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
runtime.loadClass("gui.Avatar");

var avatarStyles = null;

function setupAvatar(avatarButtonElement, avatar) {
    "use strict";
    var doc = avatarButtonElement.ownerDocument,
        memberid = avatar.getMemberId(),
        style, head;
    avatarButtonElement.appendChild(doc.createTextNode(memberid));
    avatarButtonElement.onclick = function () {
        document.session.setActiveAvatar(memberid);
    };
    avatarButtonElement.style.background = avatar.getColor();
    
    // Add per-avatar edited styling
    avatarStyles.sheet.insertRule('text|p[class=edited][user='+avatar.getMemberId()+'] { background-color: '+avatar.getColor()+';'
                                                                 +  '-webkit-animation-name: fade;'
                                                                 +  '-webkit-animation-duration: 10s;'
                                                                 +  '-webkit-animation-fill-mode: forwards;'
                                                                 +  'border-radius: 10px;}',
                        0);
}

function setupAvatarView(session, avatarlistdiv) {
    "use strict";

    var doc = avatarlistdiv.ownerDocument,
        htmlns = doc.documentElement.namespaceURI,
        avatars = session.getAvatars(),
        head, style,
        i,
        e;

    // Add a css sheet for avatar-edited styling
    head = document.getElementsByTagName('head')[0],
    style = document.createElementNS(head.namespaceURI, 'style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('media', 'screen, print, handheld, projection');
    style.appendChild(document.createTextNode('@namespace text url(urn:oasis:names:tc:opendocument:xmlns:text:1.0);'));
    head.appendChild(style);
    avatarStyles = style;

    for (i = 0; i < avatars.length; i += 1) {
        e = doc.createElementNS(htmlns, "div");
        avatarlistdiv.appendChild(e);
        setupAvatar(e, avatars[i]);
        avatars[i].getCaret().showHandle();
    }
    
    avatars.forEach(function(avatar) {
        document.addEventListener('changed', function() {
            avatar.getCaret().updateHandlePosition();
        });
    });
}

function addMember(session, member) {
    "use strict";
    session.addMemberToSession(member.id);
    var avatar = session.getAvatar(member.id);
    avatar.setImageUrl(member.imageurl);
    avatar.setColor(member.color);
}

function Session(odfcanvas, avatarlistdiv) {
    "use strict";
    var odfcontainer = odfcanvas.odfContainer(),
        session = new ops.SessionImplementation(odfcontainer),
        avatar;

    // in this test we start a session from scratch: it is not loaded from
    // a serialized document
    // each avatar is added at the starting position
    addMember(session, {id: "Bob", imageurl: "avatar-pigeon.png", color: "#fcc"});
    addMember(session, {id: "Alice", imageurl: "avatar-flower.png", color: "#cfc"});
    setupAvatarView(session, avatarlistdiv);

    return session;
}

function loadAvatars(documentObject, avatarList) {
	"use strict";
    document.session = new Session(documentObject.odfCanvas, avatarList);
}
