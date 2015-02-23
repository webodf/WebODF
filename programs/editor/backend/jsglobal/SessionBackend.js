/**
 * Copyright (C) 2014 KO GmbH <copyright@kogmbh.com>
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

/*global define, ops*/


define("webodf/editor/backend/jsglobal/SessionBackend", [
    "webodf/editor/backend/jsglobal/OperationRouter"],
    function (JsGlobalOperationRouter) {
        "use strict";

        /**
         * @constructor
         * @implements SessionBackend
         */
        function JsGlobalSessionBackend(sessionId, memberId, server) {

            /**
             * @return {!string}
             */
            this.getMemberId = function () {
                return memberId;
            };

            /*jslint unparam: true*/
            /**
             * @param {!odf.OdfContainer} odfContainer
             * @param {!function(!Object)} errorCallback
             * @return {!ops.OperationRouter}
             */
            this.createOperationRouter = function (odfContainer, errorCallback) {
                return new JsGlobalOperationRouter(sessionId, memberId, server, errorCallback);
            };
            /*jslint unparam: false*/

            /**
             * @return {!string}
             */
            this.getGenesisUrl = function () {
                return server.getGenesisUrl(sessionId);
            };
        }

        return JsGlobalSessionBackend;
});
