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
runtime.loadClass("ops.OpMoveMemberCursor");

/**
 * @constructor
 */
gui.SessionController = (function () {
    "use strict";

    /**
     * @constructor
     */
    function SessionController() {
        var self = this,
            m_session;

        this.setSessionImplementation = function(impl) {
            m_session = impl;
        };

        this.startEditing = function(ourself) {
            var op = new ops.OpAddMember(m_session);
            runtime.assert(op.hasOwnProperty("init"), "no init in op");
            op.init({memberid:ourself});
            m_session.enqueue(op);
        };
        /**
        * @param {!number} charCode
        * @return {!boolean}
        */
        this.avatarKeyHandler = function(charCode) {
            var op = null,
                handled = false;
            if (charCode === 37) { // left
                op = new ops.OpMoveMemberCursor(m_session);
                op.init({memberid:m_session.getLocalMemberid(), number:-1});
                handled = true;
            } else if (charCode === 39) { // right
                op = new ops.OpMoveMemberCursor(m_session);
                op.init({memberid:m_session.getLocalMemberid(), number:1});
                handled = true;
            } else if (charCode === 38) { // up
                // TODO: fimd a way to get the number of needed steps here, for now hardcoding 10
                op = new ops.OpMoveMemberCursor(m_session);
                op.init({memberid:m_session.getLocalMemberid(), number:-10});
                handled = true;
            } else if (charCode === 40) { // down
                // TODO: fimd a way to get the number of needed steps here, for now hardcoding 10
                op = new ops.OpMoveMemberCursor(m_session);
                op.init({memberid:m_session.getLocalMemberid(), number:10});
                handled = true;
            } else {
                runtime.log("got keycode: " + charCode);
                handled = true;
            }
            if (op) {
                m_session.enqueue(op);
            }
            return handled;
        };
    }

    return SessionController;
} ());
// vim:expandtab
