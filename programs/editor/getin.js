
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
