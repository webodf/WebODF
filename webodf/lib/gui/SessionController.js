/**
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
/*global runtime, core, gui, ops, odf */

runtime.loadClass("ops.OpAddMember");
runtime.loadClass("ops.OpRemoveMember");
runtime.loadClass("ops.OpMoveMemberCursor");
runtime.loadClass("ops.OpInsertText");

/**
 * @constructor
 * @param {!ops.Session} session
 */
gui.SessionController = (function () {
    "use strict";

    /**
     * @constructor
     * @param {!ops.Session} session
     */
    gui.SessionController = function SessionController(session) {
        var self = this;

        function listenEvent(eventTarget, eventType, eventHandler) {
            if (eventTarget.addEventListener) {
                eventTarget.addEventListener(eventType, eventHandler, false);
            } else if (eventTarget.attachEvent) {
                eventType = "on" + eventType;
                eventTarget.attachEvent(eventType, eventHandler);
            } else {
                eventTarget["on" + eventType] = eventHandler;
            }
        }

        function cancelEvent(event) {
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        }
        function dummyHandler(e) {
            cancelEvent(e);
        }

        /**
         * @param {!Event} e
         */
        function handleMouseClick(e) {
            var selection = runtime.getWindow().getSelection(),
                localMemberId = session.getUserModel().getLocalMemberId(),
                steps,
                op;

            steps = session.getDistanceFromCursor(localMemberId, selection.focusNode, selection.focusOffset);

            if (steps !== 0) {
                op = new ops.OpMoveMemberCursor(session);
                op.init({memberid:localMemberId, number:steps});
                session.enqueue(op);
            }
        }

        /**
         * @param {!Event} e
         */
        function handleKeyDown(e) {
            var charCode = e.keyCode,
                op = null,
                memberid = session.getUserModel().getLocalMemberId(),
                handled = false;

            if (charCode === 37) { // left
                op = new ops.OpMoveMemberCursor(session);
                op.init({memberid:memberid, number:-1});
                handled = true;
            } else if (charCode === 39) { // right
                op = new ops.OpMoveMemberCursor(session);
                op.init({memberid:memberid, number:1});
                handled = true;
            } else if (charCode === 38) { // up
                // TODO: fimd a way to get the number of needed steps here, for now hardcoding 10
                op = new ops.OpMoveMemberCursor(session);
                op.init({memberid:memberid, number:-10});
                handled = true;
            } else if (charCode === 40) { // down
                // TODO: fimd a way to get the number of needed steps here, for now hardcoding 10
                op = new ops.OpMoveMemberCursor(session);
                op.init({memberid:memberid, number:10});
                handled = true;
            } else {
                runtime.log("got keycode: " + charCode);
                // TODO: only accept text-like charCodes
                op = new ops.OpInsertText(session);
                op.init({
                    memberid: memberid,
                    position: session.getCursorPosition(memberid),
                    text: String.fromCharCode(charCode)
                });
                handled = true;
            }
            if (op) {
                session.enqueue(op);
            }
            // still allow ctrl-r in ui, must be improved later
            if (!e.ctrlKey) {
                cancelEvent(e);
            }
        }

        /**
         * @param {!Element} element
         */
        this.setFocusElement = function(element) {
            listenEvent(element, "keydown", handleKeyDown);
            listenEvent(element, "keyup", dummyHandler);
            listenEvent(element, "copy", dummyHandler);
            listenEvent(element, "cut", dummyHandler);
            listenEvent(element, "paste", dummyHandler);

            // start to listen for mouse clicks as well, but on the whole document
            listenEvent(session.getRootNode(), "click", handleMouseClick);
        };

       /**
        * @param {!string} ourself
        */
        this.startEditing = function(ourself) {
            var op = new ops.OpAddMember(session);
            op.init({memberid:ourself});
            session.enqueue(op);
        };

        /**
        * @param {!string} ourself
        */
        this.endEditing = function(ourself) {
            var op = new ops.OpRemoveMember(session);
            op.init({memberid:ourself});
            session.enqueue(op);
        };
    };

    return gui.SessionController;
} ());
// vim:expandtab
