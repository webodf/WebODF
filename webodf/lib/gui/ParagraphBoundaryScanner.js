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

/*global gui, odf*/

/**
 * Allows only steps within the same paragraph as the first step the scanner is asked to process.
 * Will terminate upon encountering a step within a different paragraph, and return the most recent
 * step that was still within the target paragraph.
 *
 * @constructor
 */
gui.ParagraphBoundaryScanner = function () {
    "use strict";
    var self = this,
        isInitialised = false,
        /**@type{?Element}*/
        lastParagraph,
        odfUtils = odf.OdfUtils;

    this.token = undefined;

    /**
     * @param {!gui.StepInfo} stepInfo
     * @return {!boolean}
     */
    this.process = function(stepInfo) {
        var currentParagraph = odfUtils.getParagraphElement(stepInfo.container());
        if (!isInitialised) {
            lastParagraph = currentParagraph;
            isInitialised = true;
        }

        if (lastParagraph !== currentParagraph) {
            return true;
        }

        self.token = stepInfo.token;
        return false;
    };
};