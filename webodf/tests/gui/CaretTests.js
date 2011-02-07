/*global runtime core gui*/
runtime.loadClass("gui.Caret");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
gui.CaretTests = function CaretTests(runner) {
    var r = runner,
        t;

    function setupEmptyDoc() {
        var selection = runtime.getWindow().getSelection(),
            doc = runtime.getDOMImplementation().createDocument("", "p", null),
            caret = new gui.Caret(selection, doc);
        t = { selection: selection, doc: doc }; //, cursor: cursor };
        runner.shouldBeNonNull(t, selection);
    }
    function setupSimpleTextDoc() {
        setupEmptyDoc();
        t.textnode = t.doc.createTextNode("abc");
        t.doc.documentElement.appendChild(t.textnode);
    }
    function testOnUpDownTraversal() {
    }

    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    this.tests = function () {
        return [];
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
gui.CaretTests.prototype.description = function () {
    return "Test the Caret class.";
};
(function () {
    return gui.CaretTests;
}());
