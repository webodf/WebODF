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

/*global Node, xmldom, XPathResult, runtime*/
/*jslint emptyblock: true*/

/**
 * Iterator over nodes uses in the xpath implementation
 * @class
 * @interface
 */
xmldom.XPathIterator = function XPathIterator() {"use strict"; };
/**
 * @return {?Node}
 */
xmldom.XPathIterator.prototype.next = function () {"use strict"; };
/**
 * @return {undefined}
 */
xmldom.XPathIterator.prototype.reset = function () {"use strict"; };
/*jslint emptyblock: false*/

/**
 * @typedef{{
    steps: !Array.<{
        predicates: !Array.<!xmldom.XPathAtom>,
        location:   string
    }>,
    value: *
}}*/
xmldom.XPathAtom;

/**
 * @return {!{getODFElementsWithXPath:function(!Element,!string,!function(string):?string):!Array.<!Element>}}
 */
function createXPathSingleton() {
    "use strict";
    var /**@type{function(!xmldom.XPathIterator,!xmldom.XPathAtom,!Function):!xmldom.XPathIterator}*/
        createXPathPathIterator,
        /**@type{function(string,number,!Array.<!xmldom.XPathAtom>):number}*/
        parsePredicates;
    /**
     * @param {!number} a
     * @param {!number} b
     * @param {!number} c
     * @return {!boolean}
     */
    function isSmallestPositive(a, b, c) {
        return a !== -1 && (a < b || b === -1) && (a < c || c === -1);
    }
    /**
     * Parse a subset of xpaths.
     * The xpath predicates may contain xpaths. The location may be equated to
     * a value. If a parsing error occurs, null is returned.
     * @param {!string} xpath
     * @param {!number} pos
     * @param {!number} end
     * @param {!Array} steps
     * @return {number}
     */
    function parseXPathStep(xpath, pos, end, steps) {
        var location = "",
            predicates = [],
            /**@type{number}*/
            brapos = xpath.indexOf('[', pos),
            /**@type{number}*/
            slapos = xpath.indexOf('/', pos),
            /**@type{number}*/
            eqpos = xpath.indexOf('=', pos);
        // parse the location
        if (isSmallestPositive(slapos, brapos, eqpos)) {
            location = xpath.substring(pos, slapos);
            pos = slapos + 1;
        } else if (isSmallestPositive(brapos, slapos, eqpos)) {
            location = xpath.substring(pos, brapos);
            pos = parsePredicates(xpath, brapos, predicates);
        } else if (isSmallestPositive(eqpos, slapos, brapos)) {
            location = xpath.substring(pos, eqpos);
            pos = eqpos;
        } else {
            location = xpath.substring(pos, end);
            pos = end;
        }
        steps.push({location: location, predicates: predicates});
        return pos;
    }
    /**
     * @param {string} xpath
     * @return {!xmldom.XPathAtom}
     */
    function parseXPath(xpath) {
        var /**@type{!Array.<{predicates: !Array.<!xmldom.XPathAtom>,location:string}>}*/
            steps = [],
            p = 0,
            end = xpath.length,
            value;
        while (p < end) {
            p = parseXPathStep(xpath, p, end, steps);
            if (p < end && xpath[p] === '=') {
                value = xpath.substring(p + 1, end);
                if (value.length > 2 &&
                        (value[0] === '\'' || value[0] === '"')) {
                    value = value.slice(1, value.length - 1);
                } else {
                    try {
                        value = parseInt(value, 10);
                    } catch (ignore) {
                    }
                }
                p = end;
            }
        }
        return {steps: steps, value: value};
    }
    /**
     * @param {string} xpath
     * @param {number} start
     * @param {!Array.<!xmldom.XPathAtom>} predicates
     * @return {number}
     */
    parsePredicates = function parsePredicates(xpath, start, predicates) {
        var pos = start,
            l = xpath.length,
            depth = 0;
        while (pos < l) {
            if (xpath[pos] === ']') {
                depth -= 1;
                if (depth <= 0) {
                    predicates.push(parseXPath(xpath.substring(start, pos)));
                }
            } else if (xpath[pos] === '[') {
                if (depth <= 0) {
                    start = pos + 1;
                }
                depth += 1;
            }
            pos += 1;
        }
        return pos;
    };
    /**
     * @class
     * @constructor
     * @augments xmldom.XPathIterator
     * @implements {xmldom.XPathIterator}
     */
    function XPathNodeIterator() {
        var /**@type{?Node}*/
            node = null,
            /**@type{boolean}*/
            done = false;
        /**
         * @param {?Node} n
         * @return {undefined}
         */
        this.setNode = function setNode(n) {
            node = n;
        };
        /**
         * @return {undefined}
         */
        this.reset = function () {
            done = false;
        };
        /**
         * @return {?Node}
         */
        this.next = function next() {
            var val = done ? null : node;
            done = true;
            return val;
        };
    }
    /**
     * @class
     * @constructor
     * @augments xmldom.XPathIterator
     * @implements {xmldom.XPathIterator}
     * @param {xmldom.XPathIterator} it
     * @param {!string} namespace
     * @param {!string} localName
     */
    function AttributeIterator(it, namespace, localName) {
        this.reset = function reset() {
            it.reset();
        };
        /**
         * @return {?Node}
         */
        this.next = function next() {
            var node = it.next();
            while (node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    node = /**@type{!Element}*/(node).getAttributeNodeNS(
                        namespace,
                        localName
                    );
                }
                if (node) {
                    return node;
                }
                node = it.next();
            }
            return node;
        };
    }
    /**
     * @class
     * @constructor
     * @augments xmldom.XPathIterator
     * @implements {xmldom.XPathIterator}
     * @param {xmldom.XPathIterator} it
     * @param {boolean} recurse
     */
    function AllChildElementIterator(it, recurse) {
        var root = it.next(),
            node = null;
        this.reset = function reset() {
            it.reset();
            root = it.next();
            node = null;
        };
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
                        } else {
                            node = node.nextSibling;
                        }
                    }
                } else {
                    do {
//                        node = (recurse) ?root :root.firstChild;
                        node = root.firstChild;
                        if (!node) {
                            root = it.next();
                        }
                    } while (root && !node);
                }
                if (node && node.nodeType === Node.ELEMENT_NODE) {
                    return node;
                }
            }
            return null;
        };
    }
    /**
     * @class
     * @constructor
     * @augments xmldom.XPathIterator
     * @implements {xmldom.XPathIterator}
     * @param {xmldom.XPathIterator} it
     * @param {function(Node):boolean} condition
     */
    function ConditionIterator(it, condition) {
        this.reset = function reset() {
            it.reset();
        };
        this.next = function next() {
            var n = it.next();
            while (n && !condition(n)) {
                n = it.next();
            }
            return n;
        };
    }
    /**
     * @param {xmldom.XPathIterator} it
     * @param {string} name
     * @param {function(string):?string} namespaceResolver
     * @return {!ConditionIterator}
     */
    function createNodenameFilter(it, name, namespaceResolver) {
        var s = name.split(':', 2),
            namespace = namespaceResolver(s[0]),
            localName = s[1];
        return new ConditionIterator(it, function (node) {
            return node.localName === localName &&
                node.namespaceURI === namespace;
        });
    }
    /**
     * @param {xmldom.XPathIterator} it
     * @param {!xmldom.XPathAtom} p
     * @param {function(string):?string} namespaceResolver
     * @return {!ConditionIterator}
     */
    function createPredicateFilteredIterator(it, p, namespaceResolver) {
        var nit = new XPathNodeIterator(),
            pit = createXPathPathIterator(nit, p, namespaceResolver),
            value = p.value;
        if (value === undefined) {
            return new ConditionIterator(it, function (node) {
                nit.setNode(node);
                pit.reset();
                return pit.next() !== null;
            });
        }
        return new ConditionIterator(it, function (node) {
            nit.setNode(node);
            pit.reset();
            var n = pit.next();
            // todo: distinuish between number and string
            return n ? n.nodeValue === value : false;
        });
    }
    /**
     * @param {!Array.<!xmldom.XPathAtom>} p
     * @param {!number} i
     * @return {!xmldom.XPathAtom}
     */
    function item(p, i) {
        return p[i];
    }
    /**
     * @param {!xmldom.XPathIterator} it
     * @param {!xmldom.XPathAtom} xpath
     * @param {!function(string):?string} namespaceResolver
     * @return {!xmldom.XPathIterator}
     */
    createXPathPathIterator = function createXPathPathIterator(it, xpath,
                namespaceResolver) {
        var i, j, step, location, s, p, ns;
        for (i = 0; i < xpath.steps.length; i += 1) {
            step = xpath.steps[i];
            location = step.location;
            if (location === "") {
                it = new AllChildElementIterator(it, false);
            } else if (location[0] === '@') {
                s = location.substr(1).split(":", 2);
                ns = namespaceResolver(s[0]);
                if (!ns) {
                    throw "No namespace associated with the prefix " + s[0];
                }
                it = new AttributeIterator(it, ns, s[1]);
            } else if (location !== ".") {
                it = new AllChildElementIterator(it, false);
                if (location.indexOf(":") !== -1) {
                    it = createNodenameFilter(it, location, namespaceResolver);
                }
            }
            for (j = 0; j < step.predicates.length; j += 1) {
                p = item(step.predicates, j);
                it = createPredicateFilteredIterator(it, p, namespaceResolver);
            }
        }
        return it;
    };
    /**
     * @param {!Element} node
     * @param {!string} xpath
     * @param {!function(string):?string} namespaceResolver
     * @return {!Array.<Element>}
     */
    function fallback(node, xpath, namespaceResolver) {
        var it = new XPathNodeIterator(),
            i,
            nodelist,
            parsedXPath;
        it.setNode(node);
        parsedXPath = parseXPath(xpath);
        it = createXPathPathIterator(it, parsedXPath, namespaceResolver);
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
     * @param {!function(string):?string} namespaceResolver
     * @return {!Array.<!Element>}
     */
    function getODFElementsWithXPath(node, xpath, namespaceResolver) {
        var doc = node.ownerDocument,
            nodes,
            elements = [],
            n = null;
        if (!doc || typeof doc.evaluate !== 'function') {
            elements = fallback(node, xpath, namespaceResolver);
        } else {
            nodes = doc.evaluate(xpath, node, namespaceResolver,
                XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
            n = nodes.iterateNext();
            while (n !== null) {
                if (n.nodeType === Node.ELEMENT_NODE) {
                    elements.push(n);
                }
                n = nodes.iterateNext();
            }
        }
        return elements;
    }
    return {
        getODFElementsWithXPath: getODFElementsWithXPath
    };
}
/**
 * Wrapper for XPath functions
 * @const
 * @type {!{getODFElementsWithXPath:function(!Element,!string,!function(string):?string):!Array.<!Element>}}
 */
xmldom.XPath = createXPathSingleton();
