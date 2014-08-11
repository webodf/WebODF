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

/*global gui*/

/**
 * Finds line-wrap points by comparing the visual overlap between visible rectangles.
 *
 * @constructor
 * @implements {gui.VisualStepScanner}
 */
gui.LineBoundaryScanner = function () {
    "use strict";
    var self = this,
        lineRect = null,
        // Minimum amount of overlap between two rectangles to be considered on the same line is arbitrarily 40%
        /**@const*/ MIN_OVERLAP_THRESHOLD = 0.4;

    /**
     * Return the fraction of overlap between two rectangles. If there is
     * no overlap, or either of the rectangles is 0 height, this will
     * return 0.
     *
     * @param {!core.SimpleClientRect} rect1
     * @param {!core.SimpleClientRect} rect2
     * @return {!number}
     */
    function verticalOverlapPercent(rect1, rect2) {
        var rect1Height = rect1.bottom - rect1.top,
            rect2Height = rect2.bottom - rect2.top,
            minRectHeight = Math.min(rect1Height, rect2Height),
            intersectTop = Math.max(rect1.top, rect2.top),
            intersectBottom = Math.min(rect1.bottom, rect2.bottom),
            overlapHeight = intersectBottom - intersectTop;

        return minRectHeight > 0 ? (overlapHeight / minRectHeight) : 0;
    }

    /**
     * Returns true if the amount of overlap between the known line rectangle and the visible next rectangle
     * is below the specified MIN_OVERLAP_THRESHOLD. If there is no known line rectangle, this will return false.
     *
     * @param {!core.SimpleClientRect} nextRect Client rect of next step (by direction)
     * @return {!boolean}
     */
    function isLineBoundary(nextRect) {
        if (lineRect) {
            // TODO this logic will fail if the caret is between a subscript & superscript char as the overlap will be 0
            return verticalOverlapPercent(/**@type{!core.SimpleClientRect}*/(lineRect), nextRect) <= MIN_OVERLAP_THRESHOLD;
        }
        return false;
    }

    /**
     * @param {!core.SimpleClientRect} rect1
     * @param {!core.SimpleClientRect} rect2
     * @return {!core.SimpleClientRect}
     */
    function combineRects(rect1, rect2) {
        return {
            left: Math.min(rect1.left, rect2.left),
            right: Math.max(rect1.right, rect2.right),
            top: Math.min(rect1.top, rect2.top),
            bottom: Math.min(rect1.bottom, rect2.bottom)
        };
    }

    /**
     * @param {?core.SimpleClientRect} originalRect
     * @param {?core.SimpleClientRect} newRect
     * @return {?core.SimpleClientRect}
     */
    function growRect(originalRect, newRect) {
        if (originalRect && newRect) {
            return combineRects(/**@type{!core.SimpleClientRect}*/(originalRect),
                                /**@type{!core.SimpleClientRect}*/(newRect));
        }
        return originalRect || newRect;
    }

    this.token = undefined;

    /**
     * @param {!gui.StepInfo} stepInfo
     * @param {?ClientRect} previousRect
     * @param {?ClientRect} nextRect
     * @return {!boolean}
     */
    this.process = function(stepInfo, previousRect, nextRect) {
        // Can only detect line boundaries when the next rectangle is visible. An invisible next-rect
        // indicates the next step does not have any visible content attached, so it's location on screen
        // is impossible to determine accurately.
        var isOverLineBoundary = nextRect && isLineBoundary(/**@type{!core.SimpleClientRect}*/(nextRect));

        if (previousRect && (!nextRect || isOverLineBoundary)) {
            // Detect a possible line wrap point in one of two ways:
            // 1. Going from a visible to an invisible rectangle. An invisible rectangle can indicate a collapsed
            //      whitespace text node, or an invisible element that the browser may choose to wrap at.
            // 2. A confirmed wrap point where the nextRect is visible and clearly not on the same line as the previous.
            self.token = stepInfo.token;
        }

        if (isOverLineBoundary) {
            return true;
        }

        // Grow the current line rectangle by the (now approved) previous rectangle. This allows the line height
        // to grow naturally.
        lineRect = growRect(lineRect, previousRect);
        return false;
    };
};