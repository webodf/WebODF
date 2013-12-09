/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
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
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global runtime, gui, core, ops*/

runtime.loadClass("core.DomUtils");
runtime.loadClass("core.ScheduledTask");
runtime.loadClass("ops.OdtDocument");
runtime.loadClass("ops.OdtCursor");

/**
 * @constructor
 * @param {!string} inputMemberId
 * @param {!ops.OdtDocument} odtDocument
 * @param {!gui.EventManager} eventManager
 */
gui.InputMethodEditor = function InputMethodEditor(inputMemberId, odtDocument, eventManager) {
    "use strict";
    var window = runtime.getWindow(),
        localCursor = null,
        eventTrap = eventManager.getEventTrap(),
        domUtils = new core.DomUtils(),
        FAKE_CONTENT = "b",
        clearTrapText;

    /**
     * Get the current canvas element. The current trivial undo manager replaces the root element
     * of the ODF container with a clone from a previous state. This results in the root element
     * being changed. As such, it can't be stored, and should be queried on each use.
     * @returns {!Element}
     */
    function getCanvasElement() {
        // TODO Remove when a proper undo manager arrives
        return odtDocument.getOdfCanvas().getElement();
    }

    function resetWindowSelection() {
        var selection = window.getSelection(),
            textNode = eventTrap.firstChild,
            doc = eventTrap.ownerDocument;

        if (!domUtils.containsNode(getCanvasElement(), eventTrap)) {
            // TODO Remove when a proper undo manager arrives
            // The undo manager can replace the root element, discarding the original.
            // The event trap node is still valid, and simply needs to be re-attached
            // after this occurs.

            // Don't worry about the local caret yet. The event trap will eventually be moved to
            // a new valid local caret when it is registered upon cursor re-registration
            getCanvasElement().appendChild(eventTrap);
        }

        if (!textNode) {
            // Content is necessary for cut/copy/paste to be enabled
            textNode = eventTrap.appendChild(doc.createTextNode(""));
        }

        // If there is a local cursor, and it is collapsed, collapse the window selection as well.
        // Otherwise, ensure some text is selected by default.
        // A browser selection in an editable area is necessary to allow cut/copy events to fire
        // It doesn't have to be an accurate selection however as the SessionController will override
        // the default browser handling.
        if (localCursor && localCursor.getSelectedRange().collapsed) {
            textNode.deleteData(0, textNode.length);
        } else {
            textNode.replaceData(0, textNode.length, FAKE_CONTENT);
        }

        // Obtain document focus again after a cursor update
        // This is necessary because the cursor currently removes then adds itself back into the DOM
        // breaking the focus on the event trap as a result
        eventManager.focus();
        selection.collapse(eventTrap.firstChild, 0);
        if (selection.extend) {
            selection.extend(eventTrap, eventTrap.childNodes.length);
        }
    }

    function compositionStart() {
        var cursorNode = localCursor.getNode();
        cursorNode.setAttributeNS("urn:webodf:names:cursor", "composing", "true");
    }

    function compositionEnd() {
        var cursorNode = localCursor.getNode();
        cursorNode.removeAttributeNS("urn:webodf:names:cursor", "composing");
        // The text is not updated until after the composition event fires
        clearTrapText.trigger();
    }

    /**
     * Handle a cursor registration event
     * @param {!ops.OdtCursor} cursor
     */
    this.registerCursor = function (cursor) {
        var cursorNode, hasFocus;
        if (cursor.getMemberId() === inputMemberId) {
            hasFocus = eventManager.hasFocus();
            localCursor = cursor;
            localCursor.subscribe(ops.OdtCursor.signalCursorUpdated, resetWindowSelection);
            cursorNode = localCursor.getNode();
            cursorNode.insertBefore(eventTrap, cursorNode.firstChild);
            if (hasFocus) {
                // Relocating the event trap will reset the window selection
                // Restore this again if the document previously had focus
                resetWindowSelection();
            }
        }
    };

    /**
     * Handle a cursor removal event
     * @param {!string} memberid Member id of the removed cursor
     */
    this.removeCursor = function (memberid) {
        var hasFocus;
        if (memberid ===  inputMemberId) {
            hasFocus = eventManager.hasFocus();
            localCursor.unsubscribe(ops.OdtCursor.signalCursorUpdated, resetWindowSelection);
            localCursor = null;
            getCanvasElement().appendChild(eventTrap);
            resetWindowSelection();
            if (hasFocus) {
                // Relocating the event trap will reset the window selection
                // Restore this again if the document previously had focus
                eventManager.focus();
            }
        }
    };

    function init() {
        eventManager.subscribe('compositionstart', compositionStart);
        eventManager.subscribe('compositionend', compositionEnd);

        eventTrap.setAttribute("contenteditable", "true");
        // Negative tab index still allows focus, but removes accessibility by keyboard
        eventTrap.setAttribute("tabindex", -1);
        clearTrapText = new core.ScheduledTask(resetWindowSelection, 0);
    }

    init();
};
