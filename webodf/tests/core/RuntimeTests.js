/*global core runtime*/

/**
 * @constructor
 * @param runner {UnitTestRunner}
 * @implements {core.UnitTest}
 */
core.RuntimeTests = function RuntimeTests(runner) {
    var t, r = runner;

    function testRead(callback) {
        runtime.read("tests.js", 2, 6, function (err, data) {
            t.err = err;
            r.shouldBeNull(t, "t.err");
            t.data = data;
            r.shouldBe(t, "t.data", "'global'");
            callback();
        });
    }

    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    this.tests = function () {
        return [
        ];
    };
    this.asyncTests = function () {
        return [
            testRead
        ];
    };
    this.description = function () {
        return "Test the runtime.";
    };
};
