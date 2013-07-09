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
runtime.loadClass("gui.UndoStateRules");

/**
 *
 * @constructor
 * @implements gui.UndoManager
 */
gui.TrivialUndoManager = function TrivialUndoManager() {
    "use strict";

    var self = this,
        initialDoc,
        initialState,
        playFunc,
        odtDocument,
        currentUndoState = [],
        /**@type {!Array.<Array.<!ops.Operation>>}*/undoStates = [],
        /**@type {!Array.<Array.<!ops.Operation>>}*/redoStates = [],
        eventNotifier = new core.EventNotifier([gui.UndoManager.signalUndoStackChanged]),
        undoRules = new gui.UndoStateRules();

    function emitStackChange() {
        eventNotifier.emit(gui.UndoManager.signalUndoStackChanged, {
            undoAvailable: self.hasUndoStates(),
            redoAvailable: self.hasRedoStates()
        });
    }

    function mostRecentUndoState() {
        return undoStates[undoStates.length - 1];
    }

    /**
     * Pushes the currentUndoState into the undoStates if necessary
     */
    function completeCurrentUndoState() {
        if (currentUndoState !== initialState // Initial state should never be in the undo stack
            && currentUndoState !== mostRecentUndoState()) {
            // undoStates may already contain the current undo state if the user
            // has moved backwards and then forwards in time
            undoStates.push(currentUndoState);
        }
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
        return undoStates.length > 0;
    };

    /**
     * Returns true if there are one or more redo states available
     * @return {boolean}
     */
    this.hasRedoStates = function() {
        return redoStates.length > 0;
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
        undoStates.length = 0;
        redoStates.length = 0;
        initialState.length = 0;
        currentUndoState.length = 0;
        initialDoc = null;
        emitStackChange();
    };

    /**
     * Sets the initial document state and operation state. This is the earliest point
     * in time the document can be rewound to.
     */
    this.saveInitialState = function() {
        var odfContainer = odtDocument.getOdfCanvas().odfContainer();
        initialDoc = odfContainer.rootElement.cloneNode(true);
        // Want to catch any initial cursor add operations that are part of initial document setup.
        // These will not be restored when the DOM is reset on undo, and should
        // not be able to be undone
        initialState = [];
        completeCurrentUndoState();
        undoStates.forEach(function(state) {
            initialState = initialState.concat(state);
        });
        currentUndoState = initialState;
        undoStates.length = 0;
        redoStates.length = 0;
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
        redoStates.length = 0;
        // An edit operation will signal the end of the initial state usually.
        // If this isn't the case, saveInitialState will reassemble these fragment states
        // anyways.
        if ((undoRules.isEditOperation(op) && currentUndoState === initialState)
                || !undoRules.isPartOfOperationSet(op, currentUndoState)) {
            completeCurrentUndoState();
            currentUndoState = [op];
            // Every undo state *MUST* contain an edit for it to be valid for undo or redo
            undoStates.push(currentUndoState);
            emitStackChange();
        } else {
            currentUndoState.push(op);
        }
    };

    /**
     * Move forward the desired number of states. Will stop when the number of
     * states is reached, or no more redo states are available.
     * @param {!number} states
     * @return {!number} Returns the number of states actually moved
     */
    this.moveForward = function(states) {
        var moved = 0,
            redoOperations;
        while (states && redoStates.length) {
            redoOperations = redoStates.pop();
            undoStates.push(redoOperations);
            redoOperations.forEach(playFunc);
            states -= 1;
            moved += 1;
        }

        if (moved) {
            // There is at least one undo stack now available due to the move forward
            // Reset the most recent undo state to receive new (non-edit) commands again
            currentUndoState = mostRecentUndoState();
            // Only report the stack has modified if moveForward actually did something
            emitStackChange();
        }
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

        while (states && undoStates.length) {
            redoStates.push(undoStates.pop());
            states -= 1;
            moved += 1;
        }

        if (moved) {
            // Only do actual work if moveBackward does something to the undo stacks
            // TODO Replace with a neater hack for reloading the Odt tree
            odfContainer.setRootElement(initialDoc.cloneNode(true));
            odfCanvas.setOdfContainer(odfContainer, true);
            // Need to reset the odt document cursor list back to nil so new cursors are correctly re-registered
            odtDocument.getCursors().forEach(function (cursor) {
                odtDocument.removeCursor(cursor.getMemberId());
            });
            initialState.forEach(playFunc);
            undoStates.forEach(function (ops) { ops.forEach(playFunc); });
            odfCanvas.refreshCSS();

            // On a move back command, new ops should be subsequently
            // evaluated for inclusion in the initial state again. This will
            // collect other cursor movement events and store them.
            // Without this step, an undo will always reset cursor position
            // back to the start of the document
            currentUndoState = mostRecentUndoState() || initialState;
            emitStackChange();
        }
        return moved;
    };
};

