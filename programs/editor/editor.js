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
/*global runtime,define,document,odf,require,ops,gui */

define("webodf/editor", [
    "webodf/editor/UserList",
    "webodf/editor/widgets"],
    function (UserList, loadWidgets) {
        "use strict";
        var self = {};

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
        function addCursorToDoc(session, memberId) {
            var op = new ops.OpAddCursor(session);
            op.init({memberid : memberId});
            session.enqueue(op);
        }


        function init_gui_and_doc(docurl, userid) {
            runtime.loadClass('odf.OdfCanvas');

            var doclocation, pos, odfElement, odfCanvas, filename, isConnectedWithNetwork;

            if (userid === undefined) {
                userid = "undefined";
            }

            isConnectedWithNetwork = (runtime.getNetwork().networkStatus !== "unavailable");

            odfElement = document.getElementById("canvas");
            runtime.assert(odfElement, "init_gui_and_doc failed to get odf canvas from html");
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
            require({
                paths : {
                    "webodf" : "/webodf",
                    "webodf/editor" : "/programs/editor"
                }
            }, [
                'dojo/i18n!webodf/editor/nls/myResources',
                'webodf/editor/EditorSession',
                'webodf/editor/UserList'
            ], function (myResources, EditorSession, UserList) {
                var translator = function (key, context) {
                    if (undefined === myResources[key]) {
                        return "translation missing: " + key;
                    }
                    return myResources[key];
                };
                document.translator = translator;

                odfCanvas.addListener("statereadychange", function () {
                    var session,
                        editorSession,
                        memberid = userid + "___" + Date.now(),
                        userList,
                        opRouter = null;

                    session = new ops.SessionImplementation(odfCanvas);
                    editorSession = new EditorSession(session, memberid);
                    userList = new UserList(editorSession, document.getElementById('peopleList'));

                    if (isConnectedWithNetwork) {
                        // use the nowjs op-router when connected
                        session.setOperationRouter(opRouter = new ops.NowjsOperationRouter());
                        opRouter.setMemberid(memberid);

                        runtime.log("editor: setting UserModel and requesting replay");
                        session.setUserModel(new ops.NowjsUserModel(function done() {
                            opRouter.requestReplay(function done() {
                                // start editing: let the controller send the OpAddCursor
                                editorSession.startEditing();
                                // add our two friends
                                // addCursorToDoc(session, "bob");
                                // addCursorToDoc(session, "alice");
                            });
                        }));
                    } else {
                        // offline
                        editorSession.startEditing();
                    }

                    loadWidgets(editorSession);
                });
                odfCanvas.load(doclocation);
                odfCanvas.setEditable(false);

                // App Widgets
                require([
                    "dijit/layout/BorderContainer",
                    "dijit/layout/ContentPane",
                    "dojox/layout/ExpandoPane"],
                    function (BorderContainer, ContentPane, ExpandoPane) {
                        var mainContainer = new BorderContainer({}, 'mainContainer'),
                            collabContainer = new BorderContainer({}, 'collabContainer'),
                            filename = doclocation.replace('/^.*[\\\/]/', ''),
                            topPane,
                            editorPane,
                            collabPane,
                            peoplePane,
                            chatPane;

                        topPane = new ContentPane({
                            region: 'top',
                            content: "<h1><a href='" + doclocation + "''>" + filename + "</a></h1>"
                        }, 'topPane');
                        editorPane = new ContentPane({
                            region: 'center'
                        }, 'editor');
                        collabPane = new ExpandoPane({
                            region: 'trailing',
                            splitter: 'true',
                            title: translator("collaborationPane")
                        }, 'collaboration');
                        peoplePane = new ContentPane({
                            region: 'top',
                            splitter: 'true',
                            title: translator("people")
                        }, 'people');
                        chatPane = new ContentPane({
                            region: 'center',
                            title: translator("chat")
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
                            function (TextBox, Button) {
                                // People Box
                                var nameBox, inviteButton, chatInput;

                                // User's Editable Name
                                nameBox = new TextBox({
                                    value: '',
                                    placeHolder: translator("typeYourName_DDD"),
                                    style: 'text-align: center;'
                                }, 'nameEdit');

                                inviteButton = new Button({
                                    label: translator("invitePeople")
                                }, 'inviteButton');

                                // Chat Box

                                // Chat Input
                                chatInput = new TextBox({
                                    value: '',
                                    placeHolder: translator("startTypingToChat_DDD"),
                                    style: 'text-align: center;'
                                }, 'chatInput');
                            });
                    });
            });
        }

        self.boot = function (docurl, userid) {
            var net = runtime.getNetwork(), accumulated_waiting_time = 0;

            //alert("booting: ["+docurl+"] userlist: "+UserList);

            userid = userid || "you";

            function later_cb() {
                if (net.networkStatus === "unavailable") {
                    runtime.log("connection to server unavailable.");
                    init_gui_and_doc(docurl, userid);
                    return;
                }
                if (net.networkStatus !== "ready") {
                    if (accumulated_waiting_time > 8000) {
                        // game over
                        runtime.log("connection to server timed out.");
                        init_gui_and_doc(docurl, userid);
                        return;
                    }
                    accumulated_waiting_time += 100;
                    runtime.getWindow().setTimeout(later_cb, 100);
                } else {
                    runtime.log("connection to collaboration server established.");
                    init_gui_and_doc(docurl, userid);
                }
            }
            later_cb();
        };
        return self;
    });

        /*
         TODO:
        window.onunload = function() {
            editor.editorSession.endEditing();
        }
        */
        // vim:expandtab
