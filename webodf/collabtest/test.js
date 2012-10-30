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
runtime.loadClass("gui.Avatar");
runtime.loadClass("gui.SessionController");

/**
 * @param {!Element} avatarButtonElement
 * @param {!ops.SessionImplementation} session
 * @param {!gui.Avatar} avatar
 * @return {undefined}
 */
function setupAvatarButton(avatarButtonElement, session, avatar) {
    "use strict";
    var doc = avatarButtonElement.ownerDocument,
        memberid = avatar.getMemberId();
    avatarButtonElement.appendChild(doc.createTextNode(memberid));
    avatarButtonElement.onmouseover = function () {
        avatar.getCaret().showHandle();
    };
    avatarButtonElement.onmouseout = function () {
        avatar.getCaret().hideHandle();
    };
    avatarButtonElement.onclick = function () {
        session.setActiveAvatar(avatar.getMemberId());
    };
    avatarButtonElement.style.background = avatar.getColor();
}

/**
 * @param {!ops.SessionImplementation} session
 * @param {!Array.<!gui.Avatar>} avatar
 * @return {undefined}
 */
function setupAvatarView(session, avatarlistdiv) {
    "use strict";
    var doc = avatarlistdiv.ownerDocument,
        htmlns = doc.documentElement.namespaceURI,
        avatars = session.getAvatars(),
        i,
        e;
    for (i = 0; i < avatars.length; i += 1) {
        e = doc.createElementNS(htmlns, "div");
        avatarlistdiv.appendChild(e);
        setupAvatarButton(e, session, avatars[i]);
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
        var testsession = new ops.SessionImplementation(odfcanvas.odfContainer());
        addMember(testsession, {id: "Bob", imageurl: "avatar-pigeon.png", color: "red"});
        addMember(testsession, {id: "Alice", imageurl: "avatar-flower.png", color: "green"});
        setupAvatarView(testsession, avatarlistdiv);

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
    var height = 50, controller;
    setHeight("session1", 0, height);
    setHeight("avatars1", 0, height);

    initSession("odf1", "avatars1", function(session) {
        runtime.log("odf1 session initialized.");

        controller = new gui.SessionController();
        controller.setSessionImplementation(session);
    });
}
// vim:expandtab
