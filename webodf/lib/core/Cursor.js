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
/*global core, ops, runtime*/
runtime.loadClass("core.Selection");

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
 * @param {core.Selection} selection The selection to which the cursor corresponds
 * @param {!Document} document  The DOM document in which the cursor is placed
 */
core.Cursor = function Cursor(selection, document) {
    "use strict";
    var self = this,
        /**@type{Element}*/
        cursorNode,
        /**@type{!Text}*/
        cursorTextNode;

    /**
     * Split a text node and put the cursor into it.
     * When a text node is split in two, a second node is required. For this
     * reason, cursorTextNode exists. The front part of the split text node is
     * placed in cursorTextNode. Then cursorTextNode is inserted before the
     * original text node and the cursor is placed between the two text nodes.
     * @param {!Text} container
     * @param {!number} offset
     * @return {undefined}
     */
    function putCursorIntoTextNode(container, offset) {
        var parent = container.parentNode;
        if (offset > 0) {
            cursorTextNode.data = container.substringData(0, offset);
            container.deleteData(0, offset);
            parent.insertBefore(cursorTextNode, container);
        }
        parent.insertBefore(cursorNode, container);
    }
    /**
     * @param {!Element} container
     * @param {!number} offset
     * @return {undefined}
     */
    function putCursorIntoContainer(container, offset) {
        var node = container.firstChild;
        while (node !== null && offset > 0) {
            node = node.nextSibling;
            offset -= 1;
        }
        container.insertBefore(cursorNode, node);
    }
    /**
     * Remove the cursor from the tree.
     * @param {!function(?Node,!number):undefined} onCursorRemove
     * @return {undefined}
     */
    function removeCursor(onCursorRemove) {
        var t = cursorNode.nextSibling,
            textNodeIncrease = 0;
        if (cursorTextNode.parentNode) {
            cursorTextNode.parentNode.removeChild(cursorTextNode);
            if (t && t.nodeType === 3) {
                t.insertData(0, cursorTextNode.nodeValue);
                textNodeIncrease = cursorTextNode.length;
            }
        }
        onCursorRemove(t, textNodeIncrease);
        if (cursorNode.parentNode) {
            cursorNode.parentNode.removeChild(cursorNode);
        }
    }
    /**
     * Put the cursor at a particular position.
     * @param {!Node} container
     * @param {!number} offset
     * @param {!function(?Node,!number):undefined} onCursorAdd
     * @return {undefined}
     */
    function putCursor(container, offset, onCursorAdd) {
        var text, element;
        if (container.nodeType === 3) { // TEXT_NODE
            text = /**@type{!Text}*/(container);
            putCursorIntoTextNode(text, offset);
            onCursorAdd(cursorNode.nextSibling, offset);
        } else if (container.nodeType === 1) { // ELEMENT_NODE
            element = /**@type{!Element}*/(container);
            putCursorIntoContainer(element, offset);
            onCursorAdd(cursorNode.nextSibling, 0);
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
     * @return {core.Selection}
     */
    this.getSelection = function () {
        return selection;
    };
    /**
     * Synchronize the cursor with the current selection.
     * If there is a single collapsed selection range, the cursor will be placed
     * there. If not, the cursor will be removed from the document tree.
     * @param {!function(?Node,!number):undefined} onCursorRemove
     * @param {!function(?Node,!number):undefined} onCursorAdd
     * @return {undefined}
     */
    this.updateToSelection = function (onCursorRemove, onCursorAdd) {
        var range;
        removeCursor(onCursorRemove);
        if (selection.focusNode) {
            putCursor(selection.focusNode, selection.focusOffset, onCursorAdd);
        }
    };
    /**
     * Remove the cursor from the document tree.
     * @param {!function(?Node,!number):undefined} onCursorRemove
     * @return {undefined}
     */
    this.remove = function (onCursorRemove) {
        removeCursor(onCursorRemove);
    };

    function init() {
        var cursorns = 'urn:webodf:names:cursor';

        cursorNode = document.createElementNS(cursorns, 'cursor');
        cursorTextNode = document.createTextNode("");
    }

    init();
};
