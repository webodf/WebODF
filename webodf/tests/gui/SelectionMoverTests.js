/**
 * Copyright (C) 2011 KO GmbH <jos.van.den.oever@kogmbh.com>
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
 * @source: http://gitorious.org/odfkit/webodf/
 */
/*global runtime: true, core: true, gui: true*/
runtime.loadClass("gui.SelectionMover");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
gui.SelectionMoverTests = function SelectionMoverTests(runner) {
    "use strict";
    var r = runner, maindoc = runtime.getWindow().document,
        t, testarea,
        testXMLs = [
            { x: "<a/>", n: 1 },
            { x: "<a><b/></a>", n: 3 },
            { x: "<a>a</a>", n: 2 },
            { x: "<a>a<b/></a>", n: 4 },
            { x: "<a><b/>a</a>", n: 4 },
            { x: "<a>hello</a>", n: 6 },
            { x: "<a>hel<b/>lo</a>", n: 8 },
            { x: "<a><c><b>a</b>a</c></a>", n: 7 }
        ];

    function setupDoc() {
        var doc = testarea.ownerDocument,
            p = doc.createElement("p"),
            text = doc.createTextNode("MMMMM MMMMM MMMMM MMMMM MMMMM"),
            mover,
            selection;
        testarea.appendChild(p);
        p.appendChild(text);
        p.style.width = "5em";// break line after each 'MMMMM'
        mover = new gui.SelectionMover(p);
        selection = mover.getSelection();
        t = { doc: doc, p: p, text: text, selection: selection, mover: mover };
    }
    function createDoc(xml) {
        var doc = runtime.parseXML(xml),
            mover,
            selection,
            node = testarea.ownerDocument.importNode(doc.documentElement, true);
        testarea.appendChild(node);
        mover = new gui.SelectionMover(node);
        selection = mover.getSelection();
        t = { doc: doc, root: node, selection: selection, mover: mover };
    }
    function testUpDownTraversal() {
        setupDoc();
        r.shouldBe(t, "t.selection.rangeCount", "1");
        t.r = t.selection.getRangeAt(0);
        r.shouldBeNonNull(t, "t.r");
        t.r.setStart(t.text, 0);
        r.shouldBe(t, "t.r.startContainer", "t.text");
        r.shouldBe(t, "t.r.startOffset", "0");
        t.mover.movePointForward();
        t.r = t.selection.getRangeAt(0);
        r.shouldBe(t, "t.r.startContainer", "t.text");
        r.shouldBe(t, "t.r.startOffset", "0");
        t.mover.movePointBackward();
        t.r = t.selection.getRangeAt(0);
        r.shouldBe(t, "t.r.startContainer", "t.text");
        r.shouldBe(t, "t.r.startOffset", "0");
/*
        t.mover.moveLineForward();
//        t.selection.modify("move", "forward", "line");
        t.r = t.selection.getRangeAt(0);
        r.shouldBe(t, "t.r.startContainer", "t.p.firstChild");
        r.shouldBe(t, "t.r.startOffset", "6");
*/
    }
    function testForthBack() {
        setupDoc();
        var n = 1;
        t.textValue = t.text.data;
        while (t.mover.movePointForward()) {
            n += 1;
        }
        r.shouldBe(t, n.toString(), "30");
        r.shouldBe(t, "t.text.data", "t.textValue");
        n = 1;
        while (t.mover.movePointBackward()) {
            n += 1;
        }
        r.shouldBe(t, n.toString(), "30");
        r.shouldBe(t, "t.text.data", "t.textValue");
    }
    function testXMLForthBack(xml, positions) {
        createDoc(xml);
        r.shouldBe(t, "t.mover.getCursor().getNode().parentNode", "t.root");
        var n = 1;
        while (t.mover.movePointForward()) {
            r.shouldBeNonNull(t, "t.mover.getCursor().getNode().parentNode");
            n += 1;
        }
        r.shouldBe(t, n.toString(), positions.toString());
        r.shouldBe(t, "t.mover.getCursor().getNode().parentNode", "t.root");
        n = 1;
        while (t.mover.movePointBackward()) {
            r.shouldBeNonNull(t, "t.mover.getCursor().getNode().parentNode");
            n += 1;
        }
        r.shouldBe(t, n.toString(), positions.toString());
        r.shouldBe(t, "t.mover.getCursor().getNode().parentNode", "t.root");
        runtime.log("end " + t.mover.getCursor().getNode().parentNode);
    }
    function testXMLsForthBack() {
        var i, xml;
        for (i = 0; i < 0; i += 1) {//testXMLs.length; i += 1) {
            xml = testXMLs[i];
            testXMLForthBack(xml.x, xml.n);
        }
    }

    this.setUp = function () {
        t = {};
        testarea = maindoc.getElementById("testarea");
        if (!testarea) {
            testarea = maindoc.createElement("div");
            maindoc.body.appendChild(testarea);
        }
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
        return [ testUpDownTraversal, testForthBack, testXMLsForthBack ];
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
gui.SelectionMoverTests.prototype.description = function () {
    "use strict";
    return "Test the SelectionMover class.";
};
(function () {
    "use strict";
    return gui.SelectionMoverTests;
}());
