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

/*global runtime, core, gui, ops, odf*/

runtime.loadClass("gui.SelectionManager");
runtime.loadClass("core.EventNotifier");
runtime.loadClass("odf.OdfUtils");

/**
 * A document that keeps all data related to the mapped document.
 * @constructor
 * @param {!odf.OdfCanvas} odfCanvas
 */
ops.OdtDocument = function OdtDocument(odfCanvas) {
    "use strict";

    var self = this,
        textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
        drawns = "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
        rootNode,
        selectionManager,
        filter,
        odfUtils,
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
     * Determine if the node is a text:p or a text:h element.
     * @param {?Node} e
     * @return {!boolean}
     */
    function isParagraph(e) {
        var name = e && e.localName;
        return (name === "p" || name === "h") && e.namespaceURI === textns;
    }

    /**
     * @constructor
     * @implements {core.PositionFilter}
     */
    function TextPositionFilter() {
        var /**@const*/accept = core.PositionFilter.FilterResult.FILTER_ACCEPT,
            /**@const*/reject = core.PositionFilter.FilterResult.FILTER_REJECT;
       /**
         * @param {!Node} container
         * @param {?Node} leftNode
         * @param {?Node} rightNode
         * @return {!core.PositionFilter.FilterResult}
         */
        function checkLeftRight(container, leftNode, rightNode) {
            var r, firstPos, rightOfChar;
            // accept if there is a character immediately to the left
            if (leftNode) {
                r = odfUtils.lookLeftForCharacter(leftNode);
                if (r === 1) {// non-whitespace character or a character element
                    return accept;
                }
                if (r === 2 && odfUtils.scanRightForAnyCharacter(rightNode)) {
                    // significant whitespace is ok, if not in trailing whitesp
                    return accept;
                }
            }
            // at this point, we know that the position is not directly to the
            // right of a significant character or element. so the position is
            // only acceptable if it is the first in an empty p or h or if it
            // is to the left of the first significant character or element.

            // accept if this is the first position in p or h and there is no
            // character in the p or h
            firstPos = leftNode === null && isParagraph(container);
            rightOfChar = odfUtils.lookRightForCharacter(rightNode);
            if (firstPos) {
                if (rightOfChar) {
                    return accept;
                }
                // position is first position in empty paragraph
                return odfUtils.scanRightForAnyCharacter(rightNode) ? reject : accept;
            }
            // if not directly to the right of a character, reject
            if (!rightOfChar) {
                return reject;
            }
            // accept if there is no character to the left
            leftNode = leftNode || odfUtils.previousNode(container);
            return odfUtils.scanLeftForAnyCharacter(leftNode) ? reject : accept;
        }

        /**
         * @param {!core.PositionIterator} iterator
         * @return {!core.PositionFilter.FilterResult}
         */
        this.acceptPosition = function (iterator) {
            var container = iterator.container(),
                nodeType = container.nodeType,
                localName,
                offset,
                text,
                leftChar,
                rightChar,
                leftNode,
                rightNode,
                r;

            if (nodeType !== 1 && nodeType !== 3) {
                return reject;
            }
            if (nodeType === 3) {
                if (!odfUtils.isGroupingElement(container.parentNode)) {
                    return reject;
                }
                // In a PositionIterator, the offset in a text node is never
                // equal to the length of the text node.
                offset = iterator.offset();
                text = container.data;
                runtime.assert(offset !== text.length, "Unexpected offset.");
                if (offset > 0) {
                    // The cursor may be placed to the right of a non-whitespace
                    // character.
                    leftChar = text.substr(offset - 1, 1);
                    if (!odfUtils.isODFWhitespace(leftChar)) {
                        return accept;
                    }
                    // A whitespace to the left is ok, if
                    // * there is a non-whitespace character to the right and
                    //   that is the first non-whitespace character or character
                    //   element or
                    // * there is not another whitespace character in front of
                    //   it.
                    if (offset > 1) {
                        leftChar = text.substr(offset - 2, 1);
                        if (!odfUtils.isODFWhitespace(leftChar)) {
                            r = accept;
                        } else if (!odfUtils.isODFWhitespace(text.substr(0, offset))) {
                            // check if this can be leading paragraph space
                            return reject;
                        }
                    } else {
                        // check if there is a non-whitespace character or
                        // character element in a preceding node
                        leftNode = odfUtils.previousNode(container);
                        if (odfUtils.scanLeftForNonWhitespace(leftNode)) {
                            r = accept;
                        }
                    }
                    if (r === accept) {
                        return odfUtils.isTrailingWhitespace(container, offset)
                            ? reject : accept;
                    }
                    rightChar = text.substr(offset, 1);
                    if (odfUtils.isODFWhitespace(rightChar)) {
                        return reject;
                    }
                    return odfUtils.scanLeftForAnyCharacter(odfUtils.previousNode(container))
                        ? reject : accept;
                }
                leftNode = iterator.leftNode();
                rightNode = container;
                container = /**@type{!Node}*/(container.parentNode);
                r = checkLeftRight(container, leftNode, rightNode);
            } else if (!odfUtils.isGroupingElement(container)) {
                r = reject;
            } else {
                leftNode = iterator.leftNode();
                rightNode = iterator.rightNode();
                r = checkLeftRight(container, leftNode, rightNode);
            }
            return r;
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

    /**
     * Returns a PositionIterator instance at the
     * specified starting position
     * @param {!number} position
     * @return {!core.PositionIterator}
     */
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

    /**
     * Returns an exteded neighborhood that can span multiple paragraph nodes;
     * Starting from the specified position, text nodes are added to the neighborhood array
     * till the sum of their lengths is greater than |length|. The direction of the length
     * specifies the direction to walk for making the neighborhood: negative is left, positive
     * is right.
     * @param {!number} position
     * @param {!number} length
     * @return {?Array.<!Node>}
     */
    this.getTextNeighborhood = function (position, length) {
        var iterator = getIteratorAtPosition(position),
            neighborhood = [],
            currentNeighborhood = [],
            currentNode = iterator.container(),
            iteratedLength,
            visited = false,
            inFirstNeighborhood = true,
            i,
            j;

        iteratedLength = 0;

        do {
            currentNeighborhood = iterator.textNeighborhood();
            currentNode = iterator.container();

            visited = false;
            for (i = 0; i < neighborhood.length; i += 1) {
                // All neighborhoods are disjoint ordered sets, so comparing
                // the first element of two neighborhoods is enough to compare them.
                // Therefore, if the first element of the current neighborhood is found in
                // the full neighborhood sequence, then the current neighborhood has
                // already been appended, and we need not check further.
                if (neighborhood[i] === currentNeighborhood[0]) {
                    visited = true;
                    break;
                }
            }
            if (!visited) {
                // A neighborhood is always populated from left to right. So if
                // we are moving towards the left, then reverse it.
                if (length < 0) {
                    currentNeighborhood.reverse();
                }
                // When in the first local neighborhood, remove the elements that are in
                // a direction opposite to the length.
                if (inFirstNeighborhood) {
                    for (j = 0; j < currentNeighborhood.length; j += 1) {
                        if (currentNeighborhood[j] === currentNode) {
                            currentNeighborhood.splice(0, j);
                            break;
                        }
                    }
                    if (length < 0) {
                        currentNeighborhood.splice(0, 1);
                    }
                    inFirstNeighborhood = false;
                }

                if (currentNeighborhood.length) {
                    neighborhood = neighborhood.concat(currentNeighborhood);
                }

                for (j = 0; j < currentNeighborhood.length; j += 1) {
                    iteratedLength += currentNeighborhood[j].data.length;
                }
            }
        } while ((length > 0 ? iterator.nextPosition() : iterator.previousPosition()) === true
                && iteratedLength < Math.abs(length));

        return neighborhood;
    };


    /**
     * returns a string of text contents within the "extended neighborhood"
     * (see this.getTextNeighborhood). the function will return less 
     * characters than requested, if too few characters are available.
     * the function will never return more characters then requested.
     * parameters position and length specify the extended neighborhood
     * (see this.getTextNeighborhood).
     *
     * @param {!number} position
     * @param {!number} length
     * @return {!string}
     */
    this.getText = function (position, length) {
        var i,
            charcount = 0,
            chardata = [],
            neighborhood = this.getTextNeighborhood(position, length);

        if (neighborhood.length < 1) {
            return "";
        }
        for (i = 0; i < neighborhood.length; i += 1) {
            if (neighborhood[i].textContent !== undefined) {
                chardata.push(neighborhood[i].textContent);
                charcount += neighborhood[i].textContent.length;
                if (charcount >= length) {
                    break;
                }
            }
        }
        return chardata.join("").substr(0, length);
    };

    /**
     * This function will iterate through positions allowed by the position
     * iterator and count only the text positions. When the amount defined by
     * offset has been counted, the Text node that that position is returned
     * as well as the offset in that text node.
     * Optionally takes a memberid of a cursor, to specifically return the
     * text node positioned just behind that cursor.
     * @param {!number} position
     * @param {number} memberid
     * @return {?{textNode: !Text, offset: !number}}
     */
    function getPositionInTextNode(position, memberid) {
        var iterator = gui.SelectionMover.createPositionIterator(rootNode),
            lastTextNode = null,
            lastNode = null,
            node,
            nodeOffset = 0,
            cursorNode = null;

        runtime.assert(position >= 0, "position must be >= 0");
        // iterator should be at the start of rootNode
        if (filter.acceptPosition(iterator) === 1) {
            node = iterator.container();
            if (node.nodeType === 3) {
                lastTextNode = /**@type{!Text}*/(node);
                nodeOffset = 0;
            }
        } else {
            // add 1 to move into an acceptable position
            position += 1;
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
                    lastTextNode = rootNode.ownerDocument.createTextNode('');
                    node.insertBefore(lastTextNode, iterator.rightNode());
                    nodeOffset = 0;
                    break;
                }
            }
        }
        if (lastTextNode === null) {
            return null;
        }

        // Move the cursor with the current memberid after all adjacent cursors
        if (memberid && cursors[memberid]) {
            cursorNode = cursors[memberid].getNode();
            while (nodeOffset === 0 && cursorNode.nextSibling
                    && cursorNode.nextSibling.localName === "cursor") {
                cursorNode.parentNode.insertBefore(cursorNode, cursorNode.nextSibling.nextSibling);
            }
            // The lastTextNode is not "" if the position is at the end of a paragraph.
            // We definitely need ephemeral empty text nodes instead of a lastTextNode representing
            // all the previous text, to prevent insertion by one cursor causing movement of the other 
            // cursors at the same position.
            if (cursorNode && lastTextNode.length > 0) {
                lastTextNode = rootNode.ownerDocument.createTextNode('');
                nodeOffset = 0;
                cursorNode.parentNode.insertBefore(lastTextNode, cursorNode.nextSibling);
            }
        }

        // if the position is just after a cursor, then move in front of that
        // cursor. Give preference to the cursor with the optionally specified memberid
        while (nodeOffset === 0 && lastTextNode.previousSibling &&
                lastTextNode.previousSibling.localName === "cursor") {
            node = lastTextNode.previousSibling;
            if (lastTextNode.length > 0) {
                lastTextNode = rootNode.ownerDocument.createTextNode('');
            }
            node.parentNode.insertBefore(lastTextNode, node);

            if (cursorNode === node) {
                break;
            }
        }

        // After the above cursor-specific adjustment, if the lastTextNode
        // has a text node previousSibling, merge them and make the result the lastTextNode
        while (lastTextNode.previousSibling
                && lastTextNode.previousSibling.nodeType === 3) {
            lastTextNode.previousSibling.appendData(lastTextNode.data);
            nodeOffset = lastTextNode.length + lastTextNode.previousSibling.length;
            lastTextNode = lastTextNode.previousSibling;
            lastTextNode.parentNode.removeChild(lastTextNode.nextSibling);
        }

        return {textNode: lastTextNode, offset: nodeOffset };
    }

    /**
     * @param {?Node} node
     * @return {?Node}
     */
    function getParagraphElement(node) {
        while (node && !isParagraph(node)) {
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

    function upgradeWhitespaceToElement(textNode, offset) {
        runtime.assert(textNode.data[offset] === ' ', "upgradeWhitespaceToElement: textNode.data[offset] should be a literal space");

        var space = textNode.ownerDocument.createElementNS(textns, 'text:s');
        space.appendChild(textNode.ownerDocument.createTextNode(' '));

        textNode.deleteData(offset, 1);
        textNode.splitText(offset);
        textNode.parentNode.insertBefore(space, textNode.nextSibling);
    }
    /**
     * Upgrades literal whitespaces (' ') to <text:s> </text:s>,
     * when given a textNode containing the whitespace and an offset
     * indicating the location of the whitespace in it.
     * @param {!Node} textNode
     * @param {!number} offset
     * @return {undefined}
     */
    this.upgradeWhitespaceToElement = upgradeWhitespaceToElement;

    function isSignificantWhitespace(textNode, offset) {
        var iterator = getIteratorAtPosition(0),
            container;

        iterator.setPosition(textNode, offset);
        container = iterator.container();

        if (container.nodeType === 3
                && container.data[offset] === ' '
                && container.parentNode.localName !== 's') {
            if (filter.acceptPosition(iterator) === 1) {
                return true;
            }
        }

        return false;
    }
    /** Takes a textNode and an offset, and returns true if the character
     * at that offset is a significant whitespace.
     * @param {!Node} textNode
     * @param {!number} offset
     * @return {!boolean}
     */
    this.isSignificantWhitespace = isSignificantWhitespace;

    function upgradeWhitespacesAtPosition(position) {
        var iterator = getIteratorAtPosition(position),
            container = null,
            offset,
            i = 0;

        iterator.previousPosition();
        for (i = -1; i <= 1; i += 1) {
            container = iterator.container();
            offset = iterator.offset();
            if (container.nodeType === 3
                    && container.data[offset] === ' '
                    && isSignificantWhitespace(container, offset)) {
                upgradeWhitespaceToElement(container, offset);
            }
            iterator.nextPosition();
        }
    }
    /**
     * Upgrades any significant whitespace at, one step left, and one step right of the given
     * position to space elements.
     * @param {!number} position
     * @return {undefined}
     */
    this.upgradeWhitespacesAtPosition = upgradeWhitespacesAtPosition;

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
     * @param {number} memberid
     * @return {?{textNode: !Text, offset: !number}}
     */
    this.getPositionInTextNode = getPositionInTextNode;

    /**
     * This returns the walkable paragraph just before or after the specified paragraph,
     * depending on the sign of the direction (negative is previous, positive is next).
     * @param {!Node} paragraph
     * @param {!number} direction
     * @return (Node|null)
     */
    this.getNeighboringParagraph = function (paragraph, direction) {
        var iterator = getIteratorAtPosition(0),
            currentParagraph = null;
        iterator.setPosition(paragraph, 0);

        do {
            if (filter.acceptPosition(iterator) === 1) {
                currentParagraph = getParagraphElement(iterator.container());
                if (currentParagraph !== paragraph) {
                    return currentParagraph;
                }
            }
        } while ((direction > 0 ? iterator.nextPosition() : iterator.previousPosition()) === true);

        if (currentParagraph === paragraph) {
            return null;
        }
    };

    /*
     * Returns the number of walkable positions of a paragraph node
     * @param {!Node} paragraph
     * @return {!number}
     */
    this.getWalkableParagraphLength = function (paragraph) {
        var iterator = getIteratorAtPosition(0),
            length = 0;
        iterator.setPosition(paragraph, 0);

        do {
            if (getParagraphElement(iterator.container()) !== paragraph) {
                return length;
            }
            if (filter.acceptPosition(iterator) === 1) {
                length += 1;
            }
        } while (iterator.nextPosition());

        return length;
    };

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
        runtime.assert((node !== null) && (node !== undefined),
            "OdtDocument.getDistanceFromCursor called without node");
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
        runtime.assert(Boolean(cursor), "OdtDocument::addCursor without cursor");
        var distanceToFirstTextNode = cursor.getStepCounter().countForwardSteps(1, filter),
            memberid = cursor.getMemberId();

        runtime.assert(Boolean(memberid), "OdtDocument::addCursor has cursor without memberid");
        cursor.move(distanceToFirstTextNode);

        cursors[memberid] = cursor;
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
        odfUtils = new odf.OdfUtils();
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
