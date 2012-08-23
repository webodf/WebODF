/**
 * Copyright (C) 2011 KO GmbH <jos.van.den.oever@kogmbh.com>
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
 * @source: http://gitorious.org/odfkit/webodf/
 */
/*global runtime, core*/
/**
 * A simple walker that allows finegrained stepping through the DOM.
 * It does not support node filtering.
 * TODO: write a position walker that uses a treewalker
 * @constructor
 * @implements core.PointWalker
 * @param {!Node} root
 */
core.SimplePointWalker = function SimplePointWalker(root) {
    "use strict";
    var /**@type{!Node}*/currentNode = root,
        after = root && root.firstChild, // node after the point
        before = (after !== null && after.nodeType === 3) ? after : null, // node before the point
        pos = 0,
        posInText = 0;
    /**
     * @param {Node} node
     * @return {!number}
     */
    function getPosition(node) {
        var /**@type{!number}*/ p = 0,
            /**@type{Node}*/ n = node;
        n = n.previousSibling;
        while (n) {
            if (n.nodeType === 3) {
                p += n.length;
            } else {
                p += 1;
            }
            n = n.previousSibling;
        }
        return p;
    }
    /**
     * @param {!Node} node
     * @return {!number}
     */
    function countPositions(node) {
        var p = 1,
            c = node.firstChild;
        while (c) {
            if (c.nodeType === 3) {
                p += c.length;
            } else {
                p += 1;
            }
            c = node.nextSibling;
        }
        return p;
    }
    /**
     * Move the walker to the point given by @p node and @p position.
     * @param {!Node} node must be the root of this walker or part of the
     *                   tree of this walker.
     * @param {!number} position must be a valid position in @node.
     **/
    this.setPoint = function (node, position) {
        if (node.nodeType === 3) {
            pos = position + getPosition(node);
            currentNode = /**@type{!Node}*/node.parentNode;
            posInText = position;
            before = after = node;
        } else {
            currentNode = node;
            pos = position;
            after = currentNode.firstChild;
            while (after && position > 0) {
                if (after.nodeType === 3) {
                    if (position > after.length) {
                        position -= after.length;
                    } else {
                        posInText = position;
                        position = 0;
                    }
                } else {
                    position -= 1;
                }
                after = after.nextSibling;
            }
            if (after) {
                if (after.nodeType === 3) {
                    before = after;
                } else {
                    before = after.previousSibling;
                }
            } else {
                before = currentNode.lastChild;
            }
        }
    };
    /**
     * @return {!boolean}
     */
    this.stepForward = function () {
        if (after === null) {
            if (currentNode !== root) {
                before = currentNode;
                after = before.nextSibling;
                currentNode = /**@type{!Node}*/currentNode.parentNode;
                pos = getPosition(before) + 1;
                return true;
            }
            return false;
        }
        if (before === after && posInText + 1 < after.length) {
            // advance with the current text node
            posInText += 1;
            pos += 1;
        } else {
            if (after.nodeType === 1) {
                // move into the next element
                currentNode = after;
                before = null;
                after = currentNode.firstChild;
                pos = 0;
            } else {
                // move to the next node
                before = after;
                after = after.nextSibling;
                if (after === null || after.nodeType !== 3) {
                    pos += 1;
                }
            }
            if (after !== null && after.nodeType === 3) {
                before = after;
                posInText = 0;
            }
        }
        return true;
    };
    /**
     * @return {!boolean}
     */
    this.stepBackward = function () {
        if (before === null || (before.nodeType === 3
                                && before.previousSibling === null
                                && posInText === 0)) {
            if (currentNode !== root) {
                after = currentNode;
                before = after.previousSibling;
                currentNode = /**@type{!Node}*/currentNode.parentNode;
                pos = getPosition(after);
                return true;
            }
            return false;
        }
        if (before.nodeType === 3 && posInText > 0) {
            posInText -= 1;
            pos -= 1;
        } else {
            if (before.nodeType === 1) {
                // move into the previous element
                currentNode = before;
                after = null;
                before = currentNode.lastChild;
                pos = countPositions(currentNode);
            } else {
                // move to the previous node
                after = before;
                before = before.previousSibling;
                if (before === null || before.nodeType !== 3) {
                    pos -= 1;
                }
            }
            if (before !== null && before.nodeType === 3) {
                after = before;
                posInText = after.length - 1;
            }
        }
        return true;
    };
    /**
     * @return {!Node}
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
     * @param {!Node} node
     * @return {!number}
     */
    this.countPositions = countPositions;
    /**
     * @return {?Node}
     */
    this.precedingSibling = function () {
        return (before !== null && before.nodeType === 3) ? null : before;
    };
    /**
     * @return {?Node}
     */
    this.followingSibling = function () {
        return (after !== null && after.nodeType === 3) ? null : after;
    };
};
