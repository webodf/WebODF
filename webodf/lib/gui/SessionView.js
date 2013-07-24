/**
 * @license
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
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
/*global Node, document, runtime, gui, ops, core */

runtime.loadClass("gui.Caret");
runtime.loadClass("ops.TrivialUserModel");
runtime.loadClass("ops.EditInfo");
runtime.loadClass("gui.EditInfoMarker");

/**
 * @constructor
 * @struct
 */
gui.SessionViewOptions = function () {
    "use strict";

    /**
     * Set the initial edit information marker visibility
     * @type {boolean}
     */
    this.editInfoMarkersInitiallyVisible = true;

    /**
     * Sets the initial visibility of the avatar
     * @type {boolean}
     */
    this.caretAvatarsInitiallyVisible = true;

    /**
     * Specify that the caret should blink if a non-collapsed range is selected
     * @type {boolean}
     */
    this.caretBlinksOnRangeSelect = true;
};

gui.SessionView = (function () {
    "use strict";

    /**
     * Return a user-specified option, or the default value if no user option
     * is provided
     * @param {undefined|boolean} userValue
     * @param {boolean} defaultValue
     * @returns {boolean}
     */
    function configOption(userValue, defaultValue) {
        return userValue !== undefined ? userValue : defaultValue;
    }

    /**
     * @constructor
     * @param {gui.SessionViewOptions} viewOptions
     * @param {ops.Session} session
     * @param {gui.CaretFactory} caretFactory
     */
    function SessionView(viewOptions, session, caretFactory) {
        var carets = {},
            avatarInfoStyles,
            editInfons = 'urn:webodf:names:editinfo',
            editInfoMap = {},
            showEditInfoMarkers = configOption(viewOptions.editInfoMarkersInitiallyVisible, true),
            showCaretAvatars = configOption(viewOptions.caretAvatarsInitiallyVisible, true),
            blinkOnRangeSelect = configOption(viewOptions.caretBlinksOnRangeSelect, true);

        function createAvatarInfoNodeMatch(nodeName, className, memberId) {
            var userId = memberId.split('___')[0];
            return nodeName + '.' + className + '[editinfo|memberid^="' + userId + '"]';
        }

        /**
         * @param {string} nodeName
         * @param {string} className
         * @param {string} memberId
         * @return {?Node}
         */
        function getAvatarInfoStyle(nodeName, className, memberId) {
            var node = avatarInfoStyles.firstChild,
                nodeMatch = createAvatarInfoNodeMatch(nodeName, className, memberId);

            while (node) {
                if ((node.nodeType === Node.TEXT_NODE) && (node.data.indexOf(nodeMatch) === 0)) {
                    return node;
                }
                node = node.nextSibling;
            }
            return null;
        }

        /**
         * @param {string} memberId
         * @param {string} name
         * @param {string} color
         */
        function setAvatarInfoStyle(memberId, name, color) {
            function setStyle(nodeName, className, rule) {
                var styleRule = createAvatarInfoNodeMatch(nodeName, className, memberId) + rule,
                    styleNode = getAvatarInfoStyle(nodeName, className, memberId);

                // TODO: this does not work with Firefox 16.0.1, throws a HierarchyRequestError on first try.
                // And Chromium a "SYNTAX_ERR: DOM Exception 12" now
                // avatarEditedStyles.sheet.insertRule(paragraphStyleName+styleRuleRudimentCStr, 0);
                // Workaround for now:
                if (styleNode) {
                    styleNode.data = styleRule;
                } else {
                    avatarInfoStyles.appendChild(document.createTextNode(styleRule));
                }
            }

            setStyle('div', 'editInfoMarker', '{ background-color: ' + color + '; }');
            setStyle('span', 'editInfoColor', '{ background-color: ' + color + '; }');
            setStyle('span', 'editInfoAuthor', ':before { content: "' + name + '"; }');
        }

        /**
         * @param {!string} memberId
         */
        function highlightEdit(element, memberId, timestamp) {
            var editInfo,
                editInfoMarker,
                id = '',
                editInfoNode = element.getElementsByTagNameNS(editInfons, 'editinfo')[0];

            if (editInfoNode) {
                id = editInfoNode.getAttributeNS(editInfons, 'id');
                editInfoMarker = editInfoMap[id];
            } else {
                id = Math.random().toString();
                editInfo = new ops.EditInfo(element, session.getOdtDocument());
                editInfoMarker = new gui.EditInfoMarker(editInfo, showEditInfoMarkers);

                editInfoNode = element.getElementsByTagNameNS(editInfons, 'editinfo')[0];
                editInfoNode.setAttributeNS(editInfons, 'id', id);
                editInfoMap[id] = editInfoMarker;
            }

            editInfoMarker.addEdit(memberId, new Date(timestamp));
        }

        /**
         * Updates the visibility on all existing editInfo entries
         * @param {boolean} visible
         */
        function setEditInfoMarkerVisbility(visible) {
            var editInfoMarker, keyname;

            for (keyname in editInfoMap) {
                if (editInfoMap.hasOwnProperty(keyname)) {
                    editInfoMarker = editInfoMap[keyname];
                    if (visible) {
                        editInfoMarker.show();
                    } else {
                        editInfoMarker.hide();
                    }
                }
            }
        }

        /**
         * Updates the visibility on all existing avatars
         * @param {boolean} visible
         */
        function setCaretAvatarVisibility(visible) {
            var caret, keyname;

            for (keyname in carets) {
                if (carets.hasOwnProperty(keyname)) {
                    caret = carets[keyname];
                    if (visible) {
                        caret.showHandle();
                    } else {
                        caret.hideHandle();
                    }
                }
            }
        }

        /**
         * Show edit information markers displayed near edited paragraphs
         */
        this.showEditInfoMarkers = function () {
            if (showEditInfoMarkers) {
                return;
            }

            showEditInfoMarkers = true;
            setEditInfoMarkerVisbility(showEditInfoMarkers);
        };

        /**
         * Hide edit information markers displayed near edited paragraphs
         */
        this.hideEditInfoMarkers = function () {
            if (!showEditInfoMarkers) {
                return;
            }

            showEditInfoMarkers = false;
            setEditInfoMarkerVisbility(showEditInfoMarkers);
        };

        /**
         * Show member avatars above the cursor
         */
        this.showCaretAvatars = function () {
            if (showCaretAvatars) {
                return;
            }

            showCaretAvatars = true;
            setCaretAvatarVisibility(showCaretAvatars);
        };

        /**
         * Hide member avatars above the cursor
         */
        this.hideCaretAvatars = function () {
            if (!showCaretAvatars) {
                return;
            }

            showCaretAvatars = false;
            setCaretAvatarVisibility(showCaretAvatars);
        };

        /**
         * @return {ops.Session}
         */
        this.getSession = function () {
            return session;
        };
        /**
         * @param {!string} memberid
         * @return {gui.Caret}
         */
        this.getCaret = function (memberid) {
            return carets[memberid];
        };

        /**
         * @param {!string} memberId
         * @param {Object|null} userData
         * @return {undefined}
         *
         * Setting userData to null will apply empty (bogus) user data.
         */
        function renderMemberData(memberId, userData) {
            var caret = carets[memberId];

            // this takes care of incorrectly implemented UserModels,
            // which might end up returning undefined user data
            if (userData === undefined) {
                runtime.log("UserModel sent undefined data for member \"" + memberId + "\".");
                return;
            }

            if (userData === null) {
                userData = {
                    memberid: memberId,
                    fullname: "Unknown Identity",
                    color: "black",
                    imageurl: "avatar-joe.png"
                };
            }

            if (caret) {
                caret.setAvatarImageUrl(userData.imageurl);
                caret.setColor(userData.color);
            }

            setAvatarInfoStyle(memberId, userData.fullname, userData.color);
        }

        /**
         * @param {ops.OdtCursor} cursor
         * @return {undefined}
         */
        function onCursorAdded(cursor) {
            var caret = caretFactory.createCaret(cursor, showCaretAvatars, blinkOnRangeSelect),
                memberId = cursor.getMemberId(),
                userModel = session.getUserModel();

            carets[memberId] = caret;
            // preset bogus data
            // TODO: indicate loading state
            // (instead of setting the final 'unknown identity' data)
            renderMemberData(memberId, null);
            // subscribe to real updates
            userModel.getUserDetailsAndUpdates(memberId, renderMemberData);

            runtime.log("+++ View here +++ eagerly created an Caret for '" + memberId + "'! +++");
        }

        /**
         * @param {!string} memberid
         */
        function onCursorRemoved(memberid) {
            var /**@type{!boolean}*/ hasMemberEditInfo = false,
                keyname;

            delete carets[memberid];

            // check if there is any edit info with this member
            for (keyname in editInfoMap) {
                if (editInfoMap.hasOwnProperty(keyname) &&
                        editInfoMap[keyname].getEditInfo().getEdits().hasOwnProperty(memberid)) {
                    hasMemberEditInfo = true;
                    break;
                }
            }

            if (!hasMemberEditInfo) {
                session.getUserModel().unsubscribeUserDetailsUpdates(memberid, renderMemberData);
            }
        }

        function init() {
            var odtDocument = session.getOdtDocument(),
                head = document.getElementsByTagName('head')[0];

            odtDocument.subscribe(ops.OdtDocument.signalCursorAdded, onCursorAdded);
            odtDocument.subscribe(ops.OdtDocument.signalCursorRemoved, onCursorRemoved);
            odtDocument.subscribe(ops.OdtDocument.signalParagraphChanged, function (info) {
                highlightEdit(info.paragraphElement, info.memberId, info.timeStamp);
            });


            // Add a css sheet for avatar-edited styling
            avatarInfoStyles = document.createElementNS(head.namespaceURI, 'style');
            avatarInfoStyles.type = 'text/css';
            avatarInfoStyles.media = 'screen, print, handheld, projection';
            avatarInfoStyles.appendChild(document.createTextNode('@namespace editinfo url(urn:webodf:names:editinfo);'));
            head.appendChild(avatarInfoStyles);
        }
        init();
    }

    return SessionView;
}());
