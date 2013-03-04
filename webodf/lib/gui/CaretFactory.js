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
/*global runtime, core, gui, ops*/

runtime.loadClass("gui.Caret");

/**
 * The caret factory creates an caret as UI representation of a users's cursor.
 * If the caret is for the local user, then a handler is passed to the caret
 * to redirect the keystrokes received for the caret to the session controller.
 * @constructor
 * @param {!gui.SessionController} sessionController
 */
gui.CaretFactory = function CaretFactory(sessionController) {
    "use strict";

    /**
     * @param {ops.OdtCursor} cursor
     * @return {!gui.Caret}
     */
    this.createCaret = function (cursor) {
        var memberid = cursor.getMemberId(),
            odtDocument = sessionController.getSession().getOdtDocument(),
            canvasElement = odtDocument.getOdfCanvas().getElement(),
            caret = new gui.Caret(cursor);

        // if local input user, then let controller listen on caret span
        if (memberid === sessionController.getInputMemberId()) {
            runtime.log("Starting to track input on new cursor of " + memberid);

            // on user edit actions ensure visibility of cursor
            odtDocument.subscribe('paragraphEdited', function (info) {
                if (info.memberId === memberid) {
                    caret.ensureVisible();
                }
            });

            // wire up the cursor update to caret visibility update
            cursor.handleUpdate = caret.ensureVisible;
            // enable canvas to have focus
            canvasElement.setAttribute("tabindex", 0);
            // wire up focus on canvas to caret
            canvasElement.onfocus = caret.setFocus;
            canvasElement.onblur = caret.removeFocus;
            canvasElement.focus();

            // everything prepared, so now let's start to deal with any input
            sessionController.startListening();
        }

        return caret;
    };
};
