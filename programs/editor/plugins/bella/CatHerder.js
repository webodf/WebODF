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

define("webodf/editor/plugins/bella/CatHerder", function() {
    "use strict";
    var webodf = window; // WebODF doesn't support AMD yet...

    function CatHerder(bellaInstance, autodrive) {
        var MAX_ACTIONS = 2000,
            actionsLog = [],
            lastActionName,
            currentActionOps = [];

        function readHash() {
            var hash = window.location.hash,
                result = { pass: 0, fail: 0 };
            if (hash) {
                hash.substr(1).split("&").forEach(function(pair) {
                    var parts = pair.split("=");
                    result[parts[0]] = parseInt(parts[1], 10);
                });
            }
            return result;
        }

        function setHash(obj) {
            window.location.hash = Object.keys(obj).map(function(key) { return key + "=" + obj[key];}).join("&");
        }

        function completeCurrentAction() {
            if (currentActionOps.length > 0) {
                actionsLog.push({
                    desc: lastActionName || "unspecified",
                    actions: currentActionOps
                });
            }
            lastActionName = undefined;
            currentActionOps = [];
        }

        function createReport(e) {
            var bellaState = bellaInstance.getState();
            return {
                name: bellaState.name,
                startedAt: bellaState.startedAt,
                actionsCount: bellaState.actions,
                operationsCount: bellaState.executedOperations,
                seed: bellaState.seed,
                userAgent: window.navigator && window.navigator.userAgent,
                vendor: window.navigator && window.navigator.vendor,
                webOdfVersion: (webodf.webodf && webodf.webodf.Version) || "Unknown",

                errorMessage: e && e.message,
                errorStack: e && e.stack,

                actions: actionsLog
            };
        }

        this.onStartAction = function (actionName) {
            completeCurrentAction();
            lastActionName = actionName;
        };

        this.onEndAction = function () {
            var counts;
            completeCurrentAction();
            if (autodrive && bellaInstance.getState().actions > MAX_ACTIONS) {
                counts = readHash();
                counts.pass += 1;
                setHash(counts);
                window.location.reload(true);
            }
        };

        this.onBeforeOperationExecuted = function (op) {
            currentActionOps.push(op.spec());
        };

        this.onUnhandledException = function (e) {
            var state = bellaInstance.getState(),
                reportFileName = "crash-" + state.actions + "-" + state.seed + ".txt",
                data = webodf.runtime.byteArrayFromString(JSON.stringify(createReport(e), null, "\t"));

            completeCurrentAction();
            webodf.runtime.writeFile(reportFileName, data, function (e) {
                var counts;
                if (autodrive && !e) {
                    counts = readHash();
                    counts.fail += 1;
                    setHash(counts);
                    window.location.reload(true);
                }
            });
        };
    }

    return CatHerder;
});