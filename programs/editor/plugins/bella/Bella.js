/**
 * Copyright (C) 2014-2015 KO GmbH <copyright@kogmbh.com>
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

/*global define, window, ops*/

define("webodf/editor/plugins/bella/Bella", [
        "webodf/editor/plugins/bella/Actions",
        "webodf/editor/plugins/bella/CatHerder",
        "webodf/editor/plugins/bella/DocumentValidator",
        "webodf/editor/plugins/bella/Random",
        "webodf/editor/plugins/bella/SimpleStatusReporter",
        "webodf/editor/plugins/bella/WrappedSessionController"
    ],
    function(Actions, CatHerder, DocumentValidator, Random, SimpleStatusReporter, WrappedSessionController) {
    "use strict";
    var instanceCount = 0,
        webodf = window; // WebODF doesn't support AMD yet...

    /**
     * @constructor
     * @implements {core.Destroyable}
     * @param {!Object=} config Configuration options to pass to fuzzer
     *      automatically generated
     */
    function Bella(config) {
        var self = this,
            MAX_UNDO_STATES = 1000,
            seed,
            random,
            currentSessionController,
            actionSources = [],
            scheduledTask,
            documentValidator,
            undoStateCount = 0,
            reporter,
            errorHandler,
            state = {
                name: config.name,
                startedAt: undefined,
                actions: 0,
                executedOperations: 0,
                seed: undefined
            };

        /**
         * @return {undefined}
         */
        function countOperations() {
            undoStateCount += 1; // TODO count states NOT operations
            state.executedOperations += 1;
        }

        /**
         * Workaround a TrivialUndoManager bug with cursor positions not being
         * correctly restored. It's done by adding OpMoveCursors for all cursors
         * with the current cursor state as the very last operations.
         * (see also https://github.com/kogmbh/WebODF/issues/903)
         * @return {undefined}
         */
        function saveCurrentCursorPositions() {
            var odtDocument = currentSessionController.getSession().getOdtDocument(),
                members = odtDocument.getMemberIds(),
                ops = [];

            members.forEach(function (memberId) {
                if (!odtDocument.getCursor(memberId)) {
                    return;
                }

                var selection = odtDocument.getCursorSelection(memberId),
                    selectionType = odtDocument.getCursor(memberId).getSelectionType(),
                    op = new webodf.ops.OpMoveCursor();
                op.init({
                    memberid: memberId,
                    position: selection.position,
                    length: selection.length,
                    selectionType: selectionType
                });
                ops.push(op);
            });
            currentSessionController.getSession().enqueue(ops);
        }

        /**
         * Prevents undostack eating all memory by the time.
         * Drops the current undostack if a certain size has been reached
         * (based on number of states) and resets undomanager to a fresh stack.
         * @return {undefined}
         */
        function maintainUndoStackSize() {
            var undoManager = currentSessionController.getUndoManager();
            if (undoManager && undoStateCount > MAX_UNDO_STATES) {
                saveCurrentCursorPositions();
                undoManager.setInitialState();
                documentValidator.check();
                undoStateCount = 0;
            }
        }

        /**
         * Have Bella do one random action.
         * @return {undefined}
         */
        function pounceOnComputer() {
            var actionSource = random.getElement(actionSources),
                actionName = random.getElement(Object.keys(actionSource)),
                action = actionSource[actionName];

            state.actions += 1;
            errorHandler.onStartAction(actionName);
            if (config.debug) {
                // Catching & rethrowing tends to make the Chrome debugger useless as the debugger breaks at
                // the rethrow rather than the original exception
                action({random: random});
            } else {
                try {
                    action({random: random});
                } catch (e) {
                    errorHandler.onUnhandledException(e);
                    throw e;
                }
            }

            errorHandler.onEndAction(actionName);

            try {
                maintainUndoStackSize();
            } catch (e) {
                errorHandler.onUnhandledException(e);
                throw e;
            }
            scheduledTask.trigger();
        }

        /**
         * @param {!function():undefined=} callback
         * @return {undefined}
         */
        function stop(callback) {
            /*jslint emptyblock: true*/
            function noop() {
            }
            /*jslint emptyblock: false*/
            if (scheduledTask) {
                webodf.core.Async.destroyAll([scheduledTask.destroy], callback || noop);
                if (reporter) {
                    reporter.destroy();
                    reporter = undefined;
                }
                scheduledTask = undefined;
            }
        }

        /**
         * @param {!Object.<!string, !function():undefined>} newActions
         * @return {undefined}
         */
        this.addActionSource = function (newActions) {
            actionSources.push(newActions);
        };

        /**
         * @param {!number} newInterval Time (in milliseconds) between actions
         * @return {undefined}
         */
        this.play = function (newInterval) {
            stop();
            state.startedAt = new Date();
            reporter = new SimpleStatusReporter(self, config.statusContainer);
            scheduledTask = webodf.core.Task.createTimeoutTask(pounceOnComputer, newInterval);
            scheduledTask.triggerImmediate();
        };

        this.stop = stop;
        this.destroy = stop;

        /**
         * @return {undefined}
         */
        function removeFromDocument() {
            var odtDocument;
            stop();
            actionSources.length = 0;
            if (currentSessionController) {
                odtDocument = currentSessionController.getSession().getOdtDocument();
                odtDocument.unsubscribe(webodf.ops.OdtDocument.signalOperationEnd, countOperations);
                odtDocument.unsubscribe(webodf.ops.OdtDocument.signalOperationEnd, documentValidator.check);
                odtDocument.unsubscribe(webodf.ops.OdtDocument.signalOperationStart, errorHandler.onBeforeOperationExecuted);
                currentSessionController = undefined;
                ops.StepsCache.ENABLE_CACHE_VERIFICATION = false;
            }
        }

        this.removeFromDocument = removeFromDocument;

        this.getState = function () {
            return state;
        };

        /**
         * @param {!gui.SessionController} newSessionController
         * @return {undefined}
         */
        this.addToDocument = function (newSessionController) {
            var session,
                wrappedSession;

            removeFromDocument();
            ops.StepsCache.ENABLE_CACHE_VERIFICATION = true;
            currentSessionController = newSessionController;
            session = newSessionController.getSession();
            wrappedSession = new WrappedSessionController(newSessionController);
            documentValidator = new DocumentValidator(wrappedSession, config.lengthCheck);
            actionSources.push(new Actions(wrappedSession, random, config));
            session.getOdtDocument().subscribe(webodf.ops.OdtDocument.signalOperationEnd, countOperations);
            session.getOdtDocument().subscribe(webodf.ops.OdtDocument.signalOperationEnd, documentValidator.check);
            session.getOdtDocument().subscribe(webodf.ops.OdtDocument.signalOperationStart, errorHandler.onBeforeOperationExecuted);

            self.play(config.actionTime);
        };

        function init() {
            config = config || {};
            instanceCount += 1;
            seed = config.seed || Math.floor(Math.random() * 1e10 + (1e10 * instanceCount)).toString();
            state.seed = seed;
            random = new Random(seed);
            errorHandler = new CatHerder(self, config.autoDrive);
            webodf.runtime.enableAlerts = false;
        }

        init();
    }

    return Bella;
});
