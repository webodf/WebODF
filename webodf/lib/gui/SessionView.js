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
/*global document, runtime, gui, ops */

runtime.loadClass("gui.Caret");
runtime.loadClass("ops.TrivialUserModel");

gui.SessionView = (function () {
    "use strict";

    /**
      * @constructor
      */
    function SessionView(session, caretFactory) {
        var carets = {},
            avatarEditedStyles,
            memberDataChangedHandler;

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
         */
        function onMemberDataChanged(memberId, userData) {
            var caret = carets[memberId];

            if (caret) {
                caret.setAvatarImageUrl(userData.imageurl);
                caret.setColor(userData.color);
            }
        }
        memberDataChangedHandler = onMemberDataChanged;

        /**
         * @param {core.Cursor} cursor
         */
        function onCursorAdded(cursor) {
            var caret = caretFactory.createCaret(cursor),
                memberId = cursor.getMemberId(),
                userModel = session.getUserModel(),
                userData = userModel.getUserDetails(memberId, memberDataChangedHandler),
                styleRuleRudimentCStr;

            caret.setAvatarImageUrl(userData.imageurl);
            caret.setColor(userData.color);

            runtime.log("+++ View here +++ eagerly created an Caret for '" + memberId + "'! +++");

            carets[memberId] = caret;

            // Add per-avatar edited styling
            styleRuleRudimentCStr = '[class=edited][user="' + memberId + '"] { background-color: ' + userData.color + ';'
                + '-webkit-animation-name: fade;'
                + '-webkit-animation-duration: 10s;'
                + '-webkit-animation-fill-mode: forwards;'
                + '-moz-animation-name: fade;'
                + '-moz-animation-duration: 10s;'
                + '-moz-animation-fill-mode: forwards;'
                + 'border-radius: 10px;}';
            // TODO: this does not work with Firefox 16.0.1, throws a HierarchyRequestError on first try.
            // And Chromium a "SYNTAX_ERR: DOM Exception 12" now
            // avatarEditedStyles.sheet.insertRule('text|p'+styleRuleRudimentCStr, 0);
            // Workaround for now
            avatarEditedStyles.appendChild(document.createTextNode('text|h' + styleRuleRudimentCStr));
            avatarEditedStyles.appendChild(document.createTextNode('text|p' + styleRuleRudimentCStr));
        }

        /**
         * @param {!string} memberid
         */
        function onCursorRemoved(memberid) {
            // TODO: remove style rule for avatar again from avatarEditedStyles
            delete carets[memberid];
            session.getUserModel().unsubscribeForUserDetails(memberid, memberDataChangedHandler);
        }

        function init() {
            var head = document.getElementsByTagName('head')[0];

            session.subscribe(ops.SessionImplementation.signalCursorAdded, onCursorAdded);
            session.subscribe(ops.SessionImplementation.signalCursorRemoved, onCursorRemoved);

            // Add a css sheet for avatar-edited styling
            avatarEditedStyles = document.createElementNS(head.namespaceURI, 'style');
            avatarEditedStyles.type = 'text/css';
            avatarEditedStyles.media = 'screen, print, handheld, projection';
            avatarEditedStyles.appendChild(document.createTextNode('@namespace text url(urn:oasis:names:tc:opendocument:xmlns:text:1.0);'));
            head.appendChild(avatarEditedStyles);
        }
        init();
    }

    return SessionView;
}());
