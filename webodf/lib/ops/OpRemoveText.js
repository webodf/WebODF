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
ops.OpRemoveText = function OpRemoveText() {
    "use strict";

    var memberid, timestamp, position, length, text;

    this.init = function (data) {
        memberid = data.memberid;
        timestamp = data.timestamp;
        position = data.position;
        length = data.length;
        text = data.text;
    };

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


    this.execute = function (odtDocument) {
        var neighborhood = [],
            textNode,
            paragraphElement,
            textNodeSequence = [],
            remainingLength = Math.abs(length),
            removalType = (length < 0) ? 'backspace' : 'delete',
            currentTextNode,
            currentParent,
            currentLength,
            i,
            firstNode;

        textNode = odtDocument.getPositionInTextNode(position).textNode;
        paragraphElement = odtDocument.getParagraphElement(textNode);
        neighborhood = odtDocument.getTextNeighborhood(position, length);
        if (neighborhood.length) {
            // Pick the index of the textNode from the starting neighborhood.
            firstNode = neighborhood.indexOf(textNode);
            if (removalType === 'delete') {
                firstNode += 1;
            }

            for (i = firstNode; i < neighborhood.length && remainingLength; i += 1) {
                currentTextNode = neighborhood[i];
                currentParent = currentTextNode.parentNode;
                currentLength = currentTextNode.data.length;
 
                if (currentLength <= remainingLength) {
                    currentParent.removeChild(currentTextNode);
                    // If this deleted textNode was the only child of it's parent,
                    // delete the parent too.
                    fixCursorPositions(odtDocument);
                    if (!currentParent.hasChildNodes()) {
                        currentParent.parentNode.removeChild(currentParent);
                    }
                    remainingLength -= currentLength;
                } else {
                    if (removalType === 'delete') {
                        currentTextNode.deleteData(0, remainingLength);
                    } else {
                        currentTextNode.deleteData(currentLength - remainingLength, remainingLength);
                    }
                    remainingLength = 0;
                }
            }

            fixCursorPositions(odtDocument);

            odtDocument.getOdfCanvas().refreshSize();
            odtDocument.emit(ops.OdtDocument.signalParagraphChanged, {
                paragraphElement: paragraphElement,
                memberId: memberid,
                timeStamp: timestamp
            });
            return true;
        }
        return false;
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
