/**
 * @license
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

/*global gui, runtime, odf*/

runtime.loadClass("odf.OdfNodeFilter");
runtime.loadClass("odf.TextSerializer");

/**
 * MimeDataExporter exports a passed range as several types
 * into the passed DataTransfer object
 * @constructor
 */
gui.MimeDataExporter = function MimeDataExporter() {
    "use strict";

    var /**@type{!odf.TextSerializer}*/
        textSerializer,
        filter;

    /**
     * Copy the contents of the supplied range into the passed dataTransfer.
     * @param {!DataTransfer} dataTransfer
     * @param {!Range} range Selection range to copy into the clipboard
     * @return {boolean} Returns true if the data was successfully exported into the dataTransfer
     */
    this.exportRangeToDataTransfer = function (dataTransfer, range) {
        var result = true,
            setDataResult,
            document = range.startContainer.ownerDocument,
            fragmentContainer;

        // the document fragment needs to be wrapped in a span as
        // text nodes cannot be inserted at the top level of the DOM
        fragmentContainer = document.createElement('span');
        fragmentContainer.appendChild(range.cloneContents());

        setDataResult = dataTransfer.setData('text/plain', textSerializer.writeToString(fragmentContainer));
        result = result && setDataResult;

        return result;
    };

    function init() {
        textSerializer = new odf.TextSerializer();
        filter = new odf.OdfNodeFilter();
        textSerializer.filter = filter;
    }

    init();
};
