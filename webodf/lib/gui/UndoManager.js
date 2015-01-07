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

/*global ops, gui*/
/*jslint emptyblock: true, unparam: true*/

/**
 * @interface
 */
gui.UndoManager = function UndoManager() {"use strict"; };

/**
 * Subscribe to events related to the undo manager
 * @param {!string} signal
 * @param {!Function} callback
 */
gui.UndoManager.prototype.subscribe = function(signal, callback) {"use strict"; };

/**
 * Unsubscribe to events related to the undo manager
 * @param {!string} signal
 * @param {!Function} callback
 */
gui.UndoManager.prototype.unsubscribe = function(signal, callback) {"use strict"; };

/**
 * Set the Document to operate on
 * @param {!ops.Document} newDocument
 */
gui.UndoManager.prototype.setDocument = function (newDocument) {"use strict"; };

/**
 * Sets the initial document state and operation state. This is the earliest point
 * the document can be undone to.
 */
gui.UndoManager.prototype.setInitialState = function () {"use strict"; };

/**
 * Initializes the undo manager and creates the initial document
 * snapshot. If the undo manager has already been previously initialized,
 * this call will do nothing.
 */
gui.UndoManager.prototype.initialize = function () {"use strict"; };

/**
 * Purges entire undo stack including the initial state. This is primarily intended
 * to free up memory and resources when the undo state is no longer required.
 */
gui.UndoManager.prototype.purgeInitialState = function () {"use strict"; };

/**
 * Sets the playback function to use to re-execute operations from the undo stack.
 * @param {!function(!Array.<!ops.Operation>)} playback_func
 */
gui.UndoManager.prototype.setPlaybackFunction = function (playback_func) {"use strict"; };

/**
 * Returns true if there are one or more undo states available
 * @return {boolean}
 */
gui.UndoManager.prototype.hasUndoStates = function () {"use strict"; };

/**
 * Returns true if there are one or more redo states available
 * @return {boolean}
 */
gui.UndoManager.prototype.hasRedoStates = function () {"use strict"; };

/**
 * Move forward the desired number of states. Will stop when the number of
 * states is reached, or no more redo states are available.
 * @param {!number} states
 * @return {!number} Returns the number of states actually moved
 */
gui.UndoManager.prototype.moveForward = function (states) {"use strict"; };

/**
 * Move backward the desired number of states. Will stop when the number of
 * states is reached, or no more undo states are available.
 * @param {!number} states
 * @return {!number} Returns the number of states actually moved
 */
gui.UndoManager.prototype.moveBackward = function (states) {"use strict"; };

/**
 * Track the execution of an operation, and add it to the available undo states
 * @param {!ops.Operation} op
 * @return {undefined}
 */
gui.UndoManager.prototype.onOperationExecuted = function (op) {"use strict"; };

/**
 * Returns if the current state matches the unmodified state.
 * @return {!boolean}
 */
gui.UndoManager.prototype.isDocumentModified = function () {"use strict"; };

/**
 * Sets the current state of the document to be either the unmodified state
 * or a modified state.
 * @param {!boolean} modified
 * @return {undefined}
 */
gui.UndoManager.prototype.setDocumentModified = function(modified) {"use strict"; };

/**@const*/gui.UndoManager.signalUndoStackChanged = "undoStackChanged";
/**@const*/gui.UndoManager.signalUndoStateCreated = "undoStateCreated";
/**@const*/gui.UndoManager.signalUndoStateModified = "undoStateModified";
/**@const*/gui.UndoManager.signalDocumentModifiedChanged = "documentModifiedChanged";
