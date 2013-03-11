
function on_body_load() {
    var net = runtime.getNetwork(),
        accumulated_waiting_time = 0,
        userId, sessionId;

    function bootEditor(documentPath) {
        require({ }, ["webodf/editor"],
            function(editor) {
                editor.boot(documentPath, userId, sessionId);
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
        bootEditor(docUrl);
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
         net.login(document.loginForm['login'].value, document.loginForm['password'].value, loginSuccess, loginFail);

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

            document.loginForm['Submit'].onclick = tryToGetIn;
            // show login view
            document.getElementById("loginContainer").style.display="";
        }
    }
    later_cb();
}
