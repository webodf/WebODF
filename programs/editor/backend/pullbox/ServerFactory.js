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

/*global define, document, require, runtime, ops */

define("webodf/editor/backend/pullbox/ServerFactory", [
    "webodf/editor/backend/pullbox/Server",
    "webodf/editor/backend/pullbox/SessionBackend",
    "webodf/editor/backend/pullbox/SessionList"],
    function (PullBoxServer, PullBoxSessionBackend, PullBoxSessionList) {
        "use strict";

        /**
        * @constructor
        * @implements ServerFactory
        */
        return function PullBoxServerFactory() {
            this.createServer = function (args) {
                return new PullBoxServer(args);
            };
            this.createSessionBackend = function (sid, mid, server) {
                return new PullBoxSessionBackend(sid, mid, server);
            };
            this.createSessionList = function (server) {
                return new PullBoxSessionList(server);
            };
        };
});
