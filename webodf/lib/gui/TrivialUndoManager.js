/**
 * @license
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
/*global gui,ops,core,runtime*/

runtime.loadClass("gui.UndoManager");

/**
 *
 * @constructor
 * @implements gui.UndoManager
 */
gui.TrivialUndoManager = function TrivialUndoManager() {
    "use strict";

    var initialState,
        initialStack,
        playFunc,
        odtDocument,
        undoStack = [],
        redoStack = [],
        eventNotifier = new core.EventNotifier([gui.UndoManager.signalUndoStackChanged]);

    function emitStackChange() {
        eventNotifier.emit(gui.UndoManager.signalUndoStackChanged, {
            undoAvailable: undoStack.length > 0,
            redoAvailable: redoStack.length > 0
        });
    }

    /**
     * Subscribe to events related to the undo manager
     * @param {!string} signal
     * @param {!function(*)} callback
     */
    this.subscribe = function(signal, callback) {
        eventNotifier.subscribe(signal, callback);
    };

    /**
     * Unsubscribe to events related to the undo manager
     * @param {!string} signal
     * @param {!function(*)} callback
     */
    this.unsubscribe = function(signal, callback) {
        eventNotifier.unsubscribe(signal, callback);
    };

    /**
     * Returns true if there are one or more undo states available
     * @return {boolean}
     */
    this.hasUndoStates = function() {
        return undoStack.length > 0;
    };

    /**
     * Returns true if there are one or more redo states available
     * @return {boolean}
     */
    this.hasRedoStates = function() {
        return redoStack.length > 0;
    };

    /**
     * Set the OdtDocument to operate on
     * @param newDocument
     */
    this.setOdtDocument = function(newDocument) {
        odtDocument = newDocument;
    };

    /**
     * Resets the initial document state and operation state, including clearing
     * all undo and redo stacks
     */
    this.resetInitialState = function() {
        undoStack.length = 0;
        redoStack.length = 0;
        initialStack.length = 0;
        initialState = null;
        emitStackChange();
    };

    /**
     * Sets the initial document state and operation state. This is the earliest point
     * in time the document can be rewound to.
     */
    this.saveInitialState = function() {
        var odfContainer = odtDocument.getOdfCanvas().odfContainer();
        // Want to catch any initial cursor add operations that are part of initial document setup.
        // These will not be restored when the DOM is reset on undo
        initialStack = undoStack.slice(0);
        undoStack.length = 0;
        redoStack.length = 0;
        initialState = odfContainer.rootElement.cloneNode(true);
        emitStackChange();
    };

    /**
     * Sets the playback function to use to re-execute operations from the undo stack.
     * This should *not* report these operations back to the undo manager as being executed.
     * @param {!function(!ops.Operation)} playback_func
     */
    this.setPlaybackFunction = function(playback_func) {
        playFunc = playback_func;
    };

    /**
     * Track the execution of an operation, and add it to the available undo states
     * @param {!ops.Operation} op
     * @return {undefined}
     */
    this.onOperationExecuted = function(op) {
        if (redoStack.length) {
            redoStack.length = 0;
        }
        undoStack.push(op);
        emitStackChange();
    };

    /**
     * Move forward the desired number of states. Will stop when the number of
     * states is reached, or no more redo states are available.
     * @param {!number} states
     * @return {!number} Returns the number of states actually moved
     */
    this.moveForward = function(states) {
        var op,
            moved = 0;
        while (states && redoStack.length) {
            op = redoStack.pop();
            playFunc(op);
            undoStack.push(op);
            states -= 1;
            moved += 1;
        }

        emitStackChange();
        return moved;
    };

    /**
     * Move backward the desired number of states. Will stop when the number of
     * states is reached, or no more undo states are available.
     * @param {!number} states
     * @return {!number} Returns the number of states actually moved
     */
    this.moveBackward = function(states) {
        var odfCanvas = odtDocument.getOdfCanvas(),
            odfContainer = odfCanvas.odfContainer(),
            moved = 0;
        while (states && undoStack.length) {
            redoStack.push(undoStack.pop());
            states -= 1;
            moved += 1;
        }

        // TODO Replace with a neater hack for reloading the Odt tree
        odfContainer.setRootElement(initialState.cloneNode(true));
        odfCanvas.setOdfContainer(odfContainer, true);
        // Need to reset the odt document cursor list back to nil so new cursors are correctly re-registered
        odtDocument.getCursors().forEach(function (cursor) {
            odtDocument.removeCursor(cursor.getMemberId());
        });
        initialStack.forEach(playFunc);
        undoStack.forEach(playFunc);
        odfCanvas.refreshCSS();

        emitStackChange();
        return moved;
    };
};

