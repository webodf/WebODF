/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
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

/*global Node, runtime, core, gui, ops, odf, xmldom*/


/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
ops.TransformerTests = function TransformerTests(runner) {
    "use strict";
    var r = runner, t, tests;

    /**
     * Creates a deep copy of the spec
     * @param {!Object} spec
     * @return {!Object}
     */
    function cloneSpec(spec) {
        var result = {};

        Object.keys(spec).forEach(function (key) {
            if (typeof spec[key] === 'object') {
                result[key] = cloneSpec(spec[key]);
            } else {
                result[key] = spec[key];
            }
        });

        return result;
    }

    /**
     * Creates a deep copy of the specs
     * @param {!Array.<!Object>} specs
     * @return {!Array.<!Object>}
     */
    function cloneSpecs(specs) {
        var i, result = [];

        for (i = 0; i < specs.length; i += 1) {
            result.push(cloneSpec(specs[i]));
        }

        return result;
    }

    /**
     * @param {!Element} element
     * @return {!Object}
     */
    function parseOperation(element) {
        var op = {},
            child = element.firstChild,
            atts = element.attributes,
            att,
            n = atts.length,
            i,
            value;
        // read plain data by attributes
        for (i = 0; i < n; i += 1) {
            att = atts.item(i);
            value = att.value;
            if (/^(length|number|position|fontSize|topMargin|bottomMargin|leftMargin|rightMargin)$/.test(att.localName)) {
                value = parseInt(value, 10);
            }
            op[att.nodeName] = value;
        }
        // read complex data by childs
        while (child) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                op[child.nodeName] = parseOperation(/**@type{!Element}*/(child));
            }
            child = child.nextSibling;
        }
        return op;
    }
    /**
     * @param {!string} name
     * @param {!Element} opsElement
     * @return {!Array.<!Object>}
     */
    function parseOpspecs(name, opsElement) {
        var op = opsElement.firstElementChild,
            opspecs = [];
        while (op) {
            runtime.assert(op.localName === "op", "Expected <op/> in " + name + ".");
            opspecs.push(parseOperation(op));
            op = op.nextElementSibling;
        }
        return opspecs;
    }
    /**
     * @param {!string} name
     * @param {!Element} element
     * @return {!{in, out}}
     */
    function parseTest(name, element) {
        var inElement = element.firstElementChild,
            inOpsAElement = inElement.firstElementChild,
            inOpsBElement = inOpsAElement.nextElementSibling,
            outElement = inElement.nextElementSibling,
            outOpsAElement = outElement.firstElementChild,
            outOpsBElement = outOpsAElement.nextElementSibling;
        runtime.assert(inElement.localName === "in", "Expected <in/> in " + name + ".");
        runtime.assert(inOpsAElement.localName === "opsA", "Expected <opsA/> within <in/> in " + name + ".");
        runtime.assert(inOpsBElement.localName === "opsB", "Expected <opsB/> within <in/> in " + name + ".");
        runtime.assert(outElement.localName === "out", "Expected <out/> in " + name + ".");
        runtime.assert(outOpsAElement.localName === "opsA", "Expected <opsA/> within <out/> in " + name + ".");
        runtime.assert(outOpsBElement.localName === "opsB", "Expected <opsB/> within <out/> in " + name + ".");

        return {
            "in": {
                opspecsA:   parseOpspecs(name, inOpsAElement),
                opspecsB:   parseOpspecs(name, inOpsBElement)
            },
            "out": {
                opspecsA:   parseOpspecs(name, outOpsAElement),
                opspecsB:   parseOpspecs(name, outOpsBElement)
            }
        };
    }

    /**
     * Creates a deep copy of the spec
     * @param {!Object} object
     * @param {!Object} refObject
     * @return {!boolean}
     */
    function areObjectsEqual(object, refObject) {
        var key;
        for (key in object) {
            if (object.hasOwnProperty(key)) {
                if (typeof object[key] === 'object') {
                    if (!areObjectsEqual(object[key], refObject[key])) {
                        return false;
                    }
                } else {
                    if (object[key] !== refObject[key]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function runTest(test) {
        var transformer = new ops.OperationTransformer(),
            i;

        t.transformResult = transformer.transform(cloneSpecs(test["in"].opspecsA), cloneSpecs(test["in"].opspecsB));
        r.shouldBeNonNull(t, "t.transformResult");
        if (t.transformResult) {
            t.transformedOpspecsA = t.transformResult.opSpecsA;
            t.transformedOpspecsB = t.transformResult.opSpecsB;
            t.refOpspecsA = test.out.opspecsA;
            t.refOpspecsB = test.out.opspecsB;

            r.shouldBe(t, "t.transformedOpspecsA.length", "t.refOpspecsA.length");
            for (i = 0; i < t.refOpspecsA.length; i += 1) {
                if (t.transformedOpspecsA[i] && areObjectsEqual(t.refOpspecsA[i], t.transformedOpspecsA[i])) {
                    t.transformedOpspecA = t.refOpspecA = "OK";
                } else {
                    t.transformedOpspecA = runtime.toJson(t.transformedOpspecsA[i]);
                    t.refOpspecA = runtime.toJson(t.refOpspecsA[i]);
                }
                r.shouldBe(t, "t.transformedOpspecA", "t.refOpspecA");
            }

            r.shouldBe(t, "t.transformedOpspecsB.length", "t.refOpspecsB.length");
            for (i = 0; i < t.refOpspecsB.length; i += 1) {
                if (t.transformedOpspecsB[i] && areObjectsEqual(t.refOpspecsB[i], t.transformedOpspecsB[i])) {
                    t.transformedOpspecB = t.refOpspecB = "OK";
                } else {
                    t.transformedOpspecB = runtime.toJson(t.transformedOpspecsB[i]);
                    t.refOpspecB = runtime.toJson(t.refOpspecsB[i]);
                }
                r.shouldBe(t, "t.transformedOpspecB", "t.refOpspecB");
            }
        }
    }

    function makeTestIntoFunction(name, test) {
        var f = function () {
            runTest(test);
        };
        return {f: f, name: name};
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

    function loadTests(url, tests) {
        var s = /**@type{!string}*/(runtime.readFileSync(url, "utf-8")),
            xml = runtime.parseXML(s),
            n,
            testName;
        runtime.assert(s.length > 0, "XML file is empty.");
        runtime.assert(xml.documentElement.localName === "tests", "Element is not <tests/>.");
        n = xml.documentElement.firstElementChild;
        while (n) {
            testName = n.getAttribute("name");
            runtime.assert(n.localName === "test", "Element is not <test/>.");
            runtime.assert(!tests.hasOwnProperty(testName), "Test name " + testName + " is not unique.");
            tests[testName] = parseTest(testName, n);
            n = n.nextElementSibling;
        }
    }

    function loadTestFiles(urls) {
        var trafoTests = {}, i;
        for (i = 0; i < urls.length; i += 1) {
            loadTests(urls[i], trafoTests);
        }
        return trafoTests;
    }

    this.setUp = function () {
        var testarea;
        t = {};
        testarea = core.UnitTest.provideTestAreaDiv();
        t.odfcanvas = new odf.OdfCanvas(testarea);
    };
    this.tearDown = function () {
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };
    this.tests = function () {
        var pre = r.resourcePrefix();
        if (!tests) {
            tests = makeTestsIntoFunction(loadTestFiles(
                [pre + "ops/transformertests.xml"]
            ));
        }
        return tests;
    };
    this.asyncTests = function () {
        return [
        ];
    };
};

ops.TransformerTests.prototype.description = function () {
    "use strict";
    return "Test the transformations of ODT operations described in an XML file on resulting opspecs.";
};
