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

/*global runtime, gui, core, ops, Node*/

runtime.loadClass("core.Async");
runtime.loadClass("core.DomUtils");
runtime.loadClass("core.EventNotifier");
runtime.loadClass("core.ScheduledTask");
runtime.loadClass("ops.OdtDocument");
runtime.loadClass("ops.OdtCursor");

(function() {
    "use strict";

    /**
     * When composition session is ended on Safari under MacOS by pressing
     * another text char, Safari incorrectly reports the next keypress event’s
     * “which” value as the last compositionend data, rather than the new key
     * that was pressed.
     *
     * This class will filter out these bad key presses, and emit the actual
     * text as if it occurred via a normal composition event
     *
     * @constructor
     * @param {!gui.EventManager} eventManager
     * @param {!function(!string):undefined} emitNewData
     */
    function DetectSafariCompositionError(eventManager, emitNewData) {
        var lastCompositionValue,
            suppressedKeyPress = false;

        /**
         * Detect and filter out bad Safari key presses
         * @param {!(Event|KeyboardEvent)} e
         * @return {!boolean}
         */
        function filterBadSafariKeys(e) {
            suppressedKeyPress = e.which && String.fromCharCode(e.which) === lastCompositionValue;
            lastCompositionValue = undefined;
            return suppressedKeyPress === false;
        }

        /**
         * @param {!TextEvent} e
         */
        function handleTextInput(e) {
            if (suppressedKeyPress) {
                emitNewData(e.data);
            }
            suppressedKeyPress = false;
        }

        /**
         * @param {!CompositionEvent} e
         */
        function handleCompositionEnd(e) {
            lastCompositionValue = e.data;
            suppressedKeyPress = false;
        }

        function init() {
            eventManager.subscribe("textInput", handleTextInput);
            eventManager.subscribe("compositionend", handleCompositionEnd);
            eventManager.addFilter("keypress", filterBadSafariKeys);
        }

        this.destroy = function(callback) {
            eventManager.unsubscribe("textInput", handleTextInput);
            eventManager.unsubscribe("compositionend", handleCompositionEnd);
            eventManager.unsubscribe("keypress", filterBadSafariKeys);
            callback();
        };

        init();
    }

    /**
     * Browsers:
     * Chrome 31.0.1650.63, Ubuntu 13.10
     *
     * Data isn't in the compositionend event. The text is added to the focused field
     * immediately after however in a textInput event. Firefox appears to be unaffected
     * by this bug.
     *
     * Recorded events:
     * keyup: O |cycle: 4
     * keyup: å |cycle: 3
     * textInput: た |cycle: 3
     * keydown: å |cycle: 2
     * keyup: å |cycle: 2
     * compositionend:  |cycle: 2
     * keydown: å |cycle: 2
     * keyup: å |cycle: 2
     * compositionupdate: t |cycle: 2
     * keydown: å |cycle: 2
     * keyup: T |cycle: 1
     * keyup: å |cycle: 0
     * compositionupdate: t |cycle: 0
     * compositionstart:  |cycle: 0
     * keydown: å |cycle: 0
     *
     * @constructor
     * @param {!gui.EventManager} eventManager
     * @param {!function(!string):undefined} emitNewData
     */
    function DetectChromeLinuxCompositionError(eventManager, emitNewData) {
        var afterComposition = false,
            resetEndComposition;

        /**
         * @param {!TextEvent} e
         */
        function handleTextInput(e) {
            if (afterComposition && e.data) {
                emitNewData(e.data);
            }
            afterComposition = false;
            resetEndComposition.cancel();
        }

        /**
         * @param {!CompositionEvent} e
         */
        function handleCompositionEnd(e) {
            if (!e.data) {
                afterComposition = true;
                resetEndComposition.trigger();
            }
        }

        function handleCompositionStart() {
            afterComposition = false;
            resetEndComposition.cancel();
        }

        function init() {
            eventManager.subscribe("textInput", handleTextInput);
            eventManager.subscribe("compositionend", handleCompositionEnd);
            eventManager.subscribe("compositionstart", handleCompositionStart);
            resetEndComposition = new core.ScheduledTask(function() { afterComposition = false; }, 0);
        }

        this.destroy = function(callback) {
            eventManager.unsubscribe("textInput", handleTextInput);
            eventManager.unsubscribe("compositionend", handleCompositionEnd);
            eventManager.unsubscribe("compositionstart", handleCompositionEnd);
            resetEndComposition.destroy(callback);
        };

        init();
    }

    /**
     * Challenges of note:
     * - On FF & Chrome, the composition session is interrupted if the OdtCursor moves
     * - On Safari, using Option+char incorrectly reports the following keypress event
     * - On Chrome, using Option+char will include the following keypress in the composition event
     *
     * @constructor
     * @param {!string} inputMemberId
     * @param {!ops.OdtDocument} odtDocument
     * @param {!gui.EventManager} eventManager
     */
    gui.InputMethodEditor = function InputMethodEditor(inputMemberId, odtDocument, eventManager) {
        var window = runtime.getWindow(),
            cursorns = "urn:webodf:names:cursor",
            localCursor = null,
            eventTrap = eventManager.getEventTrap(),
            async = new core.Async(),
            domUtils = new core.DomUtils(),
            FAKE_CONTENT = "b",
            processUpdates,
            pendingEvent = false,
            pendingData = "",
            events = new core.EventNotifier([gui.InputMethodEditor.signalCompositionStart,
                                                gui.InputMethodEditor.signalCompositionEnd]),
            filters = [],
            cleanup;

        /**
         * Subscribe to IME events
         * @type {Function}
         */
        this.subscribe = events.subscribe;

        /**
         * Unsubscribe from IME events
         * @type {Function}
         */
        this.unsubscribe = events.unsubscribe;

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

        function flushEvent() {
            var cursorNode;
            if (pendingEvent) {
                pendingEvent = false;
                cursorNode = localCursor.getNode();
                cursorNode.removeAttributeNS(cursorns, "composing");
                events.emit(gui.InputMethodEditor.signalCompositionEnd, {data: pendingData});
                pendingData = "";
            }
        }

        function addCompositionData(data) {
            pendingEvent = true;
            pendingData += data;
            // A delay is necessary as modifying document text and moving the cursor will interrupt
            // back-to-back composition sessions (e.g., repeatedly pressiong Option+char on MacOS in Chrome)
            processUpdates.trigger();
        }

        function resetWindowSelection() {
            var selection = window.getSelection(),
                textNode = eventTrap.firstChild,
                doc = eventTrap.ownerDocument;

            flushEvent();
            if (!domUtils.containsNode(getCanvasElement(), eventTrap)) {
                // TODO Remove when a proper undo manager arrives
                // The undo manager can replace the root element, discarding the original.
                // The event trap node is still valid, and simply needs to be re-attached
                // after this occurs.

                // Don't worry about the local caret yet. The event trap will eventually be moved to
                // a new valid local caret when it is registered upon cursor re-registration
                getCanvasElement().appendChild(eventTrap);
            }

            if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
                while (eventTrap.firstChild) {
                    // Opera puts a random BR tag in as the first node for some reason...
                    eventTrap.removeChild(eventTrap.firstChild);
                }
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
            // Some IMEs will stack end & start requests back to back.
            // Aggregate these as a group and report them in a single request once all are
            // complete to avoid the selection being reset
            processUpdates.cancel();
            cursorNode.setAttributeNS(cursorns, "composing", "true");
            if (!pendingEvent) {
                events.emit(gui.InputMethodEditor.signalCompositionStart, {data: ""});
            }
        }

        /**
         * @param {!CompositionEvent} e
         */
        function compositionEnd(e) {
            addCompositionData(e.data);
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

        this.destroy = function(callback) {
            eventManager.unsubscribe('compositionstart', compositionStart);
            eventManager.unsubscribe('compositionend', compositionEnd);
            eventManager.unsubscribe('keypress', flushEvent);
            async.destroyAll(cleanup, callback);
        };

        function init() {
            eventManager.subscribe('compositionstart', compositionStart);
            eventManager.subscribe('compositionend', compositionEnd);
            eventManager.subscribe('keypress', flushEvent);

            filters.push(new DetectSafariCompositionError(eventManager, addCompositionData));
            filters.push(new DetectChromeLinuxCompositionError(eventManager, addCompositionData));
            cleanup = filters.map(function(filter) { return filter.destroy; });

            eventTrap.setAttribute("contenteditable", "true");
            // Negative tab index still allows focus, but removes accessibility by keyboard
            eventTrap.setAttribute("tabindex", -1);
            processUpdates = new core.ScheduledTask(resetWindowSelection, 1);
            cleanup.push(processUpdates.destroy);
        }

        init();
    };

    /**
     * @const
     * @type {!string}
     */
    gui.InputMethodEditor.signalCompositionStart = "input/compositionstart";

    /**
     * @const
     * @type {!string}
     */
    gui.InputMethodEditor.signalCompositionEnd = "input/compositionend";

    return gui.InputMethodEditor;
}());
