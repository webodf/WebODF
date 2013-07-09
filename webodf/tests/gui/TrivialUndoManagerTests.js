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
/*global runtime, core, gui, ops*/
runtime.loadClass("ops.OpMoveCursor");
runtime.loadClass("ops.OpInsertText");
runtime.loadClass("ops.OpSplitParagraph");
runtime.loadClass("ops.OpRemoveText");
runtime.loadClass("gui.TrivialUndoManager");
/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
gui.TrivialUndoManagerTests = function TrivialUndoManagerTests(runner) {
    "use strict";
    var r = runner,
        t, testarea;

    /**
     * @param rootElement
     * @constructor
     */
    function AdaptiveMock(rootElement) {
        var self = this;

        function noOp() { }
        function returnThis() { return self; }

        this.rootElement = rootElement;

        this.getOdfCanvas = returnThis;
        this.odfContainer = returnThis;

        this.refreshCSS = noOp;
        this.setRootElement = noOp;
        this.setOdfContainer = noOp;
        this.getCursors = function() { return []; };
    }

    this.setUp = function () {
        testarea = core.UnitTest.provideTestAreaDiv();
        t = {
            manager : new gui.TrivialUndoManager(),
            mock : new AdaptiveMock(testarea),
            ops : []
        };
        t.manager.setOdtDocument(t.mock);
        t.manager.setPlaybackFunction(function (op) {t.ops.push(op.spec().position);});
    };
    this.tearDown = function () {
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };

    function create(operation, args) {
        operation.init(args);
        return operation;
    }

    function hasUndoStates_OnlyMovesBackValidStates() {
        t.manager.saveInitialState();

        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {position: 1}));
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.moveBackward(1)", "0");

        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {position: 3}));
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.moveBackward(1)", "0");

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 4}));
        r.shouldBe(t, "t.manager.hasUndoStates()", "true");
        r.shouldBe(t, "t.manager.moveBackward(1)", "1");

        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.moveBackward(1)", "0");
    }

    function hasRedoStates_OnlyMovesForwardValidStates() {
        t.manager.saveInitialState();

        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {position: 1}));
        r.shouldBe(t, "t.manager.hasRedoStates()", "false");
        r.shouldBe(t, "t.manager.moveForward(1)", "0");

        t.manager.moveBackward(1);
        r.shouldBe(t, "t.manager.hasRedoStates()", "false");
        r.shouldBe(t, "t.manager.moveForward(1)", "0");

        // Create something that can be undone
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 4}));
        t.manager.moveBackward(1);
        r.shouldBe(t, "t.manager.hasRedoStates()", "true");
        r.shouldBe(t, "t.manager.moveForward(1)", "1");

        r.shouldBe(t, "t.manager.hasRedoStates()", "false");
        r.shouldBe(t, "t.manager.moveForward(1)", "0");
    }

    function setInitialState_SavesPriorOps() {
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {position: 1}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 2}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {position: 3}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 4}));

        t.manager.saveInitialState();

        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.hasRedoStates()", "false");

        // Now make something that can be undone
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 5}));
        r.shouldBe(t, "t.manager.hasUndoStates()", "true");

        // And then undo it
        t.manager.moveBackward(1); // Should be back at origin

        r.shouldBe(t, "t.ops", "[1, 2, 3, 4]");
    }

    function resetInitialState_ClearsAllStacks() {
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {position: 1}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 2}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {position: 3}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 4}));

        t.manager.saveInitialState();

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 5}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {position: 6}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 7}));
        t.manager.moveBackward(1);

        // Get to the worst possible state ever
        r.shouldBe(t, "t.manager.hasUndoStates()", "true");
        r.shouldBe(t, "t.manager.hasRedoStates()", "true");

        t.ops = [];
        // Now make something that can be undone
        // And now reset it
        t.manager.resetInitialState();
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.hasRedoStates()", "false");
        r.shouldBe(t, "t.manager.moveBackward(1)", "0");
        r.shouldBe(t, "t.manager.moveForward(1)", "0");

        t.manager.saveInitialState();
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 8}));
        t.manager.moveBackward(1);
        r.shouldBe(t, "t.ops", "[]");
    }

    function moveBackward_MovesBack_InUndoQueue() {
        t.manager.saveInitialState();

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 5}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 10}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 20}));
        t.manager.moveBackward(1);

        r.shouldBe(t, "t.ops", "[5, 10]");
    }

    function moveBackward_NextOperation_ClearsRedo() {
        t.manager.saveInitialState();

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 5}));
        t.manager.moveBackward(1); // Now to 0 undo states available
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.hasRedoStates()", "true");

        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {position: 1}));
        r.shouldBe(t, "t.manager.hasRedoStates()", "false");
        r.shouldBe(t, "t.manager.moveForward(1)", "0");
    }

    function moveBackward_BoundaryCheck_InitialDocumentState() {
        t.manager.saveInitialState();

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 5}));
        t.manager.moveBackward(1); // Now to 0 undo states available
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");

        t.ops = [];
        // Want to ensure the OpMoveCursor is still applied if rewound back to initial state
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {position: 1}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 6}));
        t.manager.moveBackward(1); // Now to 0 undo states available again
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.ops", "[1]");
    }

    function undoState_ConsumesTrailingNonEditOps() {
        t.manager.saveInitialState();

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {position: 5}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {position: 1}));
        t.manager.moveBackward(1); // Now to 0 undo states available
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.hasRedoStates()", "true");
        r.shouldBe(t, "t.ops", "[]");
    }

    this.tests = function () {
        return [
            hasUndoStates_OnlyMovesBackValidStates,
            hasRedoStates_OnlyMovesForwardValidStates,
            setInitialState_SavesPriorOps,
            resetInitialState_ClearsAllStacks,
            moveBackward_MovesBack_InUndoQueue,
            moveBackward_NextOperation_ClearsRedo,
            moveBackward_BoundaryCheck_InitialDocumentState,
            undoState_ConsumesTrailingNonEditOps
        ];
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
gui.TrivialUndoManagerTests.prototype.description = function () {
    "use strict";
    return "Test the TrivialUndoManager class.";
};
(function () {
    "use strict";
    return gui.TrivialUndoManagerTests;
}());
