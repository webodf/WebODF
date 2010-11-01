/*global window runtime core gui*/
runtime.loadClass("core.UnitTester");
runtime.loadClass("core.PointWalkerTests");
runtime.loadClass("core.CursorTests");
runtime.loadClass("gui.XMLEditTests");

var coretests = [
    core.PointWalkerTests,
    core.CursorTests
];
var guitests = [
    gui.XMLEditTests
];

var tests = coretests.slice();

if (typeof window !== "undefined") {
    tests = tests.concat(guitests);
}

var tester = new core.UnitTester();
for (var i = 0; i < tests.length; i += 1) {
    runtime.log("Running test '" + tests[i].name + "'.");
    tester.runTests(tests[i]);
}
