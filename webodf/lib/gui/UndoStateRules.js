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
/*global gui*/

/**
 * This class attempts to implement undo/redo behaviour identical
 * to how LibreOffice behaves.
 *
 * State iteration rules are:
 * - Multiple text inserts in the same direction are treated as one state
 * - Multiple text removes in the same direction are treated as one state
 * - An Undo state always consumes all trailing cursor move operations
 * - An edit operation cannot follow non-edit operations. A state can
 *      start with non-edit operations if it contains no further edit ops.
 * @constructor
 */
gui.UndoStateRules = function UndoStateRules() {
    "use strict";

    function getOpType(op) {
        return op.spec().optype;
    }
    this.getOpType = getOpType;

    function getOpPosition(op) {
        return op.spec().position;
    }

    /**
     * Returns true if the supplied operation
     * is considered an editing operation.
     * @param {ops.Operation} op
     * @returns {boolean} Returns true if the supplied op is an edit operation
     */
    function isEditOperation(op) {
        return op.isEdit;
    }
    this.isEditOperation = isEditOperation;

    /**
     * Returns true if the supplied optype is allowed to
     * aggregate multiple operations in a single undo or redo state
     * @param {!string} optype
     * @returns {boolean}
     */
    function canAggregateOperation(optype) {
        switch (optype) {
            case "RemoveText":
            case "InsertText":
                return true;
            default:
                return false;
        }
    }

    /**
     * Returns true if the newly supplied operation is continuing
     * in the same direction of travel as the recent edit operations
     * @param {!Array.<!ops.Operation>} recentEditOps
     * @param {!ops.Operation} thisOp
     * @returns {boolean}
     */
    function isSameDirectionOfTravel(recentEditOps, thisOp) {
        // Note, the operations in the recent queue are most
        // recent to least recent. As such, the direction order
        // should be thisPos => existing2 => existing1
        var existing1 = getOpPosition(recentEditOps[recentEditOps.length - 2]),
            existing2 = getOpPosition(recentEditOps[recentEditOps.length - 1]),
            thisPos = getOpPosition(thisOp),
            direction = existing2 - existing1;
        // Next, the tricky part... determining the direction of travel
        // Each aggregate operation can have two directions of travel:
        // RemoveText:
        // - delete via backspace - direction will be -1 as cursor moves back
        // - delete via delete key - direction will be 0 as cursor doesn't move
        // InsertText:
        // - prepend text - direction will be 0 as cursor doesn't move
        // - append text - direction will be 1 as cursor moves forward

        return existing2 === thisPos - direction;
    }

    function isContinuousOperation(recentEditOps, thisOp) {
        var optype = getOpType(thisOp);

        if (canAggregateOperation(optype) && optype === getOpType(recentEditOps[0])) {
            // Operation can aggregate, and operation type is identical
            if (recentEditOps.length === 1) {
                return true; // Not enough ops to worry about direction of travel
            }

            if (isSameDirectionOfTravel(recentEditOps, thisOp)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns true if the provided operation is part of the existing
     * set of operations according to the undo rules
     * @param {!ops.Operation} operation
     * @param {!Array.<ops.Operation>} lastOperations
     * @returns {!boolean}
     */
    function isPartOfOperationSet(operation, lastOperations) {
        if (isEditOperation(operation)) {
            if (lastOperations.length === 0) {
                return true; // No edit operations so far, so it must be part of the set
            }
            return isEditOperation(lastOperations[lastOperations.length - 1])
                    && isContinuousOperation(lastOperations.filter(isEditOperation), operation);
        }
        return true;
    }
    this.isPartOfOperationSet = isPartOfOperationSet;
};
