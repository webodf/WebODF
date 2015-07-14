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

/*global runtime, Runtime, core, gui, xmldom, RuntimeTests, odf, ops, webodf_css: true*/

runtime.loadClass("core.UnitTester");
runtime.loadClass("core.Base64Tests");
runtime.loadClass("core.CursorTests");
runtime.loadClass("core.DomUtilsTests");
runtime.loadClass("core.EventSubscriptionsTests");
runtime.loadClass("core.PositionIteratorTests");
runtime.loadClass("core.RuntimeTests");
runtime.loadClass("core.StepIteratorTests");
runtime.loadClass("core.ZipTests");
runtime.loadClass("gui.DirectFormattingControllerTests");
runtime.loadClass("gui.GuiStepUtilsTests");
runtime.loadClass("gui.MetadataControllerTests");
runtime.loadClass("gui.SelectionControllerTests");
runtime.loadClass("gui.StyleSummaryTests");
runtime.loadClass("gui.TextControllerTests");
runtime.loadClass("gui.ImageControllerTests");
runtime.loadClass("gui.TrivialUndoManagerTests");
runtime.loadClass("gui.UndoStateRulesTests");
runtime.loadClass("odf.FormattingTests");
runtime.loadClass("odf.LayoutTests");
runtime.loadClass("odf.ListStyleToCssTests");
runtime.loadClass("odf.MaliciousDocumentTests");
runtime.loadClass("odf.ObjectNameGeneratorTests");
runtime.loadClass("odf.OdfContainerTests");
runtime.loadClass("odf.OdfContainerSafetyTests");
runtime.loadClass("odf.OdfUtilsTests");
runtime.loadClass("odf.StyleInfoTests");
runtime.loadClass("odf.StyleParseUtilsTests");
runtime.loadClass("odf.StyleCacheTests");
runtime.loadClass("odf.TextStyleApplicatorTests");
runtime.loadClass("ops.OdtDocumentTests");
runtime.loadClass("ops.OperationTests");
runtime.loadClass("ops.SessionTests");
runtime.loadClass("ops.OdtStepsTranslatorTests");
runtime.loadClass("ops.TransformationTests");
runtime.loadClass("ops.TransformerTests");
runtime.loadClass("xmldom.LSSerializerTests");
runtime.loadClass("xmldom.XPathTests");


// The StepsCache verification feature verifies the cache after every modification to ensure it does
// not contain any bad data. This is quite slow to do in practice, but is very helpful for debugging,
// and very important for tests.
runtime.loadClass("ops.StepsCache");
ops.StepsCache.ENABLE_CACHE_VERIFICATION = true;

/**
 * Holds the unit tests to run.
 * @type {!Array.<Function>}
 */
var tests = [
    core.RuntimeTests,
    core.ZipTests,
    core.Base64Tests
];

// add tests depending on runtime with XML parser
if (runtime.getDOMImplementation() && runtime.parseXML("<a/>").createRange) {
// TODO: fix test and enable
//     tests.push(core.CursorTests);
    tests.push(core.PositionIteratorTests);
    tests.push(core.DomUtilsTests);
    tests.push(core.EventSubscriptionsTests);
    tests.push(core.StepIteratorTests);
    tests.push(gui.DirectFormattingControllerTests);
    tests.push(gui.GuiStepUtilsTests);
    tests.push(gui.UndoStateRulesTests);
    tests.push(gui.TextControllerTests);
    tests.push(gui.ImageControllerTests);
    tests.push(gui.TrivialUndoManagerTests);
    tests.push(gui.MetadataControllerTests);
    tests.push(gui.SelectionControllerTests);
    tests.push(gui.StyleSummaryTests);
    tests.push(odf.OdfUtilsTests);
    tests.push(odf.ObjectNameGeneratorTests);
    tests.push(odf.FormattingTests);
    tests.push(odf.ListStyleToCssTests);
    tests.push(odf.MaliciousDocumentTests);
    tests.push(odf.OdfContainerTests);
    tests.push(odf.OdfContainerSafetyTests);
    tests.push(odf.StyleInfoTests);
    tests.push(odf.StyleParseUtilsTests);
    tests.push(odf.TextStyleApplicatorTests);
    tests.push(ops.OdtDocumentTests);
    tests.push(ops.OdtStepsTranslatorTests);
    tests.push(ops.TransformerTests);
}
// add tests depending on browser runtime
if (runtime.type() === "BrowserRuntime") {
    tests.push(xmldom.LSSerializerTests);
    tests.push(xmldom.XPathTests);
    tests.push(odf.LayoutTests);
    tests.push(odf.StyleCacheTests);
    tests.push(ops.SessionTests);
    tests.push(ops.OperationTests);
    tests.push(ops.TransformationTests);
}

