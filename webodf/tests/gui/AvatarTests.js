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
/*global runtime, core, gui, ops, odf*/
runtime.loadClass("gui.Caret");
runtime.loadClass("odf.OdfCanvas");
runtime.loadClass("ops.Document");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
gui.AvatarTests = function AvatarTests(runner) {
    "use strict";
    var r = runner, t, maindoc = runtime.getWindow().document, odfDocument, testarea,
        odfxml = '<office:text text:use-soft-page-breaks="true" xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">\n'
        + '      <text:sequence-decls>\n'
        + '        <text:sequence-decl text:display-outline-level="0" text:name="Illustration"/>\n'
        + '        <text:sequence-decl text:display-outline-level="0" text:name="Table"/>\n'
        + '        <text:sequence-decl text:display-outline-level="0" text:name="Text"/>\n'
        + '        <text:sequence-decl text:display-outline-level="0" text:name="Drawing"/>\n'
        + '      </text:sequence-decls>\n'
        + '      <text:section text:style-name="Sect1" text:name="Section1">\n'
        + '        <text:p text:style-name="P3">\n'
        + '          <text:s/>\n'
        + '        </text:p>\n'
        + '        <text:p text:style-name="P6"/>\n'
        + '        <text:p text:style-name="P5">WebODF is an exiting new technology that you can find in on <text:span text:style-name="Emphasis">mobile phones</text:span> and <text:span text:style-name="Emphasis">tablets</text:span>, embedded in <text:span text:style-name="Emphasis">wiki’s, intranet solutions</text:span> and <text:span text:style-name="Emphasis">webmail</text:span> and even in browsers. </text:p>\n'
        + '      </text:section>\n'
        + '</office:text>\n',
        odfxml2 = '<text><p>a </p></text>',
        odfxml3 = '<p>  a  b</p>',
        odfxml4 = '<office:text xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">\n'
        + '      <text:section>\n'
        + '        <text:p/>\n'
        + '      </text:section>\n'
        + '</office:text>\n',
        dummyfilter = function acceptPosition(p) {
            t.pos.push({
                c: p.container(),
                o: p.offset()
            });
            return 1;
        },
        textfilter = function acceptPosition(iterator) {
            var n = iterator.container(), p, o, d;
            // only stop in text nodes or at end of <p> or <h>
            if (n.nodeType !== 3) {
                if (n.localName !== "p" && n.localName !== "h") {
                    return 2;
                }
                t.pos.push({
                    c: iterator.container(),
                    o: iterator.offset()
                });
                return 1;
            }
            if (n.length === 0) {
                return 2;
            }
            // only stop in text nodes in 'p', 'h' or 'span' elements
            p = n.parentNode;
            o = p && p.localName;
            if (o !== "p" && o !== "span" && o !== "h") {
                return 2;
            }
            // do not stop between spaces
            o = iterator.textOffset();
            if (o > 0 && iterator.substr(o - 1, 2) === "  ") {
                return 2;
            }
            t.pos.push({
                c: iterator.container(),
                o: iterator.offset()
            });
            return 1;
        };
    dummyfilter.acceptPosition = dummyfilter;
    textfilter.acceptPosition = textfilter;

    this.setUp = function () {
        var odfContainer = new odf.OdfContainer("", null),
            odfcanvas;
        t = {};
        testarea = maindoc.getElementById("testarea");
        if (!testarea) {
            testarea = maindoc.createElement("div");
            testarea.setAttribute('id', 'testarea');
            maindoc.body.appendChild(testarea);
        }
        while (testarea.firstChild) {
            testarea.removeChild(testarea.firstChild);
        }
        odfcanvas = new odf.OdfCanvas(testarea);
        odfcanvas.setOdfContainer(odfContainer);
        odfDocument = new ops.Document(odfcanvas);
    };
    this.tearDown = function () {
        t = {};
        while (testarea.firstChild) {
            testarea.removeChild(testarea.firstChild);
        }
    };
    /**
     * @param {string=} xml
     */
    function createAvatar(xml) {
        var doc, node;

        if (xml) {
            doc = /**@type{!Document}*/(runtime.parseXML(xml));
            node = /**@type{!Element}*/(maindoc.importNode(doc.documentElement, true));
            odfDocument.getRootNode().appendChild(node);
        }
        t.cursor = new core.Cursor("id", odfDocument);
        t.caret = new gui.Caret(t.cursor);
runtime.log(maindoc.documentElement.innerHTML);
    }
    function create() {
        createAvatar("<a/>");
        r.shouldBeNonNull(t, "t.caret");
        r.shouldBe(t, "t.caret.getCursor().getMemberId()", "'id'");
        var s = t.cursor.getSelection();
        t.rangeCount = s.rangeCount;
        r.shouldBe(t, "t.rangeCount", "1");
        t.focusOffset = s.focusOffset;
        r.shouldBe(t, "t.focusOffset", "0");
        t.focusNode = s.focusNode;
        r.shouldBeNonNull(t, "t.focusNode");
    }
    function moveInEmptyDoc() {
        createAvatar();
        var s = t.cursor.getSelection();
        t.startNode = s.focusNode;
        t.cursor.move(1);
        t.focusOffset = s.focusOffset;
        t.focusNode = s.focusNode;
        r.shouldBe(t, "t.focusOffset", "0");
        r.shouldBe(t, "t.startNode", "t.focusNode");
    }
    function moveInSimpleDoc() {
        createAvatar("<a>hello</a>");
        var s = t.cursor.getSelection(),
            i;
        // step behind <a>
        t.cursor.move(1);
        t.startNode = s.focusNode;
        for (i = 1; i <= 4; i += 1) {
            t.cursor.move(1);
runtime.log(i+":"+testarea.innerHTML);
            t.focusOffset = s.focusOffset;
            t.focusNode = s.focusNode;
            r.shouldBe(t, "t.focusOffset", i.toString());
            r.shouldBe(t, "t.focusNode", "t.startNode");
        }
        // step before </a>
        t.cursor.move(1);
runtime.log(testarea.innerHTML);
        t.focusOffset = s.focusOffset;
        t.focusNode = s.focusNode;
        r.shouldBe(t, "t.focusOffset", "1");
        r.shouldBe(t, "t.focusNode", "t.startNode.parentNode");
        // step after </a>, at end of document
        t.cursor.move(1);
runtime.log(testarea.innerHTML);
        r.shouldBe(t, "t.focusOffset", "1");
        r.shouldBe(t, "t.focusNode", "t.startNode.parentNode");
        // step before </a>
        t.cursor.move(-11);
runtime.log(testarea.innerHTML);
        r.shouldBe(t, "t.focusOffset", "1");
        r.shouldBe(t, "t.focusNode", "t.startNode.parentNode");
        for (i = 4; i >= 0; i -= 1) {
            t.cursor.move(-1);
runtime.log(i+":"+testarea.innerHTML);
            t.focusOffset = s.focusOffset;
            t.focusNode = s.focusNode;
            r.shouldBe(t, "t.focusOffset", i.toString());
            r.shouldBe(t, "t.focusNode", "t.startNode");
        }
        t.cursor.move(1);
runtime.log(testarea.innerHTML);
        r.shouldBe(t, "t.focusOffset", "0");
        r.shouldBe(t, "t.focusNode", "t.startNode");
    }
    /**
     * Start at a valid position and count how many filtered steps are needed.
     * The amount should be m. Then check that the avatar is still at the
     * starting position.
     */
    function stepCounter(xml, n, m, filter) {
        var steps, s, e;
        t.pos = [];
        createAvatar(xml);
        s = t.cursor.getSelection();
        t.counter = t.cursor.getStepCounter();

        // move to a valid position
        t.startFocusOffset = s.focusOffset;
        t.startFocusNode = s.focusNode;
        t.startText = s.focusNode.data;
        t.focusOffset = s.focusOffset;
        t.focusNode = s.focusNode;
        t.text = s.focusNode.data;
        steps = t.counter.countForwardSteps(n, filter);
        r.shouldBe(t, steps.toString(), m.toString());
        t.focusOffset2 = s.focusOffset;
        t.focusNode2 = s.focusNode;
        t.text2 = s.focusNode.data;
        r.shouldBe(t, "t.focusOffset", "t.focusOffset2");
        r.shouldBe(t, "t.focusNode", "t.focusNode2");
        r.shouldBe(t, "t.text", "t.text2");

        t.cursor.move(steps);

        t.focusOffset = s.focusOffset;
        t.focusNode = s.focusNode;
        t.text = s.focusNode.data;
        steps = t.counter.countBackwardSteps(n, filter);
        r.shouldBe(t, steps.toString(), m.toString());
        t.focusOffset2 = s.focusOffset;
        t.focusNode2 = s.focusNode;
        t.text2 = s.focusNode.data;
        r.shouldBe(t, "t.focusOffset", "t.focusOffset2");
        r.shouldBe(t, "t.focusNode", "t.focusNode2");
        r.shouldBe(t, "t.text", "t.text2");

        t.cursor.move(-steps);

        t.focusOffset = s.focusOffset;
        t.focusNode = s.focusNode;
        t.text = s.focusNode.data;
        r.shouldBe(t, "t.focusOffset", "t.startFocusOffset");
        r.shouldBe(t, "t.focusNode", "t.startFocusNode");
        r.shouldBe(t, "t.text", "t.startText");
    }
    function stepCounter1() {
        stepCounter("<p>ab</p>", 1, 1, dummyfilter);
    }
    function stepCounter2() {
        stepCounter("<p>ab</p>", 2, 2, dummyfilter);
    }
    function backAndForth(xml, n, m, filter) {
        var i, steps;
        t.pos = [];
        t.filter = filter;
        createAvatar(xml);
        t.counter = t.cursor.getStepCounter();

        // move to a valid position
        steps = t.counter.countForwardSteps(1, filter);
        t.cursor.move(steps);
        steps = t.counter.countBackwardSteps(1, filter);
        t.cursor.move(-steps);
        t.pos = [];

        t.stepsSum = 0;
        t.moveSum = 0;
        for (i = 1; i <= m; i += 1) {
            steps = t.counter.countForwardSteps(1, filter);
            t.stepsSum += Math.abs(steps);
            t.moveSum += Math.abs(t.cursor.move(steps));
        }
        r.shouldBe(t, "t.counter.countForwardSteps(1, t.filter)", "0");
        r.shouldBe(t, "t.pos.length", m.toString());
        r.shouldBe(t, "t.stepsSum", n.toString());
        r.shouldBe(t, "t.moveSum", n.toString());
        t.prevPos = t.pos.reverse();
        t.pos = [];
        t.stepsSum = 0;
        t.moveSum = 0;
        for (i = 1; i <= m; i += 1) {
            steps = t.counter.countBackwardSteps(1, filter);
            t.stepsSum += Math.abs(steps);
            t.moveSum += Math.abs(t.cursor.move(-steps));
        }
        r.shouldBe(t, "t.counter.countBackwardSteps(1, t.filter)", "0");
        r.shouldBe(t, "t.pos.length", m.toString());
        r.shouldBe(t, "t.stepsSum", n.toString());
        r.shouldBe(t, "t.moveSum", n.toString());
    }
    function backAndForth1() {
        backAndForth('<p>ab</p>\n', 2, 2, dummyfilter);
    }
    function backAndForth2() {
        backAndForth(odfxml, 300, 300, dummyfilter);
    }
    function backAndForth3() {
        backAndForth('<p>ab</p>', 2, 2, textfilter);
    }
    function backAndForth4() {
        backAndForth(odfxml2, 2, 2, textfilter);
    }
    function backAndForth5() {
        backAndForth(odfxml3, 6, 6, dummyfilter);
    }
    function backAndForth6() {
        backAndForth(odfxml3, 6, 4, textfilter);
    }
    function backAndForth7() {
        backAndForth(odfxml, 300, 300, dummyfilter);
    }
    function backAndForth8() {
        backAndForth(odfxml, 212, 171, textfilter);
    }
    function backAndForth9() {
        backAndForth(odfxml4, 0, 0, textfilter);
    }
    function backAndForth10() {
        backAndForth(odfxml4, 28, 28, dummyfilter);
    }
    this.tests = function () {
        return [
            create,
            moveInEmptyDoc
//             moveInSimpleDoc
//             stepCounter1,
//             stepCounter2,
//             backAndForth1,
//             backAndForth2,
//             backAndForth3,
//             backAndForth4,
//             backAndForth5,
//             backAndForth6,
//             backAndForth7,
//             backAndForth8,
//             backAndForth9,
//             backAndForth10
        ];
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
gui.AvatarTests.prototype.description = function () {
    "use strict";
    return "Test the Avatar class.";
};
(function () {
    "use strict";
    return gui.AvatarTests;
}());
