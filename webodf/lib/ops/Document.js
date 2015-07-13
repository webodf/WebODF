/**
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
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

/*global ops */
/*jslint emptyblock: true, unparam: true */

/**
 * A document that keeps all data related to the mapped document.
 * @interface
 */
ops.Document = function Document() { "use strict"; };
/**
 * @return {!Array.<string>}
 */
ops.Document.prototype.getMemberIds = function () { "use strict"; };
/**
 * @param {!string} memberid
 * @return {!boolean}
 */
ops.Document.prototype.removeCursor = function (memberid) { "use strict"; };
/**
 * @return {!Element}
 */
ops.Document.prototype.getDocumentElement = function () { "use strict"; };
/**
 * Return the element where the document content begins.
 * Document content means the body of the document. In the case of ODF this is
 * office:text, office:spreadsheet, office:presentation. For most XML documents
 * getRootNode() will return the same node as getDocumentElement().
 * @return {!Element}
 */
ops.Document.prototype.getRootNode = function () { "use strict"; };
/**
 * @return {!Document}
 */
ops.Document.prototype.getDOMDocument = function () { "use strict"; };
/**
 * @return {!Element}
 */
ops.Document.prototype.cloneDocumentElement = function () { "use strict"; };
/**
 * @param {!Element} element
 * @return {undefined}
 */
ops.Document.prototype.setDocumentElement = function (element) { "use strict"; };
/**
 * @param {!string} eventid
 * @param {!Function} cb
 * @return {undefined}
 */
ops.Document.prototype.subscribe = function (eventid, cb) { "use strict"; };
/**
 * @param {!string} eventid
 * @param {!Function} cb
 * @return {undefined}
 */
ops.Document.prototype.unsubscribe = function (eventid, cb) { "use strict"; };
// vim:expandtab
/**
 * @return {!ops.Canvas}
 */
ops.Document.prototype.getCanvas = function () { "use strict"; };
/**
 * @param {string|!Node} inputMemberId
 * @return {!core.PositionFilter}
 */
ops.Document.prototype.createRootFilter = function (inputMemberId) { "use strict"; };
/**
 * @param {!Node} rootNode
 * @return {!core.PositionIterator}
 */
ops.Document.prototype.createPositionIterator = function (rootNode) { "use strict"; };
/**
 * @param {!string} memberid
 * @return {!boolean}
 */
ops.Document.prototype.hasCursor = function (memberid) { "use strict"; };

/**@const*/
ops.Document.signalCursorAdded =   "cursor/added";
/**@const*/
ops.Document.signalCursorRemoved = "cursor/removed";
/**@const*/
ops.Document.signalCursorMoved =   "cursor/moved";
/**@const*/
ops.Document.signalMemberAdded =   "member/added";
/**@const*/
ops.Document.signalMemberUpdated = "member/updated";
/**@const*/
ops.Document.signalMemberRemoved = "member/removed";
