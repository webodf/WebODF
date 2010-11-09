/*global core runtime*/
runtime.loadClass("core.Zip");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
core.ZipTests = function ZipTests(runner) {
    var r = runner,
        t;

    function testNonExistingFile(callback) {
        var zip = new core.Zip("whatever", function (err) {
            t.err = err;
            r.shouldBeNonNull(t, "t.err");
            callback();
        });
    }

    function testNonZipFile(callback) {
        var path = "core/ZipTests.js";
        // check that file exists
        runtime.isFile(path, function (exists) {
            t.exists = exists;
            r.shouldBe(t, "t.exists", "true");
            // check that zip file opening returns an error
            var zip = new core.Zip("core/ZipTests.js", function (err) {
                t.err = err;
                r.shouldBeNonNull(t, "t.err");
                callback();
            });
        });
    }

    function testHiUncompressed(callback) {
        var zip = new core.Zip("core/hi-uncompressed.zip", function (err) {
            t.err = err;
            r.shouldBeNull(t, "t.err");
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
        return {};
    };
    this.asyncTests = function () {
        return {
            testNonExistingFile: testNonExistingFile,
            testNonZipFile: testNonZipFile,
            testHiUncompressed: testHiUncompressed
        };
    };
};
core.ZipTests.prototype.description = function () {
    return "Test the Zip class.";
};
(function () {
    return core.ZipTests;
}());
