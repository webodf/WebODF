/*global runtime core gui*/
runtime.loadClass("gui.SelectionMover");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
gui.SelectionMoverTests = function SelectionMoverTests(runner) {
    var r = runner,
        t, testarea = runtime.getWindow().document.getElementById("testarea");

    function setupDoc() {
        var doc = testarea.ownerDocument,
            selection = runtime.getWindow().getSelection(),
            p = doc.createElement("p"),
            walker = new core.PointWalker(p),
            mover = new gui.SelectionMover(selection, walker);
        testarea.appendChild(p);
        p.appendChild(doc.createTextNode("MMMMM MMMMM MMMMM MMMMM MMMMM"));
        p.style.width = "5em";// break line after each 'MMMMM'
        selection.removeAllRanges();
        selection.addRange(doc.createRange());
        t = { doc: doc, p: p, selection: selection, mover: mover };
    }
    function testUpDownTraversal() {
        setupDoc();
        r.shouldBe(t, "t.selection.rangeCount", "1");
        t.r = t.selection.getRangeAt(0);
        r.shouldBeNonNull(t, "t.r");
        t.r.setStart(t.p.firstChild, 0);
        r.shouldBe(t, "t.r.startContainer", "t.p.firstChild");
        r.shouldBe(t, "t.r.startOffset", "0");
        t.mover.movePointForward();
        t.r = t.selection.getRangeAt(0);
        r.shouldBe(t, "t.r.startContainer", "t.p.firstChild");
        r.shouldBe(t, "t.r.startOffset", "1");
        t.mover.movePointBackward();
        t.r = t.selection.getRangeAt(0);
        r.shouldBe(t, "t.r.startContainer", "t.p.firstChild");
        r.shouldBe(t, "t.r.startOffset", "0");
        t.mover.moveLineForward();
//        t.selection.modify("move", "forward", "line");
        t.r = t.selection.getRangeAt(0);
        r.shouldBe(t, "t.r.startContainer", "t.p.firstChild");
        r.shouldBe(t, "t.r.startOffset", "6");
    }

    this.setUp = function () {
        t = {};
        while (testarea.firstChild) {
            testarea.removeChild(testarea.firstChild);
        }
    };
    this.tearDown = function () {
        t = {};
        while (testarea.firstChild) {
            testarea.removeChild(testarea.firstChild);
        }
    };
    this.tests = function () {
        return [ testUpDownTraversal ];
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
gui.SelectionMoverTests.prototype.description = function () {
    return "Test the SelectionMover class.";
};
(function () {
    return gui.SelectionMoverTests;
}());
