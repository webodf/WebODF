/*global document core gui runtime*/
runtime.loadClass("core.PointWalker");
runtime.loadClass("gui.XMLEdit");

/**
 * @constructor
 * @param runner {core.UnitTestRunner}
 * @implements {core.UnitTest}
 */
gui.XMLEditTests = function XMLEditTests(runner) {
    var t, r = runner, tests;

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
        r.shouldBe("t.countForward", "t.count");
        r.shouldBe("t.walker.precedingSibling()", "t.node.lastChild");
        r.shouldBe("t.walker.followingSibling()", "null");
        if (endpos !== null) {
            r.shouldBe("t.walker.position()", "t.endpos");
        }
        t.walker.setPoint(t.node, endpos);
        while (t.walker.stepBackward()) {
            t.countBackward += 1;
        }
        r.shouldBe("t.countBackward", "t.count");
        r.shouldBe("t.walker.precedingSibling()", "null");
        r.shouldBe("t.walker.followingSibling()", "t.node.firstChild");
        r.shouldBe("t.walker.position()", "0");
    }
    
    function testSimpleDocument(xmledit) {
        var maindoc = xmledit.ownerDocument,
            doc = maindoc.implementation.createDocument(null, "p", null),
            p = doc.firstChild,
            textnode1,
            textnode2,
            textnode3,
            em;
    
        xmledit.setXML(doc);
    
        checkWalker(doc, 2, 1);
        checkWalker(p, 0, 0);
    
        t = {};
        t.doc = doc;
        t.walker = new core.PointWalker(t.doc);
        r.shouldBe("t.walker.position()", "0");
        r.shouldBe("t.walker.stepForward()", "true");
        r.shouldBe("t.walker.position()", "0");
        r.shouldBe("t.walker.stepForward()", "true");
        r.shouldBe("t.walker.position()", "1");
        r.shouldBe("t.walker.stepForward()", "false");
        r.shouldBe("t.walker.position()", "1");
        r.shouldBe("t.walker.stepBackward()", "true");
        r.shouldBe("t.walker.position()", "0");
        r.shouldBe("t.walker.stepBackward()", "true");
        r.shouldBe("t.walker.position()", "0");
        r.shouldBe("t.walker.stepBackward()", "false");
        r.shouldBe("t.walker.position()", "0");
    
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
    
    function testXmlEdit(document) {
        var head = document.getElementsByTagName("head")[0],
            css = document.createElement("style"),
            testarea = document.createElement("div"),
            xmledit;
    
        // the xml edit requires an element to put the content and a sheet to put
        // the style
        css.type = "text/css";
        head.appendChild(css);
        document.body.appendChild(testarea);
        xmledit = new gui.XMLEdit(testarea, css);
    
        testSimpleDocument(xmledit);
    
        css.parentNode.removeChild(css);
        testarea.parentNode.removeChild(testarea);
    }
    
    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    this.tests = function () {
        return [ testSimpleDocument ];
    };
    this.asyncTests = function () {
        return [];
    };
    this.description = function () {
        return "Test the XML editor class.";
    };
};
