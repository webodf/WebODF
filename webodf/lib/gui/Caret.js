/*global gui*/
/**
 * Class that represents a caret in a document. In text nodes, a native caret is
 * used via the HTML attribute contentEditable. Outside of text nodes, an empty
 * element representing the caret is used.
 * @constructor
 */
gui.Caret = function Caret(selection, rootNode) {
    var document = rootNode.ownerDocument,
        cursorns,
        cursorNode;
    cursorns = 'urn:webodf:names:cursor';
    cursorNode = document.createElementNS(cursorns, 'cursor');
    /**
     * Synchronize the cursor with the current selection.
     * If there is a single collapsed selection range, the cursor will be placed
     * there. If not, the cursor will be removed from the document tree.
     * @return {undefined}
     */
    this.updateToSelection = function () {
        var range;
//        removeCursor();
        if (selection.rangeCount === 1) {
            range = selection.getRangeAt(0);
/*
            if (range.collapsed) {
                putCursor(range.startContainer, range.startOffset);
            }
*/
        }
    };
};
