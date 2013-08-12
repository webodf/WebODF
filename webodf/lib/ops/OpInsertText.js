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

/*global ops*/

/**
 * @constructor
 * @implements ops.Operation
 */
ops.OpInsertText = function OpInsertText() {
    "use strict";

    var memberid, timestamp, position, text;

    this.init = function (data) {
        memberid = data.memberid;
        timestamp = data.timestamp;
        position = data.position;
        text = data.text;
    };

    /**
     * This is a workaround for a bug where webkit forgets to relayout
     * the text when a new character is inserted at the beginning of a line in
     * a Text Node.
     * @param {!ops.OdtDocument} odtDocument
     * @param {!Node} textNode
     * @return {undefined}
     */
    function triggerLayoutInWebkit(odtDocument, textNode) {
        var parent = textNode.parentNode,
            next = textNode.nextSibling,
            impactedCursors = [];

        // Removing and then re-inserting the text node causes
        // all selections referencing this node to effectively break,
        // and fall back to the parent container
        // Workaround this by storing the range nodes, performing the modification
        // and then resetting the selection ranges
        odtDocument.getCursors().forEach(function (cursor) {
            var range = cursor.getSelectedRange();
            if (range && (range.startContainer === textNode
                || range.endContainer === textNode)) {
                impactedCursors.push({
                    cursor: cursor,
                    startContainer: range.startContainer,
                    startOffset: range.startOffset,
                    endContainer: range.endContainer,
                    endOffset: range.endOffset
                });
            }
        });

        parent.removeChild(textNode);
        parent.insertBefore(textNode, next);

        impactedCursors.forEach(function (entry) {
            var range = entry.cursor.getSelectedRange();
            // the cursor hasn't physically moved, we're just fixing the ranges again
            range.setStart(entry.startContainer, entry.startOffset);
            range.setEnd(entry.endContainer, entry.endOffset);
        });
    }

    this.execute = function (odtDocument) {
        var domPosition,
            previousNode,
            parent,
            refNode,
            ownerDocument = odtDocument.getDOM(),
            paragraphElement,
            textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
            space = " ",
            tab = "\t",
            append = true,
            startIndex = 0,
            textToInsert,
            spaceTag,
            node,
            i;

        domPosition = odtDocument.getPositionInTextNode(position, memberid);
        if (domPosition) {
            previousNode = domPosition.textNode;
            parent = previousNode.parentNode;
            refNode = previousNode.nextSibling;
            paragraphElement = odtDocument.getParagraphElement(previousNode);

            if (domPosition.offset !== previousNode.length) {
                refNode = previousNode.splitText(domPosition.offset);
            }

            for (i = 0; i < text.length; i += 1) {
                if (text[i] === space || text[i] === tab) {
                    if (startIndex < i) {
                        textToInsert = text.substring(startIndex, i);
                        if (append) {
                            previousNode.appendData(textToInsert);
                        } else {
                            parent.insertBefore(ownerDocument.createTextNode(textToInsert), refNode);
                        }
                    }
                    startIndex = i + 1;
                    append = false;

                    spaceTag = text[i] === space ? "text:s" : "text:tab";
                    node = ownerDocument.createElementNS(textns, spaceTag);
                    node.appendChild(ownerDocument.createTextNode(text[i]));
                    parent.insertBefore(node, refNode);
                }
            }
            textToInsert = text.substring(startIndex);
            if (textToInsert.length > 0) {
                if (append) {
                    previousNode.appendData(textToInsert);
                } else {
                    parent.insertBefore(ownerDocument.createTextNode(textToInsert), refNode);
                }
            }

            // FIXME A workaround.
            triggerLayoutInWebkit(odtDocument, previousNode);

            // If the last text node happens to be an empty text node, clean up.
            if (previousNode.length === 0) {
                previousNode.parentNode.removeChild(previousNode);
            }
            // FIXME care must be taken regarding the cursor positions
            // the new text must appear in front of the (own) cursor.
            // if there are/were other cursors at the same address,
            // those must not move along.
            // conclusion: insert text BEHIND ALL CURSORS, then move
            // the `memberid`-cursor behind new text; alternatively
            // move `memberid`-cursor behind all cursors at the same
            // position. then insert text before `memberid`-cursor.

            odtDocument.getOdfCanvas().refreshSize();
            odtDocument.emit(ops.OdtDocument.signalParagraphChanged, {
                paragraphElement: paragraphElement,
                memberId: memberid,
                timeStamp: timestamp
            });

            odtDocument.getOdfCanvas().rerenderAnnotations();
            return true;
        }
        return false;
    };

    this.spec = function () {
        return {
            optype: "InsertText",
            memberid: memberid,
            timestamp: timestamp,
            position: position,
            text: text
        };
    };

};
