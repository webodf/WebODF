/*global core runtime*/
runtime.loadClass("core.PointWalker");

/**
 * @constructor
 * @param runner {UnitTestRunner}
 * @implements {core.UnitTest}
 */
core.PointWalkerTests = function PointWalkerTests(runner) {
    var t, r = runner;

    function checkWalker(node, count, endpos) {
        t = {};
        t.node = node;
        t.walker = new core.PointWalker(node);
        t.count = count;
        t.countForward = 0;
        t.countBackward = 0;
        t.endpos = endpos;
        t.walker.setPoint(t.node, 0);
        while (t.walker.stepForward()) {
            t.countForward += 1;
        }
        r.shouldBe(t, "t.countForward", "t.count");
        r.shouldBe(t, "t.walker.precedingSibling()", "t.node.lastChild");
        r.shouldBe(t, "t.walker.followingSibling()", "null");
        if (endpos !== null) {
            r.shouldBe(t, "t.walker.position()", "t.endpos");
        }
        t.walker.setPoint(t.node, endpos);
        while (t.walker.stepBackward()) {
            t.countBackward += 1;
        }
        r.shouldBe(t, "t.countBackward", "t.count");
        r.shouldBe(t, "t.walker.precedingSibling()", "null");
        r.shouldBe(t, "t.walker.followingSibling()", "t.node.firstChild");
        r.shouldBe(t, "t.walker.position()", "0");
    }

    function testEmptyDocument() {
        var doc = runtime.getDOMImplementation().createDocument("", "p", null),
            p = doc.firstChild,
            textnode1,
            textnode2,
            textnode3,
            em;

        checkWalker(doc, 2, 1);
        checkWalker(p, 0, 0);
    
        t = {};
        t.doc = doc;
        t.walker = new core.PointWalker(t.doc);
        r.shouldBe(t, "t.walker.position()", "0");
        r.shouldBe(t, "t.walker.stepForward()", "true");
        r.shouldBe(t, "t.walker.position()", "0");
        r.shouldBe(t, "t.walker.stepForward()", "true");
        r.shouldBe(t, "t.walker.position()", "1");
        r.shouldBe(t, "t.walker.stepForward()", "false");
        r.shouldBe(t, "t.walker.position()", "1");
        r.shouldBe(t, "t.walker.stepBackward()", "true");
        r.shouldBe(t, "t.walker.position()", "0");
        r.shouldBe(t, "t.walker.stepBackward()", "true");
        r.shouldBe(t, "t.walker.position()", "0");
        r.shouldBe(t, "t.walker.stepBackward()", "false");
        r.shouldBe(t, "t.walker.position()", "0");
    
        textnode1 = doc.createTextNode("hello, ");
        textnode2 = doc.createTextNode("big ");
        textnode3 = doc.createTextNode("world.");
        em = doc.createElement('em');
        p.appendChild(textnode1);
        p.appendChild(em);
        em.appendChild(textnode2);
        p.appendChild(textnode3);
 
        checkWalker(textnode1, 7, 7);
        checkWalker(textnode2, 4, 4);
        checkWalker(textnode3, 6, 6);
        checkWalker(em, 6, 1);
        checkWalker(p, 25, 3);
        checkWalker(doc, 27, 1);
    }

    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    this.tests = function () {
        return [
            testEmptyDocument
        ];
    };
    this.asyncTests = function () {
        return [];
    };
    this.description = function () {
        return "Test the PointWalker class.";
    };
};
