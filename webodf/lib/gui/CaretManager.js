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
 * The caret manager is responsible for creating a caret as UI representation
 * of a users's cursor.
 * If the caret is for the local user, then the manager will control the caret's
 * current focus, and ensure the caret stays visible after every local operation.
 * @constructor
 * @param {!gui.SessionController} sessionController
 */
gui.CaretManager = function CaretManager(sessionController) {
    "use strict";
    var carets = {};

    function getCanvasElement() {
        return sessionController.getSession().getOdtDocument().getOdfCanvas().getElement();
    }

    function removeCaret(memberId) {
        if (memberId === sessionController.getInputMemberId()) {
            getCanvasElement().removeAttribute("tabindex", 0);
        }
        delete carets[memberId];
    }

    function refreshCaret(cursor) {
        var caret = carets[cursor.getMemberId()];
        if (caret) {
            caret.refreshCursor();
        }
    }

    function ensureLocalCaretVisible(info) {
        var caret = carets[info.memberId];
        if (info.memberId === sessionController.getInputMemberId() && caret) {
            // on user edit actions ensure visibility of cursor
            caret.ensureVisible();
        }
    }

    function focusLocalCaret() {
        var caret = carets[sessionController.getInputMemberId()];
        if (caret) {
            caret.setFocus();
        }
    }

    function blurLocalCaret() {
        var caret = carets[sessionController.getInputMemberId()];
        if (caret) {
            caret.removeFocus();
        }
    }

    /**
     * @param {ops.OdtCursor} cursor
     * @param {boolean} caretAvatarInitiallyVisible Set to false to hide the associated avatar
     * @param {boolean} blinkOnRangeSelect Specify that the caret should blink if a non-collapsed range is selected
     * @return {!gui.Caret}
     */
    this.registerCursor = function (cursor, caretAvatarInitiallyVisible, blinkOnRangeSelect) {
        var memberid = cursor.getMemberId(),
            canvasElement = getCanvasElement(),
            caret = new gui.Caret(cursor, caretAvatarInitiallyVisible, blinkOnRangeSelect);

        carets[memberid] = caret;

        // if local input user, then let controller listen on caret span
        if (memberid === sessionController.getInputMemberId()) {
            runtime.log("Starting to track input on new cursor of " + memberid);

            // wire up the cursor update to caret visibility update
            cursor.handleUpdate = caret.ensureVisible;
            // enable canvas to have focus
            canvasElement.setAttribute("tabindex", 0);
            // wire up focus on canvas to caret
            canvasElement.focus();
        }

        return caret;
    };

    /**
     * @param {!string} memberid
     * @return {!gui.Caret}
     */
    this.getCaret = function(memberid) {
        return carets[memberid];
    };

    /**
     * @returns {!Array.<!gui.Caret>}
     */
    this.getCarets = function() {
        return Object.keys(carets).map(function(memberid) { return carets[memberid]; });
    };

    function init() {
        var session = sessionController.getSession(),
            odtDocument = session.getOdtDocument(),
            canvasElement = getCanvasElement();

        odtDocument.subscribe(ops.OdtDocument.signalParagraphChanged, ensureLocalCaretVisible);
        odtDocument.subscribe(ops.OdtDocument.signalCursorMoved, refreshCaret);
        odtDocument.subscribe(ops.OdtDocument.signalCursorRemoved, removeCaret);

        canvasElement.onfocus = focusLocalCaret;
        canvasElement.onblur = blurLocalCaret;
    }

    init();
};
