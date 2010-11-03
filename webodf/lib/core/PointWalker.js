/*global core Node*/
/**
 * A simple walker that allows finegrained stepping through the DOM.
 * It does not support node filtering.
 * TODO: write a position walker that uses a treewalker
 * @constructor
 * @param {!Node} node
 */
core.PointWalker = function PointWalker(node) {
    "use strict";
    var currentNode = node,
        before = null, // node before the point
        after = node && node.firstChild, // node after the point
        root = node,
        pos = 0;

    /**
     * @param {!Node} node
     * @return {!number}
     */
    function getPosition(node) {
        var p = -1;
        while (node) {
            node = node.previousSibling;
            p += 1;
        }
        return p;
    }
    /**
     * Move the walker to the point given by @p node and @p position.
     * @param {!Element} node must be the root of this walker or part of the
     *                   tree of this walker.
     * @param {!number} position must be a valid position in @node.
     **/
    this.setPoint = function (node, position) {
        currentNode = node;
        pos = position;
        if (currentNode.nodeType === Node.TEXT_NODE) {
            after = null;
            before = null;
        } else {
            after = currentNode.firstChild;
            while (position) {
                position -= 1;
                after = after.nextSibling;
            }
            if (after) {
                before = after.previousSibling;
            } else {
                before = currentNode.lastChild;
            }
        }
    };
    /**
     * @return {!boolean}
     */
    this.stepForward = function () {
        var len;
        // if this is a text node, move to the next position in the text
        if (currentNode.nodeType === currentNode.TEXT_NODE) {
            if (typeof currentNode.nodeValue.length === "number") {
                len = currentNode.nodeValue.length;
            } else {
                len = currentNode.nodeValue.length();
            }
            if (pos < len) {
                pos += 1;
                return true;
            }
        }
        if (after) {
            if (after.nodeType === currentNode.ELEMENT_NODE) {
                currentNode = after;
                before = null;
                after = currentNode.firstChild;
                pos = 0;
            } else if (after.nodeType === currentNode.TEXT_NODE) {
                currentNode = after;
                before = null;
                after = null;
                pos = 0;
            } else {
                before = after;
                after = after.nextSibling;
                pos += 1;
            }
            return true;
        }
        if (currentNode !== root) {
            before = currentNode;
            after = before.nextSibling;
            currentNode = currentNode.parentNode;
            pos = getPosition(before) + 1;
            return true;
        }
        return false;
    };
    /**
     * @return {!boolean}
     */
    this.stepBackward = function () {
        // if this is a text node, move to the next position in the text
        if (currentNode.nodeType === currentNode.TEXT_NODE) {
            if (pos > 0) {
                pos -= 1;
                return true;
            }
        }
        if (before) {
            if (before.nodeType === currentNode.ELEMENT_NODE) {
                currentNode = before;
                before = currentNode.lastChild;
                after = null;
                pos = getPosition(before) + 1;
            } else if (before.nodeType === currentNode.TEXT_NODE) {
                currentNode = before;
                before = null;
                after = null;
                if (typeof currentNode.nodeValue.length === "number") {
                    pos = currentNode.nodeValue.length;
                } else {
                    pos = currentNode.nodeValue.length();
                }
            } else {
                after = before;
                before = before.previousSibling;
                pos -= 1;
            }
            return true;
        }
        if (currentNode !== root) {
            after = currentNode;
            before = after.previousSibling;
            currentNode = currentNode.parentNode;
            pos = getPosition(after);
            return true;
        }
        return false;
    };
    /**
     * @return {?Node}
     */
    this.node = function () {
        return currentNode;
    };
    /**
     * @return {!number}
     */
    this.position = function () {
        return pos;
    };
    /**
     * @return {?Node}
     */
    this.precedingSibling = function () {
        return before;
    };
    /**
     * @return {?Node}
     */
    this.followingSibling = function () {
        return after;
    };
};
