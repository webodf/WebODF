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
 * @class
 * A cursor is a dom node that visually represents a cursor in a DOM tree.
 * It should stay synchronized with the selection in the document. When
 * there is only one collapsed selection range, a cursor should be shown at
 * that point.
 *
 * Putting the cursor in the DOM tree modifies the DOM, so care should be taken
 * to keep the selection consistent. If e.g. a selection is drawn over the
 * cursor, and the cursor is updated to the selection, the cursor is removed
 * from the DOM because the selection is not collapsed. This means that the
 * offsets of the selection may have to be changed.
 *
 * When the selection is collapsed, the cursor is placed after the point of the
 * selection and the selection will stay valid. However, if the cursor was
 * placed in the DOM tree and was counted in the offset, the offset in the
 * selection should be decreased by one.
 *
 * Even when the selection allows for a cursor, it might be desireable to hide
 * the cursor by not letting it be part of the DOM.
 *
 * @constructor
 * @param {!Document} document  The DOM document in which the cursor is placed
 */
core.Cursor = function Cursor(document) {
    "use strict";
    var self = this,
        /**@type{Element}*/
        cursorNode,
        selectedRange;

    /**
     * Split a text node and put the cursor into it.
     * @param {!Text} container
     * @param {!number} offset
     * @return {undefined}
     */
    function putCursorIntoTextNode(container, offset) {
        runtime.assert(Boolean(container), "putCursorIntoTextNode: invalid container");
        var parent = container.parentNode;
        runtime.assert(Boolean(parent), "putCursorIntoTextNode: container without parent");
        runtime.assert(offset >= 0 && offset <= container.length, "putCursorIntoTextNode: offset is out of bounds");

        if (offset === 0) {
            parent.insertBefore(cursorNode, container);
        } else if (offset === container.length) {
            parent.insertBefore(cursorNode, container.nextSibling);
        } else {
            container.splitText(offset);
            parent.insertBefore(cursorNode, container.nextSibling);
        }
    }
    /**
     * @param {!Element} container
     * @param {!number} offset
     * @return {undefined}
     */
    function putCursorIntoContainer(container, offset) {
        runtime.assert(Boolean(container), "putCursorIntoContainer: invalid container");
        var node = container.firstChild;
        while (node !== null && offset > 0) {
            node = node.nextSibling;
            offset -= 1;
        }
        container.insertBefore(cursorNode, node);
    }
    /**
     * Remove the cursor from the tree.
     * @return {{prev: ?Node, next: ?Node}}
     */
    function removeCursor() {
        var next = cursorNode.nextSibling,
            prev = cursorNode.previousSibling;

        runtime.assert(Boolean(cursorNode.parentNode),
            "cursorNode.parentNode is undefined");

        cursorNode.parentNode.removeChild(cursorNode);
        return {prev: prev, next: next};
    }
    function mergeTextNodes(node1, node2) {
        // Merge the left and right textnodes
        if (node1.nodeType === Node.TEXT_NODE && node2.nodeType === Node.TEXT_NODE) {
            if (node1.length > 0) {
                node2.insertData(0, node1.data);
            }
            node1.parentNode.removeChild(node1);
        }
    }
    function mergeAdjacentTextNodes(nodes) {
        if (nodes && nodes.prev && nodes.prev.nextSibling) {
            mergeTextNodes(nodes.prev, nodes.prev.nextSibling);
        }
        if (nodes && nodes.next && nodes.next.previousSibling) {
            mergeTextNodes(nodes.next.previousSibling, nodes.next);
        }
    }
    /**
     * Put the cursor at a particular position.
     * @param {!Node} container
     * @param {!number} offset
     * @return {undefined}
     */
    function putCursor(container, offset) {
        var text, element;
        if (container.nodeType === Node.TEXT_NODE) {
            text = /**@type{!Text}*/(container);
            putCursorIntoTextNode(text, offset);
        } else if (container.nodeType === Node.ELEMENT_NODE) {
            element = /**@type{!Element}*/(container);
            putCursorIntoContainer(element, offset);
        }
    }
    /**
     * Obtain the node representing the cursor.
     * @return {Element}
     */
    this.getNode = function () {
        return cursorNode;
    };
    /**
     * Obtain the selection to which the cursor corresponds.
     * @return {?Range}
     */
    this.getSelectedRange = function () {
        return selectedRange;
    };
    /**
     * Synchronize the cursor to a specific range
     * If there is a single collapsed selection range, the cursor will be placed
     * there. If not, the cursor will be removed from the document tree.
     * @param {!Range} range
     * @return {undefined}
     */
    this.setSelectedRange = function (range) {
        var merge;
        if (selectedRange && selectedRange !== range) {
            selectedRange.detach();
        }
        selectedRange = range;
        if (cursorNode.parentNode) {
            merge = removeCursor();
        }
        if (range.startContainer) {
            putCursor(range.startContainer, range.startOffset);
            range.setStart(cursorNode, 0);
            range.collapse(true);
        }
        mergeAdjacentTextNodes(merge);
    };
    /**
     * Remove the cursor from the document tree.
     * @return {undefined}
     */
    this.remove = function () {
        var merge = removeCursor();
        mergeAdjacentTextNodes(merge);
    };
    /**
     * Returns the filtered offset of the given node
     * @param {!Node} node
     * @param {!NodeFilter} nodeFilter
     * @return {!number}
     */
    function whichChild(node, nodeFilter) {
        var  i = 0;
        while (node.previousSibling !== null) {
            node = node.previousSibling;
            if (nodeFilter.acceptNode(node) === 1) {
                i += 1;
            }
        }
        return i;
    }
    /**
     * This returns the container and offset of this cursor node,
     * after filtering out some other nodes blacklisted by the specified nodeFilter
     * (like <cursor> and <editinfo>).
     * @param {!NodeFilter} nodeFilter
     * @return {!{container: !Node, offset: !number}}
     */
    this.getPositionInContainer = function (nodeFilter) {
        var container, offset;

        if (cursorNode.previousSibling && cursorNode.previousSibling.nodeType === Node.TEXT_NODE) {
            container = cursorNode.previousSibling;
            offset = container.length;
        } else if (cursorNode.nextSibling && cursorNode.nextSibling.nodeType === Node.TEXT_NODE) {
            container = cursorNode.nextSibling;
            offset = 0;
        }

        if (!container) {
            container = cursorNode.parentNode;
            offset = whichChild(cursorNode, nodeFilter);
        }

        return {
            container: /**@type{!Node}*/(container),
            offset: offset
        };
    };

    function init() {
        var cursorns = 'urn:webodf:names:cursor';

        cursorNode = document.createElementNS(cursorns, 'cursor');
    }

    init();
};
