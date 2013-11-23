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
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
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
 * @source: https://github.com/kogmbh/WebODF/
 */
/*global Node, runtime, core, gui, ops, odf, NodeFilter*/
runtime.loadClass("odf.OdfCanvas");
runtime.loadClass("ops.OdtCursor");
runtime.loadClass("ops.OdtDocument");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
ops.OdtCursorTests = function OdtCursorTests(runner) {
    "use strict";
    var r = runner, t, domDocument = runtime.getWindow().document, testarea,
        odfxml = '<text:sequence-decls>\n'
        + '  <text:sequence-decl text:display-outline-level="0" text:name="Illustration"/>\n'
        + '  <text:sequence-decl text:display-outline-level="0" text:name="Table"/>\n'
        + '  <text:sequence-decl text:display-outline-level="0" text:name="Text"/>\n'
        + '  <text:sequence-decl text:display-outline-level="0" text:name="Drawing"/>\n'
        + '</text:sequence-decls>\n'
        + '<text:section text:style-name="Sect1" text:name="Section1">\n'
        + '  <text:p text:style-name="P3">\n'
        + '    <text:s/>\n'
        + '  </text:p>\n'
        + '  <text:p text:style-name="P6"/>\n'
        + '  <text:p text:style-name="P5">WebODF is an exiting new technology that you can find in on <text:span text:style-name="Emphasis">mobile phones</text:span> and <text:span text:style-name="Emphasis">tablets</text:span>, embedded in <text:span text:style-name="Emphasis">wiki’s, intranet solutions</text:span> and <text:span text:style-name="Emphasis">webmail</text:span> and even in browsers. </text:p>\n'
        + '</text:section>',
        odfxml2 = '<p>a </p>',
        odfxml3 = '<p>  a  b</p>',
        odfxml4 = '<text:section>\n'
        + '  <text:p/>\n'
        + '</text:section>',
        dummyfilter,
        textfilter;
    function createWalker(iterator) {
        var document = iterator.getCurrentNode().ownerDocument,
            walker = document.createTreeWalker(t.odtDocument.getRootNode(), NodeFilter.SHOW_ALL, iterator.getNodeFilter(), false);

        walker.currentNode = iterator.getCurrentNode();
        return walker;
    }

    /**
     * Return the offset as it would be if all neighboring text nodes were one
     * text node.
     * @return {!number}
     */
    function textOffset(iterator) {
        var walker = createWalker(iterator),
            offset = iterator.unfilteredDomOffset();
        if (walker.currentNode.nodeType !== Node.TEXT_NODE) {
            return 0;
        }
        // add lengths of preceding textnodes
        while (walker.previousSibling() && walker.currentNode.nodeType === Node.TEXT_NODE) {
            offset += walker.currentNode.length;
        }
        return offset;
    }
    /**
     * This returns the local text neighborhood as seen from the current
     * position, which is an ordered array of all sibling text nodes, from
     * left to right.
     * @return {Array.<Node>}
     */
    function textNeighborhood(iterator) {
        var walker = createWalker(iterator),
            neighborhood = [];
        if (walker.currentNode.nodeType !== Node.TEXT_NODE) {
            return neighborhood;
        }
        while (walker.previousSibling()) {
            if (walker.currentNode.nodeType !== Node.TEXT_NODE) {
                walker.nextSibling();
                break;
            }
        }
        do {
            neighborhood.push(walker.currentNode);
        } while (walker.nextSibling() && walker.currentNode.nodeType === Node.TEXT_NODE);
        return neighborhood;
    }
    /**
     * This returns the text string from the current neighborhood as if
     * all the neighboring text nodes were one
     * @return {!string}
     */
    function getText(iterator) {
        var i,
            data = "",
            neighborhood = textNeighborhood(iterator);

        for (i = 0; i < neighborhood.length; i += 1) {
            data += neighborhood[i].data;
        }

        return data;
    }
    dummyfilter = function acceptPosition(p) {
        t.pos.push({
            c: p.container(),
            o: p.unfilteredDomOffset()
        });
        return 1;
    };
    textfilter = function acceptPosition(iterator) {
        var n = iterator.container(), p, o;
        // only stop in text nodes or at end of <p> or <h>
        if (n.nodeType !== Node.TEXT_NODE) {
            if (n.localName !== "p" && n.localName !== "h") {
                return 2;
            }
            t.pos.push({
                c: iterator.container(),
                o: iterator.unfilteredDomOffset()
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
        o = textOffset(iterator);
        if (o > 0 && getText(iterator).substr(o - 1, 2) === "  ") {
            return 2;
        }
        t.pos.push({
            c: iterator.container(),
            o: iterator.unfilteredDomOffset()
        });
        return 1;
    };
    dummyfilter.acceptPosition = dummyfilter;
    textfilter.acceptPosition = textfilter;

    this.setUp = function () {
        var odfContainer;
        t = {};
        testarea = core.UnitTest.provideTestAreaDiv();
        t.odfcanvas = new odf.OdfCanvas(testarea);
        odfContainer = new odf.OdfContainer("", null);
        t.odfcanvas.setOdfContainer(odfContainer);
        t.odtDocument = new ops.OdtDocument(t.odfcanvas);
    };
    this.tearDown = function () {
        t.odfcanvas.destroy(function () { return; });
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };

    /**
     * @param {!Element} root
     * @return {undefined}
     */
    function splitTextNodes(root) {
        var iterator = root.ownerDocument.createNodeIterator(root, 0xFFFFFFFF, null, false),
            n = iterator.nextNode();
        while (n !== null) {
            if (n.nodeType === Node.TEXT_NODE && n.data.length > 1) {
                n.splitText(1);
            }
            n = iterator.nextNode();
        }
    }
    /**
     * @param {!Element} root
     * @return {undefined}
     */
    function insertEmptyTextNodes(root) {
        var doc = root.ownerDocument,
            iterator = doc.createNodeIterator(root, 0xFFFFFFFF, null, false),
            n = iterator.nextNode();
        while (n !== null) {
            if (n !== root) {
                n.parentNode.insertBefore(doc.createTextNode(''), n);
            }
            n = iterator.nextNode();
        }
    }
    /**
     * @param {string=} xml
     * @param {!boolean=} splitTexts
     * @param {!boolean=} emptyNodes
     * @return {undefined}
     */
    function createOdtCursor(xml, splitTexts, emptyNodes) {
        var doc, node,
            i,
            odfRootNode = t.odtDocument.getRootNode();

        // clean-up odf content. will be refilled
        while (odfRootNode.firstChild) {
            odfRootNode.removeChild(odfRootNode.firstChild);
        }

        if (xml) {
            // odfRootNode already provides a <office;text> element, to which
            // the content should be added here. So create the nodes in a
            // Document with a temporary <help> root element and then import
            // all its childs, which is the content
            xml = '<helper xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">' + xml + '</helper>';
            doc = /**@type{!Document}*/(runtime.parseXML(xml));
            for (i = 0; i < doc.documentElement.childNodes.length; i += 1) {
                node = /**@type{!Element}*/(domDocument.importNode(doc.documentElement.childNodes[i], true));
                odfRootNode.appendChild(node);
            }
        }
        if (splitTexts) {
            splitTextNodes(odfRootNode);
        }
        if (emptyNodes) {
            insertEmptyTextNodes(odfRootNode);
        }
        t.cursor = new ops.OdtCursor("id", t.odtDocument);
    }
    function surroundingText(cursor) {
        var previousSibling = cursor.getNode().previousSibling,
            nextSibling = cursor.getNode().nextSibling,
            text = "";
        if (previousSibling && previousSibling.nodeType === Node.TEXT_NODE) {
            text += previousSibling.data;
        }
        if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
            text += nextSibling.data;
        }

        return text;
    }
    function create() {
        createOdtCursor();
        t.range = t.cursor.getSelectedRange();
        r.shouldBeNonNull(t, "t.range");
        r.shouldBe(t, "t.range.startOffset", "0");
        r.shouldBeNonNull(t, "t.range.startContainer");
    }
    function moveInEmptyDoc() {
        createOdtCursor("");
        t.range = t.cursor.getSelectedRange();
        t.originalStartContainer = t.range.startContainer;
        t.originalStartOffset = t.range.startOffset;
        t.cursor.move(1);
        t.range = t.cursor.getSelectedRange();
        r.shouldBe(t, "t.range.startOffset", "t.originalStartOffset");
        r.shouldBe(t, "t.range.startContainer", "t.originalStartContainer");
    }
    function moveInSimpleDoc() {
        createOdtCursor("hello");
        var i;

        t.originalSurroundingText = surroundingText(t.cursor);

        for (i = 1; i <= 4; i += 1) {
            t.oldSurroundingText = surroundingText(t.cursor);
            t.oldLength = t.cursor.getNode().nextSibling.length;
            t.cursor.move(1);
            t.newSurroundingText = surroundingText(t.cursor);
            t.newLength = t.cursor.getNode().nextSibling.length;
            r.shouldBe(t, "t.oldLength", "t.newLength + 1");
            r.shouldBe(t, "t.oldSurroundingText", "t.newSurroundingText");
        }
        t.cursor.move(1);
        t.newSurroundingText = surroundingText(t.cursor);
        r.shouldBe(t, "t.originalSurroundingText", "t.newSurroundingText");

        // try to go beyond the last position
        t.cursor.move(1);
        t.newSurroundingText = surroundingText(t.cursor);
        r.shouldBe(t, "t.originalSurroundingText", "t.newSurroundingText");

        for (i = 4; i >= 1; i -= 1) {
            t.oldSurroundingText = surroundingText(t.cursor);
            t.oldLength = t.cursor.getNode().previousSibling.length;
            t.cursor.move(-1);
            t.newSurroundingText = surroundingText(t.cursor);
            t.newLength = t.cursor.getNode().previousSibling.length;
            r.shouldBe(t, "t.oldLength", "t.newLength + 1");
            r.shouldBe(t, "t.oldSurroundingText", "t.newSurroundingText");
        }
        t.cursor.move(-1);
        t.newSurroundingText = surroundingText(t.cursor);
        r.shouldBe(t, "t.originalSurroundingText", "t.newSurroundingText");
    }
    /**
     * Start at a valid position and count how many filtered steps are needed.
     * The amount should be m. Then check that the avatar is still at the
     * starting position.
     */
    function stepCounter(xml, n, m, filter) {
        var steps, s;
        t.pos = [];
        createOdtCursor(xml, true, true);
        s = t.cursor.getSelectedRange();
        t.counter = t.cursor.getStepCounter();

        // move to a valid position
        t.initialStartOffset = s.startOffset;
        t.initialStartContainer = s.startContainer;
        t.startText = s.startContainer.data;
        t.startOffset = s.startOffset;
        t.startContainer = s.startContainer;
        t.text = s.startContainer.data;

        steps = t.counter.countSteps(n, filter);
        r.shouldBe(t, steps.toString(), m.toString());

        s = t.cursor.getSelectedRange();
        t.startOffset2 = s.startOffset;
        t.startContainer2 = s.startContainer;
        t.text2 = s.startContainer.data;
        r.shouldBe(t, "t.startOffset", "t.startOffset2");
        r.shouldBe(t, "t.startContainer", "t.startContainer2");
        r.shouldBe(t, "t.text", "t.text2");

        t.cursor.move(steps);
        s = t.cursor.getSelectedRange();
        t.startOffset = s.startOffset;
        t.startContainer = s.startContainer;
        t.text = s.startContainer.data;

        steps = -t.counter.countSteps(-n, filter);
        r.shouldBe(t, steps.toString(), m.toString());
        s = t.cursor.getSelectedRange();
        t.startOffset2 = s.startOffset;
        t.startContainer2 = s.startContainer;
        t.text2 = s.startContainer.data;
        r.shouldBe(t, "t.startOffset", "t.startOffset2");
        r.shouldBe(t, "t.startContainer", "t.startContainer2");
        r.shouldBe(t, "t.text", "t.text2");

        t.cursor.move(-steps);
        s = t.cursor.getSelectedRange();
        t.startOffset = s.startOffset;
        t.startContainer = s.startContainer;
        t.text = s.startContainer.data;
        r.shouldBe(t, "t.startOffset", "t.initialStartOffset");
        r.shouldBe(t, "t.startContainer", "t.initialStartContainer");
        r.shouldBe(t, "t.text", "t.startText");
    }
    function stepCounter1() {
        stepCounter("ab", 1, 1, dummyfilter);
    }
    function stepCounter2() {
        stepCounter("ab", 2, 2, dummyfilter);
    }
    /**
     * @param {!string} xml
     * @param {!number} n
     * @param {!number} m
     * @param {!Function} filter
     * @param {!boolean=} splitTexts
     * @param {!boolean=} emptyNodes
     * @return {undefined}
     */
    function backAndForthIntern(xml, n, m, filter, splitTexts, emptyNodes) {
        var i, steps;
        t.pos = [];
        t.filter = filter;
        createOdtCursor(xml, splitTexts, emptyNodes);
        t.counter = t.cursor.getStepCounter();

        // move to a valid position
        steps = t.counter.countSteps(1, filter);
        t.cursor.move(steps);
        steps = -t.counter.countSteps(-1, filter);
        t.cursor.move(-steps);
        t.pos = [];
        t.stepsSum = 0;
        t.moveSum = 0;
        for (i = 1; i <= m; i += 1) {
            steps = t.counter.countSteps(1, filter);
            t.stepsSum += Math.abs(steps);
            t.moveSum += Math.abs(t.cursor.move(steps));
        }
        r.shouldBe(t, "t.counter.countSteps(1, t.filter)", "0");
        r.shouldBe(t, "t.pos.length", m.toString());
        r.shouldBe(t, "t.stepsSum", n.toString());
        r.shouldBe(t, "t.moveSum", n.toString());
        t.prevPos = t.pos.reverse();
        t.pos = [];
        t.stepsSum = 0;
        t.moveSum = 0;
        for (i = 1; i <= m; i += 1) {
            steps = -t.counter.countSteps(-1, filter);
            t.stepsSum += Math.abs(steps);
            t.moveSum += Math.abs(t.cursor.move(-steps));
        }
        r.shouldBe(t, "t.counter.countSteps(-1, t.filter)", "0");
        r.shouldBe(t, "t.pos.length", m.toString());
        r.shouldBe(t, "t.stepsSum", n.toString());
        r.shouldBe(t, "t.moveSum", n.toString());
    }
    /**
     * @param {!string} xml
     * @param {!number} n
     * @param {!number} m
     * @param {!Function} filter
     * @return {undefined}
     */
    function backAndForth(xml, n, m, filter) {
        backAndForthIntern(xml, n, m, filter, false, false);
        backAndForthIntern(xml, n, m, filter, false, true);
        backAndForthIntern(xml, n, m, filter, true, false);
        backAndForthIntern(xml, n, m, filter, true, true);
    }
    function backAndForth1() {
        backAndForth('ab', 2, 2, dummyfilter);
    }
    function backAndForth2() {
        backAndForth(odfxml, 220, 220, dummyfilter);
    }
    function backAndForth3() {
        backAndForth(odfxml, 188, 171, textfilter);
    }
    function backAndForth4() {
        backAndForth('<p>ab</p>', 2, 2, textfilter);
    }
    function backAndForth5() {
        backAndForth(odfxml2, 2, 2, textfilter);
    }
    function backAndForth6() {
        backAndForth('  a  b', 6, 6, dummyfilter);
    }
    function backAndForth7() {
        backAndForth(odfxml3, 6, 4, textfilter);
    }
    function backAndForth8() {
        backAndForth(odfxml4, 0, 0, textfilter);
    }
    function backAndForth9() {
        backAndForth(odfxml4, 8, 8, dummyfilter);
    }
    this.tests = function () {
        return r.name([
            create,
            moveInEmptyDoc,
            moveInSimpleDoc,
            stepCounter1,
            stepCounter2,
            backAndForth1,
            backAndForth2,
            backAndForth3,
            backAndForth4,
            backAndForth5,
            backAndForth6,
            backAndForth7,
            backAndForth8,
            backAndForth9
        ]);
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
ops.OdtCursorTests.prototype.description = function () {
    "use strict";
    return "Test the OdtCursor class.";
};
(function () {
    "use strict";
    return ops.OdtCursorTests;
}());
