/**
 * Copyright (C) 2014 KO GmbH <copyright@kogmbh.com>
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

/*global runtime, core, odf, NodeFilter, Node, xmldom*/

/**
 * @constructor
 * @param {!core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
odf.LayoutTests = function LayoutTests(runner) {
    "use strict";
    var r = runner, t, tests,
        xpath = xmldom.XPath,
        odfUtils = odf.OdfUtils;
    /**
     * @param {!Element} node
     * @return {!{count:!number,values:!Object.<!string,!string>,xpath:!string}}
     */
    function parseCheck(node) {
        var values = {}, c = node.firstElementChild;
        while (c) {
            values[c.localName] = c.getAttribute("value");
            c = c.nextElementSibling;
        }
        return {
            count: parseInt(node.getAttribute("count"), 10) || 1,
            values: values,
            xpath: node.getAttribute("xpath")
        };
    }
    /**
     * @param {!string} name
     * @param {!Element} node
     * @return {!{isFailing:!boolean,input:!Element,name:!string,layoutChecks:!Array}}
     */
    function parseTest(name, node) {
        var isFailing = node.getAttribute("isFailing") === "true",
            input = node.firstElementChild,
            checks = input.nextElementSibling,
            check = checks.firstElementChild,
            layoutChecks = [];
        runtime.assert(input.localName === "input", "Expected <input/> in " + name + ".");
        runtime.assert(checks.localName === "layoutchecks", "Expected <layoutchecks/> in " + name + ".");
        while (check) {
            runtime.assert(check.localName === "check", "Expected <check/> in " + name + ".");
            layoutChecks.push(parseCheck(check));
            check = check.nextElementSibling;
        }
        return {
            isFailing: isFailing,
            input: input,
            name: name,
            layoutChecks: layoutChecks
        };
    }
    /**
     * @param {!string} url
     * @param {!Object.<!string,{isFailing:!boolean,input:!Element,name:!string}>} tests
     * @return {undefined}
     */
    function loadTests(url, tests) {
        var s = /**@type{!string}*/(runtime.readFileSync(url, "utf-8")),
            xml = runtime.parseXML(s),
            n,
            test,
            testName;
        runtime.assert(s.length > 0, "XML file is empty.");
        runtime.assert(xml.documentElement.localName === "layouttests", "Element is not <layouttests/>.");
        n = xml.documentElement.firstElementChild;
        while (n) {
            testName = n.getAttribute("name");
            runtime.assert(n.localName === "test", "Element is not <test/>.");
            runtime.assert(!tests.hasOwnProperty(testName), "Test name " + testName + " is not unique.");
            test = parseTest(testName, n);
            if (!test.isFailing) {
                tests[testName] = test;
            }
            n = n.nextElementSibling;
        }
    }
    /**
     * @param {!Array.<!string>} urls
     * @return {!Object.<!string,{isFailing:!boolean,input:!Element,name:!string}>}
     */
    function loadTestFiles(urls) {
        var optests = {}, i;
        for (i = 0; i < urls.length; i += 1) {
            loadTests(urls[i], optests);
        }
        return optests;
    }
    /**
     * @param {!Element} odfNode
     * @param {!NodeList} childList
     * @return {undefined}
     */
    function replaceChildren(odfNode, childList) {
        var doc = odfNode.ownerDocument, i, c;
        while (odfNode.firstChild) {
            odfNode.removeChild(odfNode.firstChild);
        }
        for (i = 0; i < childList.length; i += 1) {
            c = doc.importNode(childList.item(i), true);
            while (c.firstChild !== null) {
                odfNode.appendChild(c.firstChild);
            }
        }
    }
    /**
     * @param {!Object.<!string,{isFailing:!boolean,input:!Element,name:!string}>} test
     * @param {!function():undefined} callback
     * @return {undefined}
     */
    function fillDocument(test, callback) {
        var officens = odf.Namespaces.officens,
            input = test.input,
            // test input should have a text or presentation tag
            text = input.getElementsByTagNameNS(officens, "text"),
            presentation = input.getElementsByTagNameNS(officens, "presentation"),
            isText = text.length > 0,
            type = isText ? odf.OdfContainer.DocumentType.TEXT : odf.OdfContainer.DocumentType.PRESENTATION,
            tag = isText ? "text" : "presentation",
            odfContainer = new odf.OdfContainer(type),
            root = odfContainer.rootElement,
            oldContent = root.body.getElementsByTagNameNS(officens, tag)[0],
            extension = isText ? ".odt" : ".odp",
            path = test.name + extension;
        replaceChildren(root.styles,
            input.getElementsByTagNameNS(officens, "styles"));
        replaceChildren(root.automaticStyles,
            input.getElementsByTagNameNS(officens, "automatic-styles"));
        replaceChildren(root.masterStyles,
            input.getElementsByTagNameNS(officens, "master-styles"));
        if (isText) {
            replaceChildren(oldContent, text);
        } else {
            replaceChildren(oldContent, presentation);
        }
        function handler() {
            t.odfContainer = t.odfCanvas.odfContainer();
            callback();
        }
        odfContainer.saveAs(path, function () {
            t.odfCanvas.addListener("statereadychange", handler);
            t.odfCanvas.setOdfContainer(odfContainer);
        });
    }
    /**
     * @param {!string|!number} val
     * @return {!number}
     */
    function convertToPx(val) {
        var n = -1, length;
        if (typeof val === "number") {
            n = val;
        } else {
            length = odfUtils.parseLength(val);
            if (length && length.unit === "px") {
                n = length.value;
            } else if (length && length.unit === "cm") {
                n = length.value / 2.54 * 96;
            } else {
                throw "Could not convert '" + val + "'. Unit " + length.unit + " not supported.";
            }
        }
        return n;
    }
    /**
     * @param {!string|!number} a
     * @param {!string} b
     * @return {!boolean}
     */
    function compareLengths(a, b) {
        var na, nb;
        na = convertToPx(a);
        nb = convertToPx(b);
        // check that the difference is less than one percent.
        // the % of allowed error may become configurable in the future.
        return Math.abs((na - nb) / nb) < 0.01;
    }
    /**
     * @param {!string|!number} a
     * @param {!string} b
     * @return {undefined}
     */
    function compareValues(a, b) {
        if (b.indexOf("|") !== -1) {
            // Allow multiple matches against the string value of a.
            // This enables cross-browser tests to be written for cases where Chrome & FF perform different conversions
            // on the computed value (e.g., vertical-align with a %, FF converts to pixels, while Chrome returns the
            // original string).
            if (b.split("|").indexOf(a) !== -1) {
                a = b;
            }
        } else if (a !== undefined && (typeof a === "number" || a.substr(-2) === "px")) {
            if (compareLengths(a, b)) {
                a = b;
            }
        }
        t.a = a;
        t.b = b;
        r.shouldBe(t, "t.a", "t.b");
    }
    /**
     * @param {!{count:!number,values:!Object.<!string,!string>,xpath:!string}} check
     * @param {!Element} node
     * @return {undefined}
     */
    function checkNodeLayout(check, node) {
        var window = runtime.getWindow(),
            style = window.getComputedStyle(node),
            value;
        Object.keys(check.values).forEach(function(i) {
            // get value from computed style (e.g. margin-left) or from
            // node properties (e.g. clientWidth).
            value = style[i] || node[i];
            compareValues(value, check.values[i]);
        });
    }
    /**
     * @param {!{count:!number,values:!Object.<!string,!string>,xpath:!string}} check
     * @return {undefined}
     */
    function checkNodesLayout(check) {
        var root = t.odfContainer.rootElement,
            nodes,
            i;
        nodes = xpath.getODFElementsWithXPath(root, check.xpath,
                odf.Namespaces.lookupNamespaceURI);
        t.nodeCount = nodes.length;
        r.shouldBe(t, "t.nodeCount", String(check.count));
        for (i = 0; i < nodes.length; i += 1) {
            checkNodeLayout(check, nodes[i]);
        }
    }
    /**
     * @param {!Object.<!string,{isFailing:!boolean,input:!Element,name:!string}>} test
     * @param {!function():undefined} callback
     * @return {undefined}
     */
    function runTest(test, callback) {
        var i;
        function check() {
            for (i = 0; i < test.layoutChecks.length; i += 1) {
                checkNodesLayout(test.layoutChecks[i]);
            }
            callback();
        }
        fillDocument(test, check);
    }
    /**
     * @param {!string} name
     * @param {!Object.<!string,{isFailing:!boolean,input:!Element,name:!string}>} test
     * @return {!{f:!function():undefined,name:!string,expectFail:!boolean}}
     */
    function makeTestIntoFunction(name, test) {
        var f = function (callback) {
            runTest(test, callback);
        };
        return {f: f, name: name, expectFail: test.isFailing};
    }
    /**
     * @param {!Object.<!string,{isFailing:!boolean,input:!Element,name:!string}>} tests
     * @return {!Array.<!{f:!function():undefined,name:!string,expectFail:!boolean}>}
     */
    function makeTestsIntoFunction(tests) {
        var functions = [], i;
        for (i in tests) {
            if (tests.hasOwnProperty(i)) {
                functions.push(makeTestIntoFunction(i, tests[i]));
            }
        }
        return functions;
    }

    this.setUp = function () {
        var testarea;
        t = {};
        testarea = core.UnitTest.provideTestAreaDiv();
        t.odfCanvas = new odf.OdfCanvas(testarea);
    };
    this.tearDown = function () {
        t.odfCanvas.destroy(function () { return; });
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };
    this.tests = function () {
        return [];
    };
    this.asyncTests = function () {
        var pre = r.resourcePrefix();
        if (!tests) {
            tests = makeTestsIntoFunction(loadTestFiles([
                pre + "odf/layouttests.xml",
                pre + "odf/odplayouttests.xml"
            ]));
        }
        return tests;
    };
};
odf.LayoutTests.prototype.description = function () {
    "use strict";
    return "Test that the layout of the odf documents is calculated correctly.";
};
