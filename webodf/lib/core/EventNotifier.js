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

/*global core, runtime*/

/**
 * @constructor
 * @implements {core.EventSource}
 * @param {!Array.<!string>=} eventIds
 */
core.EventNotifier = function EventNotifier(eventIds) {
    "use strict";

    var /**@type{!Object.<!string,!Array.<!Function>>}*/
        eventListener = {};

    /**
     * @param {!string} eventId
     * @param {*} args
     * @return {undefined}
     */
    this.emit = function (eventId, args) {
        var i, subscribers;

        runtime.assert(eventListener.hasOwnProperty(eventId),
            "unknown event fired \"" + eventId + "\"");
        subscribers = eventListener[eventId];
        // runtime.log("firing event \"" + eventId + "\" to " + subscribers.length + " subscribers.");
        for (i = 0; i < subscribers.length; i += 1) {
            subscribers[i](args);
        }
    };

    /**
     * @param {!string} eventId
     * @param {!Function} cb
     * @return {undefined}
     */
    this.subscribe = function (eventId, cb) {
        runtime.assert(eventListener.hasOwnProperty(eventId),
            "tried to subscribe to unknown event \"" + eventId + "\"");
        eventListener[eventId].push(cb);
    };

    /**
     * @param {!string} eventId
     * @param {!Function} cb
     * @return {undefined}
     */
    this.unsubscribe = function (eventId, cb) {
        var cbIndex;
        runtime.assert(eventListener.hasOwnProperty(eventId),
            "tried to unsubscribe from unknown event \"" + eventId + "\"");

        cbIndex = eventListener[eventId].indexOf(cb);
        runtime.assert(cbIndex !== -1, "tried to unsubscribe unknown callback from event \"" + eventId + "\"");
        if (cbIndex !== -1) {
            eventListener[eventId].splice(cbIndex, 1);
        }
    };

    /**
     * Register an event
     * @param {!string} eventId
     * @return {undefined}
     */
    function register(eventId) {
        runtime.assert(!eventListener.hasOwnProperty(eventId), "Duplicated event ids: \"" + eventId + "\" registered more than once.");
        eventListener[eventId] = [];
    }
    this.register = register;

    /**
     * @return {undefined}
     */
    function init() {
        if (eventIds) {
            eventIds.forEach(register);
        }
    }

    init();
};
