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
    function debug(msg) {
        runtime.log(msg);
    }
    function escapeHTML(text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    }
    function testFailed(msg) {
        debug('<span><span class="fail">FAIL</span> ' + escapeHTML(msg) + '</span>');
    }
    function testPassed(msg) {
        debug('<span><span class="pass">PASS</span> ' + escapeHTML(msg) + '</span>');
    }
    function areArraysEqual(a, b) {
        var i;
        try {
            if (a.length !== b.length) {
                return false;
            }
            for (i = 0; i < a.length; i += 1) {
                if (a[i] !== b[i]) {
                    return false;
                }
            }
        } catch (ex) {
            return false;
        }
        return true;
    }
    function isResultCorrect(actual, expected) {
        if (expected === 0) {
            return actual === expected && (1 / actual) === (1 / expected);
        }
        if (actual === expected) {
            return true;
        }
        if (typeof(expected) === "number" && isNaN(expected)) {
            return typeof(actual) === "number" && isNaN(actual);
        }
        if (Object.prototype.toString.call(expected) === Object.prototype.toString.call([])) {
            return areArraysEqual(actual, expected);
        }
        return false;
    }
    function stringify(v) {
        if (v === 0 && 1 / v < 0) {
            return "-0";
        }
        return "" + v;
    }
    function shouldBe(a, b) {
        if (typeof a !== "string" || typeof b !== "string") {
            debug("WARN: shouldBe() expects string arguments");
        }
        var exception, av, bv;
        try {
            av = eval(a);
        } catch (e) {
            exception = e;
        }
        bv = eval(b);

        if (exception) {
            testFailed(a + " should be " + bv + ". Threw exception " + exception);
        } else if (isResultCorrect(av, bv)) {
            testPassed(a + " is " + b);
        } else if (typeof(av) === typeof(bv)) {
            testFailed(a + " should be " + bv + ". Was " + stringify(av) + ".");
        } else {
            testFailed(a + " should be " + bv + " (of type " + typeof bv + "). Was " + av + " (of type " + typeof av + ").");
        }
    }
};
core.UnitTestRunner.prototype.shouldBe = function () {
};

/**
 * @constructor
 */
core.UnitTester = function UnitTester() {
    var runner = new core.UnitTestRunner();
    this.runTests = function (TestClass) {
        var test = new TestClass(runner), i, t, tests;
        tests = test.tests();
        for (i = 0; i < tests.length; i += 1) {
            t = tests[i];
            t();
        }
    };
};
