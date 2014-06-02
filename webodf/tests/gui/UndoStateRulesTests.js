/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
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
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
gui.UndoStateRulesTests = function UndoStateRulesTests(runner) {
    "use strict";
    var r = runner,
        t;

    this.setUp = function () {
        t = { rules : new gui.UndoStateRules() };
        core.UnitTest.provideTestAreaDiv();
    };
    this.tearDown = function () {
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };

    /**
     * Initialize an operation with the supplied arguments
     * @param {!ops.Operation} operation
     * @param {?} args
     * @param {string=} group
     * @return {!ops.Operation}
     */
    function create(operation, args, group) {
        operation.init(args);
        if (group) {
            operation.group = group;
        }
        return operation;
    }

    /**
     * Report the index of the latest undo state in the defined array.
     * If there are no available undo states, returns -1.
     *
     * For example, Given [ op1, op2, op3 ], assuming op2 is the start of a new undo state,
     * this function will return 1.
     *
     * Note: non-edit operations starting at the front of the array are gathered into the "initial"
     * state of the document, and cannot be undone.
     *
     * @param {!Array.<!ops.Operation>} undoQueue
     * @return {!number}
     */
    function findLastUndoState(undoQueue) {
        var index = 0,
            undoState = [];

        undoQueue.forEach(function (op) {
            if (!t.rules.isPartOfOperationSet(op, undoState)) {
                index += undoState.length;
                undoState.length = 0;
            }
            undoState.push(op);
        });

        return undoState.some(t.rules.isEditOperation) ? index : -1;
    }

    /**
     * Discard all remaining operations in the array beginning at the specified index (inclusive)
     * @param {!number} fromIndex
     * @return {undefined}
     */
    function discardTrailingOps(fromIndex) {
        t.ops.splice(fromIndex, t.ops.length - fromIndex);
    }

    function isPartOfOperationSet_NoValidStates() {
        t.ops = [
            create(new ops.OpMoveCursor(), {position: 0}),
            create(new ops.OpMoveCursor(), {position: 1}),
            create(new ops.OpMoveCursor(), {position: 2}),
            create(new ops.OpMoveCursor(), {position: 3})
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "-1");
    }

    function isPartOfOperationSet_AvoidsPrecedingNonEditStates() {
        t.ops = [
            create(new ops.OpMoveCursor(), {position: 0}),
            create(new ops.OpInsertText(), {position: 0, text: "a"}),
            create(new ops.OpInsertText(), {position: 1, text: "b"}),
            create(new ops.OpInsertText(), {position: 2, text: "c"}),
            create(new ops.OpInsertText(), {position: 3, text: "d"})
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "1");
        discardTrailingOps(t.previousState);

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "-1");
    }

    function isPartOfOperationSet_TextInsertion_Simple() {
        t.ops = [
            create(new ops.OpInsertText(), {position: 0, text: "a"}),
            create(new ops.OpInsertText(), {position: 1, text: "b"}),
            create(new ops.OpInsertText(), {position: 2, text: "c"}),
            create(new ops.OpInsertText(), {position: 3, text: "d"})
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "0");
    }

    function isPartOfOperationSet_TextInsertion_Simple2() {
        t.ops = [
            create(new ops.OpInsertText(), {position: 0, text: "a"}),
            create(new ops.OpInsertText(), {position: 1, text: "b"}),
            create(new ops.OpMoveCursor(), {position: 0}),
            create(new ops.OpInsertText(), {position: 0, text: "c"}),
            create(new ops.OpInsertText(), {position: 1, text: "d"})
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "3");
        discardTrailingOps(t.previousState);

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "0");
    }

    function isPartOfOperationSet_TextInsertion_DiscontinuousInsertions() {
        t.ops = [
            create(new ops.OpInsertText(), {position: 0, text: "a"}),
            create(new ops.OpInsertText(), {position: 2, text: "b"})
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "1");
        discardTrailingOps(t.previousState);

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "0");
    }

    function isPartOfOperationSet_TextInsertion_TrailingCursorMove_AddsToCurrentUndoState() {
        t.ops = [
            create(new ops.OpInsertText(), {position: 0, text: "a"}),
            create(new ops.OpInsertText(), {position: 1, text: "b"}),
            create(new ops.OpInsertText(), {position: 2, text: "c"}),
            create(new ops.OpInsertText(), {position: 3, text: "d"}),
            create(new ops.OpMoveCursor(), {position: 3}),
            create(new ops.OpMoveCursor(), {position: 2})
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "0");
    }

    function isPartOfOperationSet_TextInsertion_InterleavedCursorMove_AddsToCurrentUndoState() {
        t.ops = [
            create(new ops.OpInsertText(), {position: 0, text: "a"}),
            create(new ops.OpMoveCursor(), {position: 3}),
            create(new ops.OpInsertText(), {position: 1, text: "b"}),
            create(new ops.OpInsertText(), {position: 2, text: "c"}),
            create(new ops.OpInsertText(), {position: 3, text: "d"}),
            create(new ops.OpMoveCursor(), {position: 2})
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "0");
    }

    function isPartOfOperationSet_ResetsToLastCursorMove() {
        t.ops = [
            create(new ops.OpInsertText(), {position: 0, text: "abcdef"}),
            create(new ops.OpMoveCursor(), {position: 5}),
            create(new ops.OpMoveCursor(), {position: 4}),
            create(new ops.OpMoveCursor(), {position: 3}),
            create(new ops.OpSplitParagraph(), {position: 3})
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "4");
        discardTrailingOps(t.previousState);

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "0");
    }

    function isPartOfOperationSet_TextRemoval_ResetsToDirectionChange() {
        t.ops = [
            create(new ops.OpInsertText(), {position: 0, text: "abcdef"}),
            create(new ops.OpMoveCursor(), {position: 5}),
            create(new ops.OpMoveCursor(), {position: 4}),
            create(new ops.OpMoveCursor(), {position: 3}),
            create(new ops.OpRemoveText(), {position: 2, length: 1}),
            create(new ops.OpRemoveText(), {position: 1, length: 1}),
            create(new ops.OpMoveCursor(), {position: 0})
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "4");
        discardTrailingOps(t.previousState);

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "0");
    }

    function isPartOfOperationSet_SeparatesOperationTypes() {
        t.ops = [
            create(new ops.OpInsertText(), {position: 0, text: "a"}),
            create(new ops.OpInsertText(), {position: 1, text: "b"}),
            create(new ops.OpInsertText(), {position: 2, text: "c"}),
            create(new ops.OpInsertText(), {position: 3, text: "d"}),
            create(new ops.OpSplitParagraph(), {position: 4}),
            create(new ops.OpRemoveText(), {position: 4, length: 1}), // Delete paragraph
            create(new ops.OpRemoveText(), {position: 3, length: 1}), // Delete d
            create(new ops.OpRemoveText(), {position: 2, length: 1}) // Delete c
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "5");
        discardTrailingOps(t.previousState);

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "4");
        discardTrailingOps(t.previousState);

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "0");
    }

    function isPartOfOperationSet_SeparatesOperationDirections() {
        t.ops = [
            create(new ops.OpInsertText(), {position: 0, text: "abcde"}),
            create(new ops.OpRemoveText(), {position: 3, length: 1}), // Delete d
            create(new ops.OpRemoveText(), {position: 3, length: 1}), // Delete e
            create(new ops.OpRemoveText(), {position: 0, length: 1}), // Delete a
            create(new ops.OpRemoveText(), {position: 0, length: 1}) // Delete b
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "3");
        discardTrailingOps(t.previousState);

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "1");
        discardTrailingOps(t.previousState);

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "0");
    }

    function isPartOfOperationSet_SeparatesOperationDirections_BROKEN() {
        t.ops = [
            create(new ops.OpInsertText(), {position: 0, text: "abcde"}),
            create(new ops.OpRemoveText(), {position: 3, length: 1}), // Delete d
            create(new ops.OpRemoveText(), {position: 2, length: 1}), // Backspace c
            create(new ops.OpRemoveText(), {position: 1, length: 1}), // Backspace b
            create(new ops.OpRemoveText(), {position: 0, length: 1}) // Backspace a
        ];

        // As OpRemoveText has no indication about whether cursor travelled forwards
        // or backwards, it is ambiguous if the user deletes a char and
        // then backspaces a char, as the cursor is travelling in the same direction
        // across the two operations, but different keys were pressed to obtain it.
        t.previousState = findLastUndoState(t.ops);
        // For our pretend user, they would actually expect t.previousState === 2, as
        // that is when they switched from deleting to backspacing
        r.shouldBe(t, "t.previousState", "1");
        discardTrailingOps(t.previousState);

        t.previousState = findLastUndoState(t.ops);
        // Should then be 1
        r.shouldBe(t, "t.previousState", "0");
        discardTrailingOps(t.previousState);

        t.previousState = findLastUndoState(t.ops);
        // Finally should then be 0
        r.shouldBe(t, "t.previousState", "-1");
    }

    function isPartOfOperationSet_GroupedOperations_KeepsGroupsTogether() {
        t.ops = [
            create(new ops.OpInsertText(), {position: 0, text: "abcde"}, "g1"),
            create(new ops.OpRemoveText(), {position: 3, length: 1}, "g1"), // Delete d
            create(new ops.OpRemoveText(), {position: 1, length: 1}, "g2"), // Delete b
            create(new ops.OpRemoveText(), {position: 0, length: 1}, "g2"), // Delete a
            create(new ops.OpRemoveText(), {position: 0, length: 1}, "g2") // Delete c
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "2");
        discardTrailingOps(t.previousState);

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "0");
    }

    function isPartOfOperationSet_GroupedOperations_TextInsertAndStyle_AllowsContinuation() {
        t.ops = [
            create(new ops.OpInsertText(), {position: 0, text: "a"}, "g1"),
            create(new ops.OpApplyDirectStyling(), {position: 0, length: 1}, "g1"),
            create(new ops.OpInsertText(), {position: 1, text: "b"}, "g2"),
            create(new ops.OpInsertText(), {position: 1, text: "c"}, "g3")
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "3");
        discardTrailingOps(t.previousState);

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "0");
    }

    function isPartOfOperationSet_GroupedOperations_GroupedInserts_CreatesMultipleUndoStates() {
        t.ops = [
            create(new ops.OpInsertText(), {position: 0, text: "a"}, "g1"),
            create(new ops.OpInsertText(), {position: 2, text: "b"}, "g1"),
            create(new ops.OpInsertText(), {position: 1, text: "b"}, "g2")
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "2");
        discardTrailingOps(t.previousState);

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "0");
    }

    function isPartOfOperationSet_GroupedOperations_AdjacentGroups_AllowsContinuation() {
        t.ops = [
            create(new ops.OpInsertText(), {position: 0, text: "a"}, "g1"),
            create(new ops.OpApplyDirectStyling(), {position: 0, length: 1}, "g1"),
            create(new ops.OpInsertText(), {position: 1, text: "b"}, "g2"),
            create(new ops.OpApplyDirectStyling(), {position: 1, length: 1}, "g2"),
            create(new ops.OpInsertText(), {position: 2, text: "c"}, "g3"),
            create(new ops.OpApplyDirectStyling(), {position: 2, length: 1}, "g3"),
            create(new ops.OpInsertText(), {position: 3, text: "e"}, "g4")
        ];

        t.previousState = findLastUndoState(t.ops);
        r.shouldBe(t, "t.previousState", "0");
    }

    this.tests = function () {
        return r.name([
            isPartOfOperationSet_NoValidStates,
            isPartOfOperationSet_AvoidsPrecedingNonEditStates,
            isPartOfOperationSet_TextInsertion_Simple,
            isPartOfOperationSet_TextInsertion_Simple2,
            isPartOfOperationSet_TextInsertion_DiscontinuousInsertions,
            isPartOfOperationSet_TextInsertion_TrailingCursorMove_AddsToCurrentUndoState,
            isPartOfOperationSet_TextInsertion_InterleavedCursorMove_AddsToCurrentUndoState,
            isPartOfOperationSet_ResetsToLastCursorMove,
            isPartOfOperationSet_TextRemoval_ResetsToDirectionChange,
            isPartOfOperationSet_SeparatesOperationTypes,
            isPartOfOperationSet_SeparatesOperationDirections,
            isPartOfOperationSet_SeparatesOperationDirections_BROKEN,

            isPartOfOperationSet_GroupedOperations_KeepsGroupsTogether,
            isPartOfOperationSet_GroupedOperations_TextInsertAndStyle_AllowsContinuation,
            isPartOfOperationSet_GroupedOperations_GroupedInserts_CreatesMultipleUndoStates,
            isPartOfOperationSet_GroupedOperations_AdjacentGroups_AllowsContinuation
        ]);
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
gui.UndoStateRulesTests.prototype.description = function () {
    "use strict";
    return "Test the UndoStateRules class.";
};
