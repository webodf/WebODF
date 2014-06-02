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

/*global Node, runtime, xmldom*/

/**
 * RelaxNG can check a DOM tree against a Relax NG schema
 * The RelaxNG implementation is currently not complete. Relax NG should not
 * report errors on valid DOM trees, but it will not check all constraints that
 * a Relax NG file can define. The current implementation does not load external
 * parts of a Relax NG file.
 * The main purpose of this Relax NG engine is to validate runtime ODF
 * documents. The DOM tree is traversed via a TreeWalker. A custom TreeWalker
 * implementation can hide parts of a DOM tree. This is useful in WebODF, where
 * special elements and attributes in the runtime DOM tree.
 *
 * implementation according to
 * http://www.thaiopensource.com/relaxng/derivative.html
 */
/**
 * @typedef {{
 *     type: string,
 *     nullable: boolean,
 *     hash: (undefined|string),
 *     nc: (undefined|!xmldom.RelaxNGItem),
 *     p: (undefined|!xmldom.RelaxNGItem),
 *     p1: (undefined|!xmldom.RelaxNGItem),
 *     p2: (undefined|!xmldom.RelaxNGItem),
 *     textDeriv: (undefined|function(*=,*=):xmldom.RelaxNGItem),
 *     startTagOpenDeriv: (undefined|function(*=):xmldom.RelaxNGItem),
 *     attDeriv: function(*=,*=):xmldom.RelaxNGItem,
 *     startTagCloseDeriv: function():xmldom.RelaxNGItem,
 *     endTagDeriv: (undefined|function():xmldom.RelaxNGItem)
 *  }}*/
xmldom.RelaxNGItem;
/**
 * @constructor
 */
