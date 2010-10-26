/*global description createPointWalker shouldBe document*/
description(
"Test the PointWalker class."
);

var t = null; // t is a variable to put the test context

function checkWalker(node, count, endpos) {
    t = {};
    t.node = node;
    t.walker = createPointWalker(node);
    t.count = count;
    t.countForward = 0;
    t.countBackward = 0;
    t.endpos = endpos;
    t.walker.setPoint(t.node, 0);
    while (t.walker.stepForward()) {
        t.countForward += 1;
    }
    shouldBe("t.countForward", "t.count");
    shouldBe("t.walker.precedingSibling()", "t.node.lastChild");
    shouldBe("t.walker.followingSibling()", "null");
    if (endpos !== null) {
        shouldBe("t.walker.position()", "t.endpos");
    }
    t.walker.setPoint(t.node, endpos);
    while (t.walker.stepBackward()) {
        t.countBackward += 1;
    }
    shouldBe("t.countBackward", "t.count");
    shouldBe("t.walker.precedingSibling()", "null");
    shouldBe("t.walker.followingSibling()", "t.node.firstChild");
    shouldBe("t.walker.position()", "0");
}

function testEmptyDocument() {
    var doc = document.implementation.createDocument(null, "p", null),
        p = doc.firstChild,
        textnode1,
        textnode2,
        textnode3,
        em;

    checkWalker(doc, 2, 1);
    checkWalker(p, 0, 0);

    t = {};
    t.doc = doc;
    t.walker = createPointWalker(t.doc);
    shouldBe("t.walker.position()", "0");
    shouldBe("t.walker.stepForward()", "true");
    shouldBe("t.walker.position()", "0");
    shouldBe("t.walker.stepForward()", "true");
    shouldBe("t.walker.position()", "1");
    shouldBe("t.walker.stepForward()", "false");
    shouldBe("t.walker.position()", "1");
    shouldBe("t.walker.stepBackward()", "true");
    shouldBe("t.walker.position()", "0");
    shouldBe("t.walker.stepBackward()", "true");
    shouldBe("t.walker.position()", "0");
    shouldBe("t.walker.stepBackward()", "false");
    shouldBe("t.walker.position()", "0");

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

testEmptyDocument();

var successfullyParsed = true;
