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

    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    this.tests = function () {
        return {
            testConvertByteArrayToBase64: testConvertByteArrayToBase64,
            testToBase64: testToBase64
        };
    };
    this.asyncTests = function () {
        return {
        };
    };
    this.description = function () {
        return "Test the Base64 class.";
    };
};
