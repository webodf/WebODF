/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
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
 * @param {!string} memberId The memberid this cursor is assigned to
 */
core.Cursor = function Cursor(document, memberId) {
    "use strict";
    var cursorns = 'urn:webodf:names:cursor',
        /**@type{!Element}*/
        cursorNode = document.createElementNS(cursorns, 'cursor'),
        /**@type{!Element}*/
        anchorNode = document.createElementNS(cursorns, 'anchor'),
        forwardSelection,
        recentlyModifiedNodes = [],
        /**@type{!Range}*/
        selectedRange = /**@type{!Range}*/(document.createRange()),
        isCollapsed,
        domUtils = core.DomUtils;

    /**
     * Split a text node and put the cursor into it.
     * @param {!Node} node
     * @param {!Text} container
     * @param {!number} offset
     * @return {undefined}
     */
    function putIntoTextNode(node, container, offset) {
        runtime.assert(Boolean(container), "putCursorIntoTextNode: invalid container");
        var parent = container.parentNode;
        runtime.assert(Boolean(parent), "putCursorIntoTextNode: container without parent");
        runtime.assert(offset >= 0 && offset <= container.length, "putCursorIntoTextNode: offset is out of bounds");

        if (offset === 0) {
            parent.insertBefore(node, container);
        } else if (offset === container.length) {
            parent.insertBefore(node, container.nextSibling);
        } else {
            container.splitText(offset);
            parent.insertBefore(node, container.nextSibling);
        }
    }
    /**
     * Remove the cursor from the tree.
     * @param {!Element} node
     */
    function removeNode(node) {
        if (node.parentNode) {
            recentlyModifiedNodes.push(node.previousSibling);
            recentlyModifiedNodes.push(node.nextSibling);
            node.parentNode.removeChild(node);
        }
    }

    /**
     * Put the cursor at a particular position.
     * @param {!Node} node
     * @param {!Node} container
     * @param {!number} offset
     * @return {undefined}
     */
    function putNode(node, container, offset) {
        if (container.nodeType === Node.TEXT_NODE) {
            putIntoTextNode(node, /**@type{!Text}*/(container), offset);
        } else if (container.nodeType === Node.ELEMENT_NODE) {
            container.insertBefore(node, container.childNodes.item(offset));
        }
        recentlyModifiedNodes.push(node.previousSibling);
        recentlyModifiedNodes.push(node.nextSibling);
    }

    /**
     * Gets the earliest selection node in the document
     * @return {!Node}
     */
    function getStartNode() {
        return forwardSelection ? anchorNode : cursorNode;
    }

    /**
     * Gets the latest selection node in the document
     * @return {!Node}
     */
    function getEndNode() {
        return forwardSelection ? cursorNode : anchorNode;
    }
    /**
     * Obtain the node representing the cursor. This is
     * the selection end point
     * @return {!Element}
     */
    this.getNode = function () {
        return cursorNode;
    };
    /**
     * Obtain the node representing the selection start point.
     * If a 0-length range is selected (e.g., by clicking without
     * dragging),, this will return the exact same node as getNode
     * @return {!Element}
     */
    this.getAnchorNode = function () {
        return anchorNode.parentNode ? anchorNode : cursorNode;
    };
    /**
     * Obtain the selection to which the cursor corresponds.
     * @return {!Range}
     */
    this.getSelectedRange = function () {
        if (isCollapsed) {
            selectedRange.setStartBefore(cursorNode);
            selectedRange.collapse(true);
        } else {
            selectedRange.setStartAfter(getStartNode());
            selectedRange.setEndBefore(getEndNode());
        }
        return selectedRange;
    };
    /**
     * Synchronize the cursor to a specific range
     * If there is a single collapsed selection range, the cursor will be placed
     * there. If not, the cursor will be removed from the document tree.
     * @param {!Range} range
     * @param {boolean=} isForwardSelection Set to true to indicate the direction of the
     *                          range is startContainer => endContainer. This should be false if
     *                          the user creates a selection that ends before it starts in the document (i.e.,
     *                          drags the range backwards from the start point)
     * @return {undefined}
     */
    this.setSelectedRange = function (range, isForwardSelection) {
        if (selectedRange && selectedRange !== range) {
            selectedRange.detach();
        }
        selectedRange = range;
        forwardSelection = isForwardSelection !== false;
        isCollapsed = range.collapsed;

        // TODO the nodes need to be added and removed in the right order to preserve the range
        if (range.collapsed) {
            removeNode(anchorNode);
            removeNode(cursorNode);
            putNode(cursorNode, /**@type {!Node}*/(range.startContainer), range.startOffset);
        } else {
            removeNode(anchorNode);
            removeNode(cursorNode);
            // putting in the end node first eliminates the chance the position of the start node is destroyed
            putNode(getEndNode(), /**@type {!Node}*/(range.endContainer), range.endOffset);
            putNode(getStartNode(), /**@type {!Node}*/(range.startContainer), range.startOffset);
        }
        recentlyModifiedNodes.forEach(domUtils.normalizeTextNodes);
        recentlyModifiedNodes.length = 0;
    };
    /**
     * Returns if the selection of this cursor has the
     * same direction as the direction of the range
     * @return {boolean}
     */
    this.hasForwardSelection = function () {
        return forwardSelection;
    };
    /**
     * Remove the cursor from the document tree.
     * @return {undefined}
     */
    this.remove = function () {
        removeNode(cursorNode);
        recentlyModifiedNodes.forEach(domUtils.normalizeTextNodes);
        recentlyModifiedNodes.length = 0;
    };

    function init() {
        // mark cursornode with memberid
        cursorNode.setAttributeNS(cursorns, "memberId", memberId);
        anchorNode.setAttributeNS(cursorns, "memberId", memberId);
    }

    init();
};
