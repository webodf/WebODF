runtime.loadClass("ops.SessionImplementation");
runtime.loadClass("gui.Avatar");

function setupAvatarButton(avatarButtonElement, avatar) {
    "use strict";
    var doc = avatarButtonElement.ownerDocument,
        memberid = avatar.getMemberId();
    avatarButtonElement.appendChild(doc.createTextNode(memberid));
    avatarButtonElement.onclick = function () {
        avatar.getCaret().focus();
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
        avatars[i].getCaret().showHandle();
    }
}

function addMember(session, member) {
    "use strict";
    session.addMemberToSession(member.id);
    var avatar = session.getAvatar(member.id);
    avatar.setImageUrl(member.imageurl);
    avatar.setColor(member.color);
}

function TestSession(odfcanvas, avatarlistdiv) {
    "use strict";
    var odfcontainer = odfcanvas.odfContainer(),
        session = new ops.SessionImplementation(odfcontainer),
        avatar;

    // in this test we start a session from scratch: it is not loaded from
    // a serialized document
    // each avatar is added at the starting position
    addMember(session, {id: "Bob", imageurl: "avatar-pigeon.png", color: "#fee"});
    addMember(session, {id: "Alice", imageurl: "avatar-flower.png", color: "#efe"});
    setupAvatarView(session, avatarlistdiv);
    //avatar.focus();

    console.log("READY.");
}

function loadAvatars(documentObject, avatarList) {
	"use strict";
    var testsession = new TestSession(documentObject.odfCanvas, avatarList);
}