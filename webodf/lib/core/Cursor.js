/*global core Node*/
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
 * @param {Selection} selection The selection to which the cursor corresponds
 * @param {Document} document The document in which the cursor is placed
 */
core.Cursor = function Cursor(selection, document) {
    "use strict";
    var cursorns,
        cursorNode;
    cursorns = 'urn:webodf:names:cursor';
    cursorNode = document.createElementNS(cursorns, 'cursor');

    function putCursorIntoTextNode(container, offset) {
        var len, ref, textnode, parent;
        parent = container.parentNode;
        if (offset === 0) {
            parent.insertBefore(cursorNode, container);
        } else if (offset === container.length) {
            parent.appendChild(cursorNode);
        } else {
            len = container.length;
            ref = container.nextSibling;
            textnode = document.createTextNode(
                    container.substringData(offset, len));
            container.deleteData(offset, len);
            if (ref) {
                parent.insertBefore(textnode, ref);
            } else {
                parent.appendChild(textnode);
            }
            parent.insertBefore(cursorNode, textnode);
        }
    }
    function putCursorIntoContainer(container, offset) {
        var node;
        node = container.firstChild;
        while (node && offset) {
            node = node.nextSibling;
            offset -= 1;
        }
        container.insertBefore(cursorNode, node);
    }
    function getPotentialParentOrNode(parent, node) {
        var n = node;
        while (n && n !== parent) {
            n = n.parentNode;
        }
        return n || node;
    }
    function removeCursorFromSelectionRange(range, cursorpos) {
        var cursorParent, start, end;
        cursorParent = cursorNode.parentNode;
        start = getPotentialParentOrNode(cursorNode, range.startContainer);
        end = getPotentialParentOrNode(cursorNode, range.endContainer);
        if (start === cursorNode) {
            range.setStart(cursorParent, cursorpos);
        } else if (start === cursorParent &&
                range.startOffset > cursorpos) {
            range.setStart(cursorParent, range.startOffset - 1);
        }
        if (range.endContainer === cursorNode) {
            range.setEnd(cursorParent, cursorpos);
        } else if (range.endContainer === cursorParent &&
                range.endOffset > cursorpos) {
            range.setEnd(cursorParent, range.endOffset - 1);
        }
    }
    function adaptRangeToMergedText(range, prev, textnodetomerge, cursorpos) {
        var diff = prev.length - textnodetomerge.length;
        if (range.startContainer === textnodetomerge) {
            range.setStart(prev, diff + range.startOffset);
        } else if (range.startContainer === prev.parentNode &&
                range.startOffset === cursorpos) {
            range.setStart(prev, diff);
        }
        if (range.endContainer === textnodetomerge) {
            range.setEnd(prev, diff + range.endOffset);
        } else if (range.endContainer === prev.parentNode &&
                range.endOffset === cursorpos) {
            range.setEnd(prev, diff);
        }
    }
    function removeCursor() {
        // if the cursor is part of a selection, the selection must be adapted
        var i, cursorpos, node, textnodetoremove, range;
        // if the cursor has no parent, it is already not part of the document
        // tree
        if (!cursorNode.parentNode) {
            return;
        }
        // find the position of the cursor in its parent
        cursorpos = 0;
        node = cursorNode.parentNode.firstChild;
        while (node && node !== cursorNode) {
            cursorpos += 1;
            node = node.nextSibling;
        }
        // Check if removing the node will result in a merge of texts.
        // This will happen if the cursor is between two text nodes.
        // The text of the text node after the cursor is put in the text node
        // before the cursor. The latter node is removed after the selection
        // has been adapted.
        if (cursorNode.previousSibling &&
                cursorNode.previousSibling.nodeType === 3 && // TEXT_NODE
                cursorNode.nextSibling &&
                cursorNode.nextSibling.nodeType === 3) { // TEXT_NODE
            textnodetoremove = cursorNode.nextSibling;
            cursorNode.previousSibling.appendData(textnodetoremove.nodeValue);
        }
        // remove the node from the selections
        for (i = 0; i < selection.rangeCount; i += 1) {
            removeCursorFromSelectionRange(selection.getRangeAt(i), cursorpos);
        }
        // merge the texts that surround the cursor
        if (textnodetoremove) {
            for (i = 0; i < selection.rangeCount; i += 1) {
                adaptRangeToMergedText(selection.getRangeAt(i),
                       cursorNode.previousSibling, textnodetoremove, cursorpos);
            }
            textnodetoremove.parentNode.removeChild(textnodetoremove);
        }
        cursorNode.parentNode.removeChild(cursorNode);
    }
    // put the cursor at a particular position
    function putCursor(container, offset) {
        if (container.nodeType === 3) { // TEXT_NODE
            putCursorIntoTextNode(container, offset);
        } else if (container.nodeType !== 9) { // DOCUMENT_NODE
            putCursorIntoContainer(container, offset);
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
     * Synchronize the cursor with the current selection.
     * If there is a single collapsed selection range, the cursor will be placed
     * there. If not, the cursor will be removed from the document tree.
     * @return {undefined}
     */
    this.updateToSelection = function () {
        var range;
        removeCursor();
        if (selection.rangeCount === 1) {
            range = selection.getRangeAt(0);
            if (range.collapsed) {
                putCursor(range.startContainer, range.startOffset);
            }
        }
    };
    /**
     * Remove the cursor from the document tree.
     * @return {undefined}
     */
    this.remove = function () {
        removeCursor();
    };
};
