/**
 * Copyright (C) 2013 KO GmbH <aditya.bhatt@kogmbh.com>
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

/*global core, gui, ops, runtime*/

/**
 * @class
 * The ShadowCursor class provides a very minimal OdtCursor-like interface.
 * It does not insert anything into the DOM, and is useful mainly for
 * simulating a Cursor when you cannot/should not use a real cursor.
 * 
 * @constructor
 * @param {!ops.Document} document
 */
gui.ShadowCursor = function ShadowCursor(document) {
    "use strict";
    var /**@type{!Range}*/
        selectedRange = /**@type{!Range}*/(document.getDOMDocument().createRange()),
        forwardSelection = true;

    /*jslint emptyblock: true*/
    this.removeFromDocument = function () {};
    /*jslint emptyblock: false*/

    /**
     * Obtain the memberid the cursor is assigned to. For a shadow cursor,
     * this value is always gui.ShadowCursor.ShadowCursorMemberId
     * @return {string}
     */
    this.getMemberId = function () {
        return gui.ShadowCursor.ShadowCursorMemberId;
    };

    /**
     * Obtain the currently selected range to which the cursor corresponds.
     * @return {!Range}
     */
    this.getSelectedRange = function () {
        return selectedRange;
    };

    /**
     * Set the given range as the selected range for this cursor
     * @param {!Range} range
     * @param {boolean=} isForwardSelection Assumed to be true by default
     * @return {undefined}
     */
    this.setSelectedRange = function (range, isForwardSelection) {
        selectedRange = range;
        forwardSelection = isForwardSelection !== false;
    };

    /**
     * Returns if the selection of this cursor has the
     * same direction as the direction of the range
     * @return {boolean}
     */
    this.hasForwardSelection = function () {
        return forwardSelection;
    };

    /**
     * Obtain the document to which the cursor corresponds.
     * @return {!ops.Document}
     */
    this.getDocument = function () {
        return document;
    };

    /**
     * Gets the current selection type. For a shadow cursor, this value is always
     * ops.OdtCursor.RangeSelection
     * @return {!string}
     */
    this.getSelectionType = function () {
        return ops.OdtCursor.RangeSelection;
    };

    function init() {
        selectedRange.setStart(document.getRootNode(), 0);
    }
    init();
};

/** @const @type {!string} */gui.ShadowCursor.ShadowCursorMemberId = "";
