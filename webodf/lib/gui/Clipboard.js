/**
 * @license
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
 *
 * As additional permission under GNU AGPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * As a special exception to the AGPL, any HTML file which merely makes function
 * calls to this code, and for that purpose includes it by reference shall be
 * deemed a separate work for copyright law purposes. In addition, the copyright
 * holders of this code give you permission to combine this code with free
 * software libraries that are released under the GNU LGPL. You may copy and
 * distribute such a system following the terms of the GNU AGPL for this code
 * and the LGPL for the libraries. If you modify this code, you may extend this
 * exception to your version of the code, but you are not obligated to do so.
 * If you do not wish to do so, delete this exception statement from your
 * version.
 *
 * This license applies to this entire compilation.
 * @licend
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global gui, runtime, odf, xmldom*/

runtime.loadClass("odf.Namespaces");
runtime.loadClass("xmldom.LSSerializer");
runtime.loadClass("odf.OdfNodeFilter");
runtime.loadClass("odf.TextSerializer");

/**
 * Clipboard wrapper to attempt some semblance of cross-browser clipboard support
 * @constructor
 */
gui.Clipboard = function Clipboard() {
    "use strict";
    var /**@type{!xmldom.LSSerializer}*/
        xmlSerializer,
        /**@type{!odf.TextSerializer}*/
        textSerializer,
        filter;

    /**
     * Copy the contents of the supplied range onto the clipboard (if available).
     * @param {!Event} e
     * @param {!Range} range Selection range to copy into the clipboard
     * @return {boolean} Returns true if the data was successfully copied to the clipboard
     */
    this.setDataFromRange = function (e, range) {
        var result = true,
            setDataResult,
            clipboard = e.clipboardData,
            /**@type{?Window}*/window = runtime.getWindow(),
            document = range.startContainer.ownerDocument,
            fragmentContainer;

        if (!clipboard && window) {
            clipboard = window.clipboardData;
        }

        if (clipboard) {
            fragmentContainer = document.createElement('span');

            // the document fragment needs to be wrapped in a span as
            // text nodes cannot be inserted at the top level of the DOM
            fragmentContainer.appendChild(range.cloneContents());

            // By calling preventDefault on the copy event, no data is actually placed into the clipboard.
            // However, if we don't call it, the data we add is stripped out and thrown away :-/
            setDataResult = clipboard.setData('text/plain', textSerializer.writeToString(fragmentContainer));
            result = result && setDataResult;
            // Lazy-man's way of generating pretend html
            setDataResult = clipboard.setData('text/html', xmlSerializer.writeToString(fragmentContainer, odf.Namespaces.namespaceMap));
            result = result && setDataResult;
            e.preventDefault();
        } else {
            result = false;
        }

        return result;
    };

    function init() {
        xmlSerializer = new xmldom.LSSerializer();
        textSerializer = new odf.TextSerializer();
        filter = new odf.OdfNodeFilter();
        xmlSerializer.filter = filter;
        textSerializer.filter = filter;
    }

    init();
};
