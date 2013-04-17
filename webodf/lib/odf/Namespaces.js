/**
 * @license
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
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
 * @source: http://gitorious.org/webodf/webodf/
 */

/*global odf*/

/**
 * @constructor
 * @return {?}
 */
odf.Namespaces = (function () {
    "use strict";

    var drawns = "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
        fons = "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
        officens = "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
        presentationns = "urn:oasis:names:tc:opendocument:xmlns:presentation:1.0",
        stylens = "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
        svgns = "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
        tablens = "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
        textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
        xlinkns = 'http://www.w3.org/1999/xlink',
        xmlns = "http://www.w3.org/XML/1998/namespace";

    /**
     * @constructor
     * @return {?}
     */
    odf.Namespaces = function Namespaces() {
        var self = this,
            /** @const@type {!Object.<!string>} */
            standardNamespaceMap = {
                "draw": drawns,
                "fo": fons,
                "office": officens,
                "presentation": presentationns,
                "style": stylens,
                "svg": svgns,
                "table": tablens,
                "text": textns,
                "xlink": xlinkns,
                "xml": xmlns
            };

        /**
         * @param {function(string,string)} cb
         * @return {undefined}
         */
        this.forEachPrefix = function (cb) {
            var prefix;

            for (prefix in standardNamespaceMap) {
                if (standardNamespaceMap.hasOwnProperty(prefix)) {
                    cb(prefix, standardNamespaceMap[prefix]);
                }
            }
        };

         /**
          * @return {!Object.<!string>}
          */
        this.getNamespaceMap = function () {
            return standardNamespaceMap;
        };

        /**
         * @param {!string} prefix
         * @return {?string}
         */
        this.resolvePrefix = function (prefix) {
            return standardNamespaceMap[prefix] || null;
        };

        // TODO: document where and why this is needed
        this.resolvePrefix.lookupNamespaceURI = this.resolvePrefix;
    };

    // add all namespaces as global properties
    /**@const@type {!string}*/ odf.Namespaces.drawns = drawns;
    /**@const@type {!string}*/ odf.Namespaces.fons = fons;
    /**@const@type {!string}*/ odf.Namespaces.officens = officens;
    /**@const@type {!string}*/ odf.Namespaces.presentationns = presentationns;
    /**@const@type {!string}*/ odf.Namespaces.stylens = stylens;
    /**@const@type {!string}*/ odf.Namespaces.svgns = svgns;
    /**@const@type {!string}*/ odf.Namespaces.tablens = tablens;
    /**@const@type {!string}*/ odf.Namespaces.textns = textns;
    /**@const@type {!string}*/ odf.Namespaces.xlinkns = xlinkns;
    /**@const@type {!string}*/ odf.Namespaces.xmlns = xmlns;

    return odf.Namespaces;
}());
