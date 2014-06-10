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

/*global ops*/
/*jslint emptyblock: true, unparam: true*/

/**
 * Network status has three possible values: "unavailable", "timeout", "ready"
 * @interface
 */
ops.Server = function Server() {"use strict"; };


/**
 * @param {!number} timeout in milliseconds
 * @param {!function(!string)} cb reports the state: "unavailable", "timeout", "ready"
 * @return {undefined}
 */
ops.Server.prototype.connect = function (timeout, cb) {"use strict"; };

/**
 * @return {!string}
 */
ops.Server.prototype.networkStatus = function () {"use strict"; };

/**
 * @param {!string} login
 * @param {!string} password
 * @param {function(!Object)} successCb
 * @param {function(!string)} failCb
 * @return {undefined}
 */
ops.Server.prototype.login = function (login, password, successCb, failCb) {"use strict"; };

/**
 * @param {!string} userId  TODO: should the server not rather cache that info after login as property?
 * @param {!string} sessionId
 * @param {!function(!string)} successCb
 * @param {!function()} failCb
 * @return {undefined}
 */
ops.Server.prototype.joinSession = function (userId, sessionId, successCb, failCb) {"use strict"; };

/**
 * @param {!string} sessionId
 * @param {!string} memberId
 * @param {!function(!string)} successCb
 * @param {!function()} failCb
 * @return {undefined}
 */
ops.Server.prototype.leaveSession = function (sessionId, memberId, successCb, failCb) {"use strict"; };
