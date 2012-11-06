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
/*global runtime,document,odf,require,ops,gui */

runtime.currentDirectory = function () {
    "use strict";
    return "../../webodf/lib";
};
runtime.libraryPaths = function () {
    "use strict";
    return [ runtime.currentDirectory() ];
};


/**
 * Utility method for testing
 * @param {?string} memberId
 */
function addCursorToDoc(session, memberId) {
    "use strict";
    var op = new ops.OpAddCursor(session);
    op.init({memberid:memberId});
    session.enqueue(op);
}


function init_gui_and_doc(docurl, userid) {
    "use strict";
    runtime.loadClass('odf.OdfCanvas');

    var doclocation, pos, odfElement, odfCanvas, filename, isConnectedWithNetwork;

    if (userid === undefined) {
        userid = "undefined";
    }

    isConnectedWithNetwork = (runtime.getNetwork().networkStatus !== "unavailable");

    odfElement = document.getElementById("canvas");
    odfCanvas = new odf.OdfCanvas(odfElement);

    // this needs to be available for the widgets
    document.odfCanvas = odfCanvas;

    if (docurl === undefined) {
        // If the URL has a fragment (#...), try to load the file it represents
        doclocation = String(document.location);
        pos = doclocation.indexOf('#');
        if (pos === -1) { return; }
        doclocation = doclocation.substr(pos + 1);
    } else {
        doclocation = docurl;
    }

    // Editor Translations, Widgets and Avatars
    require([
        'dojo/i18n!nls/myResources.js',
        'widgets.js',
        'avatars.js'
    ], function (translator) {
        document.translator = translator;

        odfCanvas.addListener("statereadychange", function() {
            var session, sessionController, sessionView,
                memberid = userid+"___"+Date.now(),
                opRouter = null;

            session = new ops.SessionImplementation(odfCanvas);
            if (isConnectedWithNetwork) {
                // use the nowjs op-router when connected
                session.setOperationRouter(opRouter = new ops.NowjsOperationRouter());
                opRouter.setMemberid(memberid);
            }
            sessionController = new gui.SessionController(session, memberid);
            sessionView = new gui.SessionView(session, new gui.CaretFactory(sessionController));

            if (isConnectedWithNetwork) {
                runtime.log("editor: setting UserModel and requesting replay");
                session.setUserModel(new ops.NowjsUserModel(function done() {
                    opRouter.requestReplay(function done() {
                        // start editing: let the controller send the OpAddCursor
                        sessionController.startEditing();
                        // add our two friends
                        // addCursorToDoc(session, "bob");
                        // addCursorToDoc(session, "alice");
                    });
                }));
            }

            loadWidgets(session, sessionController.getInputMemberId());
            loadAvatarPane(sessionView, document.getElementById('peopleList'));

        });
        odfCanvas.load(doclocation);
        odfCanvas.setEditable(false);

        // App Widgets
        require([
            "dijit/layout/BorderContainer",
            "dijit/layout/ContentPane",
            "dojox/layout/ExpandoPane"],
            function(BorderContainer, ContentPane, ExpandoPane) {
                var mainContainer = new BorderContainer({}, 'mainContainer');
                var collabContainer = new BorderContainer({}, 'collabContainer');
                var filename = doclocation.replace(/^.*[\\\/]/, '');

                var topPane = new ContentPane({
                    region: 'top',
                    content: "<h1><a href='" + doclocation + "''>" + filename + "</a></h1>"
                }, 'topPane');
                var editorPane = new ContentPane({
                    region: 'center'
                }, 'editor');
                var collabPane = new ExpandoPane({
                    region: 'trailing',
                    splitter: 'true',
                    title: document.translator.collaborationPane
                }, 'collaboration');
                var peoplePane = new ContentPane({
                    region: 'top',
                    splitter: 'true',
                    title: document.translator.people
                }, 'people');
                var chatPane = new ContentPane({
                    region: 'center',
                    title: document.translator.chat
                }, 'chat');

                mainContainer.addChild(topPane);
                mainContainer.addChild(editorPane);
                mainContainer.addChild(collabPane);
                collabContainer.addChild(peoplePane);
                collabContainer.addChild(chatPane);
                collabPane.addChild(collabContainer);

                mainContainer.startup();
                collabContainer.startup();

                require([
                    "dijit/form/TextBox",
                    "dijit/form/Button"],
                    function(TextBox, Button) {
                        // People Box

                        // User's Editable Name
                        var nameBox = new TextBox({
                            value: '',
                            placeHolder: document.translator.typeYourName_DDD,
                            style: 'text-align: center;'
                        }, 'nameEdit');

                        var inviteButton = new Button({
                            label: document.translator.invitePeople,
                        }, 'inviteButton');

                        // Chat Box

                        // Chat Input
                        var chatInput = new TextBox({
                            value: '',
                            placeHolder: document.translator.startTypingToChat_DDD,
                            style: 'text-align: center;'
                        }, 'chatInput');
                    }
                );
            }
        );
    });
}

function editor_init(docurl, userid) {
    "use strict";
    var net = runtime.getNetwork(), accumulated_waiting_time = 0;

    function later_cb() {
        if (net.networkStatus === "unavailable") {
            runtime.log("connection to server unavailable.");
            return;
        }
        if (net.networkStatus !== "ready") {
            if (accumulated_waiting_time > 8000) {
                // game over
                runtime.log("connection to server timed out.");
                return;
            }
            accumulated_waiting_time += 100;
            runtime.getWindow().setTimeout(later_cb, 100);
            return;
        } else {
            runtime.log("connection to collaboration server established.");
            init_gui_and_doc(docurl, userid);
        }
    }
    later_cb();
}

window.onload = function() {
    editor_init( "/webodf/collabtest/text.odt", "you");
};
// vim:expandtab
