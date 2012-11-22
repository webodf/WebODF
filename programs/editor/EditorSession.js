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

	editor.EditorSession = function EditorSession(session, memberid) {
		var self = this,
            currentParagraphNode = null,
            currentNamedStyleName = null,
            currentStyleName = null,
            odfDocument = session.getOdfDocument(),
            textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
            formatting = odfDocument.getFormatting(),
            eventListener = {};
        	
        this.sessionController = new gui.SessionController(session, memberid);
		this.sessionView = new gui.SessionView(session, new gui.CaretFactory(self.sessionController));

        eventListener['userAdded'] = [];
        eventListener['userRemoved'] = [];
        eventListener['cursorMoved'] = [];
        eventListener['paragraphChanged'] = [];

        // Custom signals, that make sense in the Editor context. We do not want to expose webodf's ops signals to random bits of the editor UI. 
	    session.subscribe(ops.SessionImplementation.signalCursorAdded, function(cursor) {
            self.emit('userAdded', cursor.getMemberId());
	    });
        
	    session.subscribe(ops.SessionImplementation.signalCursorRemoved, function(memberId) {
	        self.emit('userRemoved', memberId);
        });
        
        session.subscribe(ops.SessionImplementation.signalCursorMoved, function(cursor) {
            // Emit 'cursorMoved' only when *I* am moving the cursor, not the other users
            if (cursor.getMemberId() == memberid)
                self.emit('cursorMoved', cursor);
        });
        
        session.subscribe(ops.SessionImplementation.signalParagraphChanged, trackCurrentParagraph);

        function checkParagraphStyleName() {
            var newStyleName,
                newNamedStyleName;

            newStyleName = currentParagraphNode.getAttributeNS(textns, 'style-name');
            if (newStyleName !== currentStyleName) {
                currentStyleName = newStyleName;
                // check if named style is still the same
                newNamedStyleName = formatting.getFirstNamedParentStyleNameOrSelf(newStyleName);
                if (!newNamedStyleName) {
                    // TODO: how to handle default styles?
                    return;
                }
                // a named style
                if (newNamedStyleName !== currentNamedStyleName) {
                    currentNamedStyleName = newNamedStyleName;
                    self.emit('paragraphChanged', {
                        type: 'style',
                        node: currentParagraphNode,
                        styleName: currentNamedStyleName
                    });
                }
            }
        }
        
        function trackCursor(cursor) {
            var node;

            node = odfDocument.getParagraphElement(cursor.getSelection().focusNode);
            if (!node) {
                return;
            }
            currentParagraphNode = node;
            checkParagraphStyleName();
        }

        function trackCurrentParagraph(paragraphNode) {
            if (paragraphNode !== currentParagraphNode) {
                return;
            }
            checkParagraphStyleName();
        }

	    this.startEditing = function () {
	    	self.sessionController.startEditing();
	    };

	    this.endEditing = function () {
	    	self.sessionController.endEditing();
	    };

        this.emit = function (eventid, args) {
            var i, subscribers;
            runtime.assert(eventListener.hasOwnProperty(eventid),
                "unknown event fired \"" + eventid + "\"");
            subscribers = eventListener[eventid];
            runtime.log("firing event \"" + eventid + "\" to " + subscribers.length + " subscribers.");
            for (i = 0; i < subscribers.length; i += 1) {
                subscribers[i](args);
            }
        };

        this.subscribe = function (eventid, cb) {
            runtime.assert(eventListener.hasOwnProperty(eventid),
                "tried to subscribe to unknown event \"" + eventid + "\"");
            eventListener[eventid].push(cb);
            runtime.log("event \"" + eventid + "\" subscribed.");
        };

        this.getUserDetails = function(memberId) {
            return session.getUserModel().getUserDetails(memberId);
        };

        this.getCursorPosition = function() {
            return odfDocument.getCursorPosition(memberid);
        }

        this.getCurrentParagraph = function() {
            return currentParagraphNode;
        };

        this.getAvailableParagraphStyles = function() {
            return formatting.getAvailableParagraphStyles();
        };

        this.getCurrentParagraphStyle = function() {
            return currentNamedStyleName;
        };
        
        this.setCurrentParagraphStyle = function(value) {
            var op;
            if (currentNamedStyleName !== value) {
                op = new ops.OpSetParagraphStyle(session);
                op.init({
                    memberid: memberid,
                    position: self.getCursorPosition(),
                    styleNameBefore: currentNamedStyleName,
                    styleNameAfter: value
                });
                session.enqueue(op);
            }
        };

        this.subscribe('cursorMoved', trackCursor);
	};

	return editor.EditorSession;
}());
