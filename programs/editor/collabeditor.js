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

/*
 * bootstrap the editor for server-based collaborative editing
 * this file is meant to be included from HTML and used
 * by users who do not want to know much about the inner
 * complexity.
 * so we need to make it really easy.
 *
 * including this file will result in the namespace/object
 * "webodfEditor" to be available from the HTML side.
 * calling webodfEditor.boot() will start the editor.
 * the method can also take some parameters to specify
 * behaviour. see documentation of that method.
 *
 */

/*global runtime, require, document, alert, gui, window */

// define the namespace/object we want to provide
// this is the first line of API, the user gets.
var webodfEditor = (function () {
    "use strict";

    runtime.currentDirectory = function () {
        return "../../webodf/lib";
    };
    runtime.libraryPaths = function () {
        return [ runtime.currentDirectory() ];
    };

    var editorInstance = null,
        serverFactory = null,
        server = null,
        booting = false;

    /**
     * start the login process by offering a login/password prompt.
     * on success a list of sessions is offered.
     * when the user selects a session the callback is called
     * with the sessionId as parameter
     *
     * @param {!function(!string, !string, ?string)} callback
     * @returns {undefined}
     */
    function startLoginProcess(callback) {
        var userid, token;

        booting = true;

        runtime.assert(editorInstance === null, "cannot boot with instanciated editor");

        /**
         * Switches the pages by hiding the old one and unhiding the new
         * @param {?string} fromPageId
         * @param {!string} toPageId
         */
        function switchPage(fromPageId, toPageId) {
            if (fromPageId) {
                document.getElementById(fromPageId).style.display = "none";
            }
            document.getElementById(toPageId).style.display = "";
        }

        function enterSession(selectedSessionId) {
            switchPage("sessionListContainer", "mainContainer");

            callback(selectedSessionId, userid, token);
        }

        function showSessions() {
            require({ }, ["webodf/editor/SessionListView"],
                function (SessionListView) {
                    var sessionListDiv = document.getElementById("sessionList"),
                        sessionList = new serverFactory.createSessionList(server),
                        sessionListView = new SessionListView(sessionList, sessionListDiv, enterSession);

                    switchPage("loginContainer", "sessionListContainer");
                }
            );
        }

        function loginSuccess(userData) {
            runtime.log("connected:" + userData.full_name);
            userid = userData.uid;
            token = userData.securityToken || null;

            showSessions();
        }

        function loginFail(result) {
            alert("Login failed: " + result);
        }

        function onLoginSubmit() {
            server.login(document.loginForm.login.value, document.loginForm.password.value, loginSuccess, loginFail);

            // block the submit button, we already dealt with the input
            return false;
        }

        // bring up the login form
        document.loginForm.Submit.onclick = onLoginSubmit;
        switchPage(null, "loginContainer");
    }

    /**
     * @param {!Object} args
     *
     * args:
     *
     * backend:   name of the server to use
     *
     * callback:  callback to be called as soon as the document is loaded
     *
     */
    function boot(args) {
        var editorOptions = {},
            loginProcedure = startLoginProcess;
        runtime.assert(!booting, "editor creation already in progress");

        if (args.saveCallback) {
            editorOptions.saveCallback = args.saveCallback;
        }
        if (args.cursorAddedCallback) {
            editorOptions.cursorAddedCallback = args.cursorAddedCallback;
        }
        if (args.cursorRemovedCallback) {
            editorOptions.cursorRemovedCallback = args.cursorRemovedCallback;
        }
        if (args.registerCallbackForShutdown) {
            editorOptions.registerCallbackForShutdown = args.registerCallbackForShutdown;
        } else {
            editorOptions.registerCallbackForShutdown = function (callback) {
                window.onunload = callback;
            };
        }

        if (args.loginProcedure) {
            loginProcedure = args.loginProcedure;
        }

        // start the editor with network
        runtime.log("starting collaborative editor for ["+args.backend+"].");
        require({ }, ["webodf/editor/server/"+args.backend+"/ServerFactory"], function (ServerFactory) {
            serverFactory = new ServerFactory();
            server = serverFactory.createServer();
            // wait for a network connection to establish.
            // call the callback when done, when finally failed, or
            // when a timeout reached.
            // the parameter to the callback is a string with the possible
            // values: "unavailable", "timeout", "ready"
            server.connect(8000, function (state) {
                var joinSession = server.joinSession;

                if (state === "ready") {
                    if (args.joinSession) {
                        joinSession = args.joinSession;
                    }

                    loginProcedure(function (sessionId, userId, token) {
                        // if pre-authentication has happened:
                        if (token) {
                            server.setToken(token);
                        }

                        joinSession(userId, sessionId, function(memberId) {
                            runtime.assert(sessionId, "sessionId needs to be specified");
                            runtime.assert(memberId, "memberId needs to be specified");
                            runtime.assert(editorInstance === null, "cannot boot with instanciated editor");

                            editorOptions = editorOptions || {};
                            editorOptions.memberid = memberId;
                            editorOptions.networked = true;
                            editorOptions.networkSecurityToken = token;

                            require({ }, ["webodf/editor/Editor"],
                                function (Editor) {
                                    editorInstance = new Editor(editorOptions, server, serverFactory);

                                    // load the document and get called back when it's live
                                    editorInstance.loadSession(sessionId, function (editorSession) {
                                        editorSession.startEditing();
                                        if (args.callback) {
                                            args.callback(editorInstance);
                                        }
                                    });
                                }
                            );
                        });
                    });
                }
            });
        });
    }

    // exposed API
    return { boot: boot };
}());

