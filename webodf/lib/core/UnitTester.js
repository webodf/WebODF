/*global runtime core*/

/**
 * @interface
 */
core.UnitTest = function () {};
/**
 * @return {undefined}
 */
core.UnitTest.prototype.setUp = function () {};
/**
 * @return {undefined}
 */
core.UnitTest.prototype.tearDown = function () {};
/**
 * @return {string}
 */
core.UnitTest.prototype.description = function () {};
/**
 * @return {Array.<Function>}
 */
core.UnitTest.prototype.tests = function () {};

/**
 * @constructor
 */
core.UnitTestRunner = function () {
};

/**
 * @constructor
 */
core.UnitTester = function UnitTester() {
    var runner = new core.UnitTestRunner();
    this.runTests = function (TestClass) {
        var test = new TestClass(runner);
    };
};
