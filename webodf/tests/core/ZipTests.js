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

    function testHi(path, callback) {
        var zip = new core.Zip(path, function (err, zip) {
            t.err = err;
            t.zip = zip;
            r.shouldBeNull(t, "t.err");
            zip.load("hello", function (err, data) {
                t.err = err;
                r.shouldBeNull(t, "t.err");
                t.data = data;
                r.shouldBe(t, "t.data.length", "16");
                r.shouldBe(t, "t.data", "'bonjour\\nbonjour\\n'");
                callback();
            });
        });
    }

    function testHiUncompressed(callback) {
        testHi("core/hi-uncompressed.zip", callback);
    }

    function testHiCompressed(callback) {
        testHi("core/hi-compressed.zip", callback);
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
            testHiUncompressed: testHiUncompressed,
            testHiCompressed: testHiCompressed
        };
    };
};
core.ZipTests.prototype.description = function () {
    return "Test the Zip class.";
};
(function () {
    return core.ZipTests;
}());
