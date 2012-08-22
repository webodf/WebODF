/*global document, runtime, odf, ops, gui*/

runtime.currentDirectory = function () {
    return "../lib";
};
runtime.libraryPaths = function () {
    return [ runtime.currentDirectory() ];
};
runtime.loadClass("ops.SessionImplementation");
runtime.loadClass("odf.OdfCanvas");
runtime.loadClass("gui.Avatar");

function setupAvatarButton(avatarButtonElement, avatar) {
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
        avatar.focus();
    };
    avatarButtonElement.style.background = avatar.getColor();
}

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
        setupAvatarButton(e, avatars[i]);
    }
}

function addMember(session, member) {
    "use strict";
    session.addMemberToSession(member.id);
    var avatar = session.getAvatar(member.id);
    avatar.setImageUrl(member.imageurl);
    avatar.setColor(member.color);
}

function TestSession(odfcanvas, odfid, avatarlistdiv) {
    "use strict";
    var odfcontainer = odfcanvas.odfContainer(),
        session = new ops.SessionImplementation(odfcontainer),
        avatar;

    // in this test we start a session from scratch: it is not loaded from
    // a serialized document
    // each avatar is added at the starting position
    addMember(session, {id: "Bob", imageurl: "avatar-pigeon.png", color: "red"});
    addMember(session, {id: "Alice", imageurl: "avatar-flower.png", color: "green"});
    setupAvatarView(session, avatarlistdiv);
    //avatar.focus();

    console.log("READY " + odfid);
}

function initSession(odfid, avatarlistid, callback) {
    "use strict";
    var odfelement = document.getElementById(odfid),
        avatarlistdiv = document.getElementById(avatarlistid),
        odfcanvas = new odf.OdfCanvas(odfelement),
        ready = false;
    odfcanvas.addListener("statereadychange", function (o) {
        if (ready) {
            return;
        }
        ready = true;
        var testsession = new TestSession(odfcanvas, odfid, avatarlistdiv);
        if (callback) {
            callback();
            callback = null;
        }
    });
    odfcanvas.load("text.odt");
}

function init() {
    "use strict";
    initSession("odf1", "avatars1", function () {
        // workaround for fact that onreadychange signal is somehow too soon
        runtime.setTimeout(function () {
            initSession("odf2", "avatars2");
        }, 1);
    });
}
