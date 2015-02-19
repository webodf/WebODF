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

/*global define, ops, runtime, core */

define("webodf/editor/backend/jsglobal/SessionList", [], function () {
    "use strict";

    var /**@const @type {!string}*/
        EVENT_SESSION_CREATED = "jsglobal/sessionCreated",
        /**@const @type {!string}*/
        EVENT_SESSION_MODIFIED = "jsglobal/sessionModified",
        /**@const @type {!string}*/
        EVENT_SESSION_REMOVED = "jsglobal/sessionRemoved",
        /**@const @type {!number}*/
        POLL_FREQUENCY_MS = 500;

    runtime.loadClass("core.EventNotifier");

    return function JsGlobalSessionList(server) {
        var events = new core.EventNotifier([
                EVENT_SESSION_CREATED,
                EVENT_SESSION_MODIFIED,
                EVENT_SESSION_REMOVED
            ]),
            pullUpdateTask,
            existingSessionHashes = {},
            sessions;

        /**
         * @return {undefined}
         */
        function fetchAndProcessSessionList() {
            var sessionPresentInUpdate = {};
            sessions = server.getJsGlobalServer().getSessions();

            sessions.forEach(function(newSessionObj) {
                var existingSession = existingSessionHashes[newSessionObj.id],
                    newSessionHash = JSON.stringify(newSessionObj); // World's most inefficient hash? Perhaps!

                if (!existingSession) {
                    events.emit(EVENT_SESSION_CREATED, newSessionObj);
                } else if (existingSession.hash !== newSessionHash) {
                    events.emit(EVENT_SESSION_MODIFIED, newSessionObj);
                }
                existingSessionHashes[newSessionObj.id] = newSessionHash;
                sessionPresentInUpdate[newSessionObj.id] = true;
            });

            Object.keys(existingSessionHashes).forEach(function(sessionId) {
                if (!sessionPresentInUpdate.hasOwnProperty(sessionId)) {
                    events.emit(EVENT_SESSION_REMOVED, sessionId);
                }
            });
        }

        /**
         * Get the current session list, and optionally subscribe to future updates
         *
         * @param {!{onCreated: function(!Object):undefined, onUpdated: function(!Object):undefined, onRemoved: function(!string):undefined}=} subscriber
         * @return {!Array.<!Object>} Return an array of session objects
         */
        this.getSessions = function (subscriber) {
            fetchAndProcessSessionList();
            if (subscriber) {
                events.subscribe(EVENT_SESSION_CREATED, subscriber.onCreated);
                events.subscribe(EVENT_SESSION_MODIFIED, subscriber.onUpdated);
                events.subscribe(EVENT_SESSION_REMOVED, subscriber.onRemoved);
            }
            return sessions;
        };

        /**
         * Unsubscribe to updates
         *
         * @param {!{onCreated: function(!Object):undefined, onUpdated: function(!Object):undefined, onRemoved: function(!string):undefined}} subscriber
         * @return {undefined}
         */
        this.unsubscribe = function (subscriber) {
            events.unsubscribe(EVENT_SESSION_CREATED, subscriber.onCreated);
            events.unsubscribe(EVENT_SESSION_MODIFIED, subscriber.onUpdated);
            events.unsubscribe(EVENT_SESSION_REMOVED, subscriber.onRemoved);
        };

        /**
         * @param {!boolean}{ enabled
         * @return {undefined}
         */
        this.setUpdatesEnabled = function (enabled) {
            if (enabled) {
                pullUpdateTask.triggerImmediate();
            } else {
                pullUpdateTask.cancel();
            }
        };

        function init() {
            pullUpdateTask = core.Task.createTimeoutTask(function() {
                fetchAndProcessSessionList();
                pullUpdateTask.trigger();
            }, POLL_FREQUENCY_MS);
        }
        init();
    };
});
