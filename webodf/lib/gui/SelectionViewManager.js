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

/*global runtime, core, gui, ops*/

/**
 * The Selection View Manager is responsible for managing SelectionView objects
 * and attaching/detaching them to cursors.
 * @constructor
 * @implements {core.Destroyable}
 * @param {!function(new:gui.SelectionView, !(ops.OdtCursor|gui.ShadowCursor))} SelectionView
 */
gui.SelectionViewManager = function SelectionViewManager(SelectionView) {
    "use strict";
    var /**@type{!Object.<string,gui.SelectionView>}*/
        selectionViews = {};

    /**
     * @param {!string} memberId
     * @return {?gui.SelectionView}
     */
    function getSelectionView(memberId) {
        return selectionViews.hasOwnProperty(memberId) ? selectionViews[memberId] : null;
    }
    this.getSelectionView = getSelectionView;

    /**
     * @return {!Array.<!gui.SelectionView>}
     */
    function getSelectionViews() {
        return Object.keys(selectionViews).map(function (memberid) { return selectionViews[memberid]; });
    }
    this.getSelectionViews = getSelectionViews;

    /**
     * @param {!string} memberId
     * @return {undefined}
     */
    function removeSelectionView(memberId) {
        if (selectionViews.hasOwnProperty(memberId)) {
            /*jslint emptyblock: true*/
            selectionViews[memberId].destroy(function () { });
            /*jslint emptyblock: false*/
            delete selectionViews[memberId];
        }
    }
    this.removeSelectionView = removeSelectionView;

    /**
     * @param {!string} memberId
     * @return {undefined}
     */
    function hideSelectionView(memberId) {
        if (selectionViews.hasOwnProperty(memberId)) {
            selectionViews[memberId].hide();
        }
    }
    this.hideSelectionView = hideSelectionView;

    /**
     * @param {!string} memberId
     * @return {undefined}
     */
    function showSelectionView(memberId) {
        if (selectionViews.hasOwnProperty(memberId)) {
            selectionViews[memberId].show();
        }
    }
    this.showSelectionView = showSelectionView;

    /**
     * Rerenders the selection views that are already visible
     * @return {undefined}
     */
    this.rerenderSelectionViews = function () {
        Object.keys(selectionViews).forEach(function (memberId) {
            selectionViews[memberId].rerender();
        });
    };

    /**
     * @param {!(ops.OdtCursor|gui.ShadowCursor)} cursor
     * @param {!boolean} virtualSelectionsInitiallyVisible
     * @return {!gui.SelectionView}
     */
    this.registerCursor = function (cursor, virtualSelectionsInitiallyVisible) {
        var memberId = cursor.getMemberId(),
            selectionView = new SelectionView(cursor);

        if (virtualSelectionsInitiallyVisible) {
            selectionView.show();
        } else {
            selectionView.hide();
        }

        selectionViews[memberId] = selectionView;
        return selectionView;
    };

    /**
     * @param {function(!Error=)} callback
     */
    this.destroy = function (callback) {
        var selectionViewArray = getSelectionViews();

        /**
         * @param {!number} i
         * @param {!Error=} err
         * @return {undefined}
         */
        function destroySelectionView(i, err) {
            if (err) {
                callback(err);
            } else {
                if (i < selectionViewArray.length) {
                    selectionViewArray[i].destroy(function (err) {
                        destroySelectionView(i + 1, err);
                    });
                } else {
                    callback();
                }
            }
        }
        destroySelectionView(0, undefined);
    };
};
