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

/*global core, gui*/

/**
 * @constructor
 * @implements {core.Destroyable}
 * @param {!Element} parentElement
 */
gui.EditInfoHandle = function EditInfoHandle(parentElement) {
    "use strict";

    var /**@type{!Array.<{memberid:!string,time:!Date}>}*/
        edits = [],
        /**@type{!HTMLDivElement}*/
        handle,
        document = /**@type{!Document}*/(parentElement.ownerDocument),
        htmlns = document.documentElement.namespaceURI,
        editinfons = 'urn:webodf:names:editinfo';

    function renderEdits() {
        var i, infoDiv, colorSpan, authorSpan, timeSpan;
        core.DomUtils.removeAllChildNodes(handle);
        for (i = 0; i < edits.length; i += 1) {
            infoDiv = document.createElementNS(htmlns, 'div');
            infoDiv.className = "editInfo";

            colorSpan = document.createElementNS(htmlns, 'span');
            colorSpan.className = "editInfoColor";
            colorSpan.setAttributeNS(editinfons, 'editinfo:memberid', edits[i].memberid);

            authorSpan = document.createElementNS(htmlns, 'span');
            authorSpan.className = "editInfoAuthor";
            authorSpan.setAttributeNS(editinfons, 'editinfo:memberid', edits[i].memberid);

            timeSpan = document.createElementNS(htmlns, 'span');
            timeSpan.className = "editInfoTime";
            timeSpan.setAttributeNS(editinfons, 'editinfo:memberid', edits[i].memberid);
            timeSpan.appendChild(document.createTextNode(edits[i].time.toString()));

            infoDiv.appendChild(colorSpan);
            infoDiv.appendChild(authorSpan);
            infoDiv.appendChild(timeSpan);
            handle.appendChild(infoDiv);
        }
    }

    /**
     * @param {!Array.<{memberid:!string,time:!Date}>} editArray
     */
    this.setEdits = function (editArray) {
        edits = editArray;
        renderEdits();
    };

    this.show = function () {
        handle.style.display = 'block';
    };

    this.hide = function () {
        handle.style.display = 'none';
    };

    /**
     * @param {!function(!Error=)} callback, passing an error object in case of error
     * @return {undefined}
     */
    this.destroy = function (callback) {
        parentElement.removeChild(handle);
        callback();
    };

    function init() {
        handle = /**@type{!HTMLDivElement}*/(document.createElementNS(htmlns, "div"));
        handle.setAttribute('class', 'editInfoHandle');

        handle.style.display = 'none';
        parentElement.appendChild(handle);
    }

    init();
};
