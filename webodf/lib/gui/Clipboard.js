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

/*global gui, runtime*/

/**
 * Clipboard wrapper to attempt some semblance of cross-browser clipboard support
 *
 * @param {!gui.MimeDataExporter} mimeDataExporter
 * @constructor
 */
gui.Clipboard = function Clipboard(mimeDataExporter) {
    "use strict";

    /**
     * Copy the contents of the supplied range onto the clipboard (if available).
     * @param {!Event} e
     * @param {!Range} range Selection range to copy into the clipboard
     * @return {boolean} Returns true if the data was successfully copied to the clipboard
     */
    this.setDataFromRange = function (e, range) {
        var result,
            clipboard = e.clipboardData,
            /**@type{?Window}*/window = runtime.getWindow();

        // IE
        if (!clipboard && window) {
            clipboard = window.clipboardData;
        }

        if (clipboard) {
            result = true;
            mimeDataExporter.exportRangeToDataTransfer(/**@type{!DataTransfer}*/(clipboard), range);
            // By calling preventDefault on the copy event, no data is actually placed into the clipboard.
            // However, if we don't call it, the data we add is stripped out and thrown away :-/
            e.preventDefault();
        } else {
            result = false;
        }

        return result;
    };
};
