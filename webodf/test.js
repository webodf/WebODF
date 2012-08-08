/*global document, runtime, odf, ops, gui*/

runtime.loadClass("ops.SessionImplementation");
runtime.loadClass("odf.OdfCanvas");
runtime.loadClass("gui.Avatar");

function TestSession(odfcanvas) {
    "use strict";
    var odfcontainer = odfcanvas.odfContainer(),
        session = new ops.SessionImplementation(odfcontainer),
        avatar;

    // in this test we start a session from scratch: it is not loaded from
    // a serialized document
    // each avatar is added at the starting position
    session.addMemberToSession("Jos");
    avatar = session.getAvatar("Jos");
    avatar.focus();

    console.log("READY");
}

function init() {
    "use strict";
    var odfelement = document.getElementById("odf"),
        odfcanvas = new odf.OdfCanvas(odfelement);
    odfcanvas.addListener("statereadychange", function () {
        var testsession = new TestSession(odfcanvas);
    });
    odfcanvas.load("eersteversie7.odt");
    //odfcanvas.load("example.odp");
}
