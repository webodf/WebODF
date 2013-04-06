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

/*global runtime, ops*/

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

    this.execute = function (odtDocument) {
        var domPosition, textNode,
            removalType = (length < 0) ? 'backspace' : 'delete';

        if (length < 0) {
            length = -length;
            position -= length;
            domPosition = odtDocument.getPositionInTextNode(position);
        } else {
            // get avatars next textnode sibling
            domPosition = odtDocument.getPositionInTextNode(position + 1);
            // FIXME: this is dirty and assumes the cursor in place.
            // actually it will only work correctly with a `length` of 1
            // or with a `length` > 1 iff no avatar or other XML element
            // is within the deletion range.
            // a real implementation of this method should work
            // independently of the cursor or other XML elements.
            // (right now getPositionInTextNode will always return an
            // offset==textnode.length if the (or any) cursor is right
            // before the deletion position; that is because the
            // avatar splits the textnode)
            // the real implementation needs to delete all characters
            // between (walkable) position and position+length with no
            // (but preserving) other XML elements. by definition of
            // walkability, the amount of deleted characters will be
            // exactly `length` (but the actual deleted characters can
            // have arbitrary XML tags between them)
            //
            if (domPosition.offset !== 1) {
                runtime.log("unexpected!");
                return false;
            }
            domPosition.offset -= 1;
        }
        if (domPosition) {
            textNode = domPosition.textNode;

            // If we are backspacing, then the textNode is on the left. If this textNode is about to be set to "", we should delete it. Similarly for 'delete', the textNode is on the right, and if we are executing 'delete' just before the last character, we should delete the textNode. If we are not at any extremity, just use textNode.deleteData(...);
            if ((removalType === 'backspace' && domPosition.offset === 0)
                    || (removalType === 'delete' && domPosition.offset + 1 === textNode.length)) {
                textNode.parentNode.removeChild(textNode);
            } else {
                textNode.deleteData(domPosition.offset, length);
            }

            odtDocument.emit(ops.OdtDocument.signalParagraphChanged, {
                paragraphElement: odtDocument.getParagraphElement(textNode),
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
