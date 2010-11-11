/*global core runtime*/
runtime.loadClass("core.Base64");
/**
 * @constructor
 * @param runner {UnitTestRunner}
 * @implements {core.UnitTest}
 */
core.Base64Tests = function Base64Tests(runner) {
    var t, r = runner, base64 = new core.Base64();

    function testConvertByteArrayToBase64() {
        t.encoded = base64.convertByteArrayToBase64([65]);
        r.shouldBe(t, "t.encoded", "'QQ=='");
        t.encoded = base64.convertByteArrayToBase64([65, 65]);
        r.shouldBe(t, "t.encoded", "'QUE='");
        t.encoded = base64.convertByteArrayToBase64([65, 65, 65]);
        r.shouldBe(t, "t.encoded", "'QUFB'");
    }

    function testToBase64() {
        t.encoded = base64.toBase64("A");
        r.shouldBe(t, "t.encoded", "'QQ=='");
        t.encoded = base64.toBase64("AA");
        r.shouldBe(t, "t.encoded", "'QUE='");
        t.encoded = base64.toBase64("AAA");
        r.shouldBe(t, "t.encoded", "'QUFB'");
    }

    function testConvertUTF8StringToUTF16String(callback) {
        var bin = "1234567890";
        while (bin.length < 100000) {
            bin += bin;
        }
        t.numcallbacks = 0;
        base64.convertUTF8StringToUTF16String(bin, function (str, done) {
            runtime.log("base64.convertUTF8StringToUTF16String");
            t.numcallbacks += 1;
            t.done = done;
            if (t.numcallbacks === 1) {
                r.shouldBe(t, "t.done", "false");
            } else {
                r.shouldBe(t, "t.done", "true");
            }
            if (done) {
                r.shouldBe(t, "t.numcallbacks", "2");
                t.str = str;
                t.bin = bin;
                r.shouldBe(t, "t.str.length", "t.bin.length");
                callback();
            }
            return true;
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
            testConvertByteArrayToBase64,
            testToBase64
        ];
    };
    this.asyncTests = function () {
        return [ testConvertUTF8StringToUTF16String ];
    };
    this.description = function () {
        return "Test the Base64 class.";
    };
};
