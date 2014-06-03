/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
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

    var editorInstance = null,
        serverFactory = null,
        server = null,
        editorOptions = {
            allFeaturesEnabled: true
        },
        currentPageId = null,
        savingOverlay, disconnectedOverlay, hasLocalUnsyncedOpsOverlay,
        sessionList,
        userId, token,
        currentSessionId, currentMemberId,
        booting = false;

    // TODO: just some quick hack done for testing, make nice (e.g. the position calculation is fragile)
    function addStatusOverlay(parentElement, symbolFileName, position) {
        var htmlns = document.documentElement.namespaceURI,
            imageElement, overlay;

        runtime.assert(parentElement, "heya, no such parentelement");

        overlay = document.createElementNS(htmlns, "div");
        imageElement = document.createElementNS(htmlns, "img");
        imageElement.src = symbolFileName;
        overlay.appendChild(imageElement);
        overlay.style.position = "absolute";
        overlay.style.top =  24*position + "px";
        overlay.style.opacity = "0.8";
        overlay.style.display = "none";
        parentElement.appendChild(overlay);
        return overlay;
    }

    /**
     * Switches the pages by hiding the old one and unhiding the new
     * @param {!string} pageId
     * @return {undefined}
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
     * @return {undefined}
     */
    function showSessions() {
        switchToPage("sessionListContainer");

        sessionList.setUpdatesEnabled(true);

        updateLocationWithSessionId("");
    }

    /**
     * @param {!string} sessionId
     * @return {undefined}
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
                            editorBase = dojo.config && dojo.config.paths && dojo.config.paths["webodf/editor"],
                            translationsDir = '/translations',
                            t;

                        runtime.assert(editorBase, "webodf/editor path not defined in dojoConfig");

                        t = new Translator(editorBase + translationsDir, locale, function (editorTranslator) {
                            var canvasContainerElement;

                            runtime.setTranslator(editorTranslator.translate);

                            editorOptions.networkSecurityToken = token;
                            editorOptions.closeCallback = closeEditing;

                            editorInstance = new Editor("mainContainer", editorOptions, server, serverFactory);
                            canvasContainerElement = editorInstance.getCanvasContainerElement();
                            savingOverlay = addStatusOverlay(canvasContainerElement, "document-save.png", 0);
                            hasLocalUnsyncedOpsOverlay = addStatusOverlay(canvasContainerElement, "vcs-locally-modified.png", 0);
                            disconnectedOverlay = addStatusOverlay(canvasContainerElement, "network-disconnect.png", 1);

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
     * @return {undefined}
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
         * @return {!boolean}
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
     * @return {undefined}
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

