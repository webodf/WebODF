/*global window runtime core gui RuntimeTests*/
runtime.loadClass("core.RuntimeTests");
runtime.loadClass("core.UnitTester");
runtime.loadClass("core.PointWalkerTests");
runtime.loadClass("core.CursorTests");
runtime.loadClass("core.ZipTests");
runtime.loadClass("core.Base64Tests");
runtime.loadClass("gui.XMLEditTests");

var tests = [
    core.RuntimeTests, // temporarily disabled, enable at next commit!
    core.ZipTests,
    core.Base64Tests
];

if (runtime.type() !== "NodeJSRuntime") {
    tests.push(core.PointWalkerTests);
}

if (runtime.type() === "BrowserRuntime") {
//    tests.push(gui.CaretTests);
    tests.push(core.CursorTests);
    tests.push(gui.XMLEditTests);
}

var tester = new core.UnitTester();

/**
 * @param {!Array.<Function>} tests
 * @return {undefined}
 */
function runNextTest(tests) {
    if (tests.length === 0) {
        //runtime.log(JSON.stringify(tester.results()));
        runtime.exit(tester.countFailedTests());
        return;
    }
    var test = tests[0];
    runtime.log("Running test '" + test.name + "'.");
    tester.runTests(test, function () {
        runNextTest(tests.slice(1));
    });
}
runNextTest(tests);
