/**
 * @license
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
 *
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

/*global runtime, core, gui, ops, odf, console*/

runtime.loadClass("gui.SelectionManager");
runtime.loadClass("core.EventNotifier");
/**
 * A document that keeps all data related to the mapped document.
 * @constructor
 * @param {!odf.OdfCanvas} odfCanvas
 */
ops.OdtDocument = function OdtDocument(odfCanvas) {
    "use strict";

    var self = this,
        textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
        rootNode,
        selectionManager,
        filter,
        /**Array.<!ops.OdtCursor>*/cursors = {},
        eventNotifier = new core.EventNotifier([
            ops.OdtDocument.signalCursorAdded,
            ops.OdtDocument.signalCursorRemoved,
            ops.OdtDocument.signalCursorMoved,
            ops.OdtDocument.signalParagraphChanged,
            ops.OdtDocument.signalParagraphStyleModified,
            ops.OdtDocument.signalStyleCreated,
            ops.OdtDocument.signalStyleDeleted,
            ops.OdtDocument.signalTableAdded]);

    /**
     * @constructor
     * @implements {core.PositionFilter}
     */
    function TextPositionFilter() {
        var /**@const*/accept = core.PositionFilter.FilterResult.FILTER_ACCEPT,
            /**@const*/reject = core.PositionFilter.FilterResult.FILTER_REJECT;

        /**
         * @param {!core.PositionIterator} iterator
         * @return {core.PositionFilter.FilterResult}
         */
        this.acceptPosition = function (iterator) {
            var n = iterator.container(), p, o, d,
                textOffset = iterator.textOffset(),
                previousSibling = iterator.getPreviousSibling(),
                nextSibling = iterator.getNextSibling();
            // only stop in text nodes or at end of <p>, <h> o <span/>
            if (n.nodeType !== 3) {
                if (n.localName !== "p" && n.localName !== "h" && n.localName !== "span") {
                    return reject;
                }
                if ((previousSibling && previousSibling.localName) === "span") {
                    return reject;
                }
                return accept;
            }

            p = n.parentNode;
            o = p && p.localName;
            if (textOffset === 0) {
                if (o === "span" || (previousSibling && previousSibling.localName) === "span") {
                    return reject;
                }
            }
            if (n.length === 0) {
                return reject;
            }
            // only stop in text nodes in 'p', 'h' or 'span' elements
            if (o !== "p" && o !== "span" && o !== "h") {
                return reject;
            }
            // do not stop between spaces
            if (textOffset > 0 && iterator.substr(textOffset - 1, 2) === "  ") {
                return reject;
            }
            
            return accept;
        };
    }
    /**
     * @param {!odf.OdfContainer} odfcontainer
     */
    function findTextRoot(odfcontainer) {
        // set the root node to be the text node
        var root = odfcontainer.rootElement.firstChild;
        while (root && root.localName !== "body") {
            root = root.nextSibling;
        }
        root = root && root.firstChild;
        while (root && root.localName !== "text") {
            root = root.nextSibling;
        }
        return root;
    }

    function getIteratorAtPosition(position) {
        var iterator = gui.SelectionMover.createPositionIterator(rootNode);

        position += 1;

        while (position > 0 && iterator.nextPosition()) {
            if (filter.acceptPosition(iterator) === 1) {
                position -= 1;
            }
        }
        return iterator;
    }

    this.getTextNeighborhood = function (position, length) {
        var iterator = getIteratorAtPosition(position),
            neighborhood = [],
            currentNeighborhood = [],
            currentNode = iterator.container(),
            iteratedLength = currentNode.data.length - iterator.text().length,
            advance,
            visited = false,
            i;

        advance = length > 0 ? iterator.nextPosition : iterator.previousPosition;

        do {
            if (filter.acceptPosition(iterator)) {
                currentNeighborhood = iterator.textNeighborhood();
                currentNode = iterator.container();
                if (currentNode.nodeType === 3) {
                    visited = false;
                    for (i = 0; i < neighborhood.length; i += 1) {
                        // All neighborhoods are disjoint ordered sets, so comparing
                        // the first element of two neighborhoods is enough to compare them.
                        if (neighborhood[i][0] === currentNeighborhood[0]) {
                            visited = true;
                            break;
                        }
                    }
                    if (!visited) {
                        neighborhood.push(currentNeighborhood);
                        iteratedLength += iterator.text().length;
                    }
                }
            }
        } while (advance() && iteratedLength < Math.abs(length));

        return neighborhood;
    };

    /**
     * This function will iterate through positions allowed by the position
     * iterator and count only the text positions. When the amount defined by
     * offset has been counted, the Text node that that position is returned
     * as well as the offset in that text node.
     * @param {!number} position
     * @return {?{textNode: !Text, offset: !number}}
     */
    function getPositionInTextNode(position) {
        var iterator = gui.SelectionMover.createPositionIterator(rootNode),
            lastTextNode = null,
            lastNode = null,
            node,
            nodeOffset = 0;
        position += 1; // add one because we check for position === 0
        // iterator should be at the start of rootNode
        if (filter.acceptPosition(iterator) === 1) {
            node = iterator.container();
            if (node.nodeType === 3) {
                lastTextNode = /**@type{!Text}*/(node);
                nodeOffset = 0;
            } else if (position === 0) {
                // create a new text node at the start of the paragraph
                lastTextNode = rootNode.ownerDocument.createTextNode('');
                node.insertBefore(lastTextNode, null);
                nodeOffset = 0;
            }
        }
        while (position > 0 || lastTextNode === null) {
            if (!iterator.nextPosition()) {
                // the desired position cannot be found
                return null;
            }
            if (filter.acceptPosition(iterator) === 1) {
                position -= 1;
                node = iterator.container();
                if (node.nodeType === 3) {
                    if (node !== lastTextNode) {
                        lastTextNode = /**@type{!Text}*/(node);
                        nodeOffset = iterator.domOffset();
                    } else {
                        nodeOffset += 1;
                    }
                } else if (lastTextNode !== null) {
                    if (position === 0) {
                        nodeOffset = lastTextNode.length;
                        break;
                    }
                    lastTextNode = null;
                } else if (position === 0) {
                    lastTextNode = node.ownerDocument.createTextNode('');
                    lastNode = iterator.getNextSibling();
                    node.insertBefore(lastTextNode, lastNode && lastNode.nextSibling);
                    nodeOffset = 0;
                    break;
                }
            }
        }
        if (lastTextNode === null) {
            return null;
        }
        // if the position is just after a cursor, then move in front of that
        // cursor
        while (nodeOffset === 0 && lastTextNode.previousSibling &&
                lastTextNode.previousSibling.localName === "cursor") {
            node = lastTextNode.previousSibling.previousSibling;
            while (node && node.nodeType !== 3) {
                node = node.previousSibling;
            }
            if (node === null) {
                node = rootNode.ownerDocument.createTextNode('');
                lastTextNode.parentNode.insertBefore(node,
                        lastTextNode.parentNode.firstChild);
            }
            lastTextNode = /**@type{!Text}*/(node);
            nodeOffset = lastTextNode.length;
        }
        return {textNode: lastTextNode, offset: nodeOffset };
    }

    /**
     * @param {?Node} node
     * @return {?Node}
     */
    function getParagraphElement(node) {
        while (node && !((node.localName === "p" || node.localName === "h") && node.namespaceURI === textns)) {
            node = node.parentNode;
        }
        return node;
    }

    /**
     * @param {!String} styleName
     * @return {?Node}
     */
    function getParagraphStyleElement(styleName) {
        var node;
        node = odfCanvas.getFormatting().getStyleElement(odfCanvas.odfContainer().rootElement.styles, styleName, 'paragraph');
        return node;
    }

    /**
     * @param {!String} styleName
     * @return {?Object}
     */
    function getParagraphStyleAttributes(styleName) {
        var node = getParagraphStyleElement(styleName);
        if (node) {
            return odfCanvas.getFormatting().getInheritedStyleAttributes(odfCanvas.odfContainer().rootElement.styles, node);
        }

        return null;
    }

    this.getParagraphStyleElement = getParagraphStyleElement;

    this.getParagraphElement = getParagraphElement;

    /**
     * This method returns the style attributes for a given stylename, including all properties
     * inherited from any parent styles, and also the Default style in the family.
     * @param {!String} styleName
     * @return {?Object}
     */
    this.getParagraphStyleAttributes = getParagraphStyleAttributes;

    /**
     * This function will return the Text node as well as the offset in that text node
     * of the cursor.
     * @param {!number} position
     * @return {?{textNode: !Text, offset: !number}}
     */
    this.getPositionInTextNode = getPositionInTextNode;

    /**
     * This function calculates the steps in ODF world between the cursor of the member and the given position in the DOM.
     * @param {!string} memberid
     * @param {!Node} node
     * @param {!number} offset
     * @return {!number}
     */
    this.getDistanceFromCursor = function (memberid, node, offset) {
        var counter,
            cursor = cursors[memberid],
            steps = 0;
        runtime.assert(node !== null, "OdtDocument.getDistanceFromCursor called with node===null");
        if (cursor) {
            counter = cursor.getStepCounter().countStepsToPosition;
            steps = counter(node, offset, filter);
        }
        return steps;
    };

    /**
     * This function returns the position in ODF world of the cursor of the member.
     * @param {!string} memberid
     * @return {!number}
     */
    this.getCursorPosition = function (memberid) {
        return -self.getDistanceFromCursor(memberid, rootNode, 0);
    };

    /**
     * @return {!core.PositionFilter}
     */
    this.getPositionFilter = function () {
        return filter;
    };

    /**
     * @return {!odf.OdfCanvas}
     */
    this.getOdfCanvas = function () {
        return odfCanvas;
    };

    /**
     * @return {!Node}
     */
    this.getRootNode = function () {
        return rootNode;
    };

    /**
     * @return {!Document}
     */
    this.getDOM = function () {
        return rootNode.ownerDocument;
    };

    /**
     * @return {gui.SelectionManager}
     */
    this.getSelectionManager = function () {
        return selectionManager;
    };

    /**
     * @param {!string} memberid
     * @return {ops.OdtCursor}
     */
    this.getCursor = function (memberid) {
        return cursors[memberid];
    };

    /**
     * @return {!Array.<!ops.OdtCursor>}
     */
    this.getCursors = function () {
        var list = [], i;
        for (i in cursors) {
            if (cursors.hasOwnProperty(i)) {
                list.push(cursors[i]);
            }
        }
        return list;
    };

    /**
     * @param {!ops.OdtCursor} cursor
     */
    this.addCursor = function (cursor) {
        var distanceToFirstTextNode = cursor.getStepCounter().countForwardSteps(1, filter);
        cursor.move(distanceToFirstTextNode);

        cursors[cursor.getMemberId()] = cursor;
    };

    /**
     * @param {!string} memberid
     * @return {!boolean}
     */
    this.removeCursor = function (memberid) {
        var cursor = cursors[memberid],
            cursorNode;
        if (cursor) {
            cursor.removeFromOdtDocument();
            delete cursors[memberid];
            return true;
        }
        return false;
    };

    /**
     * @param {!string} metadataId
     * @return {?string}
     */
    this.getMetaData = function (metadataId) {
        var node = odfCanvas.odfContainer().rootElement.firstChild;
        while (node && node.localName !== "meta") {
            node = node.nextSibling;
        }
        node = node && node.firstChild;
        while (node && node.localName !== metadataId) {
            node = node.nextSibling;
        }
        node = node && node.firstChild;
        while (node && node.nodeType !== 3) {
            node = node.nextSibling;
        }
        return node ? node.data : null;
    };

    /**
      * @return {!odf.Formatting}
      */
    this.getFormatting = function () {
        return odfCanvas.getFormatting();
    };

    this.emit = function (eventid, args) {
        eventNotifier.emit(eventid, args);
    };

    this.subscribe = function (eventid, cb) {
        eventNotifier.subscribe(eventid, cb);
    };

    /**
     * @return {undefined}
     */
    function init() {
        filter = new TextPositionFilter();
        rootNode = findTextRoot(odfCanvas.odfContainer());
        selectionManager = new gui.SelectionManager(rootNode);
    }
    init();
};

/**@const*/ops.OdtDocument.signalCursorAdded =   "cursor/added";
/**@const*/ops.OdtDocument.signalCursorRemoved = "cursor/removed";
/**@const*/ops.OdtDocument.signalCursorMoved =   "cursor/moved";
/**@const*/ops.OdtDocument.signalParagraphChanged = "paragraph/changed";
/**@const*/ops.OdtDocument.signalTableAdded = "table/added";
/**@const*/ops.OdtDocument.signalStyleCreated = "style/created";
/**@const*/ops.OdtDocument.signalStyleDeleted = "style/deleted";
/**@const*/ops.OdtDocument.signalParagraphStyleModified = "paragraphstyle/modified";

(function () {
    "use strict";
    return ops.OdtDocument;
}());

// vim:expandtab
