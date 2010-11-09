/*global core runtime*/
runtime.loadClass("core.Zip");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
core.ZipTests = function ZipTests(runner) {
    var t;
    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    this.tests = function () {
        return {};
    };
    this.asyncTests = function () {
        return {};
    };
};
core.ZipTests.prototype.description = function () {
    return "Test the Zip class.";
};
(function () {
    return core.Zip;
}());
