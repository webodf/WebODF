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

/*global gui, runtime, odf*/

/**
 * MimeDataExporter exports a passed range as several types
 * into the passed DataTransfer object
 * @constructor
 */
gui.MimeDataExporter = function MimeDataExporter() {
    "use strict";

    var /**@type{!odf.TextSerializer}*/
        textSerializer;

    /**
     * Copy the contents of the supplied range into the passed dataTransfer.
     * @param {!DataTransfer} dataTransfer
     * @param {!Range} range Selection range to copy into the clipboard
     * @return {undefined}
     */
    this.exportRangeToDataTransfer = function (dataTransfer, range) {
        var document = range.startContainer.ownerDocument,
            serializedFragment,
            fragmentContainer;

        // the document fragment needs to be wrapped in a span as
        // text nodes cannot be inserted at the top level of the DOM
        fragmentContainer = document.createElement('span');
        fragmentContainer.appendChild(range.cloneContents());
        serializedFragment = textSerializer.writeToString(fragmentContainer);
        try {
            dataTransfer.setData('text/plain', serializedFragment);
        } catch(e) {
            // Internet Explorer only supports the 'Text' key being set
            // See http://msdn.microsoft.com/en-us/library/ie/ms536744%28v=vs.85%29.aspx
            // Could do some browser sniffing potentially, but this is less error prone as it
            // doesn't rely on the agent string being correct.
            dataTransfer.setData('Text', serializedFragment);
        }
    };

    function init() {
        textSerializer = new odf.TextSerializer();
        textSerializer.filter = new odf.OdfNodeFilter();
    }

    init();
};
