/** A simple walker that allows finegrained stepping through the DOM.
    It does not support node filtering.
    TODO: write a position walker that uses a treewalker
**/
var createPointWalker = function (node, my) {
    "use strict";
    var that,
        currentNode = node,
        before = null, // node before the point
        after = node && node.firstChild, // node after the point
        root = node,
        pos = 0;
    my = my || {};

    that = {};

    function getPosition(node) {
        var p = -1;
        while (node) {
            node = node.previousSibling;
            p += 1;
        }
        return p;
    }
    /**
     * Move the walker to the point given by @node and @position.
     * @node must be the root of this walker or part of the tree of this walker.
     * @position must be a valid position in @node.
     **/
    that.setPoint = function (node, position) {
        currentNode = node;
        pos = position;
        if (currentNode.nodeType === currentNode.TEXT_NODE) {
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
    that.stepForward = function () {
        // if this is a text node, move to the next position in the text
        if (currentNode.nodeType === currentNode.TEXT_NODE) {
            if (pos < currentNode.nodeValue.length) {
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
    that.stepBackward = function () {
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
                pos = currentNode.nodeValue.length;
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
    that.node = function () {
        return currentNode;
    };
    that.position = function () {
        return pos;
    };
    that.precedingSibling = function () {
        return before;
    };
    that.followingSibling = function () {
        return after;
    };
    return that;
};
