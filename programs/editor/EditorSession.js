runtime.loadClass("ops.SessionImplementation");
runtime.loadClass("ops.NowjsOperationRouter");
runtime.loadClass("ops.NowjsUserModel");
runtime.loadClass("odf.OdfCanvas");
runtime.loadClass("gui.CaretFactory");
runtime.loadClass("gui.Caret");
runtime.loadClass("gui.SessionController");
runtime.loadClass("gui.SessionView");

editor.EditorSession = (function () {
	"use strict";

	function createAvatarButton(avatarListDiv, sessionView, memberId, userDetails) {
	    "use strict";
	    var doc = avatarListDiv.ownerDocument,
	        htmlns = doc.documentElement.namespaceURI,
	        avatarDiv = doc.createElementNS(htmlns, "div"),
	        imageElement = doc.createElement("img"),
	        fullnameTextNode = doc.createTextNode(userDetails.fullname);

	    imageElement.src = userDetails.imageurl;
	    imageElement.width = 22;
	    imageElement.height = 22;
	    imageElement.hspace = 3;
	    imageElement.align = "baseline";
	    imageElement.style['margin-top'] = "3px";

	    avatarDiv.appendChild(imageElement);
	    avatarDiv.appendChild(fullnameTextNode);
	    avatarDiv.memberId = memberId; // TODO: namespace?
	    avatarDiv.style.background = userDetails.color;
	    avatarDiv.onmouseover = function () {
	        //avatar.getCaret().showHandle();
	    };
	    avatarDiv.onmouseout = function () {
	        //avatar.getCaret().hideHandle();
	    };
	    avatarDiv.onclick = function () {
	        var caret = sessionView.getCaret(memberId);
	        if (caret) {
	            caret.toggleHandleVisibility();
	        }
	    };
	    avatarListDiv.appendChild(avatarDiv);
	}

	/**
	 * @param {!Element} avatarListDiv
	 * @param {!string} memberId
	 */
	function removeAvatarButton(avatarListDiv, memberId) {
	    var node = avatarListDiv.firstChild;
	    while (node) {
	        if (node.memberId === memberId) {
	            avatarListDiv.removeChild(node);
	            return;
	        }
	        node = node.nextSibling;
	    }
	}

	editor.EditorSession = function EditorSession(session, memberid) {
		var self = this,
			avatarListDiv = document.getElementById('peopleList');
		
		this.sessionController = new gui.SessionController(session, memberid);
		this.sessionView = new gui.SessionView(session, new gui.CaretFactory(self.sessionController));

		// attention: there is a race condition, sessionView also only
	    // on this signal creates the caret, so trying to get the caret
	    // at this point is not good to do. So fetch it dynamically in the avatarbutton.
	    session.subscribe(ops.SessionImplementation.signalCursorAdded, function(cursor) {
	        var memberId = cursor.getMemberId();
	        createAvatarButton(avatarListDiv, self.sessionView, memberId, session.getUserModel().getUserDetails(memberId));
	    });

	    session.subscribe(ops.SessionImplementation.signalCursorRemoved, function(memberId) {
	        removeAvatarButton(avatarListDiv, memberId);
	    });

	    this.startEditing = function () {
	    	self.sessionController.startEditing();
	    };

	    this.endEditing = function () {
	    	self.sessionController.endEditing();
	    };
	};

	return editor.EditorSession;
}());
