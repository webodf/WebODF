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
/*global Node, core, runtime*/

/**
 * @class
 * A scheduled task allows multiple requests for the same function to
 * be aggregated into a single call at a future time. This is useful for
 * batching up draw requests or other lower-priority or high-volume calls
 *
 * @constructor
 * @param {!Function} fn The function to execute for this task
 * @param {!number} delay The number of ms to wait after the first call to trigger
 */
core.ScheduledTask = function ScheduledTask(fn, delay) {
    "use strict";
    var timeoutId,
        scheduled = false,
        args = [];

    function cancel() {
        if (scheduled) {
            runtime.clearTimeout(timeoutId);
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
        args = Array.prototype.slice.call(arguments);
        if (!scheduled) {
            scheduled = true;
            timeoutId = runtime.setTimeout(execute, delay);
        }
    };

    /**
     * Immediately trigger this task and clear any pending requests.
     */
    this.triggerImmediate = function () {
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
     * Cancel any pending requests
     * @param {!function(!Object=)} callback
     */
    this.destroy = function (callback) {
        cancel();
        callback();
    };

};