xmldom.RelaxNG = function RelaxNG() {
    "use strict";
    var xmlnsns = "http://www.w3.org/2000/xmlns/",
        createChoice,
        createInterleave,
        createGroup,
        createAfter,
        createOneOrMore,
        createValue,
        createAttribute,
        createNameClass,
        createData,
        makePattern,
        applyAfter,
        childDeriv,
        rootPattern,
        /**@type{!xmldom.RelaxNGItem}*/
        notAllowed = {
            type: "notAllowed",
            nullable: false,
            hash: "notAllowed",
            nc: undefined,
            p: undefined,
            p1: undefined,
            p2: undefined,
            textDeriv: function () { return notAllowed; },
            startTagOpenDeriv: function () { return notAllowed; },
            attDeriv: function () { return notAllowed; },
            startTagCloseDeriv: function () { return notAllowed; },
            endTagDeriv: function () { return notAllowed; }
        },
        /**@type{!xmldom.RelaxNGItem}*/
        empty = {
            type: "empty",
            nullable: true,
            hash: "empty",
            nc: undefined,
            p: undefined,
            p1: undefined,
            p2: undefined,
            textDeriv: function () { return notAllowed; },
            startTagOpenDeriv: function () { return notAllowed; },
            attDeriv: function () { return notAllowed; },
            startTagCloseDeriv: function () { return empty; },
            endTagDeriv: function () { return notAllowed; }
        },
        /**@type{!xmldom.RelaxNGItem}*/
        text = {
            type: "text",
            nullable: true,
            hash: "text",
            nc: undefined,
            p: undefined,
            p1: undefined,
            p2: undefined,
            textDeriv: function () { return text; },
            startTagOpenDeriv: function () { return notAllowed; },
            attDeriv: function () { return notAllowed; },
            startTagCloseDeriv: function () { return text; },
            endTagDeriv: function () { return notAllowed; }
        };

    /**
     * @param {function():!xmldom.RelaxNGItem} func
     * @return {function():!xmldom.RelaxNGItem}
     */
    function memoize0arg(func) {
        /**
         * @return {function():!xmldom.RelaxNGItem}
         */
        function f() {
            /**
             * @type {xmldom.RelaxNGItem}
             */
            var cache;
            /**
             * @return {!xmldom.RelaxNGItem}
             */
            function g() {
                if (cache === undefined) {
                    cache = func();
                }
                return cache;
            }
            return g;
        }
        return f();
    }
    /**
     * @param {string} type
     * @param {function(!xmldom.RelaxNGItem):!xmldom.RelaxNGItem} func
     * @return {function(!xmldom.RelaxNGItem):!xmldom.RelaxNGItem}
     */
    function memoize1arg(type, func) {
        /**
         * @return {function(!xmldom.RelaxNGItem):!xmldom.RelaxNGItem}
         */
        function f() {
            var /**@type{!Object.<string,!xmldom.RelaxNGItem>}*/
                cache = {},
                /**@type{number}*/
                cachecount = 0;
            /**
             * @param {!xmldom.RelaxNGItem} a
             * @return {!xmldom.RelaxNGItem}
             */
            function g(a) {
                var ahash = a.hash || a.toString(),
                    v;
                if (cache.hasOwnProperty(ahash)) {
                    return cache[ahash];
                }
                cache[ahash] = v = func(a);
                v.hash = type + cachecount.toString();
                cachecount += 1;
                return v;
            }
            return g;
        }
        return f();
    }
    /**
     * @param {function(!Node):!xmldom.RelaxNGItem} func
     * @return {function(!Node):!xmldom.RelaxNGItem}
     */
    function memoizeNode(func) {
        /**
         * @return {function(!Node):!xmldom.RelaxNGItem}
         */
        function f() {
            var /**@type{!Object.<string,!Object.<string,!xmldom.RelaxNGItem>>}*/
                cache = {};
            /**
             * @param {!Node} node
             * @return {!xmldom.RelaxNGItem}
             */
            function g(node) {
                var v,
                    /**@type{!Object.<string,!xmldom.RelaxNGItem>}*/
                    m;
                if (!cache.hasOwnProperty(node.localName)) {
                    cache[node.localName] = m = {};
                } else {
                    m = cache[node.localName];
                    v = m[node.namespaceURI];
                    if (v !== undefined) {
                        return v;
                    }
                }
                m[node.namespaceURI] = v = func(node);
                return v;
            }
            return g;
        }
        return f();
    }
    /**
     * @param {string} type
     * @param {undefined|function(!xmldom.RelaxNGItem,!xmldom.RelaxNGItem):(undefined|xmldom.RelaxNGItem)} fastfunc
     * @param {function(!xmldom.RelaxNGItem,!xmldom.RelaxNGItem):!xmldom.RelaxNGItem} func
     * @return {function(!xmldom.RelaxNGItem,!xmldom.RelaxNGItem):!xmldom.RelaxNGItem}
     */
    function memoize2arg(type, fastfunc, func) {
        /**
         * @return {function(!xmldom.RelaxNGItem,!xmldom.RelaxNGItem):!xmldom.RelaxNGItem}
         */
        function f() {
            var /**@type{!Object.<string,!Object.<string,!xmldom.RelaxNGItem>>}*/
                cache = {},
                /**@type{number}*/
                cachecount = 0;
            /**
             * @param {!xmldom.RelaxNGItem} a
             * @param {!xmldom.RelaxNGItem} b
             * @return {!xmldom.RelaxNGItem}
             */
            function g(a, b) {
                var /**@type{undefined|!xmldom.RelaxNGItem}*/
                    v = fastfunc && fastfunc(a, b),
                    ahash,
                    bhash,
                    /**@type{!Object.<string,!xmldom.RelaxNGItem>}*/
                    m;
                if (v !== undefined) { return v; }
                ahash = a.hash || a.toString();
                bhash = b.hash || b.toString();
                if (!cache.hasOwnProperty(ahash)) {
                    cache[ahash] = m = {};
                } else {
                    m = cache[ahash];
                    if (m.hasOwnProperty(bhash)) {
                        return m[bhash];
                    }
                }
                m[bhash] = v = func(a, b);
                v.hash = type + cachecount.toString();
                cachecount += 1;
                return v;
            }
            return g;
        }
        return f();
    }
    /**
     * This memoize function can be used for functions where the order of two
     * arguments is not important.
     * @param {string} type
     * @param {undefined|function(!xmldom.RelaxNGItem,!xmldom.RelaxNGItem):(undefined|!xmldom.RelaxNGItem)} fastfunc
     * @param {function(!xmldom.RelaxNGItem,!xmldom.RelaxNGItem):!xmldom.RelaxNGItem} func
     * @return {function(!xmldom.RelaxNGItem,!xmldom.RelaxNGItem):!xmldom.RelaxNGItem}
     */
    function unorderedMemoize2arg(type, fastfunc, func) {
        function f() {
            var /**@type{!Object.<string,!Object.<string,!xmldom.RelaxNGItem>>}*/
                cache = {},
                /**@type{number}*/
                cachecount = 0;
            /**
             * @param {!xmldom.RelaxNGItem} a
             * @param {!xmldom.RelaxNGItem} b
             * @return {!xmldom.RelaxNGItem}
             */
            function g(a, b) {
                var /**@type{undefined|!xmldom.RelaxNGItem}*/
                    v = fastfunc && fastfunc(a, b),
                    ahash,
                    bhash,
                    hash,
                    /**@type{!Object.<string,!xmldom.RelaxNGItem>}*/
                    m;
                if (v !== undefined) { return v; }
                ahash = a.hash || a.toString();
                bhash = b.hash || b.toString();
                if (ahash < bhash) {
                    hash = ahash; ahash = bhash; bhash = hash;
                    hash = a; a = b; b = hash;
                }
                if (!cache.hasOwnProperty(ahash)) {
                    cache[ahash] = m = {};
                } else {
                    m = cache[ahash];
                    if (m.hasOwnProperty(bhash)) {
                        return m[bhash];
                    }
                }
                m[bhash] = v = func(a, b);
                v.hash = type + cachecount.toString();
                cachecount += 1;
                return v;
            }
            return g;
        }
        return f();
    }
    function getUniqueLeaves(leaves, pattern) {
        if (pattern.p1.type === "choice") {
            getUniqueLeaves(leaves, pattern.p1);
        } else {
            leaves[pattern.p1.hash] = pattern.p1;
        }
        if (pattern.p2.type === "choice") {
            getUniqueLeaves(leaves, pattern.p2);
        } else {
            leaves[pattern.p2.hash] = pattern.p2;
        }
    }
    createChoice = memoize2arg("choice", function (p1, p2) {
        if (p1 === notAllowed) { return p2; }
        if (p2 === notAllowed) { return p1; }
        if (p1 === p2) { return p1; }
    }, function (p1, p2) {
        /**
         * @param {!xmldom.RelaxNGItem} p1
         * @param {!xmldom.RelaxNGItem} p2
         * @return {!xmldom.RelaxNGItem}
         */
        function makeChoice(p1, p2) {
            return {
                type: "choice",
                nullable: p1.nullable || p2.nullable,
                hash: undefined,
                nc: undefined,
                p: undefined,
                p1: p1,
                p2: p2,
                textDeriv: function (context, text) {
                    return createChoice(p1.textDeriv(context, text),
                        p2.textDeriv(context, text));
                },
                startTagOpenDeriv: memoizeNode(function (node) {
                    return createChoice(p1.startTagOpenDeriv(node),
                        p2.startTagOpenDeriv(node));
                }),
                attDeriv: function (context, attribute) {
                    return createChoice(p1.attDeriv(context, attribute),
                        p2.attDeriv(context, attribute));
                },
                startTagCloseDeriv: memoize0arg(function () {
                    return createChoice(p1.startTagCloseDeriv(),
                        p2.startTagCloseDeriv());
                }),
                endTagDeriv: memoize0arg(function () {
                    return createChoice(p1.endTagDeriv(), p2.endTagDeriv());
                })
            };
        }
        var leaves = {}, i;
        getUniqueLeaves(leaves, {p1: p1, p2: p2});
        p1 = undefined;
        p2 = undefined;
        for (i in leaves) {
            if (leaves.hasOwnProperty(i)) {
                if (p1 === undefined) {
                    p1 = leaves[i];
                } else if (p2 === undefined) {
                    p2 = leaves[i];
                } else {
                    p2 = createChoice(p2, leaves[i]);
                }
            }
        }
        return makeChoice(p1, p2);
    });
    createInterleave = unorderedMemoize2arg("interleave", function (p1, p2) {
        if (p1 === notAllowed || p2 === notAllowed) { return notAllowed; }
        if (p1 === empty) { return p2; }
        if (p2 === empty) { return p1; }
    }, function (p1, p2) {
        return {
            type: "interleave",
            nullable: p1.nullable && p2.nullable,
            hash: undefined,
            p1: p1,
            p2: p2,
            textDeriv: function (context, text) {
                return createChoice(
                    createInterleave(p1.textDeriv(context, text), p2),
                    createInterleave(p1, p2.textDeriv(context, text))
                );
            },
            startTagOpenDeriv: memoizeNode(function (node) {
                return createChoice(
                    applyAfter(function (p) { return createInterleave(p, p2); },
                               p1.startTagOpenDeriv(node)),
                    applyAfter(function (p) { return createInterleave(p1, p); },
                               p2.startTagOpenDeriv(node))
                );
            }),
            attDeriv: function (context, attribute) {
                return createChoice(
                    createInterleave(p1.attDeriv(context, attribute), p2),
                    createInterleave(p1, p2.attDeriv(context, attribute))
                );
            },
            startTagCloseDeriv: memoize0arg(function () {
                return createInterleave(p1.startTagCloseDeriv(),
                    p2.startTagCloseDeriv());
            }),
            endTagDeriv: undefined
        };
    });
    createGroup = memoize2arg("group", function (p1, p2) {
        if (p1 === notAllowed || p2 === notAllowed) { return notAllowed; }
        if (p1 === empty) { return p2; }
        if (p2 === empty) { return p1; }
    }, function (p1, p2) {
        return {
            type: "group",
            p1: p1,
            p2: p2,
            nullable: p1.nullable && p2.nullable,
            textDeriv: function (context, text) {
                var p = createGroup(p1.textDeriv(context, text), p2);
                if (p1.nullable) {
                    return createChoice(p, p2.textDeriv(context, text));
                }
                return p;
            },
            startTagOpenDeriv: function (node) {
                var x = applyAfter(function (p) { return createGroup(p, p2); },
                        p1.startTagOpenDeriv(node));
                if (p1.nullable) {
                    return createChoice(x, p2.startTagOpenDeriv(node));
                }
                return x;
            },
            attDeriv: function (context, attribute) {
                return createChoice(
                    createGroup(p1.attDeriv(context, attribute), p2),
                    createGroup(p1, p2.attDeriv(context, attribute))
                );
            },
            startTagCloseDeriv: memoize0arg(function () {
                return createGroup(p1.startTagCloseDeriv(),
                    p2.startTagCloseDeriv());
            })
        };
    });
    createAfter = memoize2arg("after", function (p1, p2) {
        if (p1 === notAllowed || p2 === notAllowed) { return notAllowed; }
    }, function (p1, p2) {
        return {
            type: "after",
            p1: p1,
            p2: p2,
            nullable: false,
            textDeriv: function (context, text) {
                return createAfter(p1.textDeriv(context, text), p2);
            },
            startTagOpenDeriv: memoizeNode(function (node) {
                return applyAfter(function (p) { return createAfter(p, p2); },
                    p1.startTagOpenDeriv(node));
            }),
            attDeriv: function (context, attribute) {
                return createAfter(p1.attDeriv(context, attribute), p2);
            },
            startTagCloseDeriv: memoize0arg(function () {
                return createAfter(p1.startTagCloseDeriv(), p2);
            }),
            endTagDeriv: memoize0arg(function () {
                return (p1.nullable) ? p2 : notAllowed;
            })
        };
    });
    createOneOrMore = memoize1arg("oneormore", function (p) {
        if (p === notAllowed) { return notAllowed; }
        return {
            type: "oneOrMore",
            p: p,
            nullable: p.nullable,
            textDeriv: function (context, text) {
                return createGroup(p.textDeriv(context, text),
                            createChoice(this, empty));
            },
            startTagOpenDeriv: function (node) {
                var oneOrMore = this;
                return applyAfter(function (pf) {
                    return createGroup(pf, createChoice(oneOrMore, empty));
                }, p.startTagOpenDeriv(node));
            },
            attDeriv: function (context, attribute) {
                var oneOrMore = this;
                return createGroup(p.attDeriv(context, attribute),
                    createChoice(oneOrMore, empty));
            },
            startTagCloseDeriv: memoize0arg(function () {
                return createOneOrMore(p.startTagCloseDeriv());
            })
        };
    });
    function createElement(nc, p) {
        return {
            type: "element",
            nc: nc,
            nullable: false,
            textDeriv: function () { return notAllowed; },
            startTagOpenDeriv: function (node) {
                if (nc.contains(node)) {
                    return createAfter(p, empty);
                }
                return notAllowed;
            },
            attDeriv: function () { return notAllowed; },
            startTagCloseDeriv: function () { return this; }
        };
    }
    function valueMatch(context, pattern, text) {
        return (pattern.nullable && /^\s+$/.test(text)) ||
            pattern.textDeriv(context, text).nullable;
    }
    createAttribute = memoize2arg("attribute", undefined, function (nc, p) {
        return {
            type: "attribute",
            nullable: false,
            hash: undefined,
            nc: nc,
            p: p,
            p1: undefined,
            p2: undefined,
            textDeriv: undefined,
            startTagOpenDeriv: undefined,
            attDeriv: function (context, attribute) {
                if (nc.contains(attribute) && valueMatch(context, p,
                        attribute.nodeValue)) {
                    return empty;
                }
                return notAllowed;
            },
            startTagCloseDeriv: function () { return notAllowed; },
            endTagDeriv: undefined
        };
    });
    function createList() {
        return {
            type: "list",
            nullable: false,
            hash: "list",
            textDeriv: function () {
                return empty;
            }
        };
    }
/*jslint unparam: true*/
    createValue = memoize1arg("value", function (value) {
        return {
            type: "value",
            nullable: false,
            value: value,
            textDeriv: function (context, text) {
                return (text === value) ? empty : notAllowed;
            },
            attDeriv: function () { return notAllowed; },
            startTagCloseDeriv: function () { return this; }
        };
    });
/*jslint unparam: false*/
    createData = memoize1arg("data", function (type) {
        return {
            type: "data",
            nullable: false,
            dataType: type,
            textDeriv: function () { return empty; },
            attDeriv: function () { return notAllowed; },
            startTagCloseDeriv: function () { return this; }
        };
    });
    applyAfter = function applyAfter(f, p) {
        var result;
        if (p.type === "after") {
            result = createAfter(p.p1, f(p.p2));
        } else if (p.type === "choice") {
            result = createChoice(applyAfter(f, p.p1), applyAfter(f, p.p2));
        } else {
            result = p;
        }
        return result;
    };
    function attsDeriv(context, pattern, attributes, position) {
        if (pattern === notAllowed) {
            return notAllowed;
        }
        if (position >= attributes.length) {
            return pattern;
        }
        if (position === 0) {
            // TODO: loop over attributes to update namespace mapping
            position = 0;
        }
        var a = attributes.item(position);
        while (a.namespaceURI === xmlnsns) { // always ok
            position += 1;
            if (position >= attributes.length) {
                return pattern;
            }
            a = attributes.item(position);
        }
        a = attsDeriv(context, pattern.attDeriv(context,
                attributes.item(position)), attributes, position + 1);
        return a;
    }
    function childrenDeriv(context, pattern, walker) {
        var element = walker.currentNode,
            childNode = walker.firstChild(),
            childNodes = [],
            i,
            p;
        // simple incomplete implementation: only use non-empty text nodes
        while (childNode) {
            if (childNode.nodeType === Node.ELEMENT_NODE) {
                childNodes.push(childNode);
            } else if (childNode.nodeType === Node.TEXT_NODE &&
                    !/^\s*$/.test(childNode.nodeValue)) {
                childNodes.push(childNode.nodeValue);
            }
            childNode = walker.nextSibling();
        }
        // if there is no nodes at all, add an empty text node
        if (childNodes.length === 0) {
            childNodes = [""];
        }
        p = pattern;
        for (i = 0; p !== notAllowed && i < childNodes.length; i += 1) {
            childNode = childNodes[i];
            if (typeof childNode === "string") {
                if (/^\s*$/.test(childNode)) {
                    p = createChoice(p, p.textDeriv(context, childNode));
                } else {
                    p = p.textDeriv(context, childNode);
                }
            } else {
                walker.currentNode = childNode;
                p = childDeriv(context, p, walker);
            }
        }
        walker.currentNode = element;
        return p;
    }
    childDeriv = function childDeriv(context, pattern, walker) {
        var childNode = walker.currentNode, p;
        p = pattern.startTagOpenDeriv(childNode);
        p = attsDeriv(context, p, childNode.attributes, 0);
        p = p.startTagCloseDeriv();
        p = childrenDeriv(context, p, walker);
        p = p.endTagDeriv();
        return p;
    };
    function addNames(name, ns, pattern) {
        if (pattern.e[0].a) {
            name.push(pattern.e[0].text);
            ns.push(pattern.e[0].a.ns);
        } else {
            addNames(name, ns, pattern.e[0]);
        }
        if (pattern.e[1].a) {
            name.push(pattern.e[1].text);
            ns.push(pattern.e[1].a.ns);
        } else {
            addNames(name, ns, pattern.e[1]);
        }
    }
    createNameClass = function createNameClass(pattern) {
        var name, ns, hash, i, result;
        if (pattern.name === "name") {
            name = pattern.text;
            ns = pattern.a.ns;
            result = {
                name: name,
                ns: ns,
                hash: "{" + ns + "}" + name,
                contains: function (node) {
                    return node.namespaceURI === ns && node.localName === name;
                }
            };
        } else if (pattern.name === "choice") {
            name = [];
            ns = [];
            addNames(name, ns, pattern);
            hash = "";
            for (i = 0; i < name.length; i += 1) {
                hash += "{" + ns[i] + "}" + name[i] + ",";
            }
            result = {
                hash: hash,
                contains: function (node) {
                    var j;
                    for (j = 0; j < name.length; j += 1) {
                        if (name[j] === node.localName &&
                                ns[j] === node.namespaceURI) {
                            return true;
                        }
                    }
                    return false;
                }
            };
        } else {
            result = {
                hash: "anyName",
                contains: function () { return true; }
            };
        }
        return result;
    };
    function resolveElement(pattern, elements) {
        var element, p, i, hash;
        // create an empty object in the store to enable circular
        // dependencies
        hash = "element" + pattern.id.toString();
        p = elements[pattern.id] = { hash: hash };
        element = createElement(createNameClass(pattern.e[0]),
            makePattern(pattern.e[1], elements));
        // copy the properties of the new object into the predefined one
        for (i in element) {
            if (element.hasOwnProperty(i)) {
                p[i] = element[i];
            }
        }
        return p;
    }
    makePattern = function makePattern(pattern, elements) {
        var p, i;
        if (pattern.name === "elementref") {
            p = pattern.id || 0;
            pattern = elements[p];
            if (pattern.name !== undefined) {
                return resolveElement(pattern, elements);
            }
            return pattern;
        }
        switch (pattern.name) {
        case 'empty':
            return empty;
        case 'notAllowed':
            return notAllowed;
        case 'text':
            return text;
        case 'choice':
            return createChoice(makePattern(pattern.e[0], elements),
                 makePattern(pattern.e[1], elements));
        case 'interleave':
            p = makePattern(pattern.e[0], elements);
            for (i = 1; i < pattern.e.length; i += 1) {
                p = createInterleave(p, makePattern(pattern.e[i],
                        elements));
            }
            return p;
        case 'group':
            return createGroup(makePattern(pattern.e[0], elements),
                    makePattern(pattern.e[1], elements));
        case 'oneOrMore':
            return createOneOrMore(makePattern(pattern.e[0], elements));
        case 'attribute':
            return createAttribute(createNameClass(pattern.e[0]),
                makePattern(pattern.e[1], elements));
        case 'value':
            return createValue(pattern.text);
        case 'data':
            p = pattern.a && pattern.a.type;
            if (p === undefined) {
                p = "";
            }
            return createData(p);
        case 'list':
            return createList();
        }
        throw "No support for " + pattern.name;
    };
    this.makePattern = function (pattern, elements) {
        var copy = {}, i;
        for (i in elements) {
            if (elements.hasOwnProperty(i)) {
                copy[i] = elements[i];
            }
        }
        i = makePattern(pattern, copy);
        return i;
    };
    /**
     * Validate the elements pointed to by the TreeWalker
     * @param {!TreeWalker} walker
     * @param {!function(Array.<string>):undefined} callback
     * @return {undefined}
     */
    this.validate = function validate(walker, callback) {
        var errors;
        walker.currentNode = walker.root;
        errors = childDeriv(null, rootPattern, walker);
        if (!errors.nullable) {
            runtime.log("Error in Relax NG validation: " + errors);
            callback(["Error in Relax NG validation: " + errors]);
        } else {
            callback(null);
        }
    };
    this.init = function init(rootPattern1) {
        rootPattern = rootPattern1;
    };
};
