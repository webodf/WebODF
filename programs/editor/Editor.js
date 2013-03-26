/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
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
/*global runtime,define,document,odf,ops */

define("webodf/editor/Editor", [
    "dojo/i18n!webodf/editor/nls/myResources",
    "webodf/editor/EditorSession",
    "webodf/editor/UserList",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "webodf/editor/widgets"],

    function (myResources,
        EditorSession,
        UserList,
        BorderContainer,
        ContentPane,
        loadWidgets) {
        "use strict";

        function Editor() {

            var self = this,
            // Private
            userid, memberid, session,
            editorSession,
            userList,
            networked,
            opRouter,
            sessionid,
            userModel,
            docurl;

            function translator(key, context) {
                if (undefined === myResources[key]) {
                    return "translation missing: " + key;
                }
                return myResources[key];
            }

            runtime.currentDirectory = function () {
                return "../../webodf/lib";
            };
            runtime.libraryPaths = function () {
                return [ runtime.currentDirectory() ];
            };

            /**
             * Utility method for testing
             * @param {?string} memberId
             */
            function addCursorToDoc(a_session, memberId) {
                var op = new ops.OpAddCursor(a_session);
                op.init({memberid : memberId});
                a_session.enqueue(op);
            }


            function init_gui_and_doc() {
                runtime.loadClass('odf.OdfCanvas');

                var odfElement, odfCanvas, mainContainer,
                filename, editorPane, peoplePane,
                inviteButton,
                // existence of that div determines if some objects will
                // be constructed. it is required for collaborative editing.
                peopleListDiv = document.getElementById('peopleList');

                runtime.assert(userid !== undefined, "userid should be defined here.");

                odfElement = document.getElementById("canvas");
                runtime.assert(odfElement, "init_gui_and_doc failed to get odf canvas from html");
                odfCanvas = new odf.OdfCanvas(odfElement);
                // make the canvas accessible to users of editor.js
                self.odfCanvas = odfCanvas;

                document.translator = translator;

                function translateContent(node) {
                    var i,
                    element,
                    tag,
                    placeholder,
                    translatable = node.querySelectorAll("*[text-i18n]");

                    for (i = 0; i < translatable.length; i += 1) {
                        element = translatable[i];
                        tag = element.localName;
                        placeholder = element.getAttribute('text-i18n');
                        if (tag === "label"
                            || tag === "span"
                            || /h\d/i.test(tag)) {
                                element.textContent = document.translator(placeholder);
                            }
                    }
                }
                document.translateContent = translateContent;

                odfCanvas.addListener("statereadychange", function () {

                    memberid = userid + "___" + Date.now();

                    session = new ops.Session(odfCanvas);
                    editorSession = new EditorSession(session, memberid);
                    if (peopleListDiv) {
                        userList = new UserList(editorSession, peopleListDiv);
                    }

                    if (networked) {
                        // use the nowjs op-router when connected
                        opRouter = opRouter ||
                        new ops.NowjsOperationRouter(sessionid, memberid);
                        session.setOperationRouter(opRouter);

                        runtime.log("editor: setting UserModel and requesting replay");
                        userModel = userModel || new ops.NowjsUserModel();
                        session.setUserModel(userModel);

                        editorSession.sessionView.disableEditHighlighting();
                        opRouter.requestReplay(function done() {
                            editorSession.sessionView.enableEditHighlighting();

                            // start editing: let the controller send the OpAddCursor
                            editorSession.startEditing();
                        });
                    } else {
                        // offline
                        editorSession.startEditing();
                    }

                    // gracefull cursor removal on pag closing
                    window.onunload = function() {
                        editorSession.endEditing();
                    };

                    loadWidgets(editorSession, self.saveOdtFile);
                });
                odfCanvas.load(docurl);
                odfCanvas.setEditable(false);

                // App Widgets
                mainContainer = new BorderContainer({}, 'mainContainer');
                filename = docurl.replace('/^.*[\\\/]/', '');

                editorPane = new ContentPane({
                    region: 'center'
                }, 'editor');
                mainContainer.addChild(editorPane);

                if (peopleListDiv) {
                    peoplePane = new ContentPane({
                        region: 'right',
                        title: translator("people")
                    }, 'people');
                    mainContainer.addChild(peoplePane);
                }

                mainContainer.startup();

                if (window.inviteButtonProxy) {
                    inviteButton = document.getElementById('inviteButton');
                    if (inviteButton) {
                        inviteButton.innerText = translator("invitePeople");
                        inviteButton.style.display = "block";
                        inviteButton.onclick = window.inviteButtonProxy.clicked;
                    }
                }
            }

            /*
             * initializes GUI and loads given document
             */
            self.bootLocal = function (a_docurl, a_userid) {
                if (a_docurl) {
                    docurl = a_docurl;
                }
                userid = a_userid||"localuser";
                init_gui_and_doc();
            };

            /*
             * waits for network to become available and initializes
             * the editor.
             */
            self.bootWithNetworkDelay = function (a_docurl, a_userid, a_sessionid) {
                var net = runtime.getNetwork(), accumulated_waiting_time = 0;

                if (a_docurl) {
                    docurl = a_docurl;
                }
                userid = a_userid || "you";
                if (a_sessionid) {
                    sessionid = a_sessionid;
                }

                function later_cb() {
                    if (net.networkStatus === "unavailable") {
                        runtime.log("connection to server unavailable.");
                        networked = false;
                        init_gui_and_doc();
                        return;
                    }
                    if (net.networkStatus !== "ready") {
                        if (accumulated_waiting_time > 8000) {
                            // game over
                            runtime.log("connection to server timed out.");
                            networked = false;
                            init_gui_and_doc();
                            return;
                        }
                        accumulated_waiting_time += 100;
                        runtime.getWindow().setTimeout(later_cb, 100);
                    } else {
                        runtime.log("connection to collaboration server established.");
                        networked = true;
                        init_gui_and_doc();
                    }
                }
                later_cb();
            };
        }
        return Editor;
    }
);

// vim:expandtab
