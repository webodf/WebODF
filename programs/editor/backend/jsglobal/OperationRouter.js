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

/*global define, runtime, core, ops*/

define("webodf/editor/backend/jsglobal/OperationRouter", [], function () {
    "use strict";

    var /**@const @type {!string}*/
        EVENT_BEFORESAVETOFILE =                  "beforeSaveToFile",
        /**@const @type {!string}*/
        EVENT_SAVEDTOFILE =                       "savedToFile",
        /**@const @type {!string}*/
        EVENT_HASLOCALUNSYNCEDOPERATIONSCHANGED = "hasLocalUnsyncedOperationsChanged",
        /**@const @type {!string}*/
        EVENT_HASSESSIONHOSTCONNECTIONCHANGED =   "hasSessionHostConnectionChanged";

    runtime.loadClass("ops.OperationTransformer");
    runtime.loadClass("core.EventNotifier");
    runtime.loadClass("core.Task");

    /**
     * @constructor
     * @implements ops.OperationRouter
     */
    return function JsGlobalOperationRouter(sessionId, memberId, server, errorCallback) {

        var events = new core.EventNotifier([
                ops.OperationRouter.signalProcessingBatchStart,
                ops.OperationRouter.signalProcessingBatchEnd,
                EVENT_HASLOCALUNSYNCEDOPERATIONSCHANGED,
                EVENT_HASSESSIONHOSTCONNECTIONCHANGED,
                EVENT_BEFORESAVETOFILE,
                EVENT_SAVEDTOFILE
            ]),
            /**@type{!ops.OperationFactory}*/
            operationFactory,
            playbackFunction,
            operationTransformer = new ops.OperationTransformer(),
            /**@type{number}*/
            groupIdentifier = 0,
            uploadingOpSpecCount,
            syncTask,
            unsyncedClientOpspecQueue = [],
            hasLocalUnsyncedOps = false,
            hasSessionHostConnection = true,
            hasUnresolvableConflict = false,
            syncInProgress = false,
            syncAttemptCompleteCallbacks = [],
            successfulSyncCallbacks = [],
            destroyed = false;

        /**
         * @return {undefined}
         */
        function updateUnsyncedOps() {
            var hasLocalUnsyncedOpsNow = (unsyncedClientOpspecQueue.length > 0);

            // no change?
            if (hasLocalUnsyncedOps === hasLocalUnsyncedOpsNow) {
                return;
            }

            hasLocalUnsyncedOps = hasLocalUnsyncedOpsNow;
            events.emit(EVENT_HASLOCALUNSYNCEDOPERATIONSCHANGED, hasLocalUnsyncedOps);
        }

        /**
         * @return {!boolean}
         */
        this.hasLocalUnsyncedOps = function() {
            return hasLocalUnsyncedOps;
        };

        /**
         * @param {!boolean} hasConnection
         * @return {undefined}
         */
        function updateHasSessionHostConnectionState(hasConnection) {
            // no change?
            if (hasSessionHostConnection === hasConnection) {
                return;
            }

            hasSessionHostConnection = hasConnection;
            events.emit(EVENT_HASSESSIONHOSTCONNECTIONCHANGED, hasSessionHostConnection);
        }

        /**
         * @return {!boolean}
         */
        this.hasSessionHostConnection = function () {
            return hasSessionHostConnection;
        };

        /**
         * Sets the factory to use to create operation instances from operation specs.
         *
         * @param {!ops.OperationFactory} f
         * @return {undefined}
         */
        this.setOperationFactory = function (f) {
            operationFactory = f;
        };

        /**
         * Sets the method which should be called to apply operations.
         *
         * @param {!function(!ops.Operation):boolean} playback_func
         * @return {undefined}
         */
        this.setPlaybackFunction = function (playback_func) {
            playbackFunction = playback_func;
        };

        /**
         * Brings the locally created operations into the game.
         *
         * @param {!Array.<!{optype:!string}>} operationSpecs
         * @return {undefined}
         */
         function executeOpSpecs(operationSpecs) {
            // This is an extremely simplistic and VERY temporary implementation of operation grouping.
            // In order to improve undo behaviour, the undo manager requires knowledge about what groups
            // of operations were queued together, so these can be stored in a single undo state.
            // The current implementation is only designed for a localeditor instance & the TrivialUndoManager.
            // TODO redesign this concept to work with collaborative editing
            groupIdentifier += 1;
            events.emit(ops.OperationRouter.signalProcessingBatchStart, {});
            operationSpecs.forEach(function (opspec) {
                var /**@type{?ops.Operation}*/
                    timedOp;

                timedOp = operationFactory.create(opspec);
                timedOp.group = "g" + groupIdentifier;

                // TODO: handle return flag in error case
                playbackFunction(timedOp);
            });
            events.emit(ops.OperationRouter.signalProcessingBatchEnd, {});
        }

        /**
         * Executes local operations and prepares to send to these to the collab server
         *
         * @param {!Array.<!ops.Operation>} operations
         * @return {undefined}
         */
        this.push = function (operations) {
            if (hasUnresolvableConflict) {
                throw new Error("unresolvableConflictingOps");
            }

            var specs = [],
                timestamp = Date.now();

            operations.forEach(function(op) {
                var spec = op.spec();
                spec.timestamp = timestamp;
                specs.push(spec);
            });

            unsyncedClientOpspecQueue = unsyncedClientOpspecQueue.concat(specs);
            executeOpSpecs(specs);
            updateUnsyncedOps();
            syncTask.trigger();
        };

        /**
         * @param {function()} cb
         */
        this.close = function (cb) {
            function internalDestroy() {
                destroyed = true;
                syncTask.destroy(cb);
            }
            syncAttemptCompleteCallbacks.push(internalDestroy);
            syncTask.triggerImmediate();
            if (!syncInProgress) {
                internalDestroy();
            }
        };

        /**
         * @param {!string} eventId
         * @param {!Function} cb
         * @return {undefined}
         */
        this.subscribe = function (eventId, cb) {
            events.subscribe(eventId, cb);
        };

        /**
         * @param {!string} eventId
         * @param {!Function} cb
         * @return {undefined}
         */
        this.unsubscribe = function (eventId, cb) {
            events.unsubscribe(eventId, cb);
        };

        /**
         * Complete the current synchronize request
         * @param {!boolean=} connectionState If specified, update the session host connection state.
         * @return {undefined}
         */
        function completeSyncRequest(connectionState) {
            syncInProgress = false;
            updateUnsyncedOps();
            if (connectionState !== undefined) {
                updateHasSessionHostConnectionState(connectionState);
            }

            syncAttemptCompleteCallbacks.forEach(function(cb) {
                cb();
            });
            syncAttemptCompleteCallbacks.length = 0;

            if (!destroyed) {
                syncTask.cancel();
                syncTask.trigger();
            }
        }

        /**
         * Log a synchronization error and retry
         * @param {!Error} e
         * @return {undefined}
         */
        function logErrorAndRetry(e) {
            var isConnected;
            switch (e.code) {
                case "SEQ_OUTOFDATE":
                    // This error is an expected as part of normal operation. Don't bother logging
                    isConnected = true;
                    break;
                case "SERVICE_UNAVAILABLE":
                    // This error is an expected as part of normal operation. Don't bother logging.
                    // However, the error does indicate a connectivity problem with the session, so
                    // ensure the connection status is updated
                    isConnected = false;
                    break;
                default:
                    isConnected = false;
                    runtime.log(e);
                    break;
            }
            completeSyncRequest(isConnected);
        }

        /**
         * Remove synchronized client ops off the client queue
         * @return {undefined}
         */
        function onPushSuccess() {
            // Only remove operations that have now been uploaded to the remote service
            unsyncedClientOpspecQueue.splice(0, uploadingOpSpecCount);
            completeSyncRequest(true);
            successfulSyncCallbacks.forEach(function(cb) {
                cb();
            });
            successfulSyncCallbacks.length = 0;
        }

        /**
         * Process remote changes
         * @param {!{specs: !Array.<!Object>, sequenceId: !Object}} remoteChanges
         * @return {undefined}
         */
        function onRemoteChangesSuccess(remoteChanges) {
            var transformResult = operationTransformer.transform(unsyncedClientOpspecQueue, remoteChanges.specs);
            if (!transformResult) {
                hasUnresolvableConflict = true;
                errorCallback("unresolvableConflictingOps");
                completeSyncRequest();
                return;
            }

            if (transformResult.opSpecsB.length > 0) {
                // Apply remote changes that have been transformed against local updates
                executeOpSpecs(transformResult.opSpecsB);
            }

            // The local client changes are now transformed against the current remote updates, and should not be transformed again.
            // Update the local sync queue with the translated results in case the push attempt fails due to a conflict
            unsyncedClientOpspecQueue = transformResult.opSpecsA;

            // Send local changes that have been transformed against the remote updates
            uploadingOpSpecCount = unsyncedClientOpspecQueue.length;
            if (unsyncedClientOpspecQueue.length > 0) {
                server.getJsGlobalServer().push(sessionId, memberId, remoteChanges.sequenceId, unsyncedClientOpspecQueue, onPushSuccess, logErrorAndRetry);
            } else {
                onPushSuccess();
            }
        }

        /**
         * DO NOT CALL DIRECTLY, use syncTask.trigger instead.
         *
         * Synchronize the local state with the remote server. This is an async call and will return immediately, while
         * the processing occurs in the background.
         *
         * @return {undefined}
         */
        function synchronizeWithServer() {
            if (hasUnresolvableConflict === false && syncInProgress === false) {
                syncInProgress = true;
                server.getJsGlobalServer().getRemoteChanges(sessionId, memberId, onRemoteChangesSuccess, logErrorAndRetry);
            }
        }

        this.requestReplay = function(cb) {
            if (hasUnresolvableConflict) {
                throw new Error("unresolvableConflictingOps");
            }
            successfulSyncCallbacks.push(cb);
            syncTask.triggerImmediate();
        };

        function init() {
            syncTask = core.Task.createTimeoutTask(synchronizeWithServer, 100);
        }
        init();
    };
});
