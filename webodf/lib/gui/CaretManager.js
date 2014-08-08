/**
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global runtime, core, gui, ops*/


/**
 * The caret manager is responsible for creating a caret as UI representation
 * of a member's cursor.
 * If the caret is for the local member, then the manager will control the
 * caret's current focus, and ensure the caret stays visible after every local
 * operation.
 * @constructor
 * @implements {core.Destroyable}
 * @param {!gui.SessionController} sessionController
 * @param {!gui.Viewport} viewport
 */
gui.CaretManager = function CaretManager(sessionController, viewport) {
    "use strict";
    var /**@type{!Object.<string,!gui.Caret>}*/
        carets = {},
        window = runtime.getWindow(),
        odtDocument = sessionController.getSession().getOdtDocument(),
        eventManager = sessionController.getEventManager();

    /**
     * @param {!string} memberId
     * @return {?gui.Caret}
     */
    function getCaret(memberId) {
        return carets.hasOwnProperty(memberId) ? carets[memberId] : null;
    }

    /**
     * Get the horizontal offset of the local caret from the
     * left edge of the screen (in pixels).
     * @return {!number|undefined}
     */
    function getLocalCaretXOffsetPx() {
        var localCaret = getCaret(sessionController.getInputMemberId()),
            lastRect;
        if (localCaret) {
            lastRect = localCaret.getBoundingClientRect();
        }
        // usually the rect is 1px width, so rect.left ~= rect.right.
        // Right is used because during IME composition the caret width includes
        // the chars being composed. The caret is *always* flush against the right side
        // of the it's BCR.
        return lastRect ? lastRect.right : undefined;
    }

    /**
     * @return {!Array.<!gui.Caret>}
     */
    function getCarets() {
        return Object.keys(carets).map(function (memberid) {
            return carets[memberid];
        });
    }

    /**
     * @param {!string} memberId
     * @return {undefined}
     */
    function removeCaret(memberId) {
        var caret = carets[memberId];
        if (caret) {
            // Remove the caret before destroying it in case the destroy function causes new window/webodf events to be
            // triggered. This ensures the caret can't receive any new events once destroy has been invoked
            delete carets[memberId];
            if (memberId === sessionController.getInputMemberId()) {
                odtDocument.unsubscribe(ops.OdtDocument.signalProcessingBatchEnd, caret.ensureVisible);
                odtDocument.unsubscribe(ops.Document.signalCursorMoved, caret.refreshCursorBlinking);

                eventManager.unsubscribe("compositionupdate", caret.handleUpdate);
                eventManager.unsubscribe("compositionend", caret.handleUpdate);
                eventManager.unsubscribe("focus", caret.setFocus);
                eventManager.unsubscribe("blur", caret.removeFocus);

                window.removeEventListener("focus", caret.show, false);
                window.removeEventListener("blur", caret.hide, false);
            } else {
                odtDocument.unsubscribe(ops.OdtDocument.signalProcessingBatchEnd, caret.handleUpdate);
            }
            /*jslint emptyblock:true*/
            caret.destroy(function() {});
            /*jslint emptyblock:false*/
        }
    }

    /**
     * @param {!ops.OdtCursor} cursor
     * @param {!boolean} caretAvatarInitiallyVisible  Set to false to hide the associated avatar
     * @param {!boolean} blinkOnRangeSelect  Specify that the caret should blink if a non-collapsed range is selected
     * @return {!gui.Caret}
     */
    this.registerCursor = function (cursor, caretAvatarInitiallyVisible, blinkOnRangeSelect) {
        var memberid = cursor.getMemberId(),
            caret = new gui.Caret(cursor, viewport, caretAvatarInitiallyVisible, blinkOnRangeSelect);

        carets[memberid] = caret;

        // if local input member, then let controller listen on caret span
        if (memberid === sessionController.getInputMemberId()) {
            runtime.log("Starting to track input on new cursor of " + memberid);
            odtDocument.subscribe(ops.OdtDocument.signalProcessingBatchEnd, caret.ensureVisible);
            odtDocument.subscribe(ops.Document.signalCursorMoved, caret.refreshCursorBlinking);

            eventManager.subscribe("compositionupdate", caret.handleUpdate);
            eventManager.subscribe("compositionend", caret.handleUpdate);
            eventManager.subscribe("focus", caret.setFocus);
            eventManager.subscribe("blur", caret.removeFocus);

            window.addEventListener("focus", caret.show, false);
            window.addEventListener("blur", caret.hide, false);

            // Add event trap as an overlay element to the caret
            caret.setOverlayElement(eventManager.getEventTrap());
        } else {
            odtDocument.subscribe(ops.OdtDocument.signalProcessingBatchEnd, caret.handleUpdate);
        }

        return caret;
    };

    /**
     * @param {!string} memberId
     * @return {?gui.Caret}
     */
    this.getCaret = getCaret;

    /**
     * @return {!Array.<!gui.Caret>}
     */
    this.getCarets = getCarets;

    /**
     * @param {!function(!Error=)} callback, passing an error object in case of error
     * @return {undefined}
     */
    this.destroy = function (callback) {
        var caretCleanup = getCarets().map(function(caret) { return caret.destroy; });

        sessionController.getSelectionController().setCaretXPositionLocator(null);
        odtDocument.unsubscribe(ops.Document.signalCursorRemoved, removeCaret);
        carets = {};
        core.Async.destroyAll(caretCleanup, callback);
    };

    function init() {
        sessionController.getSelectionController().setCaretXPositionLocator(getLocalCaretXOffsetPx);
        odtDocument.subscribe(ops.Document.signalCursorRemoved, removeCaret);
    }

    init();
};
