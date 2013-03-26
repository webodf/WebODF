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
 * this file is meant to be included from HTML and it will
 * load necessary classes. the HTML needs to call on_body_load().
 * dojo and webodf need to be loaded already.
 */

/*global runtime,require,document,alert,net */
function on_body_load() {
    "use strict";
    var net = runtime.getNetwork(),
        accumulated_waiting_time = 0,
        userId, sessionId;

    function bootEditor(documentPath) {
        require({ }, ["webodf/editor/Editor"],
            function(Editor) {
                (new Editor()).bootWithNetworkDelay(documentPath, userId, sessionId);
            }
        );
    }

    function bootEditorWithoutNetwork() {
        var docUrl, pos;

        document.getElementById("mainContainer").style.display="";

        // If the URL has a fragment (#...), try to load the file it represents
        docUrl = String(document.location);
        pos = docUrl.indexOf('#');
        if (pos !== -1) {
            docUrl = docUrl.substr(pos + 1);
        } else {
            // default document
            docUrl = "welcome.odt";
        }
        require({ }, ["webodf/editor/Editor"],
            function(Editor) {
                (new Editor()).bootLocal(docUrl, userId, sessionId);
            }
        );
    }

    function enterSession(selectedSessionId) {
        sessionId = selectedSessionId;
        document.getElementById("sessionListContainer").style.display="none";
        document.getElementById("mainContainer").style.display="";

        bootEditor("/session/"+sessionId+"/genesis", userId, sessionId);
    }

    function showSessions() {
        var sessionListDiv = document.getElementById("sessionList"),
            sessionList = new SessionList(net),
            sessionListView = new SessionListView(sessionList, sessionListDiv, enterSession);

        // hide login view
        document.getElementById("loginContainer").style.display="none";

        // show session list
        document.getElementById("sessionListContainer").style.display="";
    }

    function loginSuccess(userData) {
        runtime.log("connected:"+userData.full_name);
        userId = userData.uid;

        showSessions();
    }

    function loginFail(result) {
        alert("Login failed: " + result);
    }

    function tryToGetIn() {
         net.login(document.loginForm.login.value, document.loginForm.password.value, loginSuccess, loginFail);

        // block the submit button, we already dealt with the input
        return false;
    }

    function later_cb() {
        if (net.networkStatus === "unavailable") {
            runtime.log("connection to server unavailable.");
            bootEditorWithoutNetwork();
            return;
        }
        if (net.networkStatus !== "ready") {
            if (accumulated_waiting_time > 8000) {
                // game over
                runtime.log("connection to server timed out.");
                bootEditorWithoutNetwork();
                return;
            }
            accumulated_waiting_time += 100;
            runtime.getWindow().setTimeout(later_cb, 100);
        } else {
            runtime.log("connection to collaboration server established.");

            document.loginForm.Submit.onclick = tryToGetIn;
            // show login view
            document.getElementById("loginContainer").style.display="";
        }
    }
    later_cb();
}
