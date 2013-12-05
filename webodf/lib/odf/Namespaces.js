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
 */
odf.Namespaces = {
    namespaceMap: {
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
    /**@type{!Object.<string,string>}*/
    prefixMap: {},
    dbns: "urn:oasis:names:tc:opendocument:xmlns:database:1.0",
    dcns: "http://purl.org/dc/elements/1.1/",
    dr3dns: "urn:oasis:names:tc:opendocument:xmlns:dr3d:1.0",
    drawns: "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
    chartns: "urn:oasis:names:tc:opendocument:xmlns:chart:1.0",
    fons: "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
    formns: "urn:oasis:names:tc:opendocument:xmlns:form:1.0",
    metans: "urn:oasis:names:tc:opendocument:xmlns:meta:1.0",
    numberns: "urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0",
    officens: "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    presentationns: "urn:oasis:names:tc:opendocument:xmlns:presentation:1.0",
    stylens: "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
    svgns: "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
    tablens: "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
    textns: "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    xlinkns: 'http://www.w3.org/1999/xlink',
    xmlns: "http://www.w3.org/XML/1998/namespace"
};

(function () {
    "use strict";
    // map namespacemap to prefix map on startup
    var map = odf.Namespaces.namespaceMap,
        /**@type{!Object.<string,string>}*/
        pmap = odf.Namespaces.prefixMap,
        /**@type{string}*/
        prefix;

    for (prefix in map) {
        if (map.hasOwnProperty(prefix)) {
            pmap[map[prefix]] = prefix;
        }
    }
}());

/**
 * Calls the passed callback for all pairs of prefix and namespace
 * which are in the namespaceMap property
 * @param {function(string,string):undefined} cb
 * @return {undefined}
 */
odf.Namespaces.forEachPrefix = function forEachPrefix(cb) {
    "use strict";
    var /**@type{!Object.<string,string>}*/
        ns = odf.Namespaces.namespaceMap,
        /**@type{string}*/
        prefix;

    for (prefix in ns) {
        if (ns.hasOwnProperty(prefix)) {
            cb(prefix, ns[prefix]);
        }
    }
};

/**
 * Returns the namespace belonging to the prefix or null.
 * @param {string} prefix
 * @return {?string}
 */
odf.Namespaces.lookupNamespaceURI = function lookupNamespaceURI(prefix) {
    "use strict";
    var /**@type{?string}*/
        r = null;
    if (odf.Namespaces.namespaceMap.hasOwnProperty(prefix)) {
        r = /**@type{string}*/(odf.Namespaces.namespaceMap[prefix]);
    }
    return r;
};

/**
 * Returns the prefix belonging to the NamespaceURI or null.
 * @param {string} namespaceURI
 * @return {?string}
 */
odf.Namespaces.lookupPrefix = function lookupPrefix(namespaceURI) {
    "use strict";
    var /**@type{!Object.<string,string>}*/
        map = odf.Namespaces.prefixMap;
    return map.hasOwnProperty(namespaceURI) ? map[namespaceURI] : null;
};

// TODO: document where and why this is needed
odf.Namespaces.lookupNamespaceURI.lookupNamespaceURI = odf.Namespaces.lookupNamespaceURI;

