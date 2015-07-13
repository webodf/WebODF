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

/*global gui,ops,core,runtime*/

(function() {
"use strict";

var/**
    * Base for generating unique state ids
    * @type {!number}
    */
    stateIdBase = 0;

/**
 * Id for a document state in the Undo/Redo history
 * @constructor
 * @param {!number=} mainId
 * @param {!number=} subId
 */
function StateId(mainId, subId) {
    /**@type{!number}*/
    this.mainId = mainId !== undefined ? mainId : -1;

    /**@type{!number}*/
    this.subId = subId !== undefined ? subId : -1;
}

/**
 * Contains all operations done between two document states
 * in the Undo/Redo history.
 * Possible TODO: create a context for sharing the undoRules,
 * instead of passing them to all StateTransition instances
 * @constructor
 * @param {gui.UndoStateRules=} undoRules
 * @param {!Array.<!ops.Operation>=} initialOps
 * @param {!boolean=} editOpsPossible  Set to @true if the initialOps could contain edit ops.
 */
function StateTransition(undoRules, initialOps, editOpsPossible) {
    var /**@type{!number}*/
        nextStateId,
        /**@type{!Array.<!ops.Operation>}*/
        operations,
        /**@type{!number}*/
        editOpsCount;

    /**
     * @param {!ops.Operation} op
     * @return {undefined}
     */
    this.addOperation = function (op) {
        if (undoRules.isEditOperation(op)) {
            editOpsCount += 1;
        }
        operations.push(op);
    };

    /**
     * @param {!StateId} stateId
     * @return {!boolean}
     */
    this.isNextStateId = function (stateId) {
        return (stateId.mainId === nextStateId) && (stateId.subId === editOpsCount);
    };

    /**
     * @return {!StateId}
     */
    this.getNextStateId = function () {
        return new StateId(nextStateId, editOpsCount);
    };

    /**
     * @return {!Array.<!ops.Operation>}
     */
    this.getOperations = function () {
        return operations;
    };

    /**
     * @param {!number} count
     * @param {!ops.Operation} op
     * @return {!number}
     */
    function addEditOpsCount(count, op) {
        return count + (undoRules.isEditOperation(op) ? 1 : 0);
    }

    function init() {
        stateIdBase += 1;
        nextStateId = stateIdBase;

        operations = initialOps || [];

        editOpsCount = (initialOps && editOpsPossible) ? initialOps.reduce(addEditOpsCount, 0) : 0;
    }
    init();
}

/**
 * @param {gui.UndoStateRules=} defaultRules
 * @constructor
 * @implements gui.UndoManager
 */
gui.TrivialUndoManager = function TrivialUndoManager(defaultRules) {
    var self = this,
        cursorns = 'urn:webodf:names:cursor',
        domUtils = core.DomUtils,
        /**@type{?Element}*/
        initialDoc,
        /**@type{!StateTransition}*/
        initialStateTransition,
        playFunc,
        /**@type{!ops.Document}*/
        document,
        /**@type {!StateId}*/
        unmodifiedStateId,
        /**@type{!StateTransition}*/
        currentUndoStateTransition,
        /**@type{!Array.<!StateTransition>}*/
        undoStateTransitions = [],
        /**@type{!Array.<!StateTransition>}*/
        redoStateTransitions = [],
        eventNotifier = new core.EventNotifier([
            gui.UndoManager.signalUndoStackChanged,
            gui.UndoManager.signalUndoStateCreated,
            gui.UndoManager.signalUndoStateModified,
            gui.UndoManager.signalDocumentModifiedChanged,
            gui.TrivialUndoManager.signalDocumentRootReplaced
        ]),
        undoRules = defaultRules || new gui.UndoStateRules(),
        isExecutingOps = false;

    /**
     * @return {!boolean}
     */
    function isModified() {
        return currentUndoStateTransition.isNextStateId(unmodifiedStateId) !== true;
    }

    /**
     * Execute all operations in the supplied state transition
     * @param {!StateTransition} stateTransition
     * @return {undefined}
     */
    function executeOperations(stateTransition) {
        var operations = stateTransition.getOperations();

        if (operations.length > 0) {
            isExecutingOps = true; // Used to ignore operations received whilst performing an undo or redo
            playFunc(operations);
            isExecutingOps = false;
        }
    }

    function emitStackChange() {
        eventNotifier.emit(gui.UndoManager.signalUndoStackChanged, {
            undoAvailable: self.hasUndoStates(),
            redoAvailable: self.hasRedoStates()
        });
    }

    /**
     * @param {!boolean} oldModified
     * @return {undefined}
     */
    function emitDocumentModifiedChange(oldModified) {
        var newModified = isModified();
        if (oldModified !== newModified) {
            eventNotifier.emit(gui.UndoManager.signalDocumentModifiedChanged, newModified);
        }
    }

    /**
     * @return {!StateTransition}
     */
    function mostRecentUndoStateTransition() {
        return undoStateTransitions[undoStateTransitions.length - 1];
    }

    /**
     * Pushes the currentUndoStateTransition into the undoStateTransitions if necessary
     */
    function completeCurrentUndoState() {
        if (currentUndoStateTransition !== initialStateTransition // Initial state should never be in the undo stack
                && currentUndoStateTransition !== mostRecentUndoStateTransition()) {
            // undoStateTransitions may already contain the current undo state if the user
            // has moved backwards and then forwards in the undo stack
            undoStateTransitions.push(currentUndoStateTransition);
        }
    }

    /**
     * @param {!Node} node
     */
    function removeNode(node) {
        var sibling = node.previousSibling || node.nextSibling;
        node.parentNode.removeChild(node);
        domUtils.normalizeTextNodes(sibling);
    }

    /**
     * @param {!Element} root
     */
    function removeCursors(root) {
        domUtils.getElementsByTagNameNS(root, cursorns, "cursor").forEach(removeNode);
        domUtils.getElementsByTagNameNS(root, cursorns, "anchor").forEach(removeNode);
    }

    /**
     * Converts an object hash into an unordered array of its values
     * @param {!Object} obj
     * @return {!Array.<Object>}
     */
    function values(obj) {
        return Object.keys(obj).map(function (key) { return obj[key]; });
    }

    /**
     * Reduce the provided undo states to just unique AddCursor followed by
     * MoveCursor commands for each still-present cursor. This is used when
     * restoring the original document state at the start of an undo step
     * @param {!Array.<!StateTransition>} undoStateTransitions
     * @return {!StateTransition}
     */
    function extractCursorStates(undoStateTransitions) {
        var addCursor = {},
            moveCursor = {},
            requiredAddOps = {},
            remainingAddOps,
            ops,
            stateTransition = undoStateTransitions.pop();

        document.getMemberIds().forEach(function (memberid) {
            requiredAddOps[memberid] = true;
        });
        remainingAddOps = Object.keys(requiredAddOps).length;

        // Every cursor that is visible on the document will need to be restored
        // Only need the *last* move or add operation for each visible cursor, as the length & position
        // are absolute
        /**
         * @param {!ops.Operation} op
         */
        function processOp(op) {
            var spec = op.spec();
            if (!requiredAddOps[spec.memberid]) {
                return;
            }
            switch (spec.optype) {
            case "AddCursor":
                if (!addCursor[spec.memberid]) {
                    addCursor[spec.memberid] = op;
                    delete requiredAddOps[spec.memberid];
                    remainingAddOps -= 1;
                }
                break;
            case "MoveCursor":
                if (!moveCursor[spec.memberid]) {
                    moveCursor[spec.memberid] = op;
                }
                break;
            }
        }

        while (stateTransition && remainingAddOps > 0) {
            ops = stateTransition.getOperations();
            ops.reverse(); // Want the LAST move/add operation seen
            ops.forEach(processOp);
            stateTransition = undoStateTransitions.pop();
        }

        return new StateTransition(undoRules, values(addCursor).concat(values(moveCursor)));
    }

    /**
     * Subscribe to events related to the undo manager
     * @param {!string} signal
     * @param {!Function} callback
     */
    this.subscribe = function (signal, callback) {
        eventNotifier.subscribe(signal, callback);
    };

    /**
     * Unsubscribe to events related to the undo manager
     * @param {!string} signal
     * @param {!Function} callback
     */
    this.unsubscribe = function (signal, callback) {
        eventNotifier.unsubscribe(signal, callback);
    };


    /**
     * @return {!boolean}
     */
    this.isDocumentModified = isModified;

    /**
     * @param {!boolean} modified
     * @return {undefined}
     */
    this.setDocumentModified = function(modified) {
        // current state is already matching the new state?
        if (isModified() === modified) {
            return;
        }

        if (modified) {
            // set to invalid state
            unmodifiedStateId = new StateId();
        } else {
            unmodifiedStateId = currentUndoStateTransition.getNextStateId();
        }

        eventNotifier.emit(gui.UndoManager.signalDocumentModifiedChanged, modified);
    };

    /**
     * Returns true if there are one or more undo states available
     * @return {boolean}
     */
    this.hasUndoStates = function () {
        return undoStateTransitions.length > 0;
    };

    /**
     * Returns true if there are one or more redo states available
     * @return {boolean}
     */
    this.hasRedoStates = function () {
        return redoStateTransitions.length > 0;
    };

    /**
     * Set the OdtDocument to operate on
     * @param {!ops.Document} newDocument
     */
    this.setDocument = function (newDocument) {
        document = newDocument;
    };

    /**
     * @inheritDoc
     */
    this.purgeInitialState = function () {
        var oldModified = isModified();

        undoStateTransitions.length = 0;
        redoStateTransitions.length = 0;
        currentUndoStateTransition = initialStateTransition = new StateTransition(undoRules);
        unmodifiedStateId = currentUndoStateTransition.getNextStateId();
        initialDoc = null;
        emitStackChange();
        emitDocumentModifiedChange(oldModified);
    };

    function setInitialState() {
        var oldModified = isModified();

        initialDoc = document.cloneDocumentElement();
        // The current state may contain cursors if the initial state is modified whilst the document is in edit mode.
        // To prevent this issue, immediately purge all cursor nodes after cloning
        removeCursors(initialDoc);
        completeCurrentUndoState();
        // We just threw away the cursors in the snapshot, so need to recover all these operations so the
        // cursor can be re-inserted when an undo is performed
        // TODO the last move state may not reflect a valid position in the document!!!
        // E.g., add cursor, move to end, delete all content + saveInitialState
        currentUndoStateTransition = initialStateTransition = extractCursorStates([initialStateTransition].concat(undoStateTransitions));
        undoStateTransitions.length = 0;
        redoStateTransitions.length = 0;
        // update unmodifiedStateId if needed
        if (!oldModified) {
            unmodifiedStateId = currentUndoStateTransition.getNextStateId();
        }
        emitStackChange();
        emitDocumentModifiedChange(oldModified);
    }

    /**
     * @inheritDoc
     */
    this.setInitialState = setInitialState;

    /**
     * @inheritDoc
     */
    this.initialize = function () {
        if (!initialDoc) {
            setInitialState();
        }
    };

    /**
     * Sets the playback function to use to re-execute operations from the undo stack.
     * @param {!function(!Array.<!ops.Operation>)} playback_func
     */
    this.setPlaybackFunction = function (playback_func) {
        playFunc = playback_func;
    };

    /**
     * Track the execution of an operation, and add it to the available undo states
     * @param {!ops.Operation} op
     * @return {undefined}
     */
    this.onOperationExecuted = function (op) {
        if (isExecutingOps) {
            return; // Ignore new operations generated whilst performing an undo/redo
        }

        var oldModified = isModified();

        // An edit operation is assumed to indicate the end of the initial state. The user can manually
        // reset the initial state later with setInitialState if desired.
        // Additionally, an edit operation received when in the middle of the undo stack should also create a new state,
        // as the current undo state is effectively "sealed" and shouldn't gain additional document modifications.
        if ((undoRules.isEditOperation(op) && (currentUndoStateTransition === initialStateTransition || redoStateTransitions.length > 0))
                || !undoRules.isPartOfOperationSet(op, currentUndoStateTransition.getOperations())) {
            redoStateTransitions.length = 0; // Creating a new undo state should always reset the redo stack
            completeCurrentUndoState();
            currentUndoStateTransition = new StateTransition(undoRules, [op], true);
            // Every undo state *MUST* contain an edit for it to be valid for undo or redo
            undoStateTransitions.push(currentUndoStateTransition);
            eventNotifier.emit(gui.UndoManager.signalUndoStateCreated, { operations: currentUndoStateTransition.getOperations() });
            emitStackChange();
        } else {
            currentUndoStateTransition.addOperation(op);
            eventNotifier.emit(gui.UndoManager.signalUndoStateModified, { operations: currentUndoStateTransition.getOperations() });
        }

        emitDocumentModifiedChange(oldModified);
    };

    /**
     * Move forward the desired number of states. Will stop when the number of
     * states is reached, or no more redo states are available.
     * @param {!number} states
     * @return {!number} Returns the number of states actually moved
     */
    this.moveForward = function (states) {
        var moved = 0,
            oldModified = isModified(),
            redoOperations;

        while (states && redoStateTransitions.length) {
            redoOperations = redoStateTransitions.pop();
            undoStateTransitions.push(redoOperations);
            executeOperations(redoOperations);
            states -= 1;
            moved += 1;
        }

        if (moved) {
            // There is at least one undo stack now available due to the move forward
            // Reset the most recent undo state to receive new (non-edit) commands again
            currentUndoStateTransition = mostRecentUndoStateTransition();
            // Only report the stack has modified if moveForward actually did something
            emitStackChange();
            emitDocumentModifiedChange(oldModified);
        }
        return moved;
    };

    /**
     * Move backward the desired number of states. Will stop when the number of
     * states is reached, or no more undo states are available.
     * @param {!number} states
     * @return {!number} Returns the number of states actually moved
     */
    this.moveBackward = function (states) {
        var moved = 0,
            oldModified = isModified();

        while (states && undoStateTransitions.length) {
            redoStateTransitions.push(undoStateTransitions.pop());
            states -= 1;
            moved += 1;
        }

        if (moved) {
            // Need to reset the odt document cursor list back to nil so new cursors are correctly re-registered
            document.getMemberIds().forEach(function (memberid) {
                if (document.hasCursor(memberid)) {
                    document.removeCursor(memberid);
                }
            });
            // Only do actual work if moveBackward does something to the undo stacks
            document.setDocumentElement(/**@type{!Element}*/(initialDoc.cloneNode(true)));
            eventNotifier.emit(gui.TrivialUndoManager.signalDocumentRootReplaced, { });
            executeOperations(initialStateTransition);
            undoStateTransitions.forEach(executeOperations);

            // On a move back command, new ops should be subsequently
            // evaluated for inclusion in the initial state again. This will
            // collect other cursor movement events and store them.
            // Without this step, an undo will always reset cursor position
            // back to the start of the document
            currentUndoStateTransition = mostRecentUndoStateTransition() || initialStateTransition;
            emitStackChange();
            emitDocumentModifiedChange(oldModified);
        }
        return moved;
    };

    function init() {
        currentUndoStateTransition = initialStateTransition = new StateTransition(undoRules);
        unmodifiedStateId = currentUndoStateTransition.getNextStateId();
    }

    init();
};

/**@const*/ gui.TrivialUndoManager.signalDocumentRootReplaced = "documentRootReplaced";

}());
