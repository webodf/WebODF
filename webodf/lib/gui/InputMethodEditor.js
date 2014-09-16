/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
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

/*global runtime, gui, core, ops, Node, odf*/

(function () {
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
     * @implements {core.Destroyable}
     * @param {!gui.EventManager} eventManager
     */
    function DetectSafariCompositionError(eventManager) {
        var lastCompositionValue,
            suppressedKeyPress = false;

        /**
         * Detect and filter out bad Safari key presses
         * @param {!(Event|KeyboardEvent)} e
         * @return {!boolean}
         */
        function suppressIncorrectKeyPress(e) {
            suppressedKeyPress = e.which && String.fromCharCode(e.which) === lastCompositionValue;
            lastCompositionValue = undefined;
            return suppressedKeyPress === false;
        }

        function clearSuppression() {
            suppressedKeyPress = false;
        }

        /**
         * @param {!CompositionEvent} e
         */
        function trapComposedValue(e) {
            lastCompositionValue = e.data;
            suppressedKeyPress = false;
        }

        function init() {
            eventManager.subscribe("textInput", clearSuppression);
            eventManager.subscribe("compositionend", trapComposedValue);
            eventManager.addFilter("keypress", suppressIncorrectKeyPress);
        }

        /**
         * @param {function(!Error=)} callback
         */
        this.destroy = function (callback) {
            eventManager.unsubscribe("textInput", clearSuppression);
            eventManager.unsubscribe("compositionend", trapComposedValue);
            eventManager.removeFilter("keypress", suppressIncorrectKeyPress);
            callback();
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
     * @implements {core.Destroyable}
     * @param {!string} inputMemberId
     * @param {!gui.EventManager} eventManager
     */
    gui.InputMethodEditor = function InputMethodEditor(inputMemberId, eventManager) {
        var cursorns = "urn:webodf:names:cursor",
            /**@type{ops.OdtCursor}*/
            localCursor = null,
            eventTrap = eventManager.getEventTrap(),
            /**@type{!Document}*/
            doc = /**@type{!Document}*/(eventTrap.ownerDocument),
            /**@type{!Element}*/
            compositionElement,
            /**@type{!core.ScheduledTask}*/
            processUpdates,
            pendingEvent = false,
            /**@type{string}*/
            pendingData = "",
            events = new core.EventNotifier([gui.InputMethodEditor.signalCompositionStart,
                                                gui.InputMethodEditor.signalCompositionEnd]),
            lastCompositionData,
            /**@type{!odf.TextSerializer}*/
            textSerializer,
            filters = [],
            cleanup,
            processingFocusEvent = false;

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
         * Set the local cursor's current composition state. If there is no local cursor,
         * this function will do nothing
         * @param {!boolean} state
         * @return {undefined}
         */
        function setCursorComposing(state) {
            if (localCursor) {
                if (state) {
                    localCursor.getNode().setAttributeNS(cursorns, "composing", "true");
                } else {
                    localCursor.getNode().removeAttributeNS(cursorns, "composing");
                    compositionElement.textContent = "";
                }
            }
        }

        function flushEvent() {
            if (pendingEvent) {
                pendingEvent = false;
                setCursorComposing(false);
                events.emit(gui.InputMethodEditor.signalCompositionEnd, {data: pendingData});
                pendingData = "";
            }
        }

        /**
         * @param {string} data
         */
        function addCompositionData(data) {
            pendingEvent = true;
            pendingData += data;
            // A delay is necessary as modifying document text and moving the cursor will interrupt
            // back-to-back composition sessions (e.g., repeatedly pressing Option+char on MacOS in Chrome)
            processUpdates.trigger();
        }

        /**
         * Synchronize the window's selection to the local user's cursor selection. This only changes whether the
         * selection is a Range or a Caret (i.e., non-collapsed or collapsed). This allows most browsers to properly
         * enable the cut/copy/paste items + shortcut keys.
         * 
         * @return {undefined}
         */
        function synchronizeWindowSelection() {
            if (processingFocusEvent) {
                // Prevent infinite focus-stealing loops. If a focus event was already in progress, do nothing
                // on the second loop
                return;
            }
            processingFocusEvent = true;
            flushEvent();

            // If there is a local cursor, and it is collapsed, collapse the window selection as well.
            // Otherwise, ensure some text is selected by default.
            // A browser selection in an editable area is necessary to allow cut/copy events to fire
            // It doesn't have to be an accurate selection however as the SessionController will override
            // the default browser handling.
            if (localCursor && localCursor.getSelectedRange().collapsed) {
                eventTrap.value = "";
            } else {
                // Content is necessary for cut/copy/paste to be enabled
                // TODO Improve performance by rewriting to not clone the range contents
                eventTrap.value = textSerializer.writeToString(localCursor.getSelectedRange().cloneContents());
            }

            eventTrap.setSelectionRange(0, eventTrap.value.length);
            processingFocusEvent = false;
        }

        /**
         * If the document has focus, queue up a window selection synchronization action to occur. If the document does
         * not have focus, no action is necessary as the window selection will be resynchronized when focus is returned.
         * @return {undefined}
         */
        function handleCursorUpdated() {
            if (eventManager.hasFocus()) {
                processUpdates.trigger();
            }
        }

        function compositionStart() {
            lastCompositionData = undefined;
            // Some IMEs will stack end & start requests back to back.
            // Aggregate these as a group and report them in a single request once all are
            // complete to avoid the selection being reset
            processUpdates.cancel();
            setCursorComposing(true);
            if (!pendingEvent) {
                events.emit(gui.InputMethodEditor.signalCompositionStart, {data: ""});
            }
        }

        /**
         * @param {!CompositionEvent} e
         */
        function compositionEnd(e) {
            lastCompositionData = e.data;
            addCompositionData(e.data);
        }

        /**
         * @param {!Text} e
         */
        function textInput(e) {
            if (e.data !== lastCompositionData) {
                // Chrome/Safari fire a compositionend event with data & a textInput event with data
                // Firefox only fires a compositionend event with data (textInput is not supported)
                // Chrome linux IME fires a compositionend event with no data, and a textInput event with data
                addCompositionData(e.data);
            }
            lastCompositionData = undefined;
        }

        /**
         * Synchronizes the eventTrap's text with
         * the compositionElement's text.
         * @return {undefined}
         */
        function synchronizeCompositionText() {
            compositionElement.textContent = eventTrap.value;
        }

        /**
         * Handle a cursor registration event
         * @param {!ops.OdtCursor} cursor
         * @return {undefined}
         */
        this.registerCursor = function (cursor) {
            if (cursor.getMemberId() === inputMemberId) {
                localCursor = cursor;
                localCursor.getNode().appendChild(compositionElement);
                cursor.subscribe(ops.OdtCursor.signalCursorUpdated, handleCursorUpdated);
                eventManager.subscribe('input', synchronizeCompositionText);
                eventManager.subscribe('compositionupdate', synchronizeCompositionText);
            }
        };

        /**
         * Handle a cursor removal event
         * @param {!string} memberid Member id of the removed cursor
         * @return {undefined}
         */
        this.removeCursor = function (memberid) {
            if (localCursor && memberid ===  inputMemberId) {
                localCursor.getNode().removeChild(compositionElement);
                localCursor.unsubscribe(ops.OdtCursor.signalCursorUpdated, handleCursorUpdated);
                eventManager.unsubscribe('input', synchronizeCompositionText);
                eventManager.unsubscribe('compositionupdate', synchronizeCompositionText);
                localCursor = null;
            }
        };

        /**
         * @param {function(!Error=)} callback
         */
        this.destroy = function (callback) {
            eventManager.unsubscribe('compositionstart', compositionStart);
            eventManager.unsubscribe('compositionend', compositionEnd);
            eventManager.unsubscribe('textInput', textInput);
            eventManager.unsubscribe('keypress', flushEvent);
            eventManager.unsubscribe('focus', synchronizeWindowSelection);

            core.Async.destroyAll(cleanup, callback);
        };

        function init() {
            textSerializer = new odf.TextSerializer();
            textSerializer.filter = new odf.OdfNodeFilter();

            eventManager.subscribe('compositionstart', compositionStart);
            eventManager.subscribe('compositionend', compositionEnd);
            eventManager.subscribe('textInput', textInput);
            eventManager.subscribe('keypress', flushEvent);
            eventManager.subscribe('focus', synchronizeWindowSelection);

            filters.push(new DetectSafariCompositionError(eventManager));
            /**
             * @param {{destroy:function()}} filter
             * return {function()}
             */
            function getDestroy(filter) {
                return filter.destroy;
            }
            cleanup = filters.map(getDestroy);

            // Initialize the composition element
            compositionElement = doc.createElement('span');
            compositionElement.setAttribute('id', 'composer');

            processUpdates = core.Task.createTimeoutTask(synchronizeWindowSelection, 1);
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
}());
