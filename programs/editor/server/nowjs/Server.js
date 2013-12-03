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

/*global runtime, ops*/

define("webodf/editor/server/nowjs/Server", [], function () {
    "use strict";

    /**
     * @constructor
     * @implements ops.Server
     */
    return function NowjsServer() {

        var nowObject;

        this.getNowObject = function () {
            return nowObject;
        };

        this.getGenesisUrl = function (sessionId) {
            return "/session/" + sessionId + "/genesis";
        };

        /**
         * @param {!number} timeout in milliseconds
         * @param {!function(!string)} callback
         * @return {undefined}
         */
        this.connect = function (timeout, callback) {
            var accumulatedWaitingTime = 0;

            // already tried connecting?
            if (nowObject) {
                return;
            }

            nowObject = runtime.getVariable("now");
            if (nowObject === undefined) {
                nowObject = {networkStatus:"unavailable"};
            }

            function laterCb() {
                if (nowObject.networkStatus === "unavailable") {
                    runtime.log("connection to server unavailable.");
                    callback("unavailable");
                    return;
                }
                if (nowObject.networkStatus !== "ready") {
                    if (accumulatedWaitingTime > timeout) {
                        // game over
                        runtime.log("connection to server timed out.");
                        callback("timeout");
                        return;
                    }
                    accumulatedWaitingTime += 100;
                    runtime.getWindow().setTimeout(laterCb, 100);
                } else {
                    runtime.log("connection to collaboration server established.");
                    callback("ready");
                }
            }
            laterCb();
        };

        /**
         * @return {!string}
         */
        this.networkStatus = function () {
            return nowObject ? nowObject.networkStatus : "unavailable";
        };

        /**
         * @param {!string} login
         * @param {!string} password
         * @param {function(!Object)} successCb
         * @param {function(!string)} failCb
         * @return {undefined}
         */
        this.login = function (login, password, successCb, failCb) {
            if (!nowObject) {
                failCb("Not connected to server");
            } else {
                nowObject.login(login, password, successCb, failCb);
            }
        };

        /**
         * @param {!string} userId
         * @param {!string} sessionId
         * @param {!function(!string)} successCb
         * @param {!function()} failCb
         * @return {undefined}
         */
        this.joinSession = function (userId, sessionId, successCb, failCb) {
            nowObject.joinSession(userId, sessionId, function(memberId) { nowObject.memberid = memberId; successCb(memberId);}, failCb);
        };

        /**
         * @param {!string} sessionId
         * @param {!string} memberId
         * @param {!function()} successCb
         * @param {!function()} failCb
         * @return {undefined}
         */
        this.leaveSession = function (sessionId, memberId, successCb, failCb) {
            nowObject.leaveSession(sessionId, memberId, function() { delete nowObject.memberid; successCb(); }, failCb);
        };
    };
});
