/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * As additional permission under GNU AGPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * As a special exception to the AGPL, any HTML file which merely makes function
 * calls to this code, and for that purpose includes it by reference shall be
 * deemed a separate work for copyright law purposes. In addition, the copyright
 * holders of this code give you permission to combine this code with free
 * software libraries that are released under the GNU LGPL. You may copy and
 * distribute such a system following the terms of the GNU AGPL for this code
 * and the LGPL for the libraries. If you modify this code, you may extend this
 * exception to your version of the code, but you are not obligated to do so.
 * If you do not wish to do so, delete this exception statement from your
 * version.
 *
 * This license applies to this entire compilation.
 * @licend
 * @source: http://www.webodf.org/
 * @source: http://gitorious.org/webodf/webodf/
 */
/*global runtime, core, gui, xmldom, ops*/
runtime.loadClass("core.PositionIterator");
runtime.loadClass("xmldom.LSSerializer");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
core.PositionIteratorTests = function PositionIteratorTests(runner) {
    "use strict";
    /**
     * @constructor
     * @extends NodeFilter
     */
    function TestFilter() {
        this.acceptNode = function (node) {
            if (node.localName === "b") {
                return 2;
            }
            if (node.localName === "c") {
                return 3;
            }
            return 1;
        };
    }
    var r = runner, t, filter = new TestFilter(),
        testXMLs = [
            { x: "<a/>", n: 1 },
            { x: "<a><b/></a>", n: 1 },
            { x: "<a>a</a>", n: 2 },
            { x: "<a>a<b/></a>", n: 2 },
            { x: "<a><b/>a</a>", n: 2 },
            { x: "<a>hello</a>", n: 6 },
            { x: "<a>hel<b/>lo</a>", n: 6 },
            { x: "<a><c><b>a</b>a</c></a>", n: 2 },
            { x: "<a><c/>abc<b/>de</a>", n: 6 }
        ];

    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    function createWalker(xml) {
        t.doc = runtime.parseXML(xml);
        t.iterator = new core.PositionIterator(t.doc.documentElement, 0,
            filter);
    }
    function create() {
        createWalker("<a/>");
        r.shouldBeNonNull(t, "t.iterator");
        r.shouldBe(t, "t.iterator.container()", "t.doc.documentElement");
        r.shouldBe(t, "t.iterator.offset()", "0");
    }
    function forwardInEmptyDoc() {
        createWalker("<a/>");
        r.shouldBe(t, "t.iterator.nextPosition()", "false");
        r.shouldBe(t, "t.iterator.container()", "t.doc.documentElement");
        r.shouldBe(t, "t.iterator.offset()", "0");
    }
    function backwardInEmptyDoc() {
        createWalker("<a/>");
        r.shouldBe(t, "t.iterator.previousPosition()", "false");
        r.shouldBe(t, "t.iterator.container()", "t.doc.documentElement");
        r.shouldBe(t, "t.iterator.offset()", "0");
    }
    function forwardInSimpleDoc() {
        var i;
        createWalker("<a>hello</a>");
        t.textNode = t.doc.documentElement.firstChild;
        r.shouldBe(t, "t.iterator.container()", "t.textNode");
        r.shouldBe(t, "t.iterator.offset()", "0");
        for (i = 1; i <= 4; i += 1) {
            r.shouldBe(t, "t.iterator.nextPosition()", "true");
            r.shouldBe(t, "t.iterator.container()", "t.textNode");
            r.shouldBe(t, "t.iterator.offset()", i.toString());
        }
        r.shouldBe(t, "t.iterator.nextPosition()", "true");
        r.shouldBe(t, "t.iterator.container()", "t.doc.documentElement");
        r.shouldBe(t, "t.iterator.offset()", "1");
        r.shouldBe(t, "t.iterator.nextPosition()", "false");
        r.shouldBe(t, "t.iterator.offset()", "1");
    }
    function backwardInSimpleDoc() {
        var i;
        createWalker("<a>hello</a>");
        t.iterator.moveToEnd();
        r.shouldBe(t, "t.iterator.container()", "t.doc.documentElement");
        r.shouldBe(t, "t.iterator.offset()", "1");
        t.textNode = t.doc.documentElement.firstChild;
        for (i = 4; i >= 0; i -= 1) {
            r.shouldBe(t, "t.iterator.previousPosition()", "true");
            r.shouldBe(t, "t.iterator.container()", "t.textNode");
            r.shouldBe(t, "t.iterator.offset()", i.toString());
        }
        r.shouldBe(t, "t.iterator.previousPosition()", "false");
        r.shouldBe(t, "t.iterator.offset()", "0");
    }
    function forwardInDoc() {
        var i;
        createWalker("<a>abc<a>abc</a>abc</a>");
        t.node = t.doc.documentElement.firstChild;
        for (i = 1; i < 3; i += 1) {
            r.shouldBe(t, "t.iterator.nextPosition()", "true");
            r.shouldBe(t, "t.iterator.container()", "t.node");
            r.shouldBe(t, "t.iterator.offset()", i.toString());
        }
        r.shouldBe(t, "t.iterator.nextPosition()", "true");
        r.shouldBe(t, "t.iterator.container()", "t.doc.documentElement");
        r.shouldBe(t, "t.iterator.offset()", "1");
        t.node = t.node.nextSibling;
        t.node = t.node.firstChild;
        for (i = 0; i < 3; i += 1) {
            r.shouldBe(t, "t.iterator.nextPosition()", "true");
            r.shouldBe(t, "t.iterator.container()", "t.node");
            r.shouldBe(t, "t.iterator.offset()", i.toString());
        }
        t.node = t.node.parentNode;
        r.shouldBe(t, "t.iterator.nextPosition()", "true");
        r.shouldBe(t, "t.iterator.container()", "t.node");
        r.shouldBe(t, "t.iterator.offset()", "1");
        t.node = t.node.nextSibling;
        for (i = 0; i < 3; i += 1) {
            r.shouldBe(t, "t.iterator.nextPosition()", "true");
            r.shouldBe(t, "t.iterator.container()", "t.node");
            r.shouldBe(t, "t.iterator.offset()", i.toString());
        }
        r.shouldBe(t, "t.iterator.nextPosition()", "true");
        r.shouldBe(t, "t.iterator.container()", "t.doc.documentElement");
        r.shouldBe(t, "t.iterator.offset()", "3");
        r.shouldBe(t, "t.iterator.nextPosition()", "false");
        r.shouldBe(t, "t.iterator.container()", "t.doc.documentElement");
        r.shouldBe(t, "t.iterator.offset()", "3");
    }
    function backwardInDoc() {
        createWalker("<a>abc<a>abc</a>1bc</a>");
        t.iterator.moveToEnd();
        t.node = t.doc.documentElement.lastChild;
        var i;
        for (i = 2; i >= 0; i -= 1) {
            r.shouldBe(t, "t.iterator.previousPosition()", "true");
            r.shouldBe(t, "t.iterator.container()", "t.node");
            r.shouldBe(t, "t.iterator.offset()", i.toString());
        }
        t.node = t.node.previousSibling;
        r.shouldBe(t, "t.iterator.previousPosition()", "true");
        r.shouldBe(t, "t.iterator.container()", "t.node");
        r.shouldBe(t, "t.iterator.offset()", "1");
        t.node = t.node.firstChild;
        for (i = 2; i >= 0; i -= 1) {
            r.shouldBe(t, "t.iterator.previousPosition()", "true");
            r.shouldBe(t, "t.iterator.container()", "t.node");
            r.shouldBe(t, "t.iterator.offset()", i.toString());
        }
        r.shouldBe(t, "t.iterator.previousPosition()", "true");
        r.shouldBe(t, "t.iterator.container()", "t.doc.documentElement");
        r.shouldBe(t, "t.iterator.offset()", "1");
        t.node = t.doc.documentElement.firstChild;
        for (i = 2; i >= 0; i -= 1) {
            r.shouldBe(t, "t.iterator.previousPosition()", "true");
            r.shouldBe(t, "t.iterator.container()", "t.node");
            r.shouldBe(t, "t.iterator.offset()", i.toString());
        }
        r.shouldBe(t, "t.iterator.previousPosition()", "false");
        r.shouldBe(t, "t.iterator.container()", "t.node");
        r.shouldBe(t, "t.iterator.offset()", "0");
    }
    function countPositions(xml) {
        var n = 1;
        createWalker(xml);
        while (t.iterator.nextPosition()) {
            n += 1;
        }
        return n;
    }
    function countPositionsBackwards(xml) {
        var n = 1;
        createWalker(xml);
        t.iterator.moveToEnd();
        while (t.iterator.previousPosition()) {
            n += 1;
        }
        return n;
    }
    function testPositions(count) {
        var n = 0, i, it = t.iterator, ok = true;
        while (it.nextPosition() && n <= count) {
            t.c1 = it.container();
            t.o1 = it.offset();
            it.setPosition(t.c1, t.o1);
            t.c2 = it.container();
            t.o2 = it.offset();
            r.shouldBe(t, "t.c2", "t.c1");
            r.shouldBe(t, "t.o2", "t.o1");
            for (i = 0; i <= n; i += 1) {
                ok = ok && it.previousPosition();
            }
            for (i = 1; i < count; i += 1) {
                ok = ok && it.nextPosition();
            }
            for (i = n + 2; i < count; i += 1) {
                ok = ok && it.previousPosition();
            }
            t.c2 = it.container();
            t.o2 = it.offset();
            r.shouldBe(t, "t.c2", "t.c1");
            r.shouldBe(t, "t.o2", "t.o1");
            n += 1;
        }
        r.shouldBe(t, ok.toString(), "true");
        r.shouldBe(t, (n + 1).toString(), count.toString());
    }
    function rejectedNodes() {
        var i, xml;
        for (i = 0; i < testXMLs.length; i += 1) {
            xml = testXMLs[i];
            t.positions = countPositions(xml.x);
            r.shouldBe(t, "t.positions", xml.n.toString());
            t.positions = countPositionsBackwards(xml.x);
            r.shouldBe(t, "t.positions", xml.n.toString());
            createWalker(xml.x);
            testPositions(xml.n);
        }
    }
    function insertEmptyTextNodes(doc) {
        var root = doc.documentElement,
            iterator = doc.createNodeIterator(root, 0xFFFFFFFF),
            n = iterator.nextNode();
        while (n !== null) {
            if (n !== root) {
                n.parentNode.insertBefore(doc.createTextNode(''), n);
            }
            n = iterator.nextNode();
        }
    }
    function splitTextNodes(doc) {
        var root = doc.documentElement,
            iterator = doc.createNodeIterator(root, 0xFFFFFFFF),
            n = iterator.nextNode();
        while (n !== null) {
            if (n.nodeType === 3 && n.data.length > 1) {
                n.splitText(1);
            }
            n = iterator.nextNode();
        }
    }
    function emptyTextNodes() {
        var i, xml, n;
        for (i = 0; i < testXMLs.length; i += 1) {
            xml = testXMLs[i];
            t.doc = runtime.parseXML(xml.x);
            insertEmptyTextNodes(t.doc);
            t.iterator = new core.PositionIterator(t.doc.documentElement, 0,
                    filter);
            n = 1;
            while (t.iterator.nextPosition()) {
                n += 1;
            }
            r.shouldBe(t, n.toString(), xml.n.toString());
            n = 1;
            while (t.iterator.previousPosition()) {
                n += 1;
            }
            r.shouldBe(t, n.toString(), xml.n.toString());
            testPositions(xml.n);
        }
    }
    function testSplitTextNodes() {
        var i, xml, n, s = new xmldom.LSSerializer();
        for (i = 0; i < testXMLs.length; i += 1) {
            xml = testXMLs[i];
            t.doc = runtime.parseXML(xml.x);
            splitTextNodes(t.doc);
            t.iterator = new core.PositionIterator(t.doc.documentElement, 0,
                    filter);
            n = 1;
            while (t.iterator.nextPosition()) {
                n += 1;
            }
            r.shouldBe(t, n.toString(), xml.n.toString());
            n = 1;
            while (t.iterator.previousPosition()) {
                n += 1;
            }
            r.shouldBe(t, n.toString(), xml.n.toString());
            testPositions(xml.n);
        }
    }
    this.tests = function () {
        return [
            create,
            forwardInEmptyDoc,
            backwardInEmptyDoc,
            forwardInSimpleDoc,
            backwardInSimpleDoc,
            forwardInDoc,
            backwardInDoc,
            rejectedNodes,
            emptyTextNodes,
            testSplitTextNodes
        ];
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
core.PositionIteratorTests.prototype.description = function () {
    "use strict";
    return "Test the PositionIterator class.";
};
(function () {
    "use strict";
    return core.PositionIteratorTests;
}());
