/**
 * Copyright (C) 2013 KO GmbH <jos.van.den.oever@kogmbh.com>
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
/*global runtime, xmled, document, xmldom, NodeFilter*/
runtime.loadClass("xmled.ValidationModel");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
xmled.ValidationModelTests = function ValidationModelTests(runner) {
    "use strict";
    var r = runner,
        t,
        replacements;
    function serialize(element) {
        var serializer = new xmldom.LSSerializer();
        return serializer.writeToString(element, {});
    }

    function loadReplacements(callback) {
        if (replacements) {
            return callback();
        }
        runtime.loadXML("xmled/replacements.xml", function (err, dom) {
            t.err = err;
            t.dom = dom;
            r.shouldBeNull(t, "t.err");
            r.shouldBeNonNull(t, "t.dom");
            replacements = {};
            var f, e;
            e = dom.documentElement.firstElementChild;
            while (e) {
                f = dom.createDocumentFragment();
                while (e.firstChild) {
                    f.appendChild(e.firstChild);
                }
                replacements[e.getAttribute("id")] = f;
                e = e.nextElementSibling;
            }
            callback();
        });
    }

    function checkReplacement(rep, ref) {
        if (!r.areNodesEqual(rep, ref)) {
            t.rep = serialize(rep);
            t.ref = serialize(ref);
        } else {
            t.rep = t.ref = "OK";
        }
        r.shouldBe(t, "t.rep", "t.ref");
    }

    function checkReplacements(reps, ids, callback) {
        loadReplacements(function () {
            t.reps = reps;
            r.shouldBe(t, "t.reps.length", String(ids.length));
            var i, length = Math.min(ids.length, reps.length);
            for (i = 0; i < length; i += 1) {
                checkReplacement(reps[i].dom, replacements[ids[i]]);
            }
            callback();
        });
    }

    /**
     * @param {!Element} element
     * @param {!string} ns
     * @param {!string} localName
     * @return {undefined}
     */
    function addNodes(element, ns, localName) {
        var doc = element.ownerDocument,
            ne = doc.createElementNS(ns, localName),
            e = element.firstElementChild;
        while (e) {
            addNodes(e, ns, localName);
            e = e.nextElementSibling;
        }
        element.appendChild(ne);
    }

    /**
     * @param {!xmled.ValidationModel} model
     * @param {!Element} documentElement
     * @return {undefined}
     */
    function validateWithIgnoredNodes(model, documentElement) {
        var ns = "http://test.com/",
            filter;
        addNodes(documentElement, ns, "test");
        /**
         * @constructor
         * @extends NodeFilter
         */
        function TestFilter(ns) {
            this.acceptNode = function (node) {
                if (node.namespaceURI === ns) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            };
        }
        filter = new TestFilter(ns);
        try {
            t.err = model.validate(documentElement, filter);
        } catch (e) {
            t.err = e;
        }
        r.shouldBeNull(t, "t.err");
    }

    /**
     * @param {?Node} n
     * @return {?Element}
     */
    function firstElementChild(n) {
        n = n && n.firstChild;
        var e = null;
        while (n && !e) {
            if (n.nodeType === 1) {
                e = /**@type{!Element}*/(n);
            }
            n = n.nextSibling;
        }
        return e;
    }

    /**
     * @param {!string} xsdfile
     * @param {!string} xmlfile
     * @return {!function(!function():undefined):undefined} callback
     */
    function testValidation(xsdfile, xmlfile) {
        var f = function (callback) {
            var model = new xmled.ValidationModel(xsdfile, function (err) {
                t.err = err;
                r.shouldBeNull(t, "t.err");
                runtime.loadXML(xmlfile, function (err, dom) {
                    t.err = err;
                    r.shouldBeNull(t, "t.err");
                    var e = firstElementChild(dom || null);
                    t.documentElement = e;
                    r.shouldBeNonNull(t, "t.documentElement");
                    if (e) {
                        t.err = model.validate(e);
                        r.shouldBeNull(t, "t.err");
                        validateWithIgnoredNodes(model, e);
                    }
                    callback();
                });
            });
        };
        f.functionName = "validation-" + xsdfile + "-" + xmlfile;
        return f;
    }

    function testRoot(xsd, replacementIds) {
        var f = function (callback) {
            var model = new xmled.ValidationModel(xsd, function (e) {
                t.err = e;
                r.shouldBeNull(t, "t.err");
                t.reps = model.getPossibleReplacements(document);
                checkReplacements(t.reps, replacementIds, callback);
            });
        };
        f.functionName = "init-" + xsd;
        return f;
    }

    /**
     * @param {!Node} node
     * @param {!Array.<!number>} list
     * @return {{node:!Node, offset: !number }}
     */
    function getPosition(node, list) {
        var i, j, l = list.length - 1, p, n = node;
        runtime.assert(l >= 0, "Position array must have at least one entry.");
        for (i = 0; i < l; i += 1) {
            n = n.firstChild;
            p = list[i];
            for (j = 0; j < p; j += 1) {
                n = n.nextSibling;
            }
        }
        return {node: /**@type{!Node}*/(n), offset: list[l]};
    }

    /**
     * @param {!Node} node
     * @param {!Array.<!number>} start
     * @param {!Array.<!number>} end
     * @return {!Range}
     */
    function createRange(node, start, end) {
        var range = node.ownerDocument.createRange(),
            pos = getPosition(node, start);
        range.setStart(pos.node, pos.offset);
        pos = getPosition(node, end);
        range.setEnd(pos.node, pos.offset);
        return range;
    }

    /**
     * @param {!string} xsd
     * @param {!string} initId
     * @param {!Array.<!number>} start
     * @param {!Array.<!number>} end
     * @param {!Array.<!number>} replacementIds
     * @return {!function(!function():undefined):undefined} callback
     */
    function testReplace(xsd, initId, start, end, replacementIds) {
        var f = function (callback) {
            var model = new xmled.ValidationModel(xsd, function (e) {
                t.err = e;
                r.shouldBeNull(t, "t.err");
                loadReplacements(function () {
                    var initial = replacements[initId],
                        range,
                        de = initial.ownerDocument.createElement("doc");
                    de.appendChild(initial.cloneNode(true));
                    initial = de;
                    range = createRange(initial, start, end);
                    t.reps = model.getPossibleReplacements(initial, range);
                    checkReplacements(t.reps, replacementIds, callback);
                });
            });
        };
        f.functionName = "replace-" + xsd + "-" + initId;
        return f;
    }

    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    this.tests = function () {
        return [];
    };
    this.asyncTests = function () {
        return [
            testValidation("xmled/XMLSchema.xsd", "xmled/XMLSchema.xsd"),
            testRoot("xmled/empty.xsd", []),
            testRoot("xmled/simple.xsd", ["a", "b", "c"]),
            testRoot("xmled/complex01.xsd", ["a", "d", "e", "f", "ga", "ha"]),
            // replace
            testReplace("xmled/simple.xsd", "a", [0], [1], ["a", "b", "c"]),
            testReplace("xmled/complex01.xsd", "d", [0, 0], [0, 1], []),
            testReplace("xmled/complex01.xsd", "g", [0, 0], [0, 1], ["a", "c"]),
            testReplace("xmled/complex01.xsd", "gb", [0, 0], [0, 1], ["a", "c"]),
            testReplace("xmled/complex01.xsd", "gbb", [0, 0], [0, 1], ["empty"]),
            testReplace("xmled/complex01.xsd", "gbb", [0, 1], [0, 2], ["empty"]),
            testReplace("xmled/complex01.xsd", "h", [0, 1, 0], [0, 1, 1], ["b", "c"]),
            // prepend
            testReplace("xmled/complex01.xsd", "d", [0, 0], [0, 0], ["a"])
        ];
    };
};
xmled.ValidationModelTests.prototype.description = function () {
    "use strict";
    return "Test the ValidationModel class.";
};
(function () {
    "use strict";
    return xmled.ValidationModelTests; 
}());
