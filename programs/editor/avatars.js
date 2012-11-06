/**
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
runtime.loadClass("ops.SessionImplementation");
runtime.loadClass("ops.NowjsOperationRouter");
runtime.loadClass("ops.NowjsUserModel");
runtime.loadClass("odf.OdfCanvas");
runtime.loadClass("gui.CaretFactory");
runtime.loadClass("gui.Caret");
runtime.loadClass("gui.SessionController");
runtime.loadClass("gui.SessionView");

function createAvatarButton(avatarListDiv, sessionView, memberId, userDetails) {
    "use strict";
    var doc = avatarListDiv.ownerDocument,
        htmlns = doc.documentElement.namespaceURI,
        avatarDiv = doc.createElementNS(htmlns, "div"),
        imageElement = doc.createElement("img"),
        fullnameTextNode = doc.createTextNode(userDetails.fullname);

    imageElement.src = userDetails.imageurl;
    imageElement.width = 22;
    imageElement.height = 22;
    imageElement.hspace = 3;
    imageElement.align = "baseline";
    imageElement.style['margin-top'] = "3px";

    avatarDiv.appendChild(imageElement);
    avatarDiv.appendChild(fullnameTextNode);
    avatarDiv.memberId = memberId; // TODO: namespace?
    avatarDiv.style.background = userDetails.color;
    avatarDiv.onmouseover = function () {
        //avatar.getCaret().showHandle();
    };
    avatarDiv.onmouseout = function () {
        //avatar.getCaret().hideHandle();
    };
    avatarDiv.onclick = function () {
        var caret = sessionView.getCaret(memberId);
        if (caret) {
            caret.toggleHandleVisibility();
        }
    };
    avatarListDiv.appendChild(avatarDiv);
}

/**
 * @param {!Element} avatarListDiv
 * @param {!string} memberId
 */
function removeAvatarButton(avatarListDiv, memberId) {
    var node = avatarListDiv.firstChild;
    while (node) {
        if (node.memberId === memberId) {
            avatarListDiv.removeChild(node);
            return;
        }
        node = node.nextSibling;
    }
}

function loadAvatarPane(sessionView, avatarListDiv) {
    "use strict";

    var session = sessionView.getSession();

    // attention: there is a race condition, sessionView also only
    // on this signal creates the caret, so trying to get the caret
    // at this point is not good to do. So fetch it dynamically in the avatarbutton.
    session.subscribe("cursor/added", function(cursor) {
        var memberId = cursor.getMemberId();

        createAvatarButton(avatarListDiv, sessionView, memberId, session.getUserModel().getUserDetails(memberId));
    });
    session.subscribe(ops.SessionImplementation.signalCursorRemoved, function(memberid) {
        removeAvatarButton(avatarListDiv, memberid);
    });
}
