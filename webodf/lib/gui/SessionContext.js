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

/*global runtime, gui, odf */


/**
 * @constructor
 * @param {!ops.Session} session
 * @param {!string} inputMemberId
 */
gui.SessionContext = function (session, inputMemberId) {
    "use strict";

    var odtDocument = session.getOdtDocument(),
        odfUtils = odf.OdfUtils;

    /**
     * @return {!boolean}
     */
    this.isLocalCursorWithinOwnAnnotation = function () {
        var cursor = odtDocument.getCursor(inputMemberId),
            cursorNode,
            currentUserName,
            parentAnnotation;

        if (!cursor) {
            return false;
        }

        cursorNode = cursor && cursor.getNode();
        currentUserName = odtDocument.getMember(inputMemberId).getProperties().fullName;
        parentAnnotation = odfUtils.getParentAnnotation(cursorNode, odtDocument.getRootNode());

        if (parentAnnotation && odfUtils.getAnnotationCreator(parentAnnotation) === currentUserName) {
            return true;
        }

        return false;
    };
};
