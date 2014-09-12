/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
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

/*global odf, xmldom, Node, NodeFilter, runtime*/

/**
 * Serializes a provided node structure into plain text, eliminating everything
 * specified by the optional filter element.
 * This will attempt to generate reasonable plain text output including line-breaks
 * at new paragraphs
 * @constructor
 */
odf.TextSerializer = function TextSerializer() {
    "use strict";
    var self = this,
        odfUtils = odf.OdfUtils;

    /**
     * @param {!Node} node
     * @return {!string}
     */
    function serializeNode(node) {
        var s = "",
            accept = (self.filter) ? self.filter.acceptNode(node) : NodeFilter.FILTER_ACCEPT,
            nodeType = node.nodeType,
            child;

        if ((accept === NodeFilter.FILTER_ACCEPT || accept === NodeFilter.FILTER_SKIP) &&
            odfUtils.isTextContentContainingNode(node)) {
            child = node.firstChild;
            while (child) {
                s += serializeNode(child);
                child = child.nextSibling;
            }
        }
        if (accept === NodeFilter.FILTER_ACCEPT) {
            if (nodeType === Node.ELEMENT_NODE && odfUtils.isParagraph(node)) {
                s += "\n";
            } else if (nodeType === Node.TEXT_NODE && node.textContent) {
                s += node.textContent;
            }
        }
        return s;
    }
    /**
     * @type {xmldom.LSSerializerFilter}
     */
    this.filter = null;

    /**
     * @param {?Node} node
     * @return {!string}
     */
    this.writeToString = function (node) {
        var plainText;
        if (!node) {
            return "";
        }
        plainText = serializeNode(node);
        if (plainText[plainText.length - 1] === "\n") {
            // By the serializing logic, the selection  <p>text</p> would generate "text\n"
            // This is slightly unexpected though, as partially selecting two paragraphs (<p>p1</p><p>p2</p>)
            // the user would expect the text to be "p1\np2"
            // Easiest way to meet this expectation is to throw away the last new line (if present)
            plainText = plainText.substr(0, plainText.length - 1);
        }
        return plainText;
    };
};
