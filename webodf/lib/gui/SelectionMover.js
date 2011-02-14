/*global runtime core gui*/
runtime.loadClass("core.Cursor");
/**
 * This class modifies the selection in different ways.
 * @constructor
 * @param {Selection} selection
 * @param {!core.PointWalker} pointWalker
 * @return {!gui.SelectionMover}
 */
gui.SelectionMover = function SelectionMover(selection, pointWalker) {
    var doc = pointWalker.node().ownerDocument,
        cursor = new core.Cursor(selection, doc);
    /**
     * Return the last range in the selection. Create one if the selection is
     * empty.
     */
    function getActiveRange(node) {
        var range;
        if (selection.rangeCount === 0) {
            selection.addRange(node.ownerDocument.createRange());
        }
        return selection.getRangeAt(selection.rangeCount - 1);
    }
    function setStart(node, offset) {
        // selection interface is cumbersome and in Chrome it is buggy
        // as a workaround all ranges are removed. The last one is updated and
        // all ranges are placed back
        var ranges = [], i, range;
        for (i = 0; i < selection.rangeCount; i += 1) {
            ranges[i] = selection.getRangeAt(i);
        }
        selection.removeAllRanges();
        if (ranges.length === 0) {
            ranges[0] = node.ownerDocument.createRange();
        }
        ranges[ranges.length - 1].setStart(pointWalker.node(),
                pointWalker.position());
        for (i = 0; i < ranges.length; i += 1) {
            selection.addRange(ranges[i]);
        }
    }
    function doMove(extend, move) {
        if (selection.rangeCount === 0) {
            return;
        }
        var range = selection.getRangeAt(0);
        pointWalker.setPoint(range.startContainer, range.startOffset);
        move();
        setStart(pointWalker.node(), pointWalker.position());
    }
    function doMoveForward(extend, move) {
        if (selection.rangeCount === 0) {
            return;
        }
        move();
        var range = selection.getRangeAt(0);
        pointWalker.setPoint(range.startContainer, range.startOffset);
    }
/*
    function fallbackMoveLineUp() {
        // put an element at the current position and call
        // pointWalker.stepForward until the y position increases and x position
        // is comparable to the previous one
        cursor.updateToSelection();
        // retrieve cursor x and y position, then move selection/cursor left
        // until, y offset is less and x offset about equal
        var rect = cursor.getNode().getBoundingClientRect(),
            x = rect.left,
            y = rect.top,
            arrived = false,
            allowedSteps = 200;
        while (!arrived && allowedSteps) {
            allowedSteps -= 1;
            cursor.remove();
            pointWalker.setPoint(selection.focusNode, selection.focusOffset);
            pointWalker.stepForward();
        moveCursor(walker.node(), walker.position());
            moveCursorLeft();
            rect = cursor.getNode().getBoundingClientRect();
            arrived = rect.top !== y && rect.left < x;
        }
    }
*/
    function moveCursor(node, offset, selectMode) {
        if (selectMode) {
            selection.extend(node, offset);
        } else {
            selection.collapse(node, offset);
        }
        cursor.updateToSelection();
    }
    function moveCursorLeft() {
        pointWalker.setPoint(selection.focusNode, selection.focusOffset);
        pointWalker.stepBackward();
        moveCursor(pointWalker.node(), pointWalker.position(), false);
    }
    function moveCursorRight() {
        cursor.remove();
        pointWalker.setPoint(selection.focusNode, selection.focusOffset);
        pointWalker.stepForward();
        moveCursor(pointWalker.node(), pointWalker.position(), false);
    }
    function moveCursorUp() {
        // retrieve cursor x and y position, then move selection/cursor left
        // until, y offset is less and x offset about equal
        var rect = cursor.getNode().getBoundingClientRect(),
            x = rect.left,
            y = rect.top,
            arrived = false,
            left = 200;
        while (!arrived && left) {
            left -= 1;
            moveCursorLeft();
            rect = cursor.getNode().getBoundingClientRect();
            arrived = rect.top !== y && rect.left < x;
        }
    }
    function moveCursorDown() {
        // retrieve cursor x and y position, then move selection/cursor right
        // until, x offset is less
        cursor.updateToSelection();
        var rect = cursor.getNode().getBoundingClientRect(),
            x = rect.left,
            y = rect.top,
            arrived = false,
            left = 200;
        while (!arrived) {
            left -= 1;
            moveCursorRight();
            rect = cursor.getNode().getBoundingClientRect();
            arrived = rect.top !== y && rect.left > x;
        }
//alert(left + " " + y + " " + x + " " + rect.top + " " + rect.left);
    }
    /**
     * Move selection forward one point.
     * @param {boolean} extend true if range is to be expanded from the current
     *                         point
     * @return {undefined}
     **/
    this.movePointForward = function (extend) {
        doMove(extend, pointWalker.stepForward);
    };
    this.movePointBackward = function (extend) {
        doMove(extend, pointWalker.stepBackward);
    };
    this.moveLineForward = function (extend) {
        if (selection.modify) {
            // TODO add a way to 
            selection.modify(extend ? "extend" : "move", "forward", "line");
        } else {
            doMove(extend, moveCursorDown);
        }
    };
    this.moveLineBackward = function (extend) {
        if (selection.modify) {
            selection.modify(extend ? "extend" : "move", "backward", "line");
        } else {
            doMove(extend, function () {
            });
        }
    };
};
