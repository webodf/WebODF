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

/*global odf, core, Node, NodeFilter*/

/**
 * Defines a set of rules for how elements can be collapsed based on whether they contain ODT content (e.g.,
 * text or character elements).
 * @constructor
 * @param {!Node} rootNode Root text element of the odtDocument
 */
odf.CollapsingRules = function CollapsingRules(rootNode) {
    "use strict";
    var odfUtils = odf.OdfUtils,
        domUtils = core.DomUtils;

    /**
     * Returns NodeFilter value if a given node is odf node or a text node that has a odf parent.
     * @param {!Node} node
     * @return {!number}
     */
    function filterOdfNodesToRemove(node) {
        var isToRemove = odfUtils.isODFNode(node)
            || (node.localName === "br" && odfUtils.isLineBreak(node.parentNode))
            || (node.nodeType === Node.TEXT_NODE && odfUtils.isODFNode(/** @type {!Node}*/(node.parentNode)));
        return isToRemove ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }

    /**
     * Returns true if the supplied node should be automatically collapsed (i.e., removed) if it contains no
     * text or ODF character elements. The only element that should always be kept is a paragraph element.
     * Paragraph elements can only be deleted through merging
     * @param {!Node} node
     * @return {!boolean}
     */
    function isCollapsibleContainer(node) {
        return !odfUtils.isParagraph(node) && node !== rootNode && odfUtils.hasNoODFContent(node);
    }

    /**
     * Merge all child nodes into the node's parent and remove the node entirely
     * @param {!Node} targetNode Node to merge into parent
     * @return {?Node} Final parent node collapsing ended at
     */
    function mergeChildrenIntoParent(targetNode) {
        var parent;
        if (targetNode.nodeType === Node.TEXT_NODE) {
            parent = targetNode.parentNode;
            parent.removeChild(targetNode);
        } else {
            // removes all odf nodes
            parent = domUtils.removeUnwantedNodes(targetNode, filterOdfNodesToRemove);
        }
        if (parent && isCollapsibleContainer(parent)) {
            return mergeChildrenIntoParent(parent);
        }
        return parent;
    }
    this.mergeChildrenIntoParent = mergeChildrenIntoParent;
};