/**
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global runtime, core, ops, odf*/

(function () {
    "use strict";

    /**
     *
     * @constructor
     * @param {!Element} rootNode
     * @param {!core.PositionIterator} iterator
     * @param {!core.PositionFilter} filter
     * @param {!number} bucketSize  Minimum number of steps between cache points
     */
    ops.OdtStepsTranslator = function OdtStepsTranslator(rootNode, iterator, filter, bucketSize) {
        var /**@type{!ops.StepsCache}*/
            stepsCache,
            odfUtils = odf.OdfUtils,
            domUtils = core.DomUtils,
            /**@const*/
            FILTER_ACCEPT = core.PositionFilter.FilterResult.FILTER_ACCEPT,
            /**@const*/
            PREVIOUS = core.StepDirection.PREVIOUS,
            /**@const*/
            NEXT = core.StepDirection.NEXT;

        /**
         * Update the steps cache based on the current iterator position. This can either add new
         * bookmarks or update existing references and repair damaged regions of the cache.
         *
         * @param {!number} steps
         * @param {!core.PositionIterator} iterator
         * @param {!boolean} isStep
         * @return {undefined}
         */
        function updateCache(steps, iterator, isStep) {
            var node = iterator.getCurrentNode();

            if (iterator.isBeforeNode() && odfUtils.isParagraph(node)) {
                if (!isStep) {
                    // Paragraph bookmarks indicate "first position in the paragraph"
                    // If the current stable point is before the first walkable position (as often happens)
                    // simply increase the step number by 1 to move to within the paragraph node
                    steps += 1;
                }
                stepsCache.updateBookmark(steps, node);
            }
        }

        /**
         * Saved bookmarks always represent the first step inside the corresponding paragraph or node. Based on the
         * current TextPositionFilter impl, this means rounding up if the current iterator position is not on a step.
         * @param {!number} steps
         * @param {!core.PositionIterator} iterator
         * @return {undefined}
         */
        function roundUpToStep(steps, iterator) {
            do {
                if (filter.acceptPosition(iterator) === FILTER_ACCEPT) {
                    // Have reached the step represented by the paragraph bookmark
                    updateCache(steps, iterator, true);
                    break;
                }
                // This logic inverts the +1 logic in updateCache. Conceptually speaking, the stored
                // bookmark represents the first step in the paragraph. Until the first step is found,
                // the iterator is still technically on steps-1.
                updateCache(steps - 1, iterator, false);
            } while (iterator.nextPosition());
        }

        /**
         * Convert the requested steps from root into the equivalent DOM node & offset pair. If the
         * requested step is before the start or past the end of the document, a RangeError will be thrown.
         * @param {!number} steps
         * @return {!{node: !Node, offset: !number}}
         */
        this.convertStepsToDomPoint = function (steps) {
            var /**@type{!number}*/
                stepsFromRoot,
                isStep;

            if (isNaN(steps)) {
                throw new TypeError("Requested steps is not numeric (" + steps + ")");
            }
            if (steps < 0) {
                throw new RangeError("Requested steps is negative (" + steps + ")");
            }
            stepsFromRoot = stepsCache.setToClosestStep(steps, iterator);

            while (stepsFromRoot < steps && iterator.nextPosition()) {
                isStep = filter.acceptPosition(iterator) === FILTER_ACCEPT;
                if (isStep) {
                    stepsFromRoot += 1;
                }
                updateCache(stepsFromRoot, iterator, isStep);
            }
            if (stepsFromRoot !== steps) {
                throw new RangeError("Requested steps (" + steps + ") exceeds available steps (" + stepsFromRoot + ")");
            }
            return {
                node: iterator.container(),
                offset: iterator.unfilteredDomOffset()
            };
        };

        /**
         * Uses the provided delegate to choose between rounding up or rounding down to the nearest step.
         * @param {!core.PositionIterator} iterator
         * @param {function(!core.StepDirection, !Node, !number):boolean=} roundDirection
         * @return {!boolean} Returns true if an accepted position is found, otherwise returns false.
         */
        function roundToPreferredStep(iterator, roundDirection) {
            if (!roundDirection || filter.acceptPosition(iterator) === FILTER_ACCEPT) {
                return true;
            }

            while (iterator.previousPosition()) {
                if (filter.acceptPosition(iterator) === FILTER_ACCEPT) {
                    if (roundDirection(PREVIOUS, iterator.container(), iterator.unfilteredDomOffset())) {
                        return true;
                    }
                    break;
                }
            }

            while (iterator.nextPosition()) {
                if (filter.acceptPosition(iterator) === FILTER_ACCEPT) {
                    if (roundDirection(NEXT, iterator.container(), iterator.unfilteredDomOffset())) {
                        return true;
                    }
                    break;
                }
            }

            return false;
        }

        /**
         * Convert the supplied DOM node & offset pair into it's equivalent steps from root
         * If the node & offset is not in an accepted location, the
         * roundDirection delegate is used to choose between rounding up or
         * rounding down to the nearest step. If not provided, the default
         * behaviour is to round down.
         * @param {!Node} node
         * @param {!number} offset
         * @param {function(!core.StepDirection, !Node, !number):!boolean=} roundDirection
         * @return {!number}
         */
        this.convertDomPointToSteps = function (node, offset, roundDirection) {
            var stepsFromRoot,
                beforeRoot,
                destinationNode,
                destinationOffset,
                rounding = 0,
                isStep;

            if (!domUtils.containsNode(rootNode, node)) {
                beforeRoot = domUtils.comparePoints(rootNode, 0, node, offset) < 0;
                node = /**@type{!Node}*/(rootNode);
                offset = beforeRoot ? 0 : /**@type{!Element}*/(rootNode).childNodes.length;
            }

            iterator.setUnfilteredPosition(node, offset);
            // if the user has set provided a rounding selection delegate, use that to select the previous or next
            // step if the (node, offset) position is not accepted by the filter
            if (!roundToPreferredStep(iterator, roundDirection)) {
                // The rounding selection delegate rejected both. Revert back to the previous step
                iterator.setUnfilteredPosition(node, offset);
            }

            // Get the iterator equivalent position of the current node & offset
            // This ensures the while loop will match the exact container and offset during iteration
            destinationNode = iterator.container();
            destinationOffset = iterator.unfilteredDomOffset();

            stepsFromRoot = stepsCache.setToClosestDomPoint(destinationNode, destinationOffset, iterator);
            if (domUtils.comparePoints(iterator.container(), iterator.unfilteredDomOffset(), destinationNode, destinationOffset) < 0) {
                // Special case: the requested DOM point is between the bookmark node and walkable step it represents
                return stepsFromRoot > 0 ? stepsFromRoot - 1 : stepsFromRoot;
            }

            while (!(iterator.container() === destinationNode && iterator.unfilteredDomOffset() === destinationOffset)
                    && iterator.nextPosition()) {
                isStep = filter.acceptPosition(iterator) === FILTER_ACCEPT;
                if (isStep) {
                    stepsFromRoot += 1;
                }
                updateCache(stepsFromRoot, iterator, isStep);
            }
            return stepsFromRoot + rounding;
        };

        /**
         * Iterates over all available positions starting at the root node and primes the cache
         * @return {undefined}
         */
        this.prime = function () {
            var stepsFromRoot,
                isStep;

            stepsFromRoot = stepsCache.setToClosestStep(0, iterator);
            while (iterator.nextPosition()) {
                isStep = filter.acceptPosition(iterator) === FILTER_ACCEPT;
                if (isStep) {
                    stepsFromRoot += 1;
                }
                updateCache(stepsFromRoot, iterator, isStep);
            }
        };

        /**
         * @param {!{position: !number}} eventArgs
         * @return {undefined}
         */
        this.handleStepsInserted = function (eventArgs) {
            // Old position = position
            // New position = position + length
            // E.g., {position: 10, length: 1} indicates 10 => 10, New => 11, 11 => 12, 12 => 13
            stepsCache.damageCacheAfterStep(eventArgs.position);
        };

        /**
         * @param {!{position: !number}} eventArgs
         * @return {undefined}
         */
        this.handleStepsRemoved = function (eventArgs) {
            // Old position = position + length
            // New position = position
            // E.g., {position: 10, length: 1} indicates 10 => 10, 11 => 10, 12 => 11

            // TODO OpRemoveText inaccurately reports the position making it necessary subtract 1
            // Paragraph merge behaviours might result in the paragraph exactly at the reported position being
            // replaced by a later paragraph. Conceptually, this means the last unmodified position is
            // actually 1 step prior to the replace paragraph.
            stepsCache.damageCacheAfterStep(eventArgs.position - 1);
        };

        function init() {
            stepsCache = new ops.StepsCache(rootNode, bucketSize, roundUpToStep);
        }
        init();
    };
}());
