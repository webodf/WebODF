/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
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
/*global window, runtime, Runtime, core, gui, xmldom, RuntimeTests, odf, ops*/

runtime.loadClass("core.Base64Tests");
runtime.loadClass("core.CursorTests");
runtime.loadClass("core.PositionIteratorTests");
runtime.loadClass("core.RuntimeTests");
runtime.loadClass("core.UnitTester");
runtime.loadClass("core.ZipTests");
runtime.loadClass("gui.SelectionMoverTests");
runtime.loadClass("gui.XMLEditTests");
runtime.loadClass("ops.OdtCursorTests");
runtime.loadClass("ops.SessionImplementationTests");
runtime.loadClass("odf.OdfContainerTests");
runtime.loadClass("xmldom.OperationalTransformDOMTests");
runtime.loadClass("xmldom.XPathTests");


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
    tests.push(gui.SelectionMoverTests);
    tests.push(odf.OdfContainerTests);
    tests.push(ops.OdtCursorTests);
}
// add tests depending on browser runtime
if (runtime.type() === "BrowserRuntime") {
    tests.push(xmldom.OperationalTransformDOMTests);
    tests.push(xmldom.XPathTests);
    tests.push(ops.SessionImplementationTests);
//    tests.push(gui.XMLEditTests);
}

var tester = new core.UnitTester();

/**
 * Recursively runs the passed tests.
 * @param {!Array.<Function>} tests
 * @return {undefined}
 */
function runNextTest(tests) {
    "use strict";
    // done with all tests?
    if (tests.length === 0) {
        //runtime.log(JSON.stringify(tester.results()));
        runtime.log("Number of failed tests: " +
                String(tester.countFailedTests()));
        runtime.exit(tester.countFailedTests());
        return;
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
            runNextTest(tests.slice(1));
        });
    } catch (e) {
        runtime.log(e);
        runtime.exit(1);
        throw e;
    }
}
runNextTest(tests);
