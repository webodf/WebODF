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
gui.TrivialUndoManagerTests = function TrivialUndoManagerTests(runner) {
    "use strict";
    var t, testarea,
        r = runner,
        member,
        cursor;

        cursor = member = function (id) {
            return { getMemberId: function () { return id; } };
        };

    /**
     * @param rootElement
     * @constructor
     * @implements {ops.Document}
     */
    function AdaptiveMock(rootElement) {
        var self = this;
        /*jslint emptyblock: true*/
        function noOp() { }
        function noOp2() { return true; }
        /*jslint emptyblock: false*/
        function returnThis() { return self; }
        this.rootElement = rootElement;

        this.getCanvas = returnThis;
        this.odfContainer = returnThis;
        this.getAnnotationViewManager = returnThis;
        this.forgetAnnotations = noOp;
        this.refreshAnnotations = noOp;
        this.refreshCSS = noOp;
        this.setRootElement = noOp;
        this.setOdfContainer = noOp;
        this.cursors = [cursor("1")];
        this.members = [member("1")];
        this.getMemberIds = function () {
            return self.members.map(function (member) {
                return member.getMemberId();
            });
        };
        this.hasCursor = function (memberid) {
            var i;
            for (i = 0; i < self.cursors.length; i += 1) {
                if (self.cursors[i].getMemberId() === memberid) {
                    return true;
                }
            }
            return false;
        };
        this.getDocumentElement = function () { return rootElement; };
        this.getRootNode = function () { return rootElement; };
        this.getDOMDocument = function () { return rootElement.ownerDocument; };
        this.cloneDocumentElement = function () { return rootElement; };
        this.setDocumentElement = noOp;
        this.removeCursor = noOp2;
        this.subscribe = noOp;
        this.unsubscribe = noOp;
        this.createRootFilter =  function () {
            return new core.PositionFilterChain();
        };
        this.createPositionIterator = function() {
            throw new Error("Not implemented");
        };
    }

    /**
     * @param {!gui.TrivialUndoManager} undoManager
     * @constructor
     */
    function DocumentModifiedChangeListener(undoManager) {
        var documentModified = null;

        /**
         * @param {!boolean} modified
         * @return {undefined}
         */
        function onDocumentModifiedChanged(modified) {
            documentModified = modified;
        }

        /**
         * @return {?boolean}
         */
        this.getDocumentModified = function() {
            return documentModified;
        };

        // init
        undoManager.subscribe(gui.UndoManager.signalDocumentModifiedChanged, onDocumentModifiedChanged);
    }

    this.setUp = function () {
        testarea = core.UnitTest.provideTestAreaDiv();
        t = {
            manager : new gui.TrivialUndoManager(),
            mock : new AdaptiveMock(testarea),
            ops : []
        };
        t.manager.setDocument(t.mock);
        t.manager.setPlaybackFunction(function (ops) {
            ops.forEach(function (op) {
                t.ops.push(op.spec().timestamp);
            });
        });
    };
    this.tearDown = function () {
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };

    function create(operation, args) {
        args.memberid = args.memberid || 1;
        operation.init(args);
        return operation;
    }

    function hasUndoStates_OnlyMovesBackValidStates() {
        t.manager.initialize();

        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 1}));
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.moveBackward(1)", "0");

        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 3}));
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.moveBackward(1)", "0");

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 4}));
        r.shouldBe(t, "t.manager.hasUndoStates()", "true");
        r.shouldBe(t, "t.manager.moveBackward(1)", "1");

        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.moveBackward(1)", "0");
    }

    function hasRedoStates_OnlyMovesForwardValidStates() {
        t.manager.initialize();

        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 1}));
        r.shouldBe(t, "t.manager.hasRedoStates()", "false");
        r.shouldBe(t, "t.manager.moveForward(1)", "0");

        t.manager.moveBackward(1);
        r.shouldBe(t, "t.manager.hasRedoStates()", "false");
        r.shouldBe(t, "t.manager.moveForward(1)", "0");

        // Create something that can be undone
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 4}));
        t.manager.moveBackward(1);
        r.shouldBe(t, "t.manager.hasRedoStates()", "true");
        r.shouldBe(t, "t.manager.moveForward(1)", "1");

        r.shouldBe(t, "t.manager.hasRedoStates()", "false");
        r.shouldBe(t, "t.manager.moveForward(1)", "0");
    }

    function setInitialState_SavesMostRecentCursorState() {
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 1}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 2}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 3}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 4}));

        t.manager.setInitialState();

        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.hasRedoStates()", "false");

        // Now make something that can be undone
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 5}));
        r.shouldBe(t, "t.manager.hasUndoStates()", "true");

        // And then undo it
        t.manager.moveBackward(1); // Should be back at origin

        r.shouldBe(t, "t.ops", "[3]");
    }

    function setInitialState_AllCursorsMaintainedWhenCalledMultipleTimes() {
        t.mock.members.push(member(2));
        t.mock.cursors.push(cursor(2));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 1, memberid: 1}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 2, memberid: 2}));
        t.manager.setInitialState();

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 3}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 4, memberid: 2}));
        t.manager.setInitialState();
        t.manager.setInitialState();
        t.manager.setInitialState();

        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.hasRedoStates()", "false");

        // Now make something that can be undone
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 5}));
        r.shouldBe(t, "t.manager.hasUndoStates()", "true");

        // And then undo it
        t.manager.moveBackward(1); // Should be back at origin

        // Internally move operations are stored as object keys. This results in independent
        // move operations being ordered unpredictably across implementations (e.g., this failed in qtruntime)
        // As the timestamps are unique, and the order is irrelevant due to these being independent cursors,
        // this can just be sorted to ensure a deterministic order.
        t.ops.sort();
        r.shouldBe(t, "t.ops", "[1,4]");
    }

    function initialize_WhenNotInitialized_SavesInitialState() {
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 1}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 2}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 3}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 4}));

        t.manager.initialize();

        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.hasRedoStates()", "false");

        // Now make something that can be undone
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 5}));
        r.shouldBe(t, "t.manager.hasUndoStates()", "true");

        // And then undo it
        t.manager.moveBackward(1); // Should be back at origin

        r.shouldBe(t, "t.ops", "[3]");
    }

    function initialize_WhenAlreadyInitialized_DoesNothing() {
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 1}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 2}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 3}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 4}));

        t.manager.initialize();

        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.hasRedoStates()", "false");

        // Now make something that can be undone
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 5}));

        // Now re-initialize and ensure nothing else happens
        t.manager.initialize();
        r.shouldBe(t, "t.manager.hasUndoStates()", "true");

        // And then undo it
        t.manager.moveBackward(1); // Should be back at origin

        r.shouldBe(t, "t.ops", "[3]");
    }

    function purgeInitialState_ClearsAllStacks() {
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 1}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 2}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 3}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 4}));

        t.manager.setInitialState();

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 5}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 6}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 7}));
        t.manager.moveBackward(1);

        // Get to the worst possible state ever
        r.shouldBe(t, "t.manager.hasUndoStates()", "true");
        r.shouldBe(t, "t.manager.hasRedoStates()", "true");

        t.ops = [];
        // Now make something that can be undone
        // And now reset it
        t.manager.purgeInitialState();
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.hasRedoStates()", "false");
        r.shouldBe(t, "t.manager.moveBackward(1)", "0");
        r.shouldBe(t, "t.manager.moveForward(1)", "0");

        t.manager.setInitialState();
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 8}));
        t.manager.moveBackward(1);
        r.shouldBe(t, "t.ops", "[]");
    }

    function moveBackward_MovesBack_InUndoQueue() {
        t.manager.initialize();

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 5}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 10}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 20}));
        t.manager.moveBackward(1);

        r.shouldBe(t, "t.ops", "[5, 10]");
    }

    function moveBackward_NextOperationEdit_ClearsRedo() {
        t.manager.initialize();

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 5}));
        t.manager.moveBackward(1); // Now to 0 undo states available
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.hasRedoStates()", "true");

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 1}));
        r.shouldBe(t, "t.manager.hasRedoStates()", "false");
        r.shouldBe(t, "t.manager.moveForward(1)", "0");
    }

    function moveBackward_NextOperationNonEdit_LeavesRedoInTact() {
        t.manager.initialize();

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 5}));
        t.manager.moveBackward(1); // Now to 0 undo states available
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.hasRedoStates()", "true");

        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 1}));
        r.shouldBe(t, "t.manager.hasRedoStates()", "true");
        r.shouldBe(t, "t.manager.moveForward(1)", "1");
    }

    function moveBackward_BoundaryCheck_InitialDocumentState() {
        t.manager.initialize();

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 5}));
        t.manager.moveBackward(1); // Now to 0 undo states available
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");

        t.ops = [];
        // Want to ensure the OpMoveCursor is still applied if rewound back to initial state
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 1}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 6}));
        t.manager.moveBackward(1); // Now to 0 undo states available again
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.ops", "[1]");
    }

    function moveBackward_ResetsMostRecentCursorState_ForVisibleCursors() {
        t.manager.onOperationExecuted(create(new ops.OpAddCursor(), {timestamp: 1, memberid: 1}));
        t.manager.onOperationExecuted(create(new ops.OpAddCursor(), {timestamp: 2, memberid: 2}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 3, memberid: 1}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 4, memberid: 1}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 5, memberid: 1}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 6, memberid: 2}));

        t.mock.members = [member(2)];
        t.mock.cursors = [cursor(2)];
        t.manager.initialize();

        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.hasRedoStates()", "false");

        // Now make something that can be undone
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 8}));
        r.shouldBe(t, "t.manager.hasUndoStates()", "true");

        // And then undo it
        t.manager.moveBackward(1); // Should be back at origin

        r.shouldBe(t, "t.ops", "[2, 6]");
    }

    function undoState_ConsumesTrailingNonEditOps() {
        t.manager.initialize();

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 5}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 1}));
        t.manager.moveBackward(1); // Now to 0 undo states available
        r.shouldBe(t, "t.manager.hasUndoStates()", "false");
        r.shouldBe(t, "t.manager.hasRedoStates()", "true");
        r.shouldBe(t, "t.ops", "[]");
    }

    function documentModified_NonEditOp() {
        t.modifiedChangeListener = new DocumentModifiedChangeListener(t.manager);
        t.manager.initialize();
        r.shouldBe(t, "t.manager.isDocumentModified()", "false");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "null");

        t.manager.onOperationExecuted(create(new ops.OpAddCursor(), {timestamp: 1, memberid: 1}));
        r.shouldBe(t, "t.manager.isDocumentModified()", "false");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "null");
        t.manager.moveBackward(1); // back to initial state which was false
        r.shouldBe(t, "t.manager.isDocumentModified()", "false");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "null");
    }

    function documentModified_EditOp() {
        t.modifiedChangeListener = new DocumentModifiedChangeListener(t.manager);
        t.manager.initialize();
        r.shouldBe(t, "t.manager.isDocumentModified()", "false");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "null");

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 5}));
        r.shouldBe(t, "t.manager.isDocumentModified()", "true");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "true");
        t.manager.moveBackward(1); // back to initial state which was false
        r.shouldBe(t, "t.manager.isDocumentModified()", "false");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "false");
    }

    function setDocumentModified() {
        t.modifiedChangeListener = new DocumentModifiedChangeListener(t.manager);
        t.manager.initialize();
        r.shouldBe(t, "t.manager.isDocumentModified()", "false");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "null");

        t.manager.setDocumentModified(true);
        r.shouldBe(t, "t.manager.isDocumentModified()", "true");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "true");

        t.manager.setDocumentModified(false);
        r.shouldBe(t, "t.manager.isDocumentModified()", "false");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "false");

        // noedit op after setDocumentModified
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 1}));
        r.shouldBe(t, "t.manager.isDocumentModified()", "false");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "false");

        // edit op after setDocumentModified
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 3}));
        r.shouldBe(t, "t.manager.isDocumentModified()", "true");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "true");

        t.manager.setDocumentModified(false);
        r.shouldBe(t, "t.manager.isDocumentModified()", "false");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "false");
    }

    function setDocumentModified_forwardBackwardToUnmodified() {
        t.modifiedChangeListener = new DocumentModifiedChangeListener(t.manager);
        t.manager.initialize();
        r.shouldBe(t, "t.manager.isDocumentModified()", "false");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "null");

        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 1}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 3}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 4}));
        r.shouldBe(t, "t.manager.isDocumentModified()", "true");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "true");

        t.manager.setDocumentModified(false);
        r.shouldBe(t, "t.manager.isDocumentModified()", "false");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "false");

        t.manager.moveBackward(1); // back one state
        r.shouldBe(t, "t.manager.isDocumentModified()", "true");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "true");

        t.manager.moveForward(1); // for one state
        r.shouldBe(t, "t.manager.isDocumentModified()", "false");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "false");
    }

    function setDocumentModified_branchingBeforeUnmodified() {
        t.modifiedChangeListener = new DocumentModifiedChangeListener(t.manager);
        t.manager.initialize();
        r.shouldBe(t, "t.manager.isDocumentModified()", "false");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "null");

        // create two states
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 1}));
        t.manager.onOperationExecuted(create(new ops.OpMoveCursor(), {timestamp: 3}));
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 4}));
        r.shouldBe(t, "t.manager.isDocumentModified()", "true");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "true");

        t.manager.setDocumentModified(false);
        r.shouldBe(t, "t.manager.isDocumentModified()", "false");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "false");

         // back one state
        t.manager.moveBackward(1);
        r.shouldBe(t, "t.manager.isDocumentModified()", "true");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "true");

        // create another second state
        t.manager.onOperationExecuted(create(new ops.OpInsertText(), {timestamp: 6}));
        r.shouldBe(t, "t.manager.isDocumentModified()", "true");
        r.shouldBe(t, "t.modifiedChangeListener.getDocumentModified()", "true");
    }

    this.tests = function () {
        return r.name([
            hasUndoStates_OnlyMovesBackValidStates,
            hasRedoStates_OnlyMovesForwardValidStates,
            setInitialState_SavesMostRecentCursorState,
            setInitialState_AllCursorsMaintainedWhenCalledMultipleTimes,
            initialize_WhenNotInitialized_SavesInitialState,
            initialize_WhenAlreadyInitialized_DoesNothing,
            purgeInitialState_ClearsAllStacks,
            moveBackward_MovesBack_InUndoQueue,
            moveBackward_NextOperationEdit_ClearsRedo,
            moveBackward_NextOperationNonEdit_LeavesRedoInTact,
            moveBackward_BoundaryCheck_InitialDocumentState,
            moveBackward_ResetsMostRecentCursorState_ForVisibleCursors,
            undoState_ConsumesTrailingNonEditOps,
            documentModified_NonEditOp,
            documentModified_EditOp,
            setDocumentModified,
            setDocumentModified_forwardBackwardToUnmodified,
            setDocumentModified_branchingBeforeUnmodified
        ]);
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
