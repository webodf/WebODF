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

/*global odf*/

/**
 * Singleton object which provides namespace ids and
 * some utility methods related to prefixes and namespaces
 * @const
 * @type{!Object.<string,string>}
 */
odf.Namespaces = (function () {
    "use strict";

    var ns = {
        db: "urn:oasis:names:tc:opendocument:xmlns:database:1.0",
        dc: "http://purl.org/dc/elements/1.1/",
        dr3d: "urn:oasis:names:tc:opendocument:xmlns:dr3d:1.0",
        draw: "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
        chart: "urn:oasis:names:tc:opendocument:xmlns:chart:1.0",
        fo: "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
        form: "urn:oasis:names:tc:opendocument:xmlns:form:1.0",
        meta: "urn:oasis:names:tc:opendocument:xmlns:meta:1.0",
        number: "urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0",
        office: "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
        presentation: "urn:oasis:names:tc:opendocument:xmlns:presentation:1.0",
        style: "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
        svg: "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
        table: "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
        text: "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
        xlink: 'http://www.w3.org/1999/xlink',
        xml: "http://www.w3.org/XML/1998/namespace"
    },
        // create the actual odf.Namespaces object as a function, because the
        // class loader of runtime expects a function
        namespaces;
    /*jslint emptyblock: true*/
    namespaces = function Namespaces() {
    };
    /*jslint emptyblock: false*/
    namespaces.namespaceMap = ns;
    return namespaces;
}());

/**
 * Calls the passed callback for all pairs of prefix and namespace
 * which are in the namespaceMap property
 * @param {function(string,string)} cb
 * @return {undefined}
 */
odf.Namespaces.forEachPrefix = function forEachPrefix(cb) {
    "use strict";
    var ns = odf.Namespaces.namespaceMap,
        prefix;

    for (prefix in ns) {
        if (ns.hasOwnProperty(prefix)) {
            cb(prefix, ns[prefix]);
        }
    }
};

/**
 * Returns the namespace belonging to the prefix or null.
 * @param {!string} prefix
 * @return {?string}
 */
odf.Namespaces.resolvePrefix = function resolvePrefix(prefix) {
    "use strict";
    return odf.Namespaces.namespaceMap[prefix] || null;
};

// TODO: document where and why this is needed
odf.Namespaces.resolvePrefix.lookupNamespaceURI = odf.Namespaces.resolvePrefix;

// add all namespaces
/**@type{!string}*/
odf.Namespaces.dbns = odf.Namespaces.namespaceMap.db;
/**@type{!string}*/
odf.Namespaces.dcns = odf.Namespaces.namespaceMap.dc;
/**@type{!string}*/
odf.Namespaces.dr3dns = odf.Namespaces.namespaceMap.dr3d;
/**@type{!string}*/
odf.Namespaces.drawns = odf.Namespaces.namespaceMap.draw;
/**@type{!string}*/
odf.Namespaces.chartns = odf.Namespaces.namespaceMap.chart;
/**@type{!string}*/
odf.Namespaces.fons = odf.Namespaces.namespaceMap.fo;
/**@type{!string}*/
odf.Namespaces.formns = odf.Namespaces.namespaceMap.form;
/**@type{!string}*/
odf.Namespaces.metans = odf.Namespaces.namespaceMap.meta;
/**@type{!string}*/
odf.Namespaces.numberns = odf.Namespaces.namespaceMap.number;
/**@type{!string}*/
odf.Namespaces.officens = odf.Namespaces.namespaceMap.office;
/**@type{!string}*/
odf.Namespaces.presentationns = odf.Namespaces.namespaceMap.presentation;
/**@type{!string}*/
odf.Namespaces.stylens = odf.Namespaces.namespaceMap.style;
/**@type{!string}*/
odf.Namespaces.svgns = odf.Namespaces.namespaceMap.svg;
/**@type{!string}*/
odf.Namespaces.tablens = odf.Namespaces.namespaceMap.table;
/**@type{!string}*/
odf.Namespaces.textns = odf.Namespaces.namespaceMap.text;
/**@type{!string}*/
odf.Namespaces.xlinkns = odf.Namespaces.namespaceMap.xlink;
/**@type{!string}*/
odf.Namespaces.xmlns = odf.Namespaces.namespaceMap.xml;
(function () {
    "use strict";
    return odf.Namespaces;
}());
