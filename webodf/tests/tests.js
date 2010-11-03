/*global window runtime core gui*/
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
for (var i = 0; i < tests.length && tester.countFailedTests() === 0; i += 1) {
    runtime.log("Running test '" + tests[i].name + "'.");
    tester.runTests(tests[i]);
}
tester.countFailedTests();
