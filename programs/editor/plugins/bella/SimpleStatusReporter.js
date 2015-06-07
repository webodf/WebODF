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

/*global define, window*/

define("webodf/editor/plugins/bella/SimpleStatusReporter", function() {
    "use strict";
    var webodf = window; // WebODF doesn't support AMD yet...

    function SimpleStatusReporter(bellaInstance, statusContainer) {
        var container, updateIntervalId;

        function updateState() {
            var state = bellaInstance.getState();
            container.textContent = JSON.stringify(state, null, "\t");
        }

        this.destroy = function () {
            window.clearInterval(updateIntervalId);
            if (container) {
                container.parentNode.removeChild(container);
                container = null;
            }
        };

        function init() {
            var doc = webodf.runtime.getWindow().document,
                parent = statusContainer || doc.body;

            container = doc.createElement("pre");
            container.style.position = "absolute";
            container.style.bottom = "0";
            container.style.right = "0";
            parent.appendChild(container);
            updateIntervalId = window.setInterval(updateState, 100);
        }

        init();
    }

    return SimpleStatusReporter;
});