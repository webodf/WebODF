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
/*global runtime, core*/
/**
 * An iterator that iterators through positions in a DOM tree.
 * @constructor
 * @param {!Node} root
 * @param {!number=} whatToShow
 * @param {!NodeFilter=} filter
 * @param {!boolean=} expandEntityReferences
 */
core.PositionIterator = function PositionIterator(root, whatToShow, filter,
        expandEntityReferences) {
    "use strict";
    /**
     * Empty text nodes are not considered to be a valid position for the
     * positioniterator. They should be filtered out in all cases.
     * @constructor
     * @extends NodeFilter
     */
    function EmptyTextNodeFilter() {
        this.acceptNode = function (node) {
            if (node.nodeType === 3 && node.length === 0) {
                return 2;
            }
            return 1;
        };
    }
    /**
     * @constructor
     * @extends NodeFilter
     * @param {!NodeFilter} filter
     */
    function FilteredEmptyTextNodeFilter(filter) {
        this.acceptNode = function (node) {
            if (node.nodeType === 3 && node.length === 0) {
                return 2;
            }
            return filter.acceptNode(node);
        };
    }
    var self = this,
        walker,
        currentPos;
    /**
     * @return {!boolean}
     */
    this.nextPosition = function () {
        if (walker.currentNode === root) {
            return false;
        }
        if (currentPos === 0 && walker.currentNode.nodeType === 1) {
            // step inside an element
            if (walker.firstChild() === null) {
                currentPos = 1;
            }
        } else if (walker.currentNode.nodeType === 3
                && currentPos + 1 < walker.currentNode.length) {
            // advance inside a text node
            currentPos += 1;
        } else {
            if (walker.nextSibling() !== null) {
                currentPos = 0;
            } else {
                walker.parentNode();
                currentPos = 1;
            }
        }
        return true;
    };
    function setAtEnd() {
        var type = walker.currentNode.nodeType;
        if (type === 3) {
            currentPos = walker.currentNode.length - 1;
        } else {
            currentPos = (type === 1) ? 1 : 0;
        }
    }
    /**
     * @return {!boolean}
     */
    this.previousPosition = function () {
        var moved = true;
        if (currentPos === 0) {
            if (walker.previousSibling() === null) {
                walker.parentNode();
                if (walker.currentNode === root) {
                    walker.firstChild();
                    return false;
                }
                currentPos = 0;
            } else {
                setAtEnd();
            }
        } else if (walker.currentNode.nodeType === 3) {
            currentPos -= 1;
        } else if (walker.lastChild() !== null) {
            setAtEnd();
        } else if (walker.currentNode === root) {
            moved = false;
        } else {
            currentPos = 0;
        }
        return moved;
    };
    /**
     * @return {!Node}
     */
    this.container = function () {
        var n = walker.currentNode,
            t = n.nodeType;
        if (currentPos === 0 && t !== 3) {
            return /**@type{!Node}*/(n.parentNode);
        }
        return n;
    };
    /**
     * @return {!number}
     */
    this.offset = function () {
        if (walker.currentNode.nodeType === 3) {
            return currentPos;
        }
        var c = 0,
            startNode = walker.currentNode,
            n,
            nextNode;
        if (currentPos === 1) {
            n = walker.lastChild();
        } else {
            n = walker.previousSibling();
        }
        while (n) {
            // neighboring texts count as 1 position
            if (n.nodeType !== 3 || n.nextSibling !== nextNode
                    || nextNode.nodeType !== 3) {
                c += 1;
            }
            nextNode = n;
            n = walker.previousSibling();
        }
        walker.currentNode = startNode;
        return c;
    };
    /**
     * The same as offset(), except that adjacent text nodes are counted
     * separately.
     * @return {!number}
     */
    this.domOffset = function () {
        if (walker.currentNode.nodeType === 3) {
            return currentPos;
        }
        var c = 0,
            startNode = walker.currentNode,
            n;
        if (currentPos === 1) {
            n = walker.lastChild();
        } else {
            n = walker.previousSibling();
        }
        while (n) {
            c += 1;
            n = walker.previousSibling();
        }
        walker.currentNode = startNode;
        return c;
    };
    /**
     * The same as domOffset(), except that all nodes are counted.
     * This function is useful for communication iterator position with
     * components that do not use a filter.
     * @return {!number}
     */
    this.unfilteredDomOffset = function () {
        if (walker.currentNode.nodeType === 3) {
            return currentPos;
        }
        var c = 0,
            n = walker.currentNode;
        if (currentPos === 1) {
            n = n.lastChild;
        } else {
            n = n.previousSibling;
        }
        while (n) {
            c += 1;
            n = n.previousSibling;
        }
        return c;
    };
    /**
     * Return the offset as it would be if all neighboring text nodes were one
     * text node.
     * @return {!number}
     */
    this.textOffset = function () {
        if (walker.currentNode.nodeType !== 3) {
            return 0;
        }
        var offset = currentPos,
            n = walker.currentNode;
        // add lengths of preceding textnodes
        while (walker.previousSibling() && walker.currentNode.nodeType === 3) {
            offset += walker.currentNode.length;
        }
        walker.currentNode = n;
        return offset;
    };
    /**
     * The substring of the current text node as if all neighboring text nodes
     * were one text node.
     * @param {!number} start
     * @param {!number} length
     * @return {!string}
     */
    this.substr = function (start, length) {
        var n = walker.currentNode,
            t,
            data = "";
        if (n.nodeType !== 3) {
            return data;
        }
        while (walker.previousSibling()) {
            if (walker.currentNode.nodeType !== 3) {
                walker.nextSibling();
                break;
            }
        }
        do {
            data += walker.currentNode.data;
        } while (walker.nextSibling() && walker.currentNode.nodeType === 3);
        walker.currentNode = n;
        return data.substr(start, length);
    };
    /**
     * @param {!Node} container
     * @param {!number} offset
     * @return {!boolean}
     */
    this.setPosition = function (container, offset) {
        runtime.assert(container !== null, "PositionIterator.setPosition called with container===null");
        walker.currentNode = container;
        if (container.nodeType === 3) {
            currentPos = offset;
            if (offset > container.length) {
                throw "Error in setPosition: " + offset + " > "
                    + container.length;
            } else if (offset < 0) {
                throw "Error in setPosition: " + offset + " < 0";
            }
            if (offset === container.length) {
                if (walker.nextSibling()) {
                    currentPos = 0;
                } else if (walker.parentNode()) {
                    currentPos = 1;
                } else {
                    throw "Error in setPosition: position not valid.";
                }
            }
            return true;
        }
        var o = offset,
            n = walker.firstChild(),
            prevNode;
        while (offset > 0 && n) {
            offset -= 1;
            prevNode = n;
            n = walker.nextSibling();
            // neighboring texts count as 1 position
            while (n && n.nodeType === 3 && prevNode.nodeType === 3
                    && n.previousSibling === prevNode) {
                prevNode = n;
                n = walker.nextSibling();
            }
        }
        if (offset !== 0) {
            throw "Error in setPosition: offset " + o + " is out of range.";
        }
        if (n === null) {
            walker.currentNode = container;
            currentPos = 1;
        } else {
            currentPos = 0;
        }
        return true;
    };
    /**
     * @return {undefined}
     */
    this.moveToEnd = function () {
        walker.currentNode = root;
        currentPos = 1;
    };
    function init() {
        var f, acceptNode;
        // a position can never be near an empty TextNode. A NodeFilter is the
        // easiest way of filtering out these nodes.
        if (filter) {
            f = new FilteredEmptyTextNodeFilter(filter);
        } else {
            f = new EmptyTextNodeFilter();
        }
        // workaround for versions of createTreeWalker that need a function
        // instead of an object with a function such as IE 9 and older webkits
        acceptNode = f.acceptNode;
        acceptNode.acceptNode = acceptNode;
        whatToShow = whatToShow || 0xFFFFFFFF;
        walker = root.ownerDocument.createTreeWalker(root, whatToShow,
                acceptNode, expandEntityReferences);
        currentPos = 0;
        if (walker.firstChild() === null) {
            currentPos = 1;
        }
    }
    init();
};
