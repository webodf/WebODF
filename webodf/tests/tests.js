/*global window runtime core gui*/
runtime.loadClass("RuntimeTests");
runtime.loadClass("core.UnitTester");
runtime.loadClass("core.PointWalkerTests");
runtime.loadClass("core.CursorTests");
runtime.loadClass("gui.XMLEditTests");

var tests = [];

if (runtime.type() !== "NodeJSRuntime") {
    tests.push(core.PointWalkerTests);
}

if (runtime.type() === "BrowserRuntime") {
    // tests.push(core.CursorTests);
    // tests.push(gui.XMLEditTests);
}

var tester = new core.UnitTester();

/**
 * @param {!Array.<Function>} tests
 * @return {!number}
 */
function runNextTest(tests) {
    if (tests.length === 0) {
        return tester.countFailedTests();
    }
    runtime.log("Running test '" + tests[0].name + "'.");
    tester.runTests(tests[0], function () {
        runNextTest(tests.slice(1));
    });
    return -1;
}
runNextTest(tests);
