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
 * @source: http://gitorious.org/webodf/webodf/
 */

/*global core, Node, runtime, gui, odf, NodeFilter*/

runtime.loadClass("core.DomUtils");
runtime.loadClass("odf.OdfUtils");

/**
 * @constructor
 */
gui.StyleHelper = function StyleHelper(formatting) {
    "use strict";
    var domUtils = new core.DomUtils(),
        odfUtils = new odf.OdfUtils();

    /**
     * Adapted from instructions on how to generate plain text from an ODT document.
     * See algorithm at http://docs.oasis-open.org/office/v1.2/os/OpenDocument-v1.2-os-part1.html#__RefHeading__1415196_253892949
     * @param node
     * @returns {boolean}
     */
    function isAcceptedNode(node) {
        switch(node.namespaceURI) {
            // Namespace skips
            case odf.Namespaces.drawns:
            case odf.Namespaces.svgns:
            case odf.Namespaces.dr3dns:
                return false;
            case odf.Namespaces.textns:
                // Specific node type skips
                //noinspection FallthroughInSwitchStatementJS
                switch(node.localName) {
                    case 'note-body':
                    case 'ruby-text':
                        return false;
                }
                break;
            case odf.Namespaces.officens:
                // Specific node type skips
                //noinspection FallthroughInSwitchStatementJS
                switch(node.localName) {
                    case 'annotation':
                    case 'binary-data':
                    case 'event-listeners':
                        return false;
                }
                break;
            default:
                // Skip webodf edit markers
                switch(node.localName) {
                    case 'editinfo':
                        return false;
                }
                break;
        }
        return true;
    }

    /**
     * Returns a array of text nodes considered to be part of the supplied range.
     * This will exclude elements that are not part of the ODT main text bot
     * @param {!Range} range    Range to search for nodes within
     * @param {boolean=} includePartial Include partially intersecting text nodes in the result. Default value is true
     * @returns {!Array.<!CharacterData>}
     */
    function getTextNodes(range, includePartial) {
        var document = range.startContainer.ownerDocument,
            nodeRange = document.createRange(),
            textNodes = [],
            n,
            root = /**@type {!Node}*/ (range.commonAncestorContainer.nodeType === Node.TEXT_NODE ?
                range.commonAncestorContainer.parentNode : range.commonAncestorContainer),
            treeWalker;

        treeWalker = document.createTreeWalker(root,
            NodeFilter.SHOW_ALL,
            function (node) {
                nodeRange.selectNodeContents(node);

                if (includePartial === false && node.nodeType === Node.TEXT_NODE) {
                    if (range.compareBoundaryPoints(range.START_TO_START, nodeRange) <= 0
                        && range.compareBoundaryPoints(range.END_TO_END, nodeRange) >= 0) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                } else if (range.compareBoundaryPoints(range.END_TO_START, nodeRange) === -1
                    && range.compareBoundaryPoints(range.START_TO_END, nodeRange) === 1) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    if (isAcceptedNode(node)) {
                        return NodeFilter.FILTER_SKIP;
                    }
                }
                return NodeFilter.FILTER_REJECT;
            },
            false);

        // Make the first call to nextNode return startContainer
        treeWalker.currentNode = range.startContainer.previousSibling || range.startContainer.parentNode;

        n = treeWalker.nextNode();
        while (n) {
            textNodes.push(n);
            n = treeWalker.nextNode();
        }

        nodeRange.detach();
        return textNodes;
    }

    /**
     * Returns an array of all unique styles in a given range for each text node
     * @param {!Range} range
     * @returns {Array.<Object>}
     */
    this.getAppliedStyles = function (range) {
        var textNodes = getTextNodes(range);
        return formatting.getAppliedStyles(textNodes);
    };

    /**
     * Apply the specified style properties to all elements within the given range.
     * Currently, only text styles are applied.
     * @param {!string} memberId Identifier of the member applying the style. This is used for naming generated autostyles
     * @param {!Range} range Range to apply text style to
     * @param {!Object} info Style information. Only data within "style:text-properties" will be considered and applied
     */
    this.applyStyle = function(memberId, range, info) {
        var nextTextNodes = domUtils.splitBoundaries(range),
            textNodes = getTextNodes(range),
            limits;

        // Avoid using the passed in range as boundaries move in strange ways as the DOM is modified
        limits = {
            startContainer: range.startContainer,
            startOffset: range.startOffset,
            endContainer: range.endContainer,
            endOffset: range.endOffset
        };

        formatting.applyStyle(memberId, textNodes, limits, info);
        nextTextNodes.forEach(domUtils.normalizeTextNodes);
    };

    /**
     * Fetch all fully encompassed character elements and text nodes, and any intersecting ODT paragraph elements in
     * the specified range in document order.
     * For example, given the following fragment, with the range starting at b, and ending at c:
     *      <text:p>ab<text:s/>cd</text:p>
     * this function would return the following array:
     *      [text:p, "b", text:s, "c"]
     * @param {!Range} range    Range to search for nodes within
     * @returns {!Array.<!Node>}
     */
    function getNodesInRange(range, nodeFilter) {
        var document = range.startContainer.ownerDocument,
            elements = [],
            root = /**@type{!Node}*/(range.commonAncestorContainer),
            n,
            treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, nodeFilter, false);

        treeWalker.currentNode = range.startContainer;
        n = range.startContainer;
        while (n) {
            if (nodeFilter(n) === NodeFilter.FILTER_ACCEPT) {
                elements.push(n);
            }
            n = n.parentNode;
        }
        // The expected sequence is outer-most to inner-most element, thus, the array just built needs to be reversed
        elements.reverse();

        n = treeWalker.nextNode();
        while (n) {
            elements.push(n);
            n = treeWalker.nextNode();
        }
        return elements;
    }

    this.getTextElements = function(range) {
        var document = range.startContainer.ownerDocument,
            nodeRange = document.createRange(),
            elements;

        function nodeFilter(node) {
            var nodeType = node.nodeType;
            nodeRange.selectNodeContents(node);
            if (nodeType === Node.TEXT_NODE || odfUtils.isCharacterElement(node)) {
                if (domUtils.containsRange(range, nodeRange)) {
                    // text nodes and character elements should only be returned if they are fully contained within the range
                    return NodeFilter.FILTER_ACCEPT;
                }
            } else if (isAcceptedNode(node) || odfUtils.isGroupingElement(node)) {
                return NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_REJECT;
        }

        elements = getNodesInRange(range, nodeFilter);
        nodeRange.detach();

        return elements;
    };

    /**
     * Get all paragraph elements that intersect or are contained within the supplied range
     * @param {!Range} range
     * @returns {!Array.<!Element>}
     */
    this.getParagraphElements = function(range) {
        var document = range.startContainer.ownerDocument,
            nodeRange = document.createRange(),
            elements;

        function nodeFilter(node) {
            nodeRange.selectNodeContents(node);
            if (odfUtils.isParagraph(node)) {
                if (domUtils.rangesIntersect(range, nodeRange)) {
                    return NodeFilter.FILTER_ACCEPT;
                }
            } else if (isAcceptedNode(node) || odfUtils.isGroupingElement(node)) {
                return NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_REJECT;
        }

        elements = getNodesInRange(range, nodeFilter);
        nodeRange.detach();

        return elements;
    };
};