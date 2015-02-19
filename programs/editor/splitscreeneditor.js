/**
 * Copyright (C) 2014 KO GmbH <copyright@kogmbh.com>
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

/*global require, define, document, window, runtime, alert, Wodo*/

/**
 * @param {!{sessionId: string, username: string, backend: string, sessionListElementId: string, editorContainerElementId: string}} args
 */
function createEditor(args) {
    "use strict";

    var editor = null,
        serverFactory = null,
        server = null,
        editorOptions = {
            allFeaturesEnabled: true,
            collabEditingEnabled: true
        },
        currentPage = null,
        savingOverlay, disconnectedOverlay, hasLocalUnsyncedOpsOverlay,
        sessionList,
        userId, token,
        currentSessionId, currentMemberId,
        backend = args.backend;

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
    function switchToPage(pageId, useParent) {
        if (currentPage) {
            currentPage.style.display = "none";
        }
        currentPage = document.getElementById(pageId);
        if (useParent) {
            currentPage = currentPage.parentNode;
        }
        currentPage.style.display = "";
    }

    /**
     * @return {undefined}
     */
    function showSessions() {
        switchToPage(args.sessionListElementId, true);
        sessionList.setUpdatesEnabled(true);
    }

    /*jslint emptyblock: true*/
    /**
     * @return {undefined}
     */
    function onEditingStarted() {
        // nothing to do right now
    }
    /*jslint emptyblock: false*/

    /**
     * @param {!boolean=} ignoreError
     * @return {undefined}
     */
    function closeEditing(ignoreError) {
        editor.leaveSession(function() {
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
     * @param {!string} sessionId
     * @return {undefined}
     */
    function joinSession(sessionId) {
        switchToPage(args.editorContainerElementId);
        sessionList.setUpdatesEnabled(false);
        currentSessionId = sessionId;
        server.joinSession(userId, sessionId, function(memberId) {
            currentMemberId = memberId;

            if (!editor) {
                editorOptions.networkSecurityToken = token;
                editorOptions.closeCallback = closeEditing;
                Wodo.createCollabTextEditor(args.editorContainerElementId, editorOptions, function(err, e) {
                    if (err) {
                        runtime.log(err);
                        return;
                    }
                    var canvasContainerElement;

                    editor = e;

                    canvasContainerElement = editor.getCanvasContainerElement();
                    savingOverlay = addStatusOverlay(canvasContainerElement, "document-save.png", 0);
                    hasLocalUnsyncedOpsOverlay = addStatusOverlay(canvasContainerElement, "vcs-locally-modified.png", 0);
                    disconnectedOverlay = addStatusOverlay(canvasContainerElement, "network-disconnect.png", 1);

                    editor.addEventListener(Wodo.EVENT_BEFORESAVETOFILE, function() {
                        savingOverlay.style.display = "";
                    });
                    editor.addEventListener(Wodo.EVENT_SAVEDTOFILE, function() {
                        savingOverlay.style.display = "none";
                    });
                    editor.addEventListener(Wodo.EVENT_HASLOCALUNSYNCEDOPERATIONSCHANGED, function(has) {
                        hasLocalUnsyncedOpsOverlay.style.display = has ? "" : "none";
                    });
                    editor.addEventListener(Wodo.EVENT_HASSESSIONHOSTCONNECTIONCHANGED, function(has) {
                        disconnectedOverlay.style.display = has ? "none" : "";
                    });
                    editor.addEventListener(Wodo.EVENT_UNKNOWNERROR, handleEditingError);

                    // load the document and get called back when it's live
                    editor.joinSession(serverFactory.createSessionBackend(sessionId, memberId, server), onEditingStarted);
                });
            } else {
                editor.joinSession(serverFactory.createSessionBackend(sessionId, memberId, server), onEditingStarted);
            }
        }, function(err) {
            // TODO: handle error
            runtime.log(err);
        });
    }

    function loginSuccess(userData) {
        require(["webodf/editor/SessionListView"],
            function (SessionListView) {
                var sessionListDiv,
                    sessionListView;

                runtime.log("connected:" + userData.full_name);
                userId = userData.uid;
                token = userData.securityToken || null;

                // add session listing
                if (args.sessionListElementId) {
                    sessionListDiv = document.getElementById(args.sessionListElementId);
                    sessionList = new serverFactory.createSessionList(server);
                    sessionListView = new SessionListView(sessionList, sessionListDiv, joinSession);
                }


                if (args.sessionId) {
                    joinSession(args.sessionId);
                } else {
                    switchToPage(args.sessionListElementId, true);
                }
                // only done to make jslint see the var used
                return sessionListView;
            }
        );
    }

    // start the editor with network
    runtime.log("starting collaborative editor for ["+backend+"].");
    require(["webodf/editor/backend/"+backend+"/ServerFactory"], function (ServerFactory) {
        serverFactory = new ServerFactory();
        server = serverFactory.createServer();
        // wait for a network connection to establish.
        // call the callback when done, when finally failed, or
        // when a timeout reached.
        // the parameter to the callback is a string with the possible
        // values: "unavailable", "timeout", "ready"
        server.connect(8000, function (state) {
            if (state === "ready") {
                server.login(args.username, loginSuccess);
            }
        });
    });
}

window.JsGlobalServer = (function() {
    "use strict";

    function createServiceError(code, message) {
        var error = new Error(message);
        error.code = code;
        return error;
    }

    function JsGlobalSession(title) {
        var operations = [],
            lastMemberSyncPoint = {},
            stateSequence = 0;

        function getSequenceId() {
            return "jsg" + stateSequence;
        }

        /**
         * Push the specified specs into the current session. Will throw a 'SEQ_OUTOFDATE' error if the supplied
         * lastSequenceId does not match the current sequence id.
         *
         * @param {!string} opMemberId
         * @param {!string} lastSequenceId
         * @param {!Array.<!Object>} opSpecs
         * @return {!{sequenceId: !string}}
         */
        this.push = function(opMemberId, lastSequenceId, opSpecs) {
            if (!lastMemberSyncPoint.hasOwnProperty(opMemberId)) {
                throw createServiceError("MEMBER_NOT_IN_SESSION", "Member with id " + opMemberId + " is not part of session");
            }

            if (opSpecs.length > 0) {
                if (lastSequenceId !== getSequenceId()) {
                    throw createServiceError("SEQ_OUTOFDATE", "State sequence out of date");
                }
                stateSequence += 1;
                operations = operations.concat(opSpecs);
                lastMemberSyncPoint[opMemberId] = operations.length;
            }
            return {
                sequenceId: getSequenceId()
            };
        };

        /**
         * Add a member to the current session
         *
         * @param {!string} memberId
         * @return {undefined}
         */
        this.addMember = function (memberId) {
            var addMember = {
                optype: "AddMember",
                memberid: memberId,
                timestamp: Date.now(),
                setProperties: {
                    fullName: memberId,
                    color: '#'+('000000' + Math.floor(Math.random()*16777215).toString(16)).slice(-6),
                    imageUrl: "avatar-" + memberId + ".png"
                }
            };

            operations.push(addMember);
            lastMemberSyncPoint[memberId] = 0;
        };

        /**
         * Remove the member from the current session
         *
         * @param {!string} memberId
         * @return {undefined}
         */
        this.removeMember = function (memberId) {
            if (!lastMemberSyncPoint.hasOwnProperty(memberId)) {
                throw createServiceError("MEMBER_NOT_IN_SESSION", "Member with id " + memberId + " is not part of session");
            }

            var removeMember = {
                optype: "RemoveMember",
                memberid: memberId,
                timestamp: Date.now()
            };
            operations.push(removeMember);
            delete lastMemberSyncPoint[memberId];
        };

        /**
         * Fetch unsynchronized remote changes for the given member
         *
         * @param {!string} memberId
         * @return {!{specs: !Array.<!Object>, sequenceId: !string}}
         */
        this.getRemoteChanges = function (memberId) {
            if (!lastMemberSyncPoint.hasOwnProperty(memberId)) {
                throw createServiceError("MEMBER_NOT_IN_SESSION", "Member with id " + memberId + " is not part of session");
            }
            var unsyncedOps = operations.slice(lastMemberSyncPoint[memberId]);
            lastMemberSyncPoint[memberId] = operations.length;
            // Make a copy to ensure consumers can't modify internal state
            return JSON.parse(JSON.stringify({
                specs: unsyncedOps,
                sequenceId: getSequenceId()
            }));
        };

        /**
         * Get an array of the currently active memberids in the current session
         * @return {!Array.<!string>}
         */
        this.getMemberIds = function () {
            return Object.keys(lastMemberSyncPoint);
        };

        /**
         * Get the title of this session
         * @return {!string}
         */
        this.getTitle = function() {
            return title;
        };
    }

    /**
     * Central server used for collaborative editing. A single real JS instance is expected to be shared between
     * all connected editors.
     *
     * @constructor
     */
    function JsGlobalServer() {
        var sessionsCount = 1,
            users = {},
            sessions = {},
            inhibited = false,
            latencyMs = 100;

        function processCallback(callback, arg) {
            window.setTimeout(function () {
                callback(arg);
            }, latencyMs); // Simulate some latency (e.g., via a HTTP req)
        }

        /**
         * Log into the server with the supplied credentials.
         * NB: this currently performs no checks of any sort, and is just meant for demonstration.
         *
         * @param {!string} login
         * @param {!function(!string):undefined} successCb
         * @return {undefined}
         */
        this.login = function (login, successCb) {
            users[login] = true;
            processCallback(successCb, {
                full_name: login,
                uid: login,
                securityToken: login
            });
        };

        /**
         * Join an existing session
         *
         * @param {!string} sessionId
         * @param {!string} memberId
         * @param {!function(!string):undefined} successCb
         * @return {undefined}
         */
        this.joinSession = function (memberId, sessionId, successCb) {
            var session = sessions[sessionId];
            if (!session) {
                session = sessions[sessionId] = new JsGlobalSession("Split screen session #" + sessionsCount);
                sessionsCount += 1;
            }
            session.addMember(memberId);
            processCallback(successCb, memberId);
        };

        /**
         * Leave an existing session
         *
         * @param {!string} sessionId
         * @param {!string} memberId
         * @param {!function(!string):undefined} successCb
         * @param {!function(!string):undefined} failCb
         * @return {undefined}
         */
        this.leaveSession = function (sessionId, memberId, successCb, failCb) {
            var session = sessions[sessionId];
            if (session) {
                session.removeMember(memberId);
                processCallback(successCb, memberId);
            } else {
                processCallback(failCb, createServiceError("SESSION_NOT_FOUND"));
            }
        };

        /**
         * Return the current sessions.
         *
         * @return {!Array.<!{id: string, title: string, cursors: Array}>}
         */
        this.getSessions = function () {
            return Object.keys(sessions).sort().map(function(sessionId) {
                var session = sessions[sessionId];
                return {
                    id: sessionId,
                    title: session.getTitle(),
                    cursors: session.getMemberIds().sort()
                };
            });
        };

        /**
         * Fetches all unsynchronized updates for the specified user
         *
         * @param {!string} sessionId
         * @param {!string} memberId
         * @param {!function(!{sequenceId: !string, specs: !Array.<!Object>}):undefined} successCb
         * @param {!function(!string):undefined} failCb
         * @return {undefined}
         */
        this.getRemoteChanges = function (sessionId, memberId, successCb, failCb) {
            try {
                if (inhibited) {
                    throw createServiceError("SERVICE_UNAVAILABLE", "Service is unavailable");
                }
                var remoteChanges = sessions[sessionId].getRemoteChanges(memberId);
                processCallback(successCb, remoteChanges);
            } catch (e) {
                processCallback(failCb, e);
            }
        };

        /**
         * Push operations to the specified session. If the supplied sequenceId doesn't match
         * the server's current sequenceId, an error will be returned instead.
         *
         * @param {!string} sessionId
         * @param {!string} memberId
         * @param {!string} sequenceId
         * @param {!Array.<!Object>} opSpecs
         * @param {!function(!{sequenceId: !string}):undefined} successCb
         * @param {!function(!string):undefined} failCb
         * @return {undefined}
         */
        this.push = function (sessionId, memberId, sequenceId, opSpecs, successCb, failCb) {
            try {
                if (inhibited) {
                    throw createServiceError("SERVICE_UNAVAILABLE", "Service is unavailable");
                }
                var pushResult = sessions[sessionId].push(memberId, sequenceId, opSpecs);
                processCallback(successCb, pushResult);
            } catch (e) {
                processCallback(failCb, e);
            }
        };

        /**
         * Pauses all incoming and outgoing messages, causing a 'SERVICE_UNAVAILABLE' error to be reported instead
         * @return {undefined}
         */
        this.pause = function () {
            inhibited = true;
        };

        /**
         * Resumes processing of incoming and outgoing messages
         * @return {undefined}
         */
        this.resume = function () {
            inhibited = false;
        };

        /**
         * Gets the current simulated latency in milliseconds
         * @return {!number}
         */
        this.getLatency = function () {
            return latencyMs;
        };

        /**
         * Sets the current simulated latency in milliseconds
         * @param {!number} newLatencyMs
         * @return {undefined}
         */
        this.setLatency = function (newLatencyMs) {
            latencyMs = newLatencyMs;
        };
    }

    return JsGlobalServer;
}());