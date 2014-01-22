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
/*global gui, runtime*/

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

    function getOpPosition(op) {
        return op.spec().position;
    }

    /**
     * Returns true if the supplied operation
     * is considered an editing operation.
     * @param {!ops.Operation} op
     * @returns {!boolean} Returns true if the supplied op is an edit operation
     */
    function isEditOperation(op) {
        return op.isEdit;
    }
    this.isEditOperation = isEditOperation;

    /**
     * Returns true if the supplied optype is allowed to
     * aggregate multiple operations in a single undo or redo state
     * @param {!string} optype
     * @returns {!boolean}
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
     * @param {!ops.Operation} thisOp
     * @param {!Array.<!ops.Operation>} recentEditOps
     * @returns {!boolean}
     */
    function isSameDirectionOfTravel(thisOp, recentEditOps) {
        // Note, the operations in the recent queue are most
        // recent to least recent. As such, the direction order
        // should be thisPos => existing2 => existing1
        var earlierPositionInState = getOpPosition(recentEditOps[recentEditOps.length - 2]),
            lastPositionInState = getOpPosition(recentEditOps[recentEditOps.length - 1]),
            newPosition = getOpPosition(thisOp),
            differenceBetweenStatePositions = lastPositionInState - earlierPositionInState,
            differenceBetweenNewPositionAndState = newPosition - lastPositionInState;
        // Next, the tricky part... determining the direction of travel
        // Each aggregate operation can have two directions of travel:
        // RemoveText:
        // - delete via backspace - direction will be -1 as cursor moves back
        // - delete via delete key - direction will be 0 as cursor doesn't move
        // InsertText:
        // - prepend text - direction will be 0 as cursor doesn't move
        // - append text - direction will be 1 as cursor moves forward

        return differenceBetweenNewPositionAndState === differenceBetweenStatePositions;
    }

    /**
     * Returns true if the two operations are considered adjacent.
     * @param {!ops.Operation} thisOp
     * @param {!ops.Operation} recentEditOp
     * @returns {!boolean}
     */
    function isAdjacentOperation(thisOp, recentEditOp) {
        var positionDifference = getOpPosition(thisOp) - getOpPosition(recentEditOp);
        // RemoveText:
        // - delete via backspace - direction will be -1 as cursor moves back
        // - delete via delete key - direction will be 0 as cursor doesn't move
        // InsertText:
        // - prepend text - direction will be 0 as cursor doesn't move
        // - append text - direction will be 1 as cursor moves forward
        return positionDifference === 0 || Math.abs(positionDifference) === 1;
    }

    /**
     * Returns true if thisOp can be grouped together with the most recent edit operations.
     *
     * For an operation to be considered continuous it must:
     * - Be of a type that supports aggregation (e.g., insert text or remove text)
     * - Be of the same type as the most recent edit operation
     * - Be considered adjacent (and in the same direction as) the most recent edit operation
     *
     * @param {!ops.Operation} thisOp
     * @param {!Array.<!ops.Operation>} recentEditOps
     * @returns {!boolean}
     */
    function isContinuousWithExistingOperation(thisOp, recentEditOps) {
        var thisOpType = getOpType(thisOp),
            lastEditOp = recentEditOps[recentEditOps.length - 1];

        runtime.assert(Boolean(lastEditOp), "No edit operations found in state");
        if (canAggregateOperation(thisOpType) && thisOpType === getOpType(lastEditOp)) {
            // Operation can aggregate, and operation type is identical
            if (recentEditOps.length === 1) {
                // Not enough ops to worry about direction of travel. Just check new op is adjacent to existing op
                return isAdjacentOperation(thisOp, lastEditOp);
            }

            return isSameDirectionOfTravel(thisOp, recentEditOps);
        }
        return false;
    }

    /**
     * Returns true if thisOp can be grouped together with the most recent edit operations group.
     *
     * For an operation to be considered continuous it must:
     * - Be of a type that supports aggregation (e.g., insert text or remove text)
     * - Be continuous with the most recent edit operation of the same type in the most recent operations group
     *   (see isContinuousWithExistingOperation for the definition of "continuous")
     *
     * @param {!ops.Operation} thisOp
     * @param {!Array.<!ops.Operation>} recentEditOps
     * @returns {!boolean}
     */
    function isContinuousWithExistingGroup(thisOp, recentEditOps) {
        var thisOpType = getOpType(thisOp),
            lastEditOp = recentEditOps[recentEditOps.length - 1],
            groupId,
            isContinuous;

        runtime.assert(Boolean(lastEditOp), "No edit operations found in state");
        groupId = lastEditOp.group;
        runtime.assert(groupId !== undefined, "Operation has no group");
        // First check if thisOp supports aggregation
        if (canAggregateOperation(thisOpType)) {
            // There is a defined group. Check if any operation in the group
            // is continuous with the current operation, and return true if this is the case.
            while (lastEditOp && lastEditOp.group === groupId) {
                if (thisOpType === getOpType(lastEditOp)) {
                    // The last edit op that is compatible for aggregation defines whether thisOp is compatible with
                    // the existing edits
                    isContinuous = isContinuousWithExistingOperation(thisOp, recentEditOps);
                    break;
                }
                recentEditOps.pop(); // Remove the non-matching op and see if the next op in the group is continuous
                lastEditOp = recentEditOps[recentEditOps.length - 1];
            }
        }
        // isContinuous will still be undefined if there were no compatibleForAggregation ops in the latest group,
        // hence to turn this into a true/false, comparison to true is necessary
        return isContinuous === true;
    }

    /**
     * Returns true if the provided operation is part of the existing
     * set of operations according to the undo rules
     * @param {!ops.Operation} operation
     * @param {!Array.<!ops.Operation>} lastOperations
     * @returns {!boolean}
     */
    function isPartOfOperationSet(operation, lastOperations) {
        var areOperationsGrouped = operation.group !== undefined, // Expect groups to be consistently used (if in use at all)
            lastOperation,
            lastEditOperations;
        if (!isEditOperation(operation)) {
            // Non-edit operations always get appended to the existing undo state
            // this covers things such as move cursor ops
            return true;
        }
        if (lastOperations.length === 0) {
            // This is the first operation of a pristine state
            return true;
        }
        lastOperation = lastOperations[lastOperations.length - 1];
        if (areOperationsGrouped && operation.group === lastOperation.group) {
            // Operation groups match, so these were queued as a group
            return true;
        }
        lastEditOperations = lastOperations.filter(isEditOperation);
        if (lastEditOperations.length > 0) {
            // The are existing edit operations. Check if the current op can be combined with existing operations
            // E.g., multiple insert text or remove text ops
            if (areOperationsGrouped) {
                return isContinuousWithExistingGroup(operation, lastEditOperations);
            }
            return isContinuousWithExistingOperation(operation, lastEditOperations);
        }
        // The following are all true at this point:
        // - new operation is an edit operation (check 1)
        // - existing undo state has at least one existing operation (check 2)
        // - new operation is not part of most recent operation group (check 3)
        // - new operation is not continuous with the existing edit operations (check 4)
        return false;
    }
    this.isPartOfOperationSet = isPartOfOperationSet;
};
