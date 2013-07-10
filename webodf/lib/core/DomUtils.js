/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
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

/*global Node, core, ops, runtime*/

/**
 * A collection of Dom utilities
 * @constructor
 */
core.DomUtils = function DomUtils() {
    "use strict";

    /**
     * Splits the range boundaries if either start of end offsets is partially within
     * a text node
     * @param {!Range} range
     * @returns {!Array.<!Node>}
     */
    function splitBoundaries(range) {
        var modifiedNodes = [],
            splitStart;

        // Must split end first to stop the start point from being lost
        if (range.endOffset !== 0
            && range.endContainer.nodeType === Node.TEXT_NODE
            && range.endOffset !== range.endContainer.length) {
            modifiedNodes.push(range.endContainer.splitText(range.endOffset));
            modifiedNodes.push(range.endContainer);
            // The end doesn't need to be reset as endContainer & endOffset are still valid after the modification
        }

        if (range.startOffset !== 0
            && range.startContainer.nodeType === Node.TEXT_NODE
            && range.startOffset !== range.startContainer.length) {
            splitStart = range.startContainer.splitText(range.startOffset);
            modifiedNodes.push(range.startContainer);
            modifiedNodes.push(splitStart);
            range.setStart(splitStart, 0);
        }
        return modifiedNodes;
    }
    this.splitBoundaries = splitBoundaries;

    /**
     * Merges the content of node1 into node2 if node2 exists.
     * If node1 is an empty text node, it will be removed
     * @param {!Node} node1
     * @param {!Node} node2
     */
    function mergeTextNodes(node1, node2) {
        if (node1.nodeType === Node.TEXT_NODE) {
            if (node1.length === 0) {
                node1.parentNode.removeChild(node1);
            } else if (node2.nodeType === Node.TEXT_NODE) {
                node2.insertData(0, node1.data);
                node1.parentNode.removeChild(node1);
                return node2;
            }
        }
        return node1;
    }

    /**
     * Attempts to normalize the node with any surrounding text nodes. No
     * actions are performed if the node is undefined, has no siblings, or
     * is not a text node
     * @param {Node} node
     */
    function normalizeTextNodes(node) {
        if (node && node.nextSibling) {
            node = mergeTextNodes(node, node.nextSibling);
        }
        if (node && node.previousSibling) {
            mergeTextNodes(node.previousSibling, node);
        }
    }
    this.normalizeTextNodes = normalizeTextNodes;

    /**
     * Checks if the provided limits fully encompass the passed in node
     * @param {{startContainer: Node, startOffset: !number, endContainer: Node, endOffset: !number}} limits
     * @param {!Node} node
     * @returns {boolean} Returns true if the node is fully contained within the range
     */
    function rangeContainsNode(limits, node) {
        var range = node.ownerDocument.createRange(),
            nodeLength = node.nodeType === Node.TEXT_NODE ? node.length : node.childNodes.length,
            result;
        range.setStart(limits.startContainer, limits.startOffset);
        range.setEnd(limits.endContainer, limits.endOffset);
        result = range.comparePoint(node, 0) === 0 && range.comparePoint(node, nodeLength) === 0;
        range.detach();
        return result;
    }
    this.rangeContainsNode = rangeContainsNode;

    /**
     * Merge all child nodes into the targetNode's parent and remove the targetNode entirely
     * @param {Node} targetNode
     */
    function mergeIntoParent(targetNode) {
        var parent = targetNode.parentNode;
        while (targetNode.firstChild) {
            parent.insertBefore(targetNode.firstChild, targetNode);
        }
        parent.removeChild(targetNode);
        return parent;
    }
    this.mergeIntoParent = mergeIntoParent;

    /**
     * Get an array of nodes below the specified node with the specific namespace and tag name
     * @param {!Element|!Document} node
     * @param {!string} namespace
     * @param {!string} tagName
     * @returns {!Array.<!Node>}
     */
    function getElementsByTagNameNS(node, namespace, tagName) {
        return Array.prototype.slice.call(node.getElementsByTagNameNS(namespace, tagName));
    }
    this.getElementsByTagNameNS = getElementsByTagNameNS;
};