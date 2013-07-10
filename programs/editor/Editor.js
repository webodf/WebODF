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
/*global runtime, define, document, odf, ops, window, gui, alert, saveAs, Blob */

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

        /**
         * @constructor
         * @param {{networked:boolean=,
         *          memberid:string=,
         *          loadCallback:function()=,
         *          saveCallback:function()=,
         *          cursorAddedCallback:function(!string)=,
         *          cursorRemovedCallback:function(!string)=,
         *          registerCallbackForShutdown:function(!function())= }} args
         */
        function Editor(args) {

            var self = this,
                // Private
                userid,
                memberid = args.memberid,
                session,
                editorSession,
                userList,
                networked = args.networked === true,
                opRouter,
                userModel,
                loadOdtFile = args.loadCallback,
                saveOdtFile = args.saveCallback,
                cursorAddedHandler = args.cursorAddedCallback,
                cursorRemovedHandler = args.cursorRemovedCallback,
                registerCallbackForShutdown = args.registerCallbackForShutdown,
                documentUrl,
                odfCanvas;

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
             * prepare all gui elements and load the given document.
             * after loading is completed, the given callback is called.
             * the caller still has to call editorSession.startEditing
             * which will insert the the cursor.
             *
             * @param {!string} initialDocumentUrl
             * @param {!function()} editorReadyCallback
             */
            function initGuiAndDoc(initialDocumentUrl, editorReadyCallback) {
                var odfElement, mainContainer,
                    editorPane, peoplePane,
                    inviteButton,
                    viewOptions = {
                        editInfoMarkersInitiallyVisible: networked,
                        caretAvatarsInitiallyVisible: networked
                    },
                    peopleListDiv = document.getElementById('peopleList');

                if (networked) {
                    runtime.assert(peopleListDiv, "missing peopleList div in HTML");
                }

                runtime.loadClass('odf.OdfCanvas');

                // we might need it later
                documentUrl = initialDocumentUrl;
                runtime.assert(documentUrl, "document should be defined here.");

                runtime.assert(memberid !== undefined, "memberid should be defined here.");

                odfElement = document.getElementById("canvas");
                runtime.assert(odfElement, "initGuiAndDoc failed to get odf canvas from html");
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
                    if (!editorReadyCallback) {
                        // already called once, restart session and return
                        editorSession.sessionController.setUndoManager(new gui.TrivialUndoManager());
                        editorSession.startEditing();
                        return;
                    }

                    if (!memberid) {
                        // legacy - memberid should be passed in the constructor
                        memberid = (userid || 'undefined') + "___" + Date.now();
                    }

                    session = new ops.Session(odfCanvas);
                    editorSession = new EditorSession(session, memberid, {
                        viewOptions: viewOptions
                    });
                    editorSession.sessionController.setUndoManager(new gui.TrivialUndoManager());

                    if (peopleListDiv) {
                        userList = new UserList(editorSession, peopleListDiv);
                    }

                    if (registerCallbackForShutdown) {
                        registerCallbackForShutdown(editorSession.endEditing);
                    }

                    loadWidgets(editorSession, loadOdtFile, saveOdtFile);
                    editorReadyCallback();
                    editorReadyCallback = null;
                });
                odfCanvas.load(initialDocumentUrl);
                odfCanvas.setEditable(false);

                // App Widgets
                mainContainer = new BorderContainer({}, 'mainContainer');

                editorPane = new ContentPane({
                    region: 'center'
                }, 'editor');
                mainContainer.addChild(editorPane);

                if (networked && peopleListDiv) {
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

            /**
             * create the editor, load the starting document,
             * call editorReadyCallback once everything is done.
             *
             * @param {!string} docUrl
             * @param {!function()} editorReadyCallback
             * @return {undefined}
             */
            self.initAndLoadDocument = function (docUrl, editorReadyCallback) {
                initGuiAndDoc(docUrl, function () {
                    editorReadyCallback(editorSession);
                });
            };

            /**
             * Load a document in an editor that has already been initialized.
             */
            self.loadDocument = function (docUrl) {
                editorSession.endEditing();
                odfCanvas.load(docUrl);
            };

            /**
             * @param {?function()} callback
             * @return {undefined}
             */
            self.saveDocument = function (filename, callback) {
                function onsuccess(data) {
                    var mimebase = "application/vnd.oasis.opendocument.",
                        mimetype = mimebase + "text",
                        blob;
                    filename = filename || "doc.odt";
                    if (filename.substr(-4) === ".odp") {
                        mimetype = mimebase + "presentation";
                    } else if (filename.substr(-4) === ".ods") {
                        mimetype = mimebase + "spreadsheet";
                    }
                    blob = new Blob([data.buffer], {type: mimetype});
                    saveAs(blob, filename);
                }
                function onerror(error) {
                    alert(error);
                }
                var doc = odfCanvas.odfContainer();
                doc.createByteArray(onsuccess, onerror);
            };

            /**
             * create the editor, load the starting document of an
             * editing-session, request a replay of previous operations, call
             * editorReadyCallback once everything is done.
             *
             * @param {!string} sessionId
             * @param {?function()} editorReadyCallback
             */
            self.loadSession = function (sessionId, editorReadyCallback) {
                initGuiAndDoc("/session/" + sessionId + "/genesis", function () {
                    // use the nowjs op-router when connected
                    opRouter = opRouter || new ops.NowjsOperationRouter(sessionId, memberid);
                    session.setOperationRouter(opRouter);

                    userModel = userModel || new ops.NowjsUserModel();
                    session.setUserModel(userModel);

                    opRouter.requestReplay(function done() {
                        var odtDocument = session.getOdtDocument();
                        if (cursorAddedHandler) {
                            odtDocument.subscribe(ops.OdtDocument.signalCursorAdded, function (cursor) {
                                cursorAddedHandler(cursor.getMemberId());
                            });
                        }
                        if (cursorRemovedHandler) {
                            odtDocument.subscribe(ops.OdtDocument.signalCursorRemoved, function (memberId) {
                                cursorRemovedHandler(memberId);
                            });
                        }

                        editorReadyCallback(editorSession);
                    });

                });
            };

            // access to user model
            self.getUserModel = function () {
                return userModel;
            };
        }
        return Editor;
    });

// vim:expandtab