var tester = new core.UnitTester();

/**
 * Recursively runs the passed tests.
 * @param {!Array.<Function>} tests
 * @return {undefined}
 */
function runNextTest(tests, tester, callback) {
    "use strict";
    // done with all tests?
    if (tests.length === 0) {
        return callback(tester);
    }

    // run first of passed tests, on success continue with the left
    var test = tests[0];
    if (typeof test !== "function") {
        runtime.log("Tests contain a non-function object of type " +
                typeof test + ".");
        runtime.exit(1);
        return;
    }
    runtime.log("Running test '" + Runtime.getFunctionName(test) + "'.");
    try {
        tester.runTests(test, function () {
            runNextTest(tests.slice(1), tester, callback);
        }, []);
    } catch (e) {
        runtime.log(e);
        runtime.exit(1);
        throw e;
    }
}

/**
 * Split ? part of the current url into a name value map.
 * @return {!{suite:?string,test:?string}}
 */
function queryObj() {
    "use strict";
    var result = { suite: null, test: null },
        window = runtime.getWindow(),
        keyValuePairs = window.location.search.slice(1).split('&');

    keyValuePairs.forEach(function (keyValuePair) {
        keyValuePair = keyValuePair.split('=');
        result[keyValuePair[0]] = keyValuePair[1] || '';
    });
    return result;
}

function findSuite(name) {
    "use strict";
    var i, suite;
    for (i = 0; !suite && i < tests.length; i += 1) {
        if (tests[i].name === name) {
            suite = tests[i];
        }
    }
    return suite;
}

function runSuite(name) {
    "use strict";
    runtime.getWindow().location.search = "?suite=" + name;
}
function runTest(suite, name) {
    "use strict";
    runtime.getWindow().location.search = "?suite=" + suite + "&test=" + encodeURIComponent(name);
}

function runSelectedTests(selectedTests) {
    "use strict";
    if (!selectedTests.suite) {
        return false;
    }
/*jslint emptyblock: true*/
    tester.runTests(selectedTests.suite, function () {
    }, selectedTests.testNames);
/*jslint emptyblock: false*/
    return true;
}

function getTestNameFromUrl(selectedTests) {
    "use strict";
    var options = queryObj();
    selectedTests.suite = findSuite(options.suite);
    if (!selectedTests.suite) {
        return;
    }
    if (options.test) {
        selectedTests.testNames = options.test.split(",").map(decodeURIComponent);
    }
}

function getTestNamesFromArguments(selectedTests, args) {
    "use strict";
    var i;
    for (i = 0; i < args.length - 1; i += 1) {
        if (args[i] === "-suite") {
            selectedTests.suite = findSuite(args[i + 1]);
        }
        if (args[i] === "-test") {
            selectedTests.testNames.push(args[i + 1]);
        }
    }
}

var args = String(typeof arguments) !== "undefined" && Array.prototype.slice.call(arguments),
    selectedTests = {
        suite: null,
        testNames: []
    };

if (runtime.type() === "BrowserRuntime") {
    getTestNameFromUrl(selectedTests);
}
// run the tests here, unless this is a karma run
if (!runtime.getWindow() || !runtime.getWindow().hasOwnProperty("use_karma")) {
    if (!selectedTests.suite) {
        getTestNamesFromArguments(selectedTests, args);
    }
    if (!runSelectedTests(selectedTests)) {
        runNextTest(tests, tester, function (tester) {
            "use strict";
            var testResults = tester.results();

            //runtime.log(JSON.stringify(tester.results()));
            runtime.log("Number of failed asserts: " + tester.failedTestsCount());
            if (tester.failedTestsCount() !== 0) {
                runtime.log("Failed tests:");
                Object.keys(testResults).forEach(function (suiteName) {
                    var suiteResults = testResults[suiteName];
                    Object.keys(suiteResults).forEach(function(testName) {
                        if (!suiteResults[testName]) {
                            runtime.log(suiteName + "." + testName);
                        }
                    });
                });
            }
            runtime.exit(tester.failedTestsCount());
            return;
        });
    }
}
