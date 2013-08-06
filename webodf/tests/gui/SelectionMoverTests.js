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
/*global runtime, core, gui, Node, NodeFilter*/
runtime.loadClass("gui.SelectionMover");
/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
gui.SelectionMoverTests = function SelectionMoverTests(runner) {
    "use strict";
    var r = runner,
        t, testarea,
        testXMLs = [
            { x: "<a/>", n: 1, t: 0 },
            { x: "<a><b/></a>", n: 3, t: 0 },
            { x: "<a>a</a>", n: 2, t: 1 },
            { x: "<a>a<b/></a>", n: 4, t: 1 },
            { x: "<a><b/>a</a>", n: 4, t: 1 },
            { x: "<a>hello</a>", n: 6, t: 5 },
            { x: "<a>hel<b/>lo</a>", n: 8, t: 5 },
            { x: "<a><c><b>a</b>a</c></a>", n: 7, t: 2 }
        ];

    function setupDoc() {
        var domDocument = testarea.ownerDocument,
            p = domDocument.createElement("p"),
            text = domDocument.createTextNode("MMMMM MMMMM MMMMM MMMMM MMMMM"),
            cursor,
            mover;
        testarea.appendChild(p);
        p.appendChild(text);
        p.style.width = "5em";// break line after each 'MMMMM'
        cursor = new core.Cursor(domDocument, "Joe");
        mover = new gui.SelectionMover(cursor, p);
        t = { doc: domDocument, p: p, mover: mover, cursor: cursor };
    }
    function replaceParagraphsWithHtmlParagraphs(root) {
        var child = root.firstChild, paragraph;
        while (child) {
            if (child.localName === "p") {
                paragraph = root.ownerDocument.createElement("p");
                root.insertBefore(paragraph, child);
                while (child.firstChild) {
                    paragraph.appendChild(child.firstChild);
                }
                root.removeChild(child);
                child = paragraph;
            }
            child = child.nextSibling;
        }
    }
    function createDoc(xml) {
        var domDocument = testarea.ownerDocument,
            doc = runtime.parseXML(xml),
            mover,
            cursor,
            node = /**@type{!Element}*/(domDocument.importNode(doc.documentElement, true));
        testarea.appendChild(node);
        // Paragraph nodes can be styled, will properly line break etc.
        // This makes writing boundary and line-related tests easier
        replaceParagraphsWithHtmlParagraphs(node);
        cursor = new core.Cursor(domDocument, "Joe");
        mover = new gui.SelectionMover(cursor, node);
        t = { doc: doc, root: node, mover: mover, cursor: cursor };
    }
    function testUpDownTraversal() {
        setupDoc();
        t.mover.movePointForward(1);
        r.shouldBe(t, "'M'", "t.cursor.getNode().previousSibling.data");
        r.shouldBe(t, "'MMMM MMMMM MMMMM MMMMM MMMMM'", "t.cursor.getNode().nextSibling.data");
        t.mover.movePointBackward(1);
        r.shouldBe(t, "'MMMMM MMMMM MMMMM MMMMM MMMMM'", "t.cursor.getNode().nextSibling.data");
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
        t.textValue = t.cursor.getNode().nextSibling.data;
        while (t.mover.movePointForward(1)) {
            n += 1;
        }
        r.shouldBe(t, n.toString(), "30");
        r.shouldBe(t, "t.cursor.getNode().previousSibling.data", "t.textValue");
        n = 1;
        while (t.mover.movePointBackward(1)) {
            n += 1;
        }
        r.shouldBe(t, n.toString(), "30");
        r.shouldBe(t, "t.cursor.getNode().nextSibling.data", "t.textValue");
    }
    function testXMLForthBack(xml, positions) {
        createDoc(xml);
        r.shouldBe(t, "t.cursor.getNode().parentNode", "t.root");
        var n = 1;
        while (t.mover.movePointForward(1)) {
            r.shouldBeNonNull(t, "t.cursor.getNode().parentNode");
            n += 1;
        }
        r.shouldBe(t, n.toString(), positions.toString());
        r.shouldBe(t, "t.cursor.getNode().parentNode", "t.root");
        n = 1;
        while (t.mover.movePointBackward(1)) {
            r.shouldBeNonNull(t, "t.cursor.getNode().parentNode");
            n += 1;
        }
        r.shouldBe(t, n.toString(), positions.toString());
        r.shouldBe(t, "t.cursor.getNode().parentNode", "t.root");
    }
    /**
     * @constructor
     * @implements core.PositionFilter
     */
    function AcceptAllPositionFilter() {
        this.acceptPosition = function () {
            return 1;
        };
    }
    function testXMLsForthBack() {
        var i, xml;
        for (i = 0; i < testXMLs.length; i += 1) {
            xml = testXMLs[i];
            testXMLForthBack(xml.x, xml.n);
        }
    }
    function countAndConfirm(xml, n, filter) {
        createDoc(xml);
        var counter = t.mover.getStepCounter(),
            steps = counter.countForwardSteps(1, filter),
            sum = 0,
            stepped = 0;
        while (steps > 0) {
            stepped += t.mover.movePointForward(steps);
            sum += steps;
            steps = counter.countForwardSteps(1, filter);
        }
        t.totalSteps = counter.countStepsToPosition(t.root, 0,filter);
        r.shouldBe(t, stepped.toString(), (n - 1).toString());
        r.shouldBe(t, sum.toString(), (n - 1).toString());
        r.shouldBe(t, "t.totalSteps", (-1 * (n - 1)).toString());
    }
    function testCountAndConfirm() {
        var i, xml,
            filter2 = new AcceptAllPositionFilter();
        for (i = 0; i < testXMLs.length; i += 1) {
            xml = testXMLs[i];
            countAndConfirm(xml.x, xml.n, filter2);
        }
    }
    function testCountStepsToNode() {
        createDoc("<t><p>hello</p><p></p></t>");
        var range = t.root.ownerDocument.createRange(),
            counter = t.mover.getStepCounter(),
            emptyNode = t.root.lastChild,
            steps;
        range.setStart(emptyNode, 0);
        range.collapse(true);
        t.cursor.setSelectedRange(range);
        steps = counter.countStepsToPosition(emptyNode, 0, new AcceptAllPositionFilter());
        r.shouldBe(t, steps.toString(), "0");
    }
    /**
     * Simulate a valid cursor position
     * Keeps logic behaving in a similar fashion to actual ODT counting... makes the tests less confusing
     * Additionally, some bugs only exhibit themselves when a particular container & offset are returned
     * @constructor
     * @implements core.PositionFilter
     */
    function PretendOdfFilter() {
        this.acceptPosition = function (iterator) {
            var container = iterator.container();

            if (container.nodeType === Node.TEXT_NODE
                    && (container.parentNode.localName === "p" || iterator.unfilteredDomOffset() !== 0)) {
                return NodeFilter.FILTER_ACCEPT;
            }
            if (container.localName === "p" && iterator.unfilteredDomOffset() !== 0) {

                return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
        };
    }
    function setCursorPosition(startOffset) {
        var range = t.root.ownerDocument.createRange(),
            filter = new PretendOdfFilter(),
            counter = t.mover.getStepCounter(),
            firstParagraph = t.root.childNodes[1], // index-0 will be the cursor
            stepsToStartOffset;
        t.filter = filter;
        t.counter = counter;
        range.setStart(firstParagraph, 0);
        range.collapse(true);
        t.cursor.setSelectedRange(range);
        stepsToStartOffset = counter.countForwardSteps(startOffset, filter);
        t.mover.movePointForward(stepsToStartOffset, false);
    }
    function testCountLinesStepsDown_FromParagraphStart() {
        createDoc("<t><p>ABCD</p><p>FGHIJ</p></t>");
        setCursorPosition(0);
        t.steps = t.counter.countLinesSteps(1, t.filter);
        r.shouldBe(t, "t.steps", "5");
    }
    function testCountLinesStepsDown_FromParagraphEnd() {
        createDoc("<t><p>ABCD</p><p>FGHIJ</p></t>");
        setCursorPosition(4);
        t.steps = t.counter.countLinesSteps(1, t.filter);
        r.shouldBe(t, "t.steps", "6");
    }
    function testCountLinesStepsDown_FromJaggedParagraphEnd() {
        createDoc("<t><p>ABCDE</p><p>FGHIJ</p></t>");
        setCursorPosition(5);
        t.steps = t.counter.countLinesSteps(1, t.filter);
        r.shouldBe(t, "t.steps", "6");
    }
    function testCountLinesStepsDown_OverWrap() {
        createDoc("<t><p>ABCD FGHIJ</p></t>");
        t.root.getElementsByTagName('p')[0].style.width = "30px"; // first paragraph
        setCursorPosition(4);
        t.steps = t.counter.countLinesSteps(1, t.filter);
        r.shouldBe(t, "t.steps", "6");
    }
    function testCountLinesStepsUp_FromParagraphStart() {
        createDoc("<t><p>ABCD</p><p>FGHIJ</p></t>");
        setCursorPosition(5);
        t.steps = t.counter.countLinesSteps(-1, t.filter);
        r.shouldBe(t, "t.steps", "-5");
    }
    function testCountLinesStepsUp_FromParagraphEnd() {
        createDoc("<t><p>ABCD</p><p>FGHIJ</p></t>");
        setCursorPosition(10);
        t.steps = t.counter.countLinesSteps(-1, t.filter);
        r.shouldBe(t, "t.steps", "-6");
    }
    function testCountLinesStepsUp_FromJaggedParagraphEnd() {
        createDoc("<t><p>ABCDE</p><p>FGHIJ</p></t>");
        setCursorPosition(11);
        t.steps = t.counter.countLinesSteps(-1, t.filter);
        r.shouldBe(t, "t.steps", "-7");
    }
    function testCountStepsToLineBoundary_Forward_FromParagraphStart() {
        createDoc("<t><p>ABCD</p><p>FGHIJ</p></t>");
        setCursorPosition(0);
        t.steps = t.counter.countStepsToLineBoundary(1, t.filter);
        r.shouldBe(t, "t.steps", "4");
    }
    function testCountStepsToLineBoundary_Forward_StartingAtSpace() {
        createDoc("<t><p> BCD</p><p>FGHIJ</p></t>");
        setCursorPosition(0);
        t.steps = t.counter.countStepsToLineBoundary(1, t.filter);
        r.shouldBe(t, "t.steps", "4");
    }
    function testCountStepsToLineBoundary_Forward_EndingAtSpace() {
        createDoc("<t><p>ABC </p><p>FGHIJ</p></t>");
        setCursorPosition(0);
        t.steps = t.counter.countStepsToLineBoundary(1, t.filter);
        r.shouldBe(t, "t.steps", "4");
    }
    function testCountStepsToLineBoundary_Forward_OverWrapping() {
        createDoc("<t><p>ABC DEF</p></t>");
        setCursorPosition(0);
        t.root.getElementsByTagName('p')[0].style.width = "30px"; // first paragraph
        t.steps = t.counter.countStepsToLineBoundary(1, t.filter);
        r.shouldBe(t, "t.steps", "3");
    }
    function testCountStepsToLineBoundary_Backward_FromParagraphStart() {
        createDoc("<t><p>ABCD</p><p>FGHIJ</p></t>");
        setCursorPosition(0);
        t.steps = Math.abs(t.counter.countStepsToLineBoundary(-1, t.filter)); // Chrome tells me this is -0. Er wat?
        r.shouldBe(t, "t.steps", "0");
    }
    function testCountStepsToLineBoundary_Backward_EndingAtWhiteSpace() {
        createDoc("<t><p> BCD</p><p>FGHIJ</p></t>");
        setCursorPosition(4);
        t.steps = t.counter.countStepsToLineBoundary(-1, t.filter);
        r.shouldBe(t, "t.steps", "-4");
    }
    function testCountStepsToLineBoundary_Backward_FromParagraphEnd() {
        createDoc("<t><p>ABCD</p><p>FGHIJ</p></t>");
        setCursorPosition(4);
        t.steps = t.counter.countStepsToLineBoundary(-1, t.filter);
        r.shouldBe(t, "t.steps", "-4");
    }
    function testCountStepsToLineBoundary_Backward_OverWhiteSpace() {
        createDoc("<t><p>A <span> BC</span>D</p></t>");
        setCursorPosition(6);
        t.steps = t.counter.countStepsToLineBoundary(-1, t.filter);
        r.shouldBe(t, "t.steps", "-6");
    }
    function testCountStepsToLineBoundary_Backward_OverWhiteSpaceOnlyNode() {
        createDoc("<t><p>A <span>   </span>D</p></t>");
        setCursorPosition(6);
        t.steps = t.counter.countStepsToLineBoundary(-1, t.filter);
        r.shouldBe(t, "t.steps", "-6");
    }
    function testCountStepsToLineBoundary_Backward_OverEmptyTextNodes() {
        var span1, span2;
        createDoc("<t><p>A <span/><span/> D </p></t>");
        // Add an empty text node to the span element
        span1 = t.root.childNodes[1].childNodes[1];
        span2 = t.root.childNodes[1].childNodes[2];
        span1.appendChild(t.root.ownerDocument.createTextNode(""));
        span2.parentNode.insertBefore(t.root.ownerDocument.createTextNode(""), span1);
        span2.appendChild(t.root.ownerDocument.createTextNode(""));
        span2.parentNode.insertBefore(t.root.ownerDocument.createTextNode(""), span2);
        setCursorPosition(6);
        t.steps = t.counter.countStepsToLineBoundary(-1, t.filter);
        r.shouldBe(t, "t.steps", "-6");
    }
    function testCountStepsToLineBoundary_Backward_OverWrapping() {
        createDoc("<t><p>ABC DEF</p></t>");
        t.root.getElementsByTagName('p')[0].style.width = "30px"; // first paragraph
        setCursorPosition(6);
        t.steps = t.counter.countStepsToLineBoundary(-1, t.filter);
        r.shouldBe(t, "t.steps", "-2");
    }
    function testCountStepsToLineBoundary_Backward_OverWrapping2() {
        createDoc("<t><p>ABC D <span>E</span>F</p></t>");
        t.root.getElementsByTagName('p')[0].style.width = "40px"; // first paragraph
        setCursorPosition(8);
        t.steps = t.counter.countStepsToLineBoundary(-1, t.filter);
        r.shouldBe(t, "t.steps", "-4");
    }
    this.setUp = function () {
        t = {};
        testarea = core.UnitTest.provideTestAreaDiv();
    };
    this.tearDown = function () {
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };

    this.tests = function () {
        return [
            testUpDownTraversal,
            testForthBack,
            testXMLsForthBack,
            testCountAndConfirm,
            testCountStepsToNode,

            testCountLinesStepsDown_FromParagraphStart,
            testCountLinesStepsDown_FromParagraphEnd,
            testCountLinesStepsDown_FromJaggedParagraphEnd,
            testCountLinesStepsDown_OverWrap,

            testCountLinesStepsUp_FromParagraphStart,
            testCountLinesStepsUp_FromParagraphEnd,
            testCountLinesStepsUp_FromJaggedParagraphEnd,

            testCountStepsToLineBoundary_Forward_FromParagraphStart,
            testCountStepsToLineBoundary_Forward_StartingAtSpace,
            testCountStepsToLineBoundary_Forward_EndingAtSpace,
            testCountStepsToLineBoundary_Forward_OverWrapping,

            testCountStepsToLineBoundary_Backward_FromParagraphStart,
            testCountStepsToLineBoundary_Backward_EndingAtWhiteSpace,
            testCountStepsToLineBoundary_Backward_FromParagraphEnd,
            testCountStepsToLineBoundary_Backward_OverWhiteSpace,
            testCountStepsToLineBoundary_Backward_OverWhiteSpaceOnlyNode,
            testCountStepsToLineBoundary_Backward_OverEmptyTextNodes,
            testCountStepsToLineBoundary_Backward_OverWrapping,
            testCountStepsToLineBoundary_Backward_OverWrapping2
        ];
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
