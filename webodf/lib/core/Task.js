/**
 * @license
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

/*global core, runtime*/

(function() {
    "use strict";

    /**
     * @type {!Object}
     */
    core.Task =  {};

    /**
     * Creates a new task that will execute the specified callback once
     * when redrawing the next animation frame. Triggering the task multiple
     * times before the execution occurs will still only result in a single
     * call being made.
     *
     * @param {!Function} callback
     * @return {!core.ScheduledTask}
     */
    core.Task.createRedrawTask = function (callback) {
        return new core.ScheduledTask(callback,
            runtime.requestAnimationFrame,
            runtime.cancelAnimationFrame
        );
    };

    /**
     * Creates a new task that will execute the specified callback once
     * within the specified delay period. Triggering the task multiple
     * times before the execution occurs will still only result in a single
     * call being made.
     *
     * @param {!Function} callback
     * @param {!number} delay
     * @return {!core.ScheduledTask}
     */
    core.Task.createTimeoutTask = function (callback, delay) {
        return new core.ScheduledTask(callback,
            function(callback) {
                return runtime.setTimeout(callback, delay);
            },
            runtime.clearTimeout
        );
    };
}());