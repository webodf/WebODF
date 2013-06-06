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

/*global ops, runtime*/

/**
 * @constructor
 * @implements ops.Operation
 */
ops.OpRemoveText = function OpRemoveText() {
    "use strict";

    var memberid, timestamp, position, length, text, odfUtils;

    this.init = function (data) {
        memberid = data.memberid;
        timestamp = data.timestamp;
        position = data.position;
        length = data.length;
        text = data.text;
        odfUtils = new odf.OdfUtils();
    };

    /**
     * Iterates through all cursors and checks if they are in
     * walkable positions; if not, move the cursor 1 filtered step backward
     * which guarantees walkable state for all cursors.
     */
    function fixCursorPositions(odtDocument) {
        var cursors, stepCounter, steps, filter, i;

        cursors = odtDocument.getCursors();
        filter = odtDocument.getPositionFilter();

        for (i in cursors) {
            if (cursors.hasOwnProperty(i)) {
                stepCounter = cursors[i].getStepCounter();
                if (!stepCounter.isPositionWalkable(filter)) {
                    steps = -stepCounter.countBackwardSteps(1, filter);
                    cursors[i].move(steps);
                    if (i === memberid) {
                        odtDocument.emit(ops.OdtDocument.signalCursorMoved, cursors[i]);
                    }
                }
            }
        }
    }

    /**
     * Merges the 'second' paragraph into the 'first' paragraph,
     * appending the contents by default. If 'prepend' is true,
     * the contents are prepended.
     * @param {!Node} first
     * @param {!Node} second
     * @param {!boolean} prepend
     * @return {undefined}
     */
    function mergeParagraphs(first, second, prepend) {
        var parent,
            child,
            isEmptyNode,
            firstEditInfo = null;

        child = prepend ? second.lastChild : second.firstChild;

        while (child) {
            second.removeChild(child);
            isEmptyNode = (child.localName === "s" || child.localName === "span") && child.textContent.length === 0;
            if (child.localName !== 'editinfo' && !isEmptyNode) {
                if (prepend) {
                    firstEditInfo = first.getElementsByTagNameNS('editinfo')[0];
                    if (firstEditInfo) {
                        first.insertBefore(child, firstEditInfo);
                    } else {
                        first.insertBefore(child, first.firstChild);
                    }
                } else {
                    first.appendChild(child);
                }
            }

            child = prepend ? second.lastChild : second.firstChild;
        }

        parent = second.parentNode;
        if (odfUtils.isListItem(parent)) {
            parent.parentNode.removeChild(parent);
        } else {
            parent.removeChild(second);
        }
    }

    /**
     * Takes a given position and signed length, and returns an extended neighborhood
     * that can be safely iterated on for deletion. The initial textnode might have 
     * extra characters alongwith the characters of deletion interest. This function
     * deletes the target characters, and then computes a neighborhood that consists
     * of the remaining text nodes, which is all that is needed for further deletion.
     * @param odtDocument
     * @param {!number} position
     * @param {!number} length
     * @return {!{paragraphElement: !Node, neighborhood: ?Array.<!Node>, remainingLength: !number}}
     */
    function getPreprocessedNeighborhood(odtDocument, position, length) {
        // First, upgrade whitespaces before any deletion, around the initial position
        odtDocument.upgradeWhitespacesAtPosition(position);

        var domPosition = odtDocument.getPositionInTextNode(position),
            initialTextNode = domPosition.textNode,
            initialTextOffset = domPosition.offset,
            initialParentElement = initialTextNode.parentNode,
            paragraphElement = odtDocument.getParagraphElement(initialParentElement),
            remainingLength = Math.abs(length),
            direction = (length < 0) ? -1 : 1,
            removalType = (length < 0) ? 'backspace' : 'delete',
            neighborhood,
            difference;

        if (initialTextNode.data === "") {
            // Sometimes the initialTextNode returned by getPositionInTextNode is "" -
            // for example when the position is beside a space, etc. These text nodes should be
            // cleaned up, so remove it
            initialParentElement.removeChild(initialTextNode);
            neighborhood = odtDocument.getTextNeighborhood(position, length);
        } else if (initialTextOffset !== 0) {
            // If the deletion is around a cursor, this initialTextoffset is 0.
            // But if not, the neighborhood may come with the first node containing extra
            // characters than the ones we want to delete.
            // To avoid that, we must first delete the target content from the initial text node,
            // and then request the neighborhood, so that the first element in the neighborhood
            // can be easily operated upon by the deletion loop
            if (removalType === 'delete') {
                difference = remainingLength < (initialTextNode.length - initialTextOffset)
                    ? remainingLength
                    : (initialTextNode.length - initialTextOffset);

                initialTextNode.deleteData(initialTextOffset, difference);
                // Now the new post-'collapse' position is the same as the old, because the
                // data to the right is deleted.
                // Upgrade the whitespaces there.
                odtDocument.upgradeWhitespacesAtPosition(position);
                neighborhood = odtDocument.getTextNeighborhood(position, length + difference * direction);
            } else {
                difference = remainingLength < initialTextOffset
                    ? remainingLength
                    : initialTextOffset;

                initialTextNode.deleteData(initialTextOffset - difference, difference);
                // Now the new post-collapse position is `position - difference - 1`,
                // because the data to the left is deleted.
                // Upgrade the whitespaces there.
                odtDocument.upgradeWhitespacesAtPosition(position - difference - 1);
                neighborhood = odtDocument.getTextNeighborhood(position - difference - 1, length + difference * direction);
            }

            remainingLength -= difference;
            if (difference && neighborhood[0] === initialTextNode) {
                // The initial text node has already been truncated.
                // Therefore, forget it from the neighborhood
                neighborhood.splice(0, 1);
            }
        } else {
            neighborhood = odtDocument.getTextNeighborhood(position, length);
        }

        return {
            paragraphElement: paragraphElement,
            neighborhood: neighborhood,
            remainingLength: remainingLength
        };
    }

    this.execute = function (odtDocument) {
        length = parseInt(length, 10);
        position = parseInt(position, 10);
        var neighborhood = [],
            paragraphElement,
            currentParagraphElement,
            nextParagraphElement,
            remainingLength,
            direction = (length < 0) ? -1 : 1,
            removalType = (length < 0) ? 'backspace' : 'delete',
            currentTextNode = null,
            currentParent = null,
            currentLength,
            preprocessedNeighborhood,
            i;

        preprocessedNeighborhood = getPreprocessedNeighborhood(odtDocument, position, length);

        neighborhood = preprocessedNeighborhood.neighborhood;
        remainingLength = preprocessedNeighborhood.remainingLength;
        paragraphElement = preprocessedNeighborhood.paragraphElement;

        // If there is no text neighborhood, and also no neighboring paragraph,
        // then there is nothing to delete
        if (odtDocument.getNeighboringParagraph(paragraphElement, direction) === null
                && neighborhood.length === 0) {
            return false;
        }

        while (remainingLength) {
            if (neighborhood[0]) {
                currentTextNode = neighborhood[0];
                currentParent = currentTextNode.parentNode;
                currentLength = currentTextNode.length;
            }

            currentParagraphElement = odtDocument.getParagraphElement(currentTextNode);
            if (paragraphElement !== currentParagraphElement) {
                // If paragraph element of the current textnode from the neighborhood is different
                // from the original paragraphElement, a merging must be performed.
                nextParagraphElement = odtDocument.getNeighboringParagraph(paragraphElement, direction);
                if (nextParagraphElement) {
                    // An empty paragraph should never win new childnodes. therefore, check if
                    // the walkable length of a paragraph is > 1 (non-empty).
                    if (removalType === 'delete') {
                        if (odtDocument.getWalkableParagraphLength(paragraphElement) > 1) {
                            mergeParagraphs(paragraphElement, nextParagraphElement, false);
                        } else {
                            mergeParagraphs(nextParagraphElement, paragraphElement,/*prepend*/true);
                            paragraphElement = nextParagraphElement;
                        }
                    } else {
                        if (odtDocument.getWalkableParagraphLength(nextParagraphElement) > 1) {
                            mergeParagraphs(nextParagraphElement, paragraphElement, false);
                            paragraphElement = nextParagraphElement;
                        } else {
                            mergeParagraphs(paragraphElement, nextParagraphElement,/*prepend*/true);
                        }
                    }
                }
                // A paragraph merging is worth 1 delete length
                remainingLength -= 1;
            } else {
                if (currentLength <= remainingLength) {
                    currentParent.removeChild(currentTextNode);
                    // If the parent is a span that contains no further text
                    // after deletion, remove the span.
                    fixCursorPositions(odtDocument);
                    // If the current node is text:s or span and is empty, it should
                    // be removed.
                    if ((currentParent.localName === "s"
                            || currentParent.localName === "span")
                            && currentParent.textContent.length === 0) {
                        currentParent.parentNode.removeChild(currentParent);
                    }

                    remainingLength -= currentLength;
                    neighborhood.splice(0, 1);
                } else {
                    if (removalType === 'delete') {
                        currentTextNode.deleteData(0, remainingLength);
                        // Now the new post-'collapse' position is the same as the old, because the
                        // data to the right is deleted.
                        // Upgrade the whitespaces there.
                        odtDocument.upgradeWhitespacesAtPosition(position);
                    } else {
                        currentTextNode.deleteData(currentLength - remainingLength, remainingLength);
                        // Now the new post-collapse position is `position + length - 1`,
                        // because the data to the left is deleted.
                        // Upgrade the whitespaces there.
                        odtDocument.upgradeWhitespacesAtPosition(position + length - 1);
                    }
                    remainingLength = 0;
                }
            }
        }

        fixCursorPositions(odtDocument);

        odtDocument.getOdfCanvas().refreshSize();
        odtDocument.emit(ops.OdtDocument.signalParagraphChanged, {
            paragraphElement: paragraphElement,
            memberId: memberid,
            timeStamp: timestamp
        });
        odtDocument.emit(ops.OdtDocument.signalCursorMoved, odtDocument.getCursor(memberid));

        return true;
    };

    this.spec = function () {
        return {
            optype: "RemoveText",
            memberid: memberid,
            timestamp: timestamp,
            position: position,
            length: length,
            text: text
        };
    };

};
