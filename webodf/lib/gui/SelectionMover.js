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
/*global Node, runtime, core, gui, XMLSerializer, window*/
runtime.loadClass("core.Cursor");
runtime.loadClass("core.PositionIterator");
runtime.loadClass("core.PositionFilter");
runtime.loadClass("core.LoopWatchDog");

/**
 * This class modifies the selection in different ways.
 * @constructor
 * @param {core.Cursor} cursor
 * @param {!Node} rootNode
 */
gui.SelectionMover = function SelectionMover(cursor, rootNode) {
    "use strict";
    var self = this,
        positionIterator,
        cachedXOffset,
        timeoutHandle;
    function getOffset(el) {
        var x = 0, y = 0;
        while (el && el.nodeType === Node.ELEMENT_NODE) {//!isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
            x += el.offsetLeft - el.scrollLeft;
            y += el.offsetTop - el.scrollTop;
            el = el.parentNode;//offsetParent;
        }
        return { top: y, left: x };
    }

    /**
     * Resets the positionIterator back to the current cursor position and returns the iterator
     * @return {!core.PositionIterator}
     */
    function getIteratorAtCursor() {
        positionIterator.setUnfilteredPosition(cursor.getNode(), 0);
        return positionIterator;
    }

    /**
     * Gets the client rect of a position specified by the container and an
     * offset. If this is not possible with a range, then the last element's coordinates
     * are used to guesstimate the position.
     * @param {!Node} container
     * @param {!number} offset
     * @param {!Range} range
     * @return {?{top: !number, left: !number}}
     */
    function getRect(container, offset, range) {
        var rect,
            containerOffset;

        range.setStart(container, offset);
        rect = range.getClientRects()[0];
        if (!rect) {
            rect = {};
            // There are various places where the list of client rects will be empty,
            // for example in the last position of a paragraph, or when the range covers and empty text node.
            // In that case, we need to handle these positions in a more special manner to get an equivalent
            // clientRect
            if (container.childNodes[offset - 1]) {
                range.setStart(container, offset  - 1);
                range.setEnd(container, offset);
                containerOffset = range.getClientRects()[0];
                if (!containerOffset) {
                    containerOffset = getOffset(container);
                }
                rect.top = containerOffset.top;
                rect.left = containerOffset.right;
            } else if (container.nodeType === Node.TEXT_NODE) {
                // If the container is a text node and we were not able to get the client rects for it,
                // try using the client rects from it's previous sibling
                if (container.previousSibling) {
                    rect = container.previousSibling.getClientRects()[0];
                }
                // If even that did not work, extend the range over the textnode and try to get it's client rect
                if (!rect) {
                    range.setStart(container, 0);
                    range.setEnd(container, offset);
                    rect = range.getClientRects()[0];
                }
            } else {
                // finally, if none of the above cases were true, just get the client rect of the container itself
                rect = container.getClientRects()[0];
            }
        }
        return {
            top: rect.top,
            left: rect.left
        };
    }

    function doMove(steps, extend, move) {
        var left = steps,
            iterator = getIteratorAtCursor(),
            initialRect,
            range = /**@type{!Range}*/(rootNode.ownerDocument.createRange()),
            selectionRange = cursor.getSelectedRange() ? cursor.getSelectedRange().cloneRange() : (rootNode.ownerDocument.createRange()),
            newRect,
            horizontalMovement,
            o, c,
            isForwardSelection;

        initialRect = getRect(/**@type{!Node}*/(cursor.getNode()), 0, range);
        while (left > 0 && move()) {
            left -= 1;
        }

        if (extend) {
            c = iterator.container();
            o = iterator.unfilteredDomOffset();
            if (selectionRange.comparePoint(c, o) === -1) {
                selectionRange.setStart(c, o);
                isForwardSelection = false;
            } else {
                selectionRange.setEnd(c, o);
            }
        } else {
            selectionRange.setStart(iterator.container(), iterator.unfilteredDomOffset());
            selectionRange.collapse(true);
        }
        cursor.setSelectedRange(selectionRange, isForwardSelection);

        newRect = getRect(/**@type{!Node}*/(cursor.getNode()), 0, range);

        horizontalMovement = (newRect.top === initialRect.top) ? true : false;
        if (horizontalMovement || cachedXOffset === undefined) {
            cachedXOffset = newRect.left;
        }
        window.clearTimeout(timeoutHandle);
        timeoutHandle = window.setTimeout(function () {
            cachedXOffset = undefined;
        }, 2000);

        range.detach();
        return steps - left;
    }
    /**
     * Move selection forward one position.
     * @param {!number} steps
     * @param {boolean=} extend true if range is to be expanded from the current
     *                         point
     * @return {!number}
     **/
    this.movePointForward = function (steps, extend) {
        return doMove(steps, extend, positionIterator.nextPosition);
    };
    /**
     * Move selection forward one position.
     * @param {boolean=} extend true if range is to be expanded from the current
     *                         point
     * @return {!number}
     **/
    this.movePointBackward = function (steps, extend) {
        return doMove(steps, extend, positionIterator.previousPosition);
    };

    /**
     * Returns if the current position is walkable according to the
     * specified filter. Useful when the position becomes unwalkable after, for example,
     * text removal.
     * @param {!core.PositionFilter} filter
     * @return {boolean}
     */
    function isPositionWalkable(filter) {
        var iterator = getIteratorAtCursor();

        if (filter.acceptPosition(iterator) === 1) {
            return true;
        }
        return false;
    }

    /**
     * @param {!number} steps
     * @param {!core.PositionFilter} filter
     * @return {!number}
     */
    function countForwardSteps(steps, filter) {
        var iterator = getIteratorAtCursor(),
            watch = new core.LoopWatchDog(1000),
            stepCount = 0,
            count = 0;
        while (steps > 0 && iterator.nextPosition()) {
            stepCount += 1;
            watch.check();
            if (filter.acceptPosition(iterator) === 1) {
                count += stepCount;
                stepCount = 0;
                steps -= 1;
            }
        }
        return count;
    }
    /**
     * @param {!number} steps
     * @param {!core.PositionFilter} filter
     * @return {!number}
     */
    function countBackwardSteps(steps, filter) {
        var iterator = getIteratorAtCursor(),
            watch = new core.LoopWatchDog(1000),
            stepCount = 0,
            count = 0;
        while (steps > 0 && iterator.previousPosition()) {
            stepCount += 1;
            watch.check();
            if (filter.acceptPosition(iterator) === 1) {
                count += stepCount;
                stepCount = 0;
                steps -= 1;
            }
        }
        return count;
    }
    /**
     * Return the number of steps needed to move across one line in the specified direction.
     * If it is not possible to move across one line, then 0 is returned.
     *
     * @param {!number} direction -1 for upwards, +1 for downwards
     * @param {!core.PositionFilter} filter
     * @param {!core.PositionIterator} iterator
     * @return {!number}
     */
    function countLineSteps(filter, direction, iterator) {
        var c = iterator.container(),
            count = 0,
            bestContainer = null,
            bestOffset,
            bestXDiff = 10,
            xDiff,
            bestCount = 0,
            top,
            left,
            lastTop,
            rect,
            range = /**@type{!Range}*/(rootNode.ownerDocument.createRange()),
            watch = new core.LoopWatchDog(1000);

        // Get the starting position
        rect = getRect(c, iterator.unfilteredDomOffset(), range);

        top = rect.top;
        if (cachedXOffset === undefined) {
            left = rect.left;
        } else {
            left = cachedXOffset;
        }
        lastTop = top;

        while ((direction < 0 ? iterator.previousPosition() : iterator.nextPosition()) === true) {
            watch.check();
            if (filter.acceptPosition(iterator) === 1) {
                count += 1;

                c = iterator.container();
                rect = getRect(c, iterator.unfilteredDomOffset(), range);

                if (rect.top !== top) { // Not on the initial line anymore
                    if (rect.top !== lastTop && lastTop !== top) { // Not even on the next line
                        break;
                    }
                    lastTop = rect.top;
                    xDiff = Math.abs(left - rect.left);
                    if (bestContainer === null || xDiff < bestXDiff) {
                        bestContainer = c;
                        bestOffset = iterator.offset();
                        bestXDiff = xDiff;
                        bestCount = count;
                    }
                }
            }
        }

        if (bestContainer !== null) {
            iterator.setPosition(bestContainer, /**@type {!number}*/(bestOffset));
            count = bestCount;
        } else {
            count = 0;
        }

        range.detach();
        return count;
    }
    /**
     * @param {!number} lines
     * @param {!core.PositionFilter} filter
     * @return {!number}
     */
    function countLinesUpSteps(lines, filter) {
        var iterator = getIteratorAtCursor(),
            stepCount = 0,
            count = 0;
        // move back in the document, until a position is found for which the
        // top is smaller than initially and the left is closest
        while (lines > 0) {
            stepCount += countLineSteps(filter, /*upwards*/-1, iterator);
            if (stepCount === 0) {
                break;
            }
            count += stepCount;
            lines -= 1;
        }
        return count;
    }
    /**
     * @param {!number} lines
     * @param {!core.PositionFilter} filter
     * @return {!number}
     */
    function countLinesDownSteps(lines, filter) {
        var iterator = getIteratorAtCursor(),
            stepCount = 0,
            count = 0;
        // move back in the document, until a position is found for which the
        // top is smaller than initially and the left is closest
        while (lines > 0) {
            stepCount += countLineSteps(filter, /*downwards*/1, iterator);
            if (stepCount === 0) {
                break;
            }
            count += stepCount;
            lines -= 1;
        }
        return count;
    }

    /**
     * Calculate node offset in unfiltered DOM world
     * @param {!Node} node
     * @param {!Node} container
     * @return {!number}
     */
    function getPositionInContainingNode(node, container) {
        var offset = 0,
            n;
        while (node.parentNode !== container) {
            runtime.assert(node.parentNode !== null, "parent is null");
            node = /**@type{!Node}*/(node.parentNode);
        }
        n = container.firstChild;
        while (n !== node) {
            offset += 1;
            n = n.nextSibling;
        }
        return offset;
    }
    /**
     * Return a number > 0 when point 1 precedes point 2. Return 0 if the points
     * are equal. Return < 0 when point 2 precedes point 1.
     * @param {!Node} c1 container of point 1
     * @param {!number} o1  offset in unfiltered DOM world of point 1
     * @param {!Node} c2 container of point 2
     * @param {!number} o2  offset in unfiltered DOM world of point 2
     * @return {!number}
     */
    function comparePoints(c1, o1, c2, o2) {
        if (c1 === c2) {
            return o2 - o1;
        }
        var comparison = c1.compareDocumentPosition(c2);
        if (comparison === 2) { // DOCUMENT_POSITION_PRECEDING
            comparison = -1;
        } else if (comparison === 4) { // DOCUMENT_POSITION_FOLLOWING
            comparison = 1;
        } else if (comparison === 10) { // DOCUMENT_POSITION_CONTAINS
            // c0 contains c2
            o1 = getPositionInContainingNode(c1, c2);
            comparison = (o1 < o2) ? 1 : -1;
        } else { // DOCUMENT_POSITION_CONTAINED_BY
            o2 = getPositionInContainingNode(c2, c1);
            comparison = (o2 < o1) ? -1 : 1;
        }
        return comparison;
    }
    /**
     * @param {!Element} posElement
     * @param {!number} posOffset  offset in filtered DOM world
     * @param {!core.PositionFilter} filter
     * @return {!number}
     */
    function countStepsToPosition(posElement, posOffset, filter) {
        runtime.assert(posElement !== null, "SelectionMover.countStepsToPosition called with element===null");
        // first figure out how to get to the element
        // really dumb/inefficient implementation
        var iterator = getIteratorAtCursor(),
            c = iterator.container(),
            o = iterator.offset(),
            steps = 0,
            posUnfilteredDomOffset,
            watch = new core.LoopWatchDog(1000),
            comparison;

        // the iterator may interpret the positions as given by the range
        // differently than the dom positions, so we normalize them by calling
        // setPosition with these values
        iterator.setUnfilteredPosition(posElement, posOffset);
        posElement = iterator.container();
        runtime.assert(posElement !== null, "SelectionMover.countStepsToPosition: positionIterator.container() returned null");
        posOffset = iterator.offset();
        posUnfilteredDomOffset = iterator.unfilteredDomOffset();
        iterator.setPosition(c, o);

        comparison = comparePoints(posElement, posUnfilteredDomOffset, iterator.container(), iterator.unfilteredDomOffset());
        if (comparison < 0) {
            while (iterator.nextPosition()) {
                watch.check();
                if (filter.acceptPosition(iterator) === 1) {
                    steps += 1;
                }
                if (iterator.container() === posElement) {
                    if (iterator.offset() === posOffset) {
                        return steps;
                    }
                }
            }
        } else if (comparison > 0) {
            while (iterator.previousPosition()) {
                watch.check();
                if (filter.acceptPosition(iterator) === 1) {
                    steps -= 1;
                }
                if (iterator.container() === posElement) {
                    if (iterator.offset() === posOffset) {
                        return steps;
                    }
                }
            }
        }
        return steps;
    }

    this.getStepCounter = function () {
        return {
            countForwardSteps: countForwardSteps,
            countBackwardSteps: countBackwardSteps,
            countLinesDownSteps: countLinesDownSteps,
            countLinesUpSteps: countLinesUpSteps,
            countStepsToPosition: countStepsToPosition,
            isPositionWalkable: isPositionWalkable
        };
    };
    function init() {
        positionIterator = gui.SelectionMover.createPositionIterator(rootNode);
        var range = rootNode.ownerDocument.createRange();
        range.setStart(positionIterator.container(), positionIterator.unfilteredDomOffset());
        range.collapse(true);
        cursor.setSelectedRange(range);
    }
    init();
};
/**
 * @param {!Node} rootNode
 * @return {!core.PositionIterator}
 */
gui.SelectionMover.createPositionIterator = function (rootNode) {
    "use strict";
    /**
     * @constructor
     * @extends NodeFilter
      */
    function CursorFilter() {
        /**
         * @param {!Node} node
         * @return {!number}
         */
        this.acceptNode = function (node) {
            if (node.namespaceURI === "urn:webodf:names:cursor" ||
                    node.namespaceURI === "urn:webodf:names:editinfo") {
                return 2;
            }
            return 1;
        };
    }
    var filter = new CursorFilter();
    return new core.PositionIterator(rootNode, 5, filter, false);
};
(function () {
    "use strict";
    return gui.SelectionMover;
}());
