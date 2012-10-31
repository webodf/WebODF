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
/*global runtime, core, gui*/

runtime.loadClass("gui.Avatar");

/**
 * The avatar factory creates an avatar as UI representation of a users's cursor.
 * If the avatar is for the local user, then a handler is passed to the avatar
 * to redirect the keystrokes received for the avatar to the session controller.
 * @constructor
 * @param {!ops.Session} session
 * @param {!gui.SessionController} sessionController
 */
gui.AvatarFactory = function AvatarFactory(session, sessionController) {
    "use strict";

    /**
     * @param {!string} memberid
     * @return {!gui.Avatar}
     */
    this.createAvatar = function (memberid) {
        var mover, handler, filter, selectionMover, avatar;

        filter = session.getFilter();
        selectionMover = session.getSelectionManager().createSelectionMover();
        mover = function (n) {
            session.moveMemberCaret(memberid, n);
        };
        // if local user, then install input handler
        if (memberid === session.getLocalMemberid()) {
            handler = function (charCode) {
                runtime.log("got keycode: " + charCode);
                // TODO: here take sessionController object and forward input
                return true;
            };
        }

        avatar = new gui.Avatar(memberid, selectionMover, filter, mover, handler);

        return avatar;
    }
};
