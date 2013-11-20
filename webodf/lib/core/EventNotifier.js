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

/*global core, runtime*/

/**
 * @constructor
 * @param {!Array.<!string>} eventIds
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
        runtime.log("event \"" + eventId + "\" subscribed.");
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
        runtime.log("event \"" + eventId + "\" unsubscribed.");
    };

    /**
     * @return {undefined}
     */
    function init() {
        var i, eventId;

        for (i = 0; i < eventIds.length; i += 1) {
            eventId = eventIds[i];
            runtime.assert(!eventListener.hasOwnProperty(eventId), "Duplicated event ids: \"" + eventId + "\" registered more than once.");
            eventListener[eventId] = [];
        }
    }

    init();
};
