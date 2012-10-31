/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>

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
/*global document, runtime, odf, ops, gui, alert */

runtime.loadClass("ops.SessionImplementation");
runtime.loadClass("odf.OdfCanvas");
runtime.loadClass("gui.AvatarFactory");
runtime.loadClass("gui.Avatar");
runtime.loadClass("gui.SessionController");
runtime.loadClass("gui.SessionView");

/**
 * @param {!Element} avatarButtonElement
 * @param {!gui.Avatar} avatar
 * @return {undefined}
 */
function setupAvatarButton(avatarButtonElement, avatar) {
    "use strict";
    var doc = avatarButtonElement.ownerDocument,
        memberid = avatar.getMemberId();
    avatarButtonElement.appendChild(doc.createTextNode(memberid));
    avatarButtonElement.onmouseover = function () {
        //avatar.getCaret().showHandle();
    };
    avatarButtonElement.onmouseout = function () {
        //avatar.getCaret().hideHandle();
    };
    avatarButtonElement.onclick = function () {
        avatar.getCaret().showHandle();
    };
    avatarButtonElement.style.background = avatar.getColor();
}

/**
 * @param {!ops.SessionView} sessionView
 * @param {!Array.<!gui.Avatar>} avatar
 * @return {undefined}
 */
function setupAvatarView(sessionView, avatarlistdiv) {
    "use strict";
    var doc = avatarlistdiv.ownerDocument,
        htmlns = doc.documentElement.namespaceURI,
        avatars = sessionView.getAvatars(),
        i,
        e;
    for (i = 0; i < avatars.length; i += 1) {
        e = doc.createElementNS(htmlns, "div");
        avatarlistdiv.appendChild(e);
        setupAvatarButton(e, avatars[i]);
    }
}

/**
 * @param {!ops.SessionImplementation} session
 * @param {!{id:!string,imageurl:!string,color:!string}}
 * @return {undefined}
 */
function addMember(session, member) {
    "use strict";
    session.addMemberToSession(member.id);
    var avatar = session.getAvatar(member.id);
    avatar.setImageUrl(member.imageurl);
    avatar.setColor(member.color);
}

function initSession(odfid, avatarlistid, callback) {
    "use strict";
    var odfelement = document.getElementById(odfid),
        avatarlistdiv = document.getElementById(avatarlistid),
        odfcanvas = new odf.OdfCanvas(odfelement),
        testsession,
        sessionController,
        sessionView,
        ready = false;
    odfcanvas.addListener("statereadychange", function (container) {
        if (container.state !== odf.OdfContainer.DONE) {
            alert("statereadychange fired but state not DONE");
        }
        if (ready) {
            alert("ASSERT: statereadychange fired twice! (should not happen)");
            return;
        }
        ready = true;
        testsession = new ops.SessionImplementation(odfcanvas.odfContainer());
        sessionView = new gui.SessionView(testsession);
        sessionController = new gui.SessionController();
        sessionController.setSessionImplementation(testsession);
        sessionView.setGuiAvatarFactory(new gui.AvatarFactory(testsession, sessionController));

        // add our two friends
        sessionController.startEditing("bob");
        sessionController.startEditing("alice");
        setupAvatarView(sessionView, avatarlistdiv);

        // start editing: let the controller send the OpAddMember
        runtime.assert(testsession.getUserModel(), "lacking user model");
        sessionController.startEditing(testsession.getUserModel().myMemberId());

        if (callback) {
            callback(testsession);
            callback = null;
        }
    });
    odfcanvas.load("text.odt");
}

function setHeight(id, top, height) {
    "use strict";
    var div = document.getElementById(id);
    div.style.top = top + "%";
    div.style.height = height + "%";
}

function init() {
    "use strict";
    var height = 50;
    setHeight("session1", 0, height);
    setHeight("avatars1", 0, height);

    initSession("odf1", "avatars1", function(session) {
        runtime.log("odf1 session initialized.");
    });
}
// vim:expandtab
