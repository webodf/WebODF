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

/*global core, gui*/

/**
 * Finds the closest step to the specified offset, but comparing the left and right edges of the
 * surrounding rectangles to the desired offset. Iteration will continue until the steps
 * start getting further away from the current closest step.
 *
 * @constructor
 * @implements {gui.VisualStepScanner}
 * @param {!number} offset Target horizontal offset
 */
gui.ClosestXOffsetScanner = function (offset) {
    "use strict";
    var self = this,
        closestDiff,
        LEFT_TO_RIGHT = gui.StepInfo.VisualDirection.LEFT_TO_RIGHT;

    this.token = undefined;

    /**
     * Returns true if the supplied edgeOffset is further away from the desired offset
     * than one previously seen.
     *
     * @param {?number} edgeOffset
     * @return {!boolean}
     */
    function isFurtherFromOffset(edgeOffset) {
        if (edgeOffset !== null && closestDiff !== undefined) {
            return Math.abs(edgeOffset - offset) > closestDiff;
        }
        return false;
    }

    /**
     * Update the closestDiff if the supplied edge is closer to the offset
     * @param {?number} edge
     * @return {undefined}
     */
    function updateDiffIfSmaller(edge) {
        if (edge !== null && isFurtherFromOffset(edge) === false) {
            closestDiff = Math.abs(edge - offset);
        }
    }

    /**
     * @param {!gui.StepInfo} stepInfo
     * @param {?ClientRect} previousRect
     * @param {?ClientRect} nextRect
     * @return {!boolean}
     */
    this.process = function(stepInfo, previousRect, nextRect) {
        var edge1,
            edge2;

        // The cursor is always between the two rects.
        if (stepInfo.visualDirection === LEFT_TO_RIGHT) {
            // In an LTR visual direction, the caret is to the right of the previous rect
            edge1 = previousRect && previousRect.right;
            // and the left of the next rect
            edge2 = nextRect && nextRect.left;
        } else {
            // In an RTL visual direction, the caret is to the LEFT of the previous rect
            edge1 = previousRect && previousRect.left;
            // and the RIGHT of the next rect
            edge2 = nextRect && nextRect.right;
        }

        if (isFurtherFromOffset(edge1) || isFurtherFromOffset(edge2)) {
            // The current step is further away than the previous one, so terminate iteration
            return true;
        }
        if (previousRect || nextRect) {
            // At least one rectangle is visible, and is therefore a closer step than the last seen one
            updateDiffIfSmaller(edge1);
            updateDiffIfSmaller(edge2);
            self.token = stepInfo.token;
        }
        return false;
    };
};