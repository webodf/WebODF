/**
 * Copyright (C) 2010-2014 KO GmbH <copyright@kogmbh.com>
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

/*global gui, core*/

/**
 * A helper object used to subscribe to events on multiple event sources. Tracking this makes it easier to unsubscribe
 * to all events upon destruction.
 * 
 * @constructor
 * @implements {core.Destroyable}
 */
core.EventSubscriptions = function () {
    "use strict";
     var /**@type{!Array.<!{eventSource: !core.EventSource, eventid: !string, callback: !Function}>}*/
         subscriptions = [],
         /**@type {!core.EventNotifier}*/
         frameEventNotifier = new core.EventNotifier(),
         /**@type{!Object.<!string,!Array.<!{frameEventId: !string, eventSource: !Object, task: !core.ScheduledTask}>>}*/
         frameSubscriptions = {},
         /**@type{!number}*/
         nextFrameEventId = 0;

    /**
     * Subscribe to the specified event on the supplied eventSource
     * @param {!core.EventSource} eventSource
     * @param {!string} eventid
     * @param {!Function} callback
     */
    function addSubscription(eventSource, eventid, callback) {
        eventSource.subscribe(eventid, callback);
        subscriptions.push({
            eventSource: eventSource,
            eventid: eventid,
            callback: callback
        });
    }
    this.addSubscription = addSubscription;

    /**
     * Register a callback that will be invoked if the supplied event id is triggered at least once before the next
     * frame. The callback will only be triggered once per event id when the browser redraws the content.
     * The callback takes no arguments.
     *
     * @param {!core.EventSource} eventSource
     * @param {!string} eventid
     * @param {!function():undefined} callback Event callback. This callback takes NO arguments
     * @return {undefined}
     */
    this.addFrameSubscription = function (eventSource, eventid, callback) {
        var frameSubscription,
            frameEventId,
            eventFrameSubscriptions,
            i;

        if (!frameSubscriptions.hasOwnProperty(eventid)) {
            frameSubscriptions[eventid] = [];
        }
        eventFrameSubscriptions = frameSubscriptions[eventid];

        for (i = 0; i < eventFrameSubscriptions.length; i += 1) {
            if (eventFrameSubscriptions[i].eventSource === eventSource) {
                frameSubscription = eventFrameSubscriptions[i];
                break;
            }
        }

        if (!frameSubscription) {
            frameEventId = "s" + nextFrameEventId;
            nextFrameEventId += 1;
            frameEventNotifier.register(frameEventId);
            frameSubscription = {
                // A unique frame event id is necessary in case multiple eventSources identical external event ids
                frameEventId: frameEventId,
                eventSource: eventSource,
                task: core.Task.createRedrawTask(function() {
                    frameEventNotifier.emit(frameEventId, undefined);
                })
            };
            eventFrameSubscriptions.push(frameSubscription);
            addSubscription(eventSource, eventid, frameSubscription.task.trigger);
        }

        frameEventNotifier.subscribe(frameSubscription.frameEventId, callback);
    };

    /**
     * Unsubscribe all event subscriptions on all eventSources
     * @return {undefined}
     */
    function unsubscribeAll() {
        var cleanup = [];

        subscriptions.forEach(function(subscription) {
            subscription.eventSource.unsubscribe(subscription.eventid, subscription.callback);
        });
        subscriptions.length = 0;

        Object.keys(frameSubscriptions).forEach(function(eventId) {
            frameSubscriptions[eventId].forEach(function(subscriber) {
                cleanup.push(subscriber.task.destroy);
            });
            delete frameSubscriptions[eventId];
        });
        /*jslint emptyblock:true*/
        core.Async.destroyAll(cleanup, function() { });
        /*jslint emptyblock:false*/
        frameEventNotifier = new core.EventNotifier();
    }
    this.unsubscribeAll = unsubscribeAll;

    /**
     * Destroy the object.
     * Do not access any member of this object after this call.
     * @param {function(!Error=):undefined} callback
     * @return {undefined}
     */
    this.destroy = function(callback) {
        unsubscribeAll();
        callback();
    };
};