/**
 * Copyright (C) 2012 KO GmbH <aditya.bhatt@kogmbh.com>
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

/*global core, ops, runtime*/

/**
 * @constructor
 * @implements {core.Destroyable}
 * @param {!Element} container
 * @param {!ops.OdtDocument} odtDocument
 */
ops.EditInfo = function EditInfo(container, odtDocument) {
    "use strict";
    var /**@type {!Element}*/
        editInfoNode,
        /**@type {!Object.<!string,{time:!Date}>}*/
        editHistory = {};

    /**
     * @return {!Array.<{memberid:!string,time:!Date}>}
     */
    function sortEdits() {
        var /**@type {!Array.<{memberid:!string,time:!Date}>}*/
            arr = [],
            /**@type{string}*/
            memberid;
        for (memberid in editHistory) {
            if (editHistory.hasOwnProperty(memberid)) {
                arr.push({
                    'memberid': memberid,
                    'time': editHistory[memberid].time
                });
            }
        }

        arr.sort(function (a, b) {
            return a.time - b.time;
        });

        return arr;
    }

    /**
     * @return {!Element}
     */
    this.getNode = function () {
        return editInfoNode;
    };

    /**
     * @return {!ops.OdtDocument}
     */
    this.getOdtDocument = function () {
        return odtDocument;
    };

    /**
     * @return {!Object.<!string,{time:!Date}>}
     */
    this.getEdits = function () {
        return editHistory;
    };

    /**
     * Returns the sorted list of memberid/time pairs, with oldest first.
     * @return {!Array.<{memberid:!string,time:!Date}>}
     */
    this.getSortedEdits = function () {
        return sortEdits();
    };

    /**
     * @param {!string} memberid
     * @param {!Date} timestamp
     * @return {undefined}
     */
    this.addEdit = function (memberid, timestamp) {
        // log the edit time for this memberid
        editHistory[memberid] = {
            time: timestamp
        };
    };

    /**
     * @return {undefined}
     */
    this.clearEdits = function () {
        editHistory = {};
    };

    /**
     * @param {!function(!Error=)} callback, passing an error object in case of error
     * @return {undefined}
     */
    this.destroy = function (callback) {
        // TODO: have EditInfo cleaned up if the paragraph is deleted, not happening right now
        // workaround: check if the container is still in the DOM
        if (container.parentNode) {
            container.removeChild(editInfoNode);
        }
        callback();
    };

    function init() {
        var editInfons = 'urn:webodf:names:editinfo',
            dom = odtDocument.getDOMDocument();

        editInfoNode = dom.createElementNS(editInfons, 'editinfo');
        container.insertBefore(editInfoNode, container.firstChild);
    }

    init();
};
