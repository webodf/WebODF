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
/*global Node, NodeFilter, runtime, core*/
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
            if (node.nodeType === Node.TEXT_NODE && node.length === 0) {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        };
    }
    /**
     * @constructor
     * @extends NodeFilter
     * @param {!NodeFilter} filter
     */
    function FilteredEmptyTextNodeFilter(filter) {
        this.acceptNode = function (node) {
            if (node.nodeType === Node.TEXT_NODE && node.length === 0) {
                return NodeFilter.FILTER_REJECT;
            }
            return filter.acceptNode(node);
        };
    }
    var self = this,
        walker,
        currentPos,
        nodeFilter;
    /**
     * @return {!boolean}
     */
    this.nextPosition = function () {
        if (walker.currentNode === root) {
            return false;
        }
        if (currentPos === 0 && walker.currentNode.nodeType === Node.ELEMENT_NODE) {
            // step inside an element
            if (walker.firstChild() === null) {
                currentPos = 1;
            }
        } else if (walker.currentNode.nodeType === Node.TEXT_NODE
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
        if (type === Node.TEXT_NODE) {
            currentPos = walker.currentNode.length - 1;
        } else {
            currentPos = (type === Node.ELEMENT_NODE) ? 1 : 0;
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
        } else if (walker.currentNode.nodeType === Node.TEXT_NODE) {
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
     * @return {!Element|!Text}
     */
    this.container = function () {
        var n = walker.currentNode,
            t = n.nodeType;
        if (currentPos === 0 && t !== Node.TEXT_NODE) {
            return /**@type{!Element|!Text}*/(n.parentNode);
        }
        return n;
    };
    /**
     * Return the node to the right of the current iterator position.
     * If the iterator is placed between two characters in a text node,
     * the text node will be returned.
     * If there is no right neighbor in the container node, then null is
     * returned.
     * Only filtered nodes will be returned.
     * @return {?Node}
     */
    this.rightNode = function () {
        var n = walker.currentNode,
            nodeType = n.nodeType;
        if (nodeType === Node.TEXT_NODE && currentPos === n.length) {
            n = n.nextSibling;
            while (n && nodeFilter(n) !== 1) {
                n = n.nextSibling;
            }
        } else if (nodeType === Node.ELEMENT_NODE && currentPos === 1) {
            n = null;
        }
        return n;
    };
    /**
     * Return the node to the left of the current iterator position.
     * See rightNode().
     * @return {?Node}
     */
    this.leftNode = function () {
        var n = walker.currentNode;
        if (currentPos === 0) {
            n = n.previousSibling;
            while (n && nodeFilter(n) !== 1) {
                n = n.previousSibling;
            }
        } else if (n.nodeType === Node.ELEMENT_NODE) {
            n = n.lastChild;
            while (n && nodeFilter(n) !== 1) {
                n = n.previousSibling;
            }
        }
        return n;
    };
    /**
     * @return {!Node}
     */
    this.getCurrentNode = function () {
        return walker.currentNode;
    };
    /**
     * The same as offset(), except that adjacent text nodes are counted
     * separately.
     * @return {!number}
     */
    this.domOffset = function () {
        if (walker.currentNode.nodeType === Node.TEXT_NODE) {
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
        if (walker.currentNode.nodeType === Node.TEXT_NODE) {
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
        if (walker.currentNode.nodeType !== Node.TEXT_NODE) {
            return 0;
        }
        var offset = currentPos,
            n = walker.currentNode;
        // add lengths of preceding textnodes
        while (walker.previousSibling() && walker.currentNode.nodeType === Node.TEXT_NODE) {
            offset += walker.currentNode.length;
        }
        walker.currentNode = n;
        return offset;
    };
    /**
     * Return the previous sibling of the current node
     * @return {Node}
     */
    this.getPreviousSibling = function () {
        var currentNode = walker.currentNode,
            sibling = walker.previousSibling();

        walker.currentNode = currentNode;

        return sibling;
    };
    /**
     * Return the next sibling of the current node
     * @return {Node}
     */
    this.getNextSibling = function () {
        var currentNode = walker.currentNode,
            sibling = walker.nextSibling();

        walker.currentNode = currentNode;

        return sibling;
    };
    /**
     * This returns the text string from the current neighborhood as if
     * all the neighboring text nodes were one
     * @return {!string}
     */
    this.text = function () {
        var i,
            data = "",
            neighborhood = self.textNeighborhood();

        for (i = 0; i < neighborhood.length; i += 1) {
            data += neighborhood[i].data;
        }

        return data;
    };
    /**
     * This returns the local text neighborhood as seen from the current
     * position, which is an ordered array of all sibling text nodes, from
     * left to right.
     * @return {Array.<Node>}
     */
    this.textNeighborhood = function () {
        var n = walker.currentNode,
            t,
            neighborhood = [];
        if (n.nodeType !== Node.TEXT_NODE) {
            return neighborhood;
        }
        while (walker.previousSibling()) {
            if (walker.currentNode.nodeType !== Node.TEXT_NODE) {
                walker.nextSibling();
                break;
            }
        }
        do {
            neighborhood.push(walker.currentNode);
        } while (walker.nextSibling() && walker.currentNode.nodeType === Node.TEXT_NODE);
        walker.currentNode = n;

        return neighborhood;
    };
    /**
     * The substring of the current text node as if all neighboring text nodes
     * were one text node.
     * @param {!number} start
     * @param {!number} length
     * @return {!string}
     */
    this.substr = function (start, length) {
        return self.text().substr(start, length);
    };
    /**
     * Set the position of the iterator.
     *
     * @param {!Node} container
     * @param {!number} offset offset in filtered DOM world
     * @return {!boolean}
     */
    this.setPosition = function (container, offset) {
        runtime.assert((container !== null) && (container !== undefined),
            "PositionIterator.setPosition called without container");
        walker.currentNode = container;
        if (container.nodeType === Node.TEXT_NODE) {
            currentPos = offset;
            runtime.assert(offset <= container.length, "Error in setPosition: " +
                offset + " > " + container.length);
            runtime.assert(offset >= 0, "Error in setPosition: " +
                offset + " < 0");
            if (offset === container.length) {
                currentPos = undefined;
                if (walker.nextSibling()) {
                    currentPos = 0;
                } else if (walker.parentNode()) {
                    currentPos = 1;
                }
                runtime.assert(currentPos !== undefined, "Error in setPosition: position not valid.");
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
            while (n && n.nodeType === Node.TEXT_NODE && prevNode.nodeType === Node.TEXT_NODE
                    && n.previousSibling === prevNode) {
                prevNode = n;
                n = walker.nextSibling();
            }
        }
        runtime.assert(offset === 0, "Error in setPosition: offset " + o + " is out of range.");
        if (n === null) {
            walker.currentNode = container;
            currentPos = 1;
        } else {
            currentPos = 0;
        }
        return true;
    };
    /**
     * Set the position of the iterator.
     * The position can be on an unfiltered, i.e. forbidden, position.
     * If the specified container is forbidden, the iterator will immediately
     * move to the next valid position
     *
     * @param {!Node} container
     * @param {!number} offset offset in unfiltered DOM world
     * @return {!boolean}
     */
    this.setUnfilteredPosition = function (container, offset) {
        runtime.assert((container !== null) && (container !== undefined),
            "PositionIterator.setUnfilteredPosition called without container");
        if (container.nodeType === Node.TEXT_NODE) {
            return self.setPosition(container, offset);
        }
        walker.currentNode = container;
        if (filter.acceptNode(container) === NodeFilter.FILTER_ACCEPT) {
            if (offset < container.childNodes.length) {
                walker.currentNode = container.childNodes[offset];
                currentPos = 0;
            } else {
                currentPos = 1; // set position to past the last container child
            }
        } else {
            if (walker.nextSibling()) {
                currentPos = 0; // set position to before the next sibling in the container
            } else if (walker.parentNode()) {
                currentPos = 1; // set position to past the last container child
            }
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

    /**
     * Places the iterator at the last position inside the given node.
     * @param {!Node} node
     * @return {undefined}
     */
    this.moveToEndOfNode = function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
            self.setPosition(node, node.length);
        } else {
            walker.currentNode = node;
            currentPos = 1;
        }
    };

    this.getNodeFilter = function () {
        return nodeFilter;
    };

    function init() {
        var f;
        // a position can never be near an empty TextNode. A NodeFilter is the
        // easiest way of filtering out these nodes.
        if (filter) {
            f = new FilteredEmptyTextNodeFilter(filter);
        } else {
            f = new EmptyTextNodeFilter();
        }
        // workaround for versions of createTreeWalker that need a function
        // instead of an object with a function such as IE 9 and older webkits
        nodeFilter = /**@type {function(Node):number}*/(f.acceptNode);
        nodeFilter.acceptNode = nodeFilter;
        whatToShow = whatToShow || 0xFFFFFFFF;
        walker = root.ownerDocument.createTreeWalker(root, whatToShow,
                nodeFilter, expandEntityReferences);

        currentPos = 0;
        if (walker.firstChild() === null) {
            currentPos = 1;
        }
    }
    init();
};
