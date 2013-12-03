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
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
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
 * @source: https://github.com/kogmbh/WebODF/
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
        editorOptions = {},
        currentPageId = null,
        savingOverlay, disconnectedOverlay, hasLocalUnsyncedOpsOverlay,
        sessionList,
        userId, token,
        currentSessionId, currentMemberId,
        booting = false;

    // TODO: just some quick hack done for testing, make nice (e.g. the position calculation is fragile)
    function addStatusOverlay(parentElementId, symbolFileName, position) {
        var htmlns = document.documentElement.namespaceURI,
            parentElement = document.getElementById(parentElementId),
            imageElement, overlay;

        runtime.assert(parentElement, "heya, no such element with id "+parentElementId);

        overlay = document.createElementNS(htmlns, "div");
        imageElement = document.createElementNS(htmlns, "img");
        imageElement.src = symbolFileName;
        overlay.appendChild(imageElement);
        overlay.style.position = "relative";
        overlay.style.top = 24*position + "px";
        overlay.style.opacity = "0.8";
        overlay.style.display = "none";
        parentElement.appendChild(overlay);
        return overlay;
    }

    /**
     * Switches the pages by hiding the old one and unhiding the new
     * @param {!string} pageId
     * @returns {undefined}
     */
    function switchToPage(pageId) {
        if (currentPageId) {
            document.getElementById(currentPageId).style.display = "none";
        }
        currentPageId = pageId;
        document.getElementById(pageId).style.display = "";
    }

    /**
     * @param {!string}
     * @return {undefined}
     */
    function updateLocationWithSessionId(sessionId) {
        var location = String(document.location),
            pos = location.indexOf('#');
        if (pos != -1) {
            location = location.substr(0, pos);
        }
        if (sessionId) {
            location = location + '#' + sessionId;
        }
        history.replaceState( {}, "", location);
    }

    /**
     * @return {undefined}
     */
    function startEditing() {
        editorInstance.startEditing();
    }

    /**
     * @param {!boolean=} ignoreError
     * @return {undefined}
     */
    function closeEditing(ignoreError) {
        editorInstance.endEditing();
        editorInstance.closeSession(function() {
            server.leaveSession(currentSessionId, currentMemberId, function() {
                showSessions();
            }, function() {
                if (ignoreError) {
                    showSessions();
                }
                // TODO: else report problem
            });
        });
    }

    /**
     * @return {undefined}
     */
    function handleEditingError(error) {
        alert("Something went wrong:\n"+error);
        closeEditing(true);
    }

    /**
     * @returns {undefined}
     */
    function showSessions() {
        switchToPage("sessionListContainer");

        sessionList.setUpdatesEnabled(true);

        updateLocationWithSessionId("");
    }

    /**
     * @param {!string} sessionId
     * @returns {undefined}
     */
    function enterSession(sessionId) {
        switchToPage("mainContainer");

        sessionList.setUpdatesEnabled(false);

        updateLocationWithSessionId(sessionId);

        currentSessionId = sessionId;
        server.joinSession(userId, sessionId, function(memberId) {
            currentMemberId = memberId;

            if (!editorInstance) {
                require({ }, [
                "webodf/editor/Translator",
                "webodf/editor/Editor"],
                    function (Translator, Editor) {
                        var locale = navigator.language || "en-US",
                            t = new Translator(locale, function (editorTranslator) {
                                runtime.setTranslator(editorTranslator.translate);
                                savingOverlay = addStatusOverlay("editor", "document-save.png", 0);
                                hasLocalUnsyncedOpsOverlay = addStatusOverlay("editor", "vcs-locally-modified.png", 0);
                                disconnectedOverlay = addStatusOverlay("editor", "network-disconnect.png", 1);

                                editorOptions = editorOptions || {}; // TODO: cleanup
                                editorOptions.networkSecurityToken = token;
                                editorOptions.closeCallback = closeEditing;

                                editorInstance = new Editor(editorOptions, server, serverFactory);
                                editorInstance.addEventListener(Editor.EVENT_BEFORESAVETOFILE, function() {
                                    savingOverlay.style.display = "";
                                });
                                editorInstance.addEventListener(Editor.EVENT_SAVEDTOFILE, function() {
                                    savingOverlay.style.display = "none";
                                });
                                editorInstance.addEventListener(Editor.EVENT_HASLOCALUNSYNCEDOPERATIONSCHANGED, function(has) {
                                    hasLocalUnsyncedOpsOverlay.style.display = has ? "" : "none";
                                });
                                editorInstance.addEventListener(Editor.EVENT_HASSESSIONHOSTCONNECTIONCHANGED, function(has) {
                                    disconnectedOverlay.style.display = has ? "none" : "";
                                });
                                editorInstance.addEventListener(Editor.EVENT_ERROR, handleEditingError);

                                // load the document and get called back when it's live
                                editorInstance.openSession(sessionId, memberId, startEditing);
                            });
                    }
                );
            } else {
                editorInstance.openSession(sessionId, memberId, startEditing);
            }
        }, function() {
            // TODO: handle error
        });
    }

    /**
     * extract session id from the url-fragment
     *
     * @return {?string}
     */
    function extractSessionId() {
        var sessionId = String(document.location),
            pos = sessionId.indexOf('#');
        return (pos !== -1) ? sessionId.substr(pos + 1) : null;
    }

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
        booting = true;

        runtime.assert(editorInstance === null, "cannot boot with instanciated editor");

        function loginSuccess(userData) {
            require({ }, ["webodf/editor/SessionListView"],
                function (SessionListView) {
                    var sessionListDiv = document.getElementById("sessionList"),
                        sessionId = extractSessionId(),
                        sessionListView;

                    runtime.log("connected:" + userData.full_name);
                    userId = userData.uid;
                    token = userData.securityToken || null;

                    // add session listing
                    sessionList = new serverFactory.createSessionList(server);
                    sessionListView = new SessionListView(sessionList, sessionListDiv, enterSession);

                    if (sessionId) {
                        // TODO: check if session exists
                        enterSession(sessionId);
                    } else {
                        switchToPage("sessionListContainer");
                    }
                }
            );
        }

        function loginFail(result) {
            alert("Login failed: " + result);
        }

        /**
         * @returns {!boolean}
         */
        function onLoginSubmit() {
            server.login(document.loginForm.login.value, document.loginForm.password.value, loginSuccess, loginFail);

            // block the submit button, we already dealt with the input
            return false;
        }

        // bring up the login form
        document.loginForm.Submit.onclick = onLoginSubmit;
        switchToPage("loginContainer");
        document.loginForm.login.focus();
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
     * @returns {undefined}
     */
    function boot(args) {
        runtime.assert(!booting, "editor creation already in progress");

        if (args.saveCallback) {
            editorOptions.saveCallback = args.saveCallback;
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
                if (state === "ready") {
                    startLoginProcess();
                }
            });
        });
    }

    // exposed API
    return { boot: boot };
}());

