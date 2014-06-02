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

/*global core,runtime */

/**
 * An iterator that iterators through positions in a DOM tree.
 * @constructor
 * @param {!number} timeout
 * @param {!number=} maxChecks
 */
core.LoopWatchDog = function LoopWatchDog(timeout, maxChecks) {
    "use strict";
    var startTime = Date.now(),
        /**@type{!number}*/
        checks = 0;
    function check() {
        var t;
        if (timeout) {
            t = Date.now();
            if (t - startTime > timeout) {
                runtime.log("alert", "watchdog timeout");
                throw "timeout!";
            }
        }
        if (maxChecks > 0) {
            checks += 1;
            if (checks > maxChecks) {
                runtime.log("alert", "watchdog loop overflow");
                throw "loop overflow";
            }
        }
    }
    this.check = check;
};
