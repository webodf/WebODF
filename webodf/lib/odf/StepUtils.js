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

/*global runtime, odf, Node*/

/**
 * Helper functions to retrieve information about an ODF document using a step iterator
 * @constructor
 */
odf.StepUtils = function StepUtils() {
    "use strict";

    /**
     * Fetch the content bounds related to the step iterator's current position. This will return the text element, or
     * the content element immediately to the left of the step. Will return undefined if there is no content to the left
     * of the step.
     *
     * @param {!core.StepIterator} stepIterator
     * @return {!{container: !Node, startOffset: !number, endOffset: !number}|undefined}
     */
    function getContentBounds(stepIterator) {
        var container = stepIterator.container(),
            offset,
            contentBounds;

        runtime.assert(stepIterator.isStep(), "Step iterator must be on a step");
        // A step is to the left of the corresponding text content according to the TextPositionFilter.
        if (container.nodeType === Node.TEXT_NODE && stepIterator.offset() > 0) {
            offset = stepIterator.offset();
        } else {
            // If the container is not a text node, the content is expected to be found in the node to the left of the
            // current position.
            container = stepIterator.leftNode();
            if (container && container.nodeType === Node.TEXT_NODE) {
                offset = /**@type{!Text}*/(container).length;
            }
        }

        if (container) {
            if (container.nodeType === Node.TEXT_NODE) {
                // Based on the above logic, if the text offset is 0, the container to the left should have been
                // used instead.
                runtime.assert(offset > 0, "Empty text node found");
                contentBounds = {
                    container: container,
                    startOffset: /**@type{!number}*/(offset) - 1,
                    endOffset: /**@type{!number}*/(offset)
                };
            } else {
                contentBounds = {
                    container: container,
                    startOffset: 0,
                    endOffset: container.childNodes.length
                };
            }
        }

        return contentBounds;
    }
    this.getContentBounds = getContentBounds;
};
