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

/*global ops, runtime, odf, Node, NodeFilter*/

/**
 * @constructor
 */
ops.OperationTestHelper = function OperationTestHelper() {
    "use strict";

    var odfUtils = odf.OdfUtils;

    /**
     * Returns true for any node not contained in an ODF paragraph
     * @param {!Node} node
     * @returns {!number}
     */
    function insignificantNodes(node) {
        var textNode = /**@type{!Text}*/(node);
        if (odfUtils.isODFWhitespace(textNode.data) && !odfUtils.isGroupingElement(textNode.parentNode) && !odfUtils.isCharacterElement(textNode.parentNode)) {
            return NodeFilter.FILTER_ACCEPT;
        }

        return NodeFilter.FILTER_REJECT;
    }

    /**
     * Removes any text nodes not contained in a paragraph element.
     * This is done to allow us to ignore whitespace nodes when comparing before/after node structures in a test.
     * @param {!Node} rootElement
     * @return {undefined}
     */
    this.removeInsignificantTextNodes = function (rootElement) {
        var walker = rootElement.ownerDocument.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT, insignificantNodes, false),
            node = walker.nextNode(),
            nodesToRemove = [];
        while (node) {
            nodesToRemove.push(node);
            node = walker.nextNode();
        }

        nodesToRemove.forEach(function (nodeToRemove) {
            nodeToRemove.parentNode.removeChild(nodeToRemove);
        });
    };
};
