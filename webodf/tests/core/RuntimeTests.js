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

    /**
     * Test writing a binary file and reading it back.
     */
    function testWrite(callback) {
        var content = "", i, max = 1024, filename, clean;
        for (i = 0; i < max; i += 1) {
            content += String.fromCharCode(i);
        }
        filename = "tmp" + Math.random();
        clean = "";
        for (i = 0; i < max; i += 1) {
            clean += String.fromCharCode(content.charCodeAt(i) & 0xff);
        }
        // now content has content different from what is on the server
        runtime.writeFile(filename, content, "binary", function (err) {
            t.err = err;
            r.shouldBeNull(t, "t.err");
            runtime.readFile(filename, "binary", function (err, data) {
                t.err = err;
                r.shouldBeNull(t, "t.err");
                t.data = data;
                t.clean = clean;
                r.shouldBe(t, "t.data.length", "t.clean.length");
                for (i = 0; i < max && data[i] === clean[i]; i += 1) {}
                if (i !== max) {
                    runtime.log(data.charCodeAt(i) + " vs " +
                        clean.charCodeAt(i));
                }
                t.i = i;
                t.max = max;
                r.shouldBe(t, "t.i", "t.max");
                r.shouldBe(t, "t.data", "t.clean");
                // cleanup
                runtime.deleteFile(filename, function (err) {
                    callback();
                });
            });
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
            testRead,
            testWrite
        ];
    };
    this.description = function () {
        return "Test the runtime.";
    };
};
