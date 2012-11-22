editor.UserList = (function() {
    "use strict";
    
    editor.UserList = function UserList(userListDiv) {
        var self = this;

        editor.editorSession.subscribe('userAdded', function(memberId) {
            self.addUser(memberId);
        });
        
        editor.editorSession.subscribe('userRemoved', function(memberId) {
            self.removeUser(memberId);
        });

        function createAvatarButton(avatarListDiv, sessionView, memberId, userDetails) {
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

        this.addUser = function (memberId) {
            createAvatarButton(userListDiv, editor.editorSession.sessionView, memberId, editor.editorSession.getUserDetails(memberId));
        };

        this.removeUser = function (memberId) {
            removeAvatarButton(userListDiv, memberId);
        };
    };

    return editor.UserList;
}());
