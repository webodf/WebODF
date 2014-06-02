/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
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

/*global Node, NodeFilter, xmldom, runtime*/

/*jslint sub: true, emptyblock: true*/
if (typeof Object.create !== 'function') {
    /**
     * @param {!Object} o
     * @return {!Object}
     */
    Object['create'] = function (o) {
        "use strict";
        /**
         * @constructor
         */
        var F = function () {};
        F.prototype = o;
        return new F();
    };
}
/*jslint emptyblock: false*/

/**
 * Partial implementation of LSSerializer
 * @constructor
 */
xmldom.LSSerializer = function LSSerializer() {
    "use strict";
    var self = this;

    /**
     * @constructor
     * @param {!Object.<string,string>} nsmap
     */
    function Namespaces(nsmap) {
        /**
         * @param {!Object.<string,string>} map
         * @return {!Object.<string,string>}
         */
        function invertMap(map) {
            var m = {},
                /**@type{string}*/
                i;
            for (i in map) {
                if (map.hasOwnProperty(i)) {
                    m[map[i]] = i;
                }
            }
            return m;
        }
        var /**@type{!Object.<string,string>}*/
            current = nsmap || {},
            /**@type{!Object.<string,string>}*/
            currentrev = invertMap(nsmap),
            /**@type{!Array.<!Object.<string,string>>}*/
            levels = [ current ],
            /**@type{!Array.<!Object.<string,string>>}*/
            levelsrev = [ currentrev ],
            /**@type{number}*/
            level = 0;
        this.push = function () {
            level += 1;
            current = levels[level] = Object.create(current);
            currentrev = levelsrev[level] = Object.create(currentrev);
        };
        this.pop = function () {
            levels.pop();
            levelsrev.pop();
            level -= 1;
            current = levels[level];
            currentrev = levelsrev[level];
        };
        /**
         * @return {!Object.<string,string>} nsmap
         */
        this.getLocalNamespaceDefinitions = function () {
            return currentrev;
        };
        /**
         * @param {!Node} node
         * @return {!string}
         */
        this.getQName = function (node) {
            var ns = node.namespaceURI,
                i = 0,
                p;
            if (!ns) {
                return node.localName;
            }
            p = currentrev[ns];
            if (p) {
                return p + ":" + node.localName;
            }
            do {
                if (p || !node.prefix) {
                    p = "ns" + i;
                    i += 1;
                } else {
                    p = node.prefix;
                }
                if (current[p] === ns) {
                    break;
                }
                if (!current[p]) {
                    current[p] = ns;
                    currentrev[ns] = p;
                    break;
                }
                p = null;
            } while (p === null);
            return p + ":" + node.localName;
        };
    }
    /**
     * Escape characters within document content
     * Follows basic guidelines specified at http://xerces.apache.org/xerces2-j/javadocs/api/org/w3c/dom/ls/LSSerializer.html
     * @param {string} value
     * @return {string}
     */
    function escapeContent(value) {
        return value.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/'/g, "&apos;")
            .replace(/"/g, "&quot;");
    }
    /**
     * @param {!string} qname
     * @param {!Attr} attr
     * @return {!string}
     */
    function serializeAttribute(qname, attr) {
        var escapedValue = typeof attr.value === 'string'
                           ? escapeContent(attr.value)
                           : attr.value,
            /**@type{!string}*/
            s = qname + "=\"" + escapedValue + "\"";
        return s;
    }
    /**
     * @param {!Namespaces} ns
     * @param {!string} qname
     * @param {!Node} element
     * @return {!string}
     */
    function startElement(ns, qname, element) {
        var /**@type{!string}*/ s = "",
            /**@const*/
            atts = /**@type{!NamedNodeMap}*/(element.attributes),
            /**@const
 *             @type{!number}*/
            length,
            /**@type{!number}*/
            i,
            /**@type{!Attr}*/
            attr,
            /**@type{!string}*/
            attstr = "",
            /**@type{!number}*/
            accept,
            /**@type{!string}*/
            prefix,
            nsmap;
        s += "<" + qname;
        length = atts.length;
        for (i = 0; i < length; i += 1) {
            attr = /**@type{!Attr}*/(atts.item(i));
            if (attr.namespaceURI !== "http://www.w3.org/2000/xmlns/") {
                accept = self.filter
                         ? self.filter.acceptNode(attr)
                         : NodeFilter.FILTER_ACCEPT;
                if (accept === NodeFilter.FILTER_ACCEPT) {
                    attstr += " " + serializeAttribute(ns.getQName(attr),
                        attr);
                }
            }
        }
        nsmap = ns.getLocalNamespaceDefinitions();
        for (i in nsmap) {
            if (nsmap.hasOwnProperty(i)) {
                prefix = nsmap[i];
                if (!prefix) {
                    s += " xmlns=\"" + i + "\"";
                } else if (prefix !== "xmlns") {
                    s += " xmlns:" + nsmap[i] + "=\"" + i + "\"";
                }
            }
        }
        s += attstr + ">";
        return s;
    }
    /**
     * @param {!Namespaces} ns
     * @param {!Node} node
     * @return {!string}
     */
    function serializeNode(ns, node) {
        var /**@type{!string}*/
            s = "",
            /**@const
 *             @type{!number}*/
            accept = (self.filter) ? self.filter.acceptNode(node) : NodeFilter.FILTER_ACCEPT,
            /**@type{Node}*/
            child,
            /**@const
 *             @type{string}*/
            qname;
        if (accept === NodeFilter.FILTER_ACCEPT
                && node.nodeType === Node.ELEMENT_NODE) {
            ns.push();
            qname = ns.getQName(node);
            s += startElement(ns, qname, node);
        }
        if (accept === NodeFilter.FILTER_ACCEPT
                || accept === NodeFilter.FILTER_SKIP) {
            child = node.firstChild;
            while (child) {
                s += serializeNode(ns, child);
                child = child.nextSibling;
            }
            if (node.nodeValue) {
                s += escapeContent(node.nodeValue);
            }
        }
        if (qname) {
            s += "</" + qname + ">";
            ns.pop();
        }
        return s;
    }
    /**
     * @type {xmldom.LSSerializerFilter}
     */
    this.filter = null;
    /**
     * @param {?Node} node
     * @param {!Object.<string,string>} nsmap
     * @return {!string}
     */
    this.writeToString = function (node, nsmap) {
        if (!node) {
            return "";
        }
        var ns = new Namespaces(nsmap);
        return serializeNode(ns, node);
    };
};
