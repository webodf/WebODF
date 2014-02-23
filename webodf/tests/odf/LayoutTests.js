/**
 * Copyright (C) 2014 KO GmbH <jos.van.den.oever@kogmbh.com>
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
/*global runtime, core, odf, NodeFilter, Node, xmldom*/
/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
odf.LayoutTests = function LayoutTests(runner) {
    "use strict";
    var r = runner, t, tests,
        xpath = xmldom.XPath;
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
    function loadTestFiles(urls) {
        var optests = {}, i;
        for (i = 0; i < urls.length; i += 1) {
            loadTests(urls[i], optests);
        }
        return optests;
    }
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
    function fillDocument(test, callback) {
        var officens = odf.Namespaces.officens,
            odfContainer = new odf.OdfContainer("", null),
            root = odfContainer.rootElement,
            path = test.name + ".odt",
            input = test.input;
        replaceChildren(root.automaticStyles,
            input.getElementsByTagNameNS(officens, "automatic-styles"));
        replaceChildren(root.masterStyles,
            input.getElementsByTagNameNS(officens, "master-styles"));
        replaceChildren(root.body.getElementsByTagNameNS(officens, "text")[0],
            input.getElementsByTagNameNS(officens, "text"));
        function handler() {
            t.odfContainer = t.odfCanvas.odfContainer();
            callback();
        }
        odfContainer.saveAs(path, function () {
            t.odfCanvas.addListener("statereadychange", handler);
            t.odfCanvas.load(path);
        });
    }
    function convertToPx(val) {
        var n = -1;
        if (typeof val === "number") {
            n = val;
        } else if (val.substr(-2) === "px") {
            n = parseFloat(val.substr(0, val.length - 2));
        } else if (val.substr(-2) === "cm") {
            n = parseFloat(val.substr(0, val.length - 2)) / 2.54 * 96;
        }
        return n;
    }
    function compareLengths(a, b) {
        a = convertToPx(a);
        b = convertToPx(b);
        return Math.abs((a - b) / b) < 0.01;
    }
    function compareValues(a, b) {
        if (typeof a === "number" || a.substr(-2) === "px") {
            if (compareLengths(a, b)) {
                a = b;
            }
        }
        t.a = a;
        t.b = b;
        r.shouldBe(t, "t.a", "t.b");
    }
    function checkNodeLayout(check, node) {
        var window = runtime.getWindow(),
            style = window.getComputedStyle(node),
            i,
            value;
        for (i in check.values) {
            if (check.values.hasOwnProperty(i)) {
                value = style[i] || node[i];
                compareValues(value, check.values[i]);
            }
        }
    }
    function checkNodesLayout(check) {
        var root = t.odfContainer.rootElement,
            nodes,
            ns = {
                d: "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
                o: "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
                t: "urn:oasis:names:tc:opendocument:xmlns:text:1.0"
            },
            i;
        function resolve(prefix) {
            return ns[prefix];
        }
        nodes = xpath.getODFElementsWithXPath(root, check.xpath, resolve);
        t.nodeCount = nodes.length;
        r.shouldBe(t, "t.nodeCount", String(check.count));
        for (i = 0; i < nodes.length; i += 1) {
            checkNodeLayout(check, nodes[i]);
        }
    }
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
    function makeTestIntoFunction(name, test) {
        var f = function (callback) {
            runTest(test, callback);
        };
        return {f: f, name: name, expectFail: test.isFailing};
    }
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
                pre + "odf/layouttests.xml"
            ]));
        }
        return tests;
    };
};
odf.LayoutTests.prototype.description = function () {
    "use strict";
    return "Test that the layout of the odf documents is calculated correctly.";
};
(function () {
    "use strict";
    return odf.LayoutTests;
}());
