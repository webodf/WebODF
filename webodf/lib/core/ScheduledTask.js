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

/*global Node, core, runtime*/

/**
 * @class
 * A scheduled task allows multiple requests for the same function to
 * be aggregated into a single call at a future time. This is useful for
 * batching up draw requests or other lower-priority or high-volume calls
 *
 * @constructor
 * @implements {core.Destroyable}
 * @param {!Function} fn The function to execute for this task
 * @param {!function(!function():undefined):!number} scheduleTask Schedule the task to execute
 * @param {!function(!number):undefined} cancelTask Cancel a scheduled task
 */
core.ScheduledTask = function ScheduledTask(fn, scheduleTask, cancelTask) {
    "use strict";
    var timeoutId,
        scheduled = false,
        args = [],
        destroyed = false;

    function cancel() {
        if (scheduled) {
            cancelTask(timeoutId);
            scheduled = false;
        }
    }

    function execute() {
        cancel();
        fn.apply(undefined, args);
        args = null;
    }

    /**
     * Schedule this task to execute. If one has already been requested,
     * this call will have no impact
     */
    this.trigger = function () {
        runtime.assert(destroyed === false, "Can't trigger destroyed ScheduledTask instance");
        args = Array.prototype.slice.call(arguments);
        if (!scheduled) {
            scheduled = true;
            timeoutId = scheduleTask(execute);
        }
    };

    /**
     * Immediately trigger this task and clear any pending requests.
     */
    this.triggerImmediate = function () {
        runtime.assert(destroyed === false, "Can't trigger destroyed ScheduledTask instance");
        args = Array.prototype.slice.call(arguments);
        execute();
    };

    /**
     * Execute any pending requests, but do not start any new ones.
     * If there are no pending requests, this call will do nothing.
     */
    this.processRequests = function () {
        if (scheduled) {
            execute();
        }
    };

    /**
     * Cancel any current pending requests
     * @type {Function}
     */
    this.cancel = cancel;

    /**
     * Cancel any scheduled callbacks and immediately reschedule a new call with
     * any existing arguments.
     * @return {undefined}
     */
    this.restart = function () {
        runtime.assert(destroyed === false, "Can't trigger destroyed ScheduledTask instance");
        cancel();
        scheduled = true;
        timeoutId = scheduleTask(execute);
    };

    /**
     * Cancel any pending requests
     * @param {!function(!Error=)} callback
     */
    this.destroy = function (callback) {
        cancel();
        destroyed = true;
        callback();
    };

};
