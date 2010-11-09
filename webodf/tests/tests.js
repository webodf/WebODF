/*global window runtime core gui RuntimeTests*/
runtime.loadClass("core.RuntimeTests");
runtime.loadClass("core.UnitTester");
runtime.loadClass("core.PointWalkerTests");
runtime.loadClass("core.CursorTests");
runtime.loadClass("core.ZipTests");
runtime.loadClass("gui.XMLEditTests");

var tests = [core.RuntimeTests, core.ZipTests];

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
 * @return {undefined}
 */
function runNextTest(tests) {
    if (tests.length === 0) {
        runtime.exit(tester.countFailedTests());
        return;
    }
    runtime.log("Running test '" + tests[0].name + "'.");
    tester.runTests(tests[0], function () {
        runNextTest(tests.slice(1));
    });
}
runNextTest(tests);
