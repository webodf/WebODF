
function letIn() {
    var net = runtime.getNetwork(),
        accumulated_waiting_time = 0,
        userId;

    function enterSession(sessionid) {
        document.getElementById("sessionListContainer").style.display="none";
        document.getElementById("mainContainer").style.display="";
        require({ }, ["webodf/editor"],
            function(editor) {
                editor.boot("/session/"+sessionid+"/genesis", userId, sessionid);
            }
        );
    }

    function showSessions(sessionList) {
        var idx,
            sessionListDiv = document.getElementById("sessionList"),
            sessionListView = new SessionListView(sessionListDiv, enterSession);

        // hide login view
        document.getElementById("loginContainer").style.display="none";

        // fill session list
        for (idx = 0; idx < sessionList.length; idx += 1) {
            sessionListView.addSession(sessionList[idx]);
        }

        // show session list
        document.getElementById("sessionListContainer").style.display="";
    }

    function loginSuccess(userData) {
        runtime.log("connected:"+userData.full_name);
        userId = userData.uid;
        net.getSessionList(showSessions);
    }

    function loginFail(result) {
        alert("Login failed: " + result);
    }

    function later_cb() {
        if (net.networkStatus === "unavailable") {
            runtime.log("connection to server unavailable.");
            return;
        }
        if (net.networkStatus !== "ready") {
            if (accumulated_waiting_time > 8000) {
                // game over
                runtime.log("connection to server timed out.");
                return;
            }
            accumulated_waiting_time += 100;
            runtime.getWindow().setTimeout(later_cb, 100);
        } else {
            runtime.log("connection to collaboration server established.");
            net.login(document.loginForm['login'].value, document.loginForm['password'].value, loginSuccess, loginFail);
        }
    }
    later_cb();
}
