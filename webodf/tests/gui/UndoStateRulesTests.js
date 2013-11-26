/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
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
/*global runtime, core, gui, ops*/
runtime.loadClass("ops.OpMoveCursor");
runtime.loadClass("ops.OpInsertText");
runtime.loadClass("ops.OpSplitParagraph");
runtime.loadClass("ops.OpRemoveText");
runtime.loadClass("gui.UndoStateRules");
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

    function create(operation, args) {
        operation.init(args);
        return operation;
    }

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

    function isPartOfOperationSet_TextInsertion_IgnoresCursorMove() {
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

    this.tests = function () {
        return r.name([
            isPartOfOperationSet_NoValidStates,
            isPartOfOperationSet_AvoidsPrecedingNonEditStates,
            isPartOfOperationSet_TextInsertion_Simple,
            isPartOfOperationSet_TextInsertion_Simple2,
            isPartOfOperationSet_TextInsertion_IgnoresCursorMove,
            isPartOfOperationSet_ResetsToLastCursorMove,
            isPartOfOperationSet_TextRemoval_ResetsToDirectionChange,
            isPartOfOperationSet_SeparatesOperationTypes,
            isPartOfOperationSet_SeparatesOperationDirections,
            isPartOfOperationSet_SeparatesOperationDirections_BROKEN
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
(function () {
    "use strict";
    return gui.UndoStateRulesTests;
}());
