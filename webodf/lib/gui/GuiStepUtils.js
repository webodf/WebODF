/**
 * Copyright (C) 2010-2014 KO GmbH <copyright@kogmbh.com>
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

/*global runtime, odf, gui, core, Node*/

/**
 * Helper functions to retrieve information about an ODF document using a step iterator
 * @constructor
 */
gui.GuiStepUtils = function GuiStepUtils() {
    "use strict";
    var odfUtils = odf.OdfUtils,
        stepUtils = new odf.StepUtils(),
        domUtils = core.DomUtils,
        NEXT = core.StepDirection.NEXT,
        LEFT_TO_RIGHT = gui.StepInfo.VisualDirection.LEFT_TO_RIGHT,
        RIGHT_TO_LEFT = gui.StepInfo.VisualDirection.RIGHT_TO_LEFT;

    /**
     * Returns the client rectangle for the content bounds at the step iterator's current position.
     * Note, if the selected content is really collapsed whitespace, this function will return null.
     *
     * @param {!core.StepIterator} stepIterator
     * @return {?ClientRect}
     */
    function getContentRect(stepIterator) {
        var bounds = stepUtils.getContentBounds(stepIterator),
            range,
            rect = null;

        if (bounds) {
            if (bounds.container.nodeType === Node.TEXT_NODE) {
                range = bounds.container.ownerDocument.createRange();
                range.setStart(bounds.container, bounds.startOffset);
                range.setEnd(bounds.container, bounds.endOffset);
                // *MUST* use the BCR here rather than the individual client rects, as the individual client rects
                // don't support subpixel accuracy. Most browsers *do* support subpixel values for the BCR though
                // (FF, Chrome + IE!!)
                rect = range.getClientRects().length > 0 ? range.getBoundingClientRect() : null;
                if (rect
                    && /**@type{!Text}*/(bounds.container).data.substring(bounds.startOffset, bounds.endOffset) === " "
                    && rect.width <= 1) {
                    // In Chrome, collapsed whitespace still reports a width of 1px. In FF, they report as 0px.
                    // Consumers of this function are really wanting the cursor position for a given
                    // step, which will actually be the next step in this instance.
                    rect = null;
                }
                range.detach();
            } else if (odfUtils.isCharacterElement(bounds.container) || odfUtils.isCharacterFrame(bounds.container)) {
                // Want to ignore some invisible document content elements such as annotation anchors.
                rect = domUtils.getBoundingClientRect(bounds.container);
            }
        }

        return rect;
    }
    this.getContentRect = getContentRect;

    /**
     * Advance the step iterator in the specified direction until an accepted step is identified
     * by a token scanner.
     *
     * @param {!core.StepIterator} stepIterator
     * @param {!core.StepDirection} direction
     * @param {!Array.<!gui.VisualStepScanner>} scanners
     * @return {!boolean} Return true if a step was found that satisfied one of the scanners
     */
    function moveToFilteredStep(stepIterator, direction, scanners) {
        var isForward = direction === NEXT,
            leftRect,
            rightRect,
            previousRect,
            nextRect,
            /**@type{?core.StepIterator.StepSnapshot}*/
            destinationToken,
            // Just in case no destination is found, the iterator will reset back to the initial position
            initialToken = stepIterator.snapshot(),
            wasTerminated = false,
            /**@type{!gui.StepInfo}*/
            stepInfo;

        /**
         * @param {!boolean} terminated
         * @param {!gui.VisualStepScanner} scanner
         * @return {!boolean};
         */
        function process(terminated, scanner) {
            // Multiple token scanners might be complete in a single step
            if (scanner.process(stepInfo, previousRect, nextRect)) {
                terminated = true;
                // A scanner might indicate iteration as complete without specifying a token
                // if no available steps exist in the specified direction.
                if (!destinationToken && scanner.token) {
                    // Scanners that terminate the iteration get the first chance to specify the destination token
                    destinationToken = scanner.token;
                }
            }
            return terminated;
        }

        do {
            // TODO Optimize performance by re-using the left/right rect from the last step (depending on direction)
            leftRect = getContentRect(stepIterator);
            stepInfo = /**@type{!gui.StepInfo}*/({
                token: stepIterator.snapshot(),
                container: stepIterator.container,
                offset: stepIterator.offset,
                direction: direction,
                // TODO account for right-to-left languages
                visualDirection: direction === NEXT ? LEFT_TO_RIGHT : RIGHT_TO_LEFT
            });

            if (stepIterator.nextStep()) {
                rightRect = getContentRect(stepIterator);
            } else {
                rightRect = null;
            }
            stepIterator.restore(stepInfo.token);

            if (isForward) {
                previousRect = leftRect;
                nextRect = rightRect;
            } else {
                previousRect = rightRect;
                nextRect = leftRect;
            }

            wasTerminated = scanners.reduce(process, false);
        } while (!wasTerminated && stepIterator.advanceStep(direction));

        if (!wasTerminated) {
            // If no token scanner has terminated the iteration, then check each
            // token scanner for the last identified potential step
            // and take the first specified token.
            scanners.forEach(function(scanner) {
                if (!destinationToken && scanner.token) {
                    destinationToken = scanner.token;
                }
            });
        }

        stepIterator.restore(destinationToken || initialToken);
        return Boolean(destinationToken);
    }
    this.moveToFilteredStep = moveToFilteredStep;
};