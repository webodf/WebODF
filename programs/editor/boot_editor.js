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
 * bootstrap the editor in different ways.
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

/*global runtime, require, document, alert, gui, window, SessionList, SessionListView, FileReader, Uint8Array */

// define the namespace/object we want to provide
// this is the first line of API, the user gets.
var webodfEditor = (function () {
    "use strict";

    var editorInstance = null,
        booting = false,
        loadedFilename;

    /**
     * wait for a network connection through nowjs to establish.
     * call the callback when done, when finally failed, or
     * when a timeout reached.
     * the parameter to the callback is a string with the possible
     * values:
     * "unavailable", "timeout", "ready"
     *
     * @param {!function(!string)} callback
     * @return {undefined}
     */
    function waitForNetwork(callback) {
        var net = runtime.getNetwork(), accumulated_waiting_time = 0;
        function later_cb() {
            if (net.networkStatus === "unavailable") {
                runtime.log("connection to server unavailable.");
                callback("unavailable");
                return;
            }
            if (net.networkStatus !== "ready") {
                if (accumulated_waiting_time > 8000) {
                    // game over
                    runtime.log("connection to server timed out.");
                    callback("timeout");
                    return;
                }
                accumulated_waiting_time += 100;
                runtime.getWindow().setTimeout(later_cb, 100);
            } else {
                runtime.log("connection to collaboration server established.");
                callback("ready");
            }
        }
        later_cb();
    }

    /**
     * extract document url from the url-fragment
     *
     * @return {?string}
     */
    function guessDocUrl() {
        var pos, docUrl = String(document.location);
        // If the URL has a fragment (#...), try to load the file it represents
        pos = docUrl.indexOf('#');
        if (pos !== -1) {
            docUrl = docUrl.substr(pos + 1);
        } else {
            docUrl = "welcome.odt";
        }
        return docUrl || null;
    }

    function fileSelectHandler(evt) {
        var file, files, reader;
        files = (evt.target && evt.target.files) ||
            (evt.dataTransfer && evt.dataTransfer.files);
        function onloadend() {
            if (reader.readyState === 2) {
                runtime.registerFile(file.name, reader.result);
                loadedFilename = file.name;
                editorInstance.loadDocument(file.name);
            }
        }
        if (files && files.length === 1) {
            file = files[0];
            reader = new FileReader();
            reader.onloadend = onloadend;
            reader.readAsArrayBuffer(file);
        } else {
            alert("File could not be opened in this browser.");
        }
    }

    function enhanceRuntime() {
        var openedFiles = {},
            read = runtime.read,
            getFileSize = runtime.getFileSize;
        runtime.read = function (path, offset, length, callback) {
            var array;
            if (openedFiles.hasOwnProperty(path)) {
                array = new Uint8Array(openedFiles[path], offset, length);
                callback(undefined, array);
            } else {
                return read(path, offset, length, callback);
            }
        };
        runtime.getFileSize = function (path, callback) {
            if (openedFiles.hasOwnProperty(path)) {
                return callback(openedFiles[path].byteLength);
            } else {
                return getFileSize(path, callback);
            }
        };
        runtime.registerFile = function (path, data) {
            openedFiles[path] = data;
        };
    }

    function createFileLoadForm() {
        var form = document.createElement("form"),
            input = document.createElement("input");
        form.appendChild(input);
        form.style.display = "none";
        input.id = "fileloader";
        input.setAttribute("type", "file");
        input.addEventListener("change", fileSelectHandler, false);
        document.body.appendChild(form);
    }

    function load() {
        var form = document.getElementById("fileloader");
        if (!form) {
            enhanceRuntime();
            createFileLoadForm();
            form = document.getElementById("fileloader");
        }
        form.click();
    }

    function save() {
        editorInstance.saveDocument(loadedFilename);
    }

    /**
     * create a new editor instance, and start the editor with
     * the given document.
     *
     * @param {!string} docUrl
     * @param {?Object} editorOptions
     * @param {?function(!Object)} editorReadyCallback
     */
    function createLocalEditor(docUrl, editorOptions, editorReadyCallback) {
        var pos;
        booting = true;
        editorOptions = editorOptions || {};
        editorOptions.memberid = "localuser";
        editorOptions.loadCallback = load;
        editorOptions.saveCallback = save;

        runtime.assert(docUrl, "docUrl needs to be specified");
        runtime.assert(editorInstance === null, "cannot boot with instanciated editor");

        document.getElementById("mainContainer").style.display = "";

        require({ }, ["webodf/editor/Editor"],
            function (Editor) {
                editorInstance = new Editor(editorOptions);
                editorInstance.initAndLoadDocument(docUrl, function (editorSession) {
                    editorSession.sessionController.setUndoManager(new gui.TrivialUndoManager());
                    editorSession.startEditing();
                    editorReadyCallback(editorInstance);
                });
            }
            );
    }

    /**
     * assume the network connection is established, create a new editor instance,
     * and start the editor on the network.
     *
     * @param {!string} sessionId
     * @param {!string} userid
     * @param {?string} token
     * @param {?Object} editorOptions
     * @param {?function(!Object)} editorReadyCallback
     */
    function createNetworkedEditor(sessionId, userid, token, editorOptions, editorReadyCallback) {

        runtime.assert(sessionId, "sessionId needs to be specified");
        runtime.assert(editorInstance === null, "cannot boot with instanciated editor");

        editorOptions = editorOptions || {};
        editorOptions.memberid = userid + "___" + Date.now();
        editorOptions.networked = true;
        editorOptions.networkSecurityToken = token;

        require({ }, ["webodf/editor/Editor"],
            function (Editor) {
                // TODO: the networkSecurityToken needs to be retrieved via now.login
                // (but this is to be implemented later)
                editorInstance = new Editor(editorOptions);

                // load the document and get called back when it's live
                editorInstance.loadSession(sessionId, function (editorSession) {
                    editorSession.startEditing();
                    editorReadyCallback(editorInstance);
                });
            }
            );
    }


    /**
     * start the login process by offering a login/password prompt.
     * the login is validated via nowjs namespace.
     * on success a list of sessions is offered.
     * when the user selects a session the callback is called
     * with the sessionId as parameter
     *
     * @param {!function(!string, !string, ?string)} callback
     * @returns {undefined}
     */
    function startLoginProcess(callback) {
        var userid, token,
            net = runtime.getNetwork();

        booting = true;

        runtime.assert(editorInstance === null, "cannot boot with instanciated editor");

        function enterSession(selectedSessionId) {
            document.getElementById("sessionListContainer").style.display = "none";
            document.getElementById("mainContainer").style.display = "";

            callback(selectedSessionId, userid, token);
        }

        function showSessions() {
            var sessionListDiv = document.getElementById("sessionList"),
                sessionList = new SessionList(net),
                sessionListView = new SessionListView(sessionList, sessionListDiv, enterSession);

            // hide login view
            document.getElementById("loginContainer").style.display = "none";

            // show session list
            document.getElementById("sessionListContainer").style.display = "";
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
            net.login(document.loginForm.login.value, document.loginForm.password.value, loginSuccess, loginFail);

            // block the submit button, we already dealt with the input
            return false;
        }

        // bring up the login form
        document.loginForm.Submit.onclick = onLoginSubmit;
        document.getElementById("loginContainer").style.display = "";
    }

    /**
     * make a guess about the document (# in URL)
     * also guess about local/collaborative (depending on nowjs)
     *
     * @param {?Object} args
     *
     * args:
     *
     * collaborative: if set to true: connect to the network and start a
     *                collaborative editor. in that case the document url
     *                is ignored. and user needs to select a session.
     *
     *                if set to the string "auto": it will try the above
     *                but fall back to non-collaborative mode [default]
     *
     * docUrl:        if given it is used as the url to the document to load
     *
     * callback:      callback to be called as soon as the document is loaded
     *
     */
    function boot(args) {
        var editorOptions = {}, loginProcedure = startLoginProcess;
        runtime.assert(!booting, "editor creation already in progress");

        args = args || {};

        if (args.collaborative === undefined) {
            args.collaborative = "auto";
        } else {
            args.collaborative = String(args.collaborative).toLowerCase();
        }
        if (args.docUrl === undefined) {
            args.docUrl = guessDocUrl();
        }

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
        function handleNetworkedSituation() {
            loginProcedure(function (sessionId, userid, token) {
                createNetworkedEditor(sessionId, userid, token, editorOptions, function (ed) {
                    if (args.callback) {
                        args.callback(ed);
                    }
                }
                    );
            });
        }

        // start the editor without network
        function handleNonNetworkedSituation() {
            createLocalEditor(args.docUrl, editorOptions, function (editor) {
                if (args.callback) {
                    args.callback(editor);
                }
            });
        }

        if (args.collaborative === "auto") {
            runtime.log("detecting network...");
            waitForNetwork(function (state) {
                if (state === "ready") {
                    runtime.log("... network available.");
                    handleNetworkedSituation();
                } else {
                    runtime.log("... no network available (" + state + ").");
                    handleNonNetworkedSituation();
                }
            });
        } else if ((args.collaborative === "true") ||
                   (args.collaborative === "1") ||
                   (args.collaborative === "yes")) {
            runtime.log("starting collaborative editor.");
            waitForNetwork(function (state) {
                if (state === "ready") {
                    handleNetworkedSituation();
                }
            });
        } else {
            runtime.log("starting local editor.");
            handleNonNetworkedSituation();
        }
    }

    // exposed API
    return { boot: boot };
}());

