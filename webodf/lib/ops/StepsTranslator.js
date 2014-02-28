/**
 * @license
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
 *
 * As additional permission under GNU AGPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * As a special exception to the AGPL, any HTML file which merely makes function
 * calls to this code, and for that purpose includes it by reference shall be
 * deemed a separate work for copyright law purposes. In addition, the copyright
 * holders of this code give you permission to combine this code with free
 * software libraries that are released under the GNU LGPL. You may copy and
 * distribute such a system following the terms of the GNU AGPL for this code
 * and the LGPL for the libraries. If you modify this code, you may extend this
 * exception to your version of the code, but you are not obligated to do so.
 * If you do not wish to do so, delete this exception statement from your
 * version.
 *
 * This license applies to this entire compilation.
 * @licend
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global runtime, core, ops*/

(function () {
    "use strict";
    var
        /**
         * @const
         * @type {!number}
         */
        PREVIOUS_STEP = 0,
        /**
         * @const
         * @type {!number}
         */
        NEXT_STEP = 1;

    /**
     *
     * @constructor
     * @param {!function():!Element} getRootNode
     * @param {!function(!Node):!core.PositionIterator} newIterator
     * @param {!core.PositionFilter} filter
     * @param {!number} bucketSize  Minimum number of steps between cache points
     */
    ops.StepsTranslator = function StepsTranslator(getRootNode, newIterator, filter, bucketSize) {
        var rootNode = getRootNode(),
            /**@type{!ops.StepsCache}*/
            stepsCache = new ops.StepsCache(rootNode, filter, bucketSize),
            domUtils = new core.DomUtils(),
            /**@type{!core.PositionIterator}*/
            iterator = newIterator(getRootNode()),
            /**@const*/
            FILTER_ACCEPT = core.PositionFilter.FilterResult.FILTER_ACCEPT;

        /**
         * This evil little check is necessary because someone, not mentioning any names *cough*
         * added an extremely hacky undo manager that replaces the root node in order to go back
         * to a prior document state.
         * This makes things very sad, and kills baby kittens.
         * Unfortunately, no-one has had time yet to write a *real* undo stack... so we just need
         * to cope with it for now.
         * @return {undefined}
         */
        function verifyRootNode() {
            // TODO Remove when a proper undo manager arrives
            var currentRootNode = getRootNode();
            if (currentRootNode !== rootNode) {
                runtime.log("Undo detected. Resetting steps cache");
                rootNode = currentRootNode;
                stepsCache = new ops.StepsCache(rootNode, filter, bucketSize);
                iterator = newIterator(rootNode);
            }
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
            verifyRootNode();
            stepsFromRoot = stepsCache.setToClosestStep(steps, iterator);
            
            while (stepsFromRoot < steps && iterator.nextPosition()) {
                isStep = filter.acceptPosition(iterator) === FILTER_ACCEPT;
                if (isStep) {
                    stepsFromRoot += 1;
                }
                stepsCache.updateCache(stepsFromRoot, iterator, isStep);
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
         * @param {function(!number, !Node, !number):boolean=} roundDirection
         * @return {!boolean} Returns true if an accepted position is found, otherwise returns false.
         */
        function roundToPreferredStep(iterator, roundDirection) {
            if (!roundDirection || filter.acceptPosition(iterator) === FILTER_ACCEPT) {
                return true;
            }

            while (iterator.previousPosition()) {
                if (filter.acceptPosition(iterator) === FILTER_ACCEPT) {
                    if (roundDirection(PREVIOUS_STEP, iterator.container(), iterator.unfilteredDomOffset())) {
                        return true;
                    }
                    break;
                }
            }

            while (iterator.nextPosition()) {
                if (filter.acceptPosition(iterator) === FILTER_ACCEPT) {
                    if (roundDirection(NEXT_STEP, iterator.container(), iterator.unfilteredDomOffset())) {
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
         * @param {function(!number, !Node, !number):!boolean=} roundDirection
         * @return {!number}
         */
        this.convertDomPointToSteps = function (node, offset, roundDirection) {
            var stepsFromRoot,
                beforeRoot,
                destinationNode,
                destinationOffset,
                rounding = 0,
                isStep;

            verifyRootNode();
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
                stepsCache.updateCache(stepsFromRoot, iterator, isStep);
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

            verifyRootNode();
            stepsFromRoot = stepsCache.setToClosestStep(0, iterator);
            while (iterator.nextPosition()) {
                isStep = filter.acceptPosition(iterator) === FILTER_ACCEPT;
                if (isStep) {
                    stepsFromRoot += 1;
                }
                stepsCache.updateCache(stepsFromRoot, iterator, isStep);
            }
        };

        /**
         * @param {!{position: !number, length: !number}} eventArgs
         * @return {undefined}
         */
        this.handleStepsInserted = function (eventArgs) {
            verifyRootNode();
            // Old position = position
            // New position = position + length
            // E.g., {position: 10, length: 1} indicates 10 => 10, New => 11, 11 => 12, 12 => 13
            stepsCache.damageCacheAfterStep(eventArgs.position);
        };

        /**
         * @param {!{position: !number, length: !number}} eventArgs
         * @return {undefined}
         */
        this.handleStepsRemoved = function (eventArgs) {
            verifyRootNode();
            // Old position = position + length
            // New position = position
            // E.g., {position: 10, length: 1} indicates 10 => 10, 11 => 10, 12 => 11

            // TODO OpRemoveText inaccurately reports the position making it necessary subtract 1
            // Paragraph merge behaviours might result in the paragraph exactly at the reported position being
            // replaced by a later paragraph. Conceptually, this means the last unmodified position is
            // actually 1 step prior to the replace paragraph.
            stepsCache.damageCacheAfterStep(eventArgs.position === 0 ? 0 : eventArgs.position - 1);
        };
    };

    /**
     * @const
     * @type {!number}
     */
    ops.StepsTranslator.PREVIOUS_STEP = PREVIOUS_STEP;

    /**
     * @const
     * @type {!number}
     */
    ops.StepsTranslator.NEXT_STEP = NEXT_STEP;

    return ops.StepsTranslator;
}());
