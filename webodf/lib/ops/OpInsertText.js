/**
 * @license
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
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
ops.OpInsertText = function OpInsertText(session) {
    "use strict";

    var memberid, timestamp, position, text;

    this.init = function (data) {
        memberid = data.memberid;
        timestamp = data.timestamp;
        position = data.position;
        text = data.text;
    };

    /* This is a workaround for a bug where webkit forgets to relayout
     * the text when a new character is inserted at the beginning of a line in
     * a Text Node.
     * @param {Node} textNode
     */
    function triggerLayoutInWebkit(textNode) {
        var parent = textNode.parentNode,
            next = textNode.nextSibling;
        parent.removeChild(textNode);
        parent.insertBefore(textNode, next);
    }

    this.execute = function (domroot) {
        var odtDocument = session.getOdtDocument(),
            domPosition, textNode;

        domPosition = odtDocument.getPositionInTextNode(position);
        if (domPosition) {
            textNode = domPosition.textNode;
            textNode.insertData(domPosition.offset, text);

            // FIXME A workaround.
            triggerLayoutInWebkit(textNode);

            // FIXME care must be taken regarding the cursor positions
            // the new text must appear in front of the (own) cursor.
            // if there are/were other cursors at the same address,
            // those must not move along.
            // conclusion: insert text BEHIND ALL CURSORS, then move
            // the `memberid`-cursor behind new text; alternatively
            // move `memberid`-cursor behind all cursors at the same
            // position. then insert text before `memberid`-cursor.
            session.emit(ops.Session.signalParagraphChanged, {
                paragraphElement: odtDocument.getParagraphElement(domPosition.textNode),
                memberId: memberid,
                timeStamp: timestamp
            });
        }
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
