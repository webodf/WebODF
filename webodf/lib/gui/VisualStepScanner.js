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
/*jslint emptyblock:true, unparam:true*/

/**
 * @constructor
 * @struct
 */
gui.StepInfo = function() { "use strict"; };

/**
 * Visual step iteration direction, taking into account
 * whether the text block is right-to-left or left to right.
 *
 * For left-to-right languages, this maps onto
 * core.StepDirection as:
 *  LEFT_TO_RIGHT = NEXT
 *  RIGHT_TO_LEFT = PREV
 *
 * @enum {!number}
 */
gui.StepInfo.VisualDirection = {
    LEFT_TO_RIGHT: 0,
    RIGHT_TO_LEFT: 1
};

/**
 * @type {!core.StepIterator.StepSnapshot}
 */
gui.StepInfo.prototype.token;

/**
 * @return {!Element|!Text}
 */
gui.StepInfo.prototype.container = function() { "use strict"; };

/**
 * @return {!number}
 */
gui.StepInfo.prototype.offset = function() { "use strict"; };

/**
 * The direction of iteration from previous to next rect.
 *
 * @type {!core.StepDirection}
 */
gui.StepInfo.prototype.direction;

/**
 * The visual direction of iteration accounting for right-to-left
 * languages.
 *
 * @type {!gui.StepInfo.VisualDirection}
 */
gui.StepInfo.prototype.visualDirection;

/**
 * Scanners are stateful objects that are used to locate a step matching certain
 * parameters within a sequence. This a similar concept to lexical scanners.
 *
 * As these are stateful objects, a new instance should be created for every use.
 * @interface
 */
gui.VisualStepScanner = function() { "use strict"; };

/**
 * Token for the last step accepted by this scanner
 * @type {?core.StepIterator.StepSnapshot|undefined}
 */
gui.VisualStepScanner.prototype.token;

/**
 * @param {!gui.StepInfo} stepInfo
 * @param {?ClientRect} previousRect
 * @param {?ClientRect} nextRect
 * @return {!boolean} Return true in terminate iteration
 */
gui.VisualStepScanner.prototype.process = function(stepInfo, previousRect, nextRect) { "use strict"; };