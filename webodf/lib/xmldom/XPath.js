/**
 * Copyright (C) 2011 KO GmbH <jos.van.den.oever@kogmbh.com>
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
 * @source: http://gitorious.org/odfkit/webodf/
 */
/*global xmldom, XPathResult, runtime*/
/**
 * Wrapper for XPath functions
 * @constructor
 */
xmldom.XPath = (function () {
    "use strict";
    var createXPathPathIterator;
    /**
     * Iterator over nodes uses in the xpath implementation
     * @class
     * @interface
     */
    function XPathIterator() {}
    /**
     * @return {Node}
     */
    XPathIterator.prototype.next = function () {};
    /**
     * @class
     * @constructor
     * @augments XPathIterator
     * @implements {XPathIterator}
     * @param {Array.<Node>} array
     */
    function ArrayIterator(array) {
        var pos = 0;
        this.next = function next() {
            var val;
            if (pos < array.length) {
                val = array[pos];
                pos += 1;
            }
            return val;
        };
    }
    /**
     * @class
     * @constructor
     * @augments XPathIterator
     * @implements {XPathIterator}
     * @param {XPathIterator} it
     * @param {boolean} recurse
     */
    function AllChildElementIterator(it, recurse) {
        var root = it.next(),
            node = null;
        this.next = function next() {
            while (root) {
                if (node) {
                    if (recurse && node.firstChild) {
                        node = node.firstChild;
                    } else {
                        while (!node.nextSibling && node !== root) {
                            node = node.parentNode;
                        }
                        if (node === root) {
                            root = it.next();
                            node = null;
                        } else {
                            node = node.nextSibling;
                        }
                    }
                } else {
                    do {
                        node = root.firstChild;
                        if (!node) {
                            root = it.next();
                        }
                    } while (root && !node);
                }
                if (node && node.nodeType === 1) {
                    return node;
                }
            }
            return null;
        };
    }
    /**
     * @class
     * @constructor
     * @augments XPathIterator
     * @implements {XPathIterator}
     * @param {XPathIterator} it
     * @param {function(Node):boolean} condition
     */
    function ConditionIterator(it, condition) {
        this.next = function next() {
            var n = it.next();
            while (n && !condition(n)) {
                n = it.next();
            }
            return n;
        };
    }
    /**
     * @param {XPathIterator} it
     * @param {string} condition
     * @param {function(string):string} namespaceResolver
     * @return {ConditionIterator}
     */
    function createConditionIterator(it, condition, namespaceResolver) {
runtime.log(condition);
        return new ConditionIterator(it, function (node) { return true; });
    }
    /**
     * @class
     * @constructor
     * @augments XPathIterator
     * @implements {XPathIterator}
     * @param {XPathIterator} it
     * @param {string} xpath
     * @param {function(string):string} namespaceResolver
     */
    function XPathPathIterator(it, xpath, namespaceResolver) {
        var namespace,
            localName;
        function init() {
            var pos = xpath.indexOf('['),
                l = xpath.length,
                selector,
                depth = 0,
                start = 0;
            it = new AllChildElementIterator(it, false);
            if (pos === -1) {
                selector = xpath;
            } else {
                selector = xpath.substring(0, pos);
            }
            if (selector !== '*') {
                selector = selector.split(':', 2);
                namespace = namespaceResolver(selector[0]);
                localName = selector[1];
                it = new ConditionIterator(it, function (node) {
                    return node.localName === localName &&
                        node.namespaceURI === namespace;
                });
            }
            if (pos !== -1) {
                while (pos < l) {
                    if (xpath[pos] === ']') {
                        depth -= 1;
                        if (depth <= 0) {
                            it = createConditionIterator(it,
                                    xpath.substring(start, pos),
                                    namespaceResolver);
                        }
                    } else if (xpath[pos] === '[') {
                        if (depth <= 0) {
                            start = pos + 1;
                        }
                        depth += 1;
                    }
                    pos += 1;
                }
            }
        }
        this.next = function next() {
            return it.next();
        };
        init();
    }
    /**
     * @param {!XPathIterator} it
     * @param {!string} xpath
     * @param {!Function} namespaceResolver
     * @return {!XPathIterator}
     */
    createXPathPathIterator = function createXPathPathIterator(it, xpath, namespaceResolver) {
        var i, xpaths = xpath.split('/'); // TODO: Need to split more carefully
        for (i = 0; it && i < xpaths.length; i += 1) {
            xpath = xpaths[i];
            if (xpath === "") {
                it = new AllChildElementIterator(it, true);
            } else if (xpath !== ".") {
                it = new XPathPathIterator(it, xpath, namespaceResolver);
            }
        }
        return it;
    };
    /**
     * @param {!Element} node
     * @param {!string} xpath
     * @param {!Function} namespaceResolver
     * @return {!Array.<Element>}
     */
    function fallback(node, xpath, namespaceResolver) {
        var it = new ArrayIterator([node]),
            i,
            nodelist;
        it = createXPathPathIterator(it, xpath, namespaceResolver);
        nodelist = [];
        i = it.next();
        while (i) {
            nodelist.push(i);
            i = it.next();
        }
        return nodelist;
    }
    /**
     * @param {!Element} node
     * @param {!string} xpath
     * @param {!Function} namespaceResolver
     * @return {!Array.<Element>}
     */
    function getODFElementsWithXPath(node, xpath, namespaceResolver) {
        var doc = node.ownerDocument,
            nodes, elements = [], n = null;
        if (!doc || !doc.evaluate) {
            elements = fallback(node, xpath, namespaceResolver);
        } else {
            nodes = doc.evaluate(xpath, node, namespaceResolver,
                XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
            n = nodes.iterateNext();
            while (n !== null) {
                if (n.nodeType === 1) {
                    elements.push(n);
                }
                n = nodes.iterateNext();
            }
        }
        return elements;
    }
    /**
     * @constructor
     */
    xmldom.XPath = function XPath() {
        this.getODFElementsWithXPath = getODFElementsWithXPath;
    };
    return xmldom.XPath;
}());
