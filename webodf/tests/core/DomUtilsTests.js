/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global core, runtime, NodeFilter, Node*/

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
core.DomUtilsTests = function DomUtilsTests(runner) {
    "use strict";
    var r = runner, t = {},
        document = runtime.getWindow().document;

    this.setUp = function () {
        t = {
            doc : core.UnitTest.provideTestAreaDiv(),
            utils : core.DomUtils,
            range : document.createRange()
        };
    };
    this.tearDown = function () {
        t.range.detach();
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };

    function ignoreSpans(node) {
        return node.localName === "span" ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }

    function textNodesOnly(node) {
        return node.nodeType !== Node.TEXT_NODE ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }

    /**
     * Add the specified HTML nodes to the test area's div
     * @param {!string} html XML html string
     * @return {undefined}
     */
    function createNodes(html) {
        var /**@type{!string}*/
            xmlDoc = "<?xml version='1.0' encoding='UTF-8'?>",
            doc;

        xmlDoc += "<div xmlns='http://www.w3.org/1999/xhtml'>";
        xmlDoc += html;
        xmlDoc += "</div>";

        doc = runtime.parseXML(xmlDoc);
        document.importNode(doc.firstChild, true);
        while (doc.firstChild.firstChild) {
            t.doc.appendChild(doc.firstChild.firstChild);
        }
    }

    function normalizeTextNodes_TextWithTextSilblings() {
        t.doc.appendChild(document.createTextNode("a"));
        t.doc.appendChild(document.createTextNode("b"));
        t.doc.appendChild(document.createTextNode("c"));

        t.utils.normalizeTextNodes(t.doc.childNodes[1]);

        r.shouldBe(t, "t.doc.childNodes.length", "1");
        r.shouldBe(t, "t.doc.childNodes[0].textContent", "'abc'");
    }

    function normalizeTextNodes_EmptyTextWithTextSilblings() {
        t.doc.appendChild(document.createTextNode("a"));
        t.doc.appendChild(document.createTextNode(""));
        t.doc.appendChild(document.createTextNode("c"));

        t.utils.normalizeTextNodes(t.doc.childNodes[1]);

        r.shouldBe(t, "t.doc.childNodes.length", "1");
        r.shouldBe(t, "t.doc.childNodes[0].textContent", "'ac'");
    }

    function normalizeTextNodes_TextWithPreviousTextSilbling() {
        t.doc.appendChild(document.createTextNode("a"));
        t.doc.appendChild(document.createTextNode("b"));
        t.doc.appendChild(document.createElement("span"));

        t.utils.normalizeTextNodes(t.doc.childNodes[1]);

        r.shouldBe(t, "t.doc.childNodes.length", "2");
        r.shouldBe(t, "t.doc.childNodes[0].textContent", "'ab'");
    }

    function normalizeTextNodes_EmptyTextWithPreviousTextSilbling() {
        t.doc.appendChild(document.createTextNode("a"));
        t.doc.appendChild(document.createTextNode(""));
        t.doc.appendChild(document.createElement("span"));

        t.utils.normalizeTextNodes(t.doc.childNodes[1]);

        r.shouldBe(t, "t.doc.childNodes.length", "2");
        r.shouldBe(t, "t.doc.childNodes[0].textContent", "'a'");
    }

    function normalizeTextNodes_TextWithNextTextSilbling() {
        t.doc.appendChild(document.createElement("span"));
        t.doc.appendChild(document.createTextNode("b"));
        t.doc.appendChild(document.createTextNode("c"));

        t.utils.normalizeTextNodes(t.doc.childNodes[1]);

        r.shouldBe(t, "t.doc.childNodes.length", "2");
        r.shouldBe(t, "t.doc.childNodes[1].textContent", "'bc'");
    }

    function normalizeTextNodes_EmptyTextWithNextTextSilbling() {
        t.doc.appendChild(document.createElement("span"));
        t.doc.appendChild(document.createTextNode(""));
        t.doc.appendChild(document.createTextNode("c"));

        t.utils.normalizeTextNodes(t.doc.childNodes[1]);

        r.shouldBe(t, "t.doc.childNodes.length", "2");
        r.shouldBe(t, "t.doc.childNodes[1].textContent", "'c'");
    }

    function normalizeTextNodes_TextWithNoTextSilblings() {
        t.doc.appendChild(document.createElement("span"));
        t.doc.appendChild(document.createTextNode("b"));
        t.doc.appendChild(document.createElement("span"));

        t.utils.normalizeTextNodes(t.doc.childNodes[1]);

        r.shouldBe(t, "t.doc.childNodes.length", "3");
        r.shouldBe(t, "t.doc.childNodes[1].textContent", "'b'");
    }

    function normalizeTextNodes_EmptyTextWithNoTextSilblings() {
        t.doc.appendChild(document.createElement("span"));
        t.doc.appendChild(document.createTextNode(""));
        t.doc.appendChild(document.createElement("span"));

        t.utils.normalizeTextNodes(t.doc.childNodes[1]);

        r.shouldBe(t, "t.doc.childNodes.length", "2");
    }

    function splitBoundaries_StartAndEnd_SameTextNodes() {
        t.doc.appendChild(document.createTextNode("abcdef"));
        t.range.setStart(t.doc.firstChild, 1);
        t.range.setEnd(t.doc.firstChild, 5);

        t.utils.splitBoundaries(t.range);

        r.shouldBe(t, "t.doc.childNodes.length", "3");
        r.shouldBe(t, "t.doc.childNodes[0].data", "'a'");
        r.shouldBe(t, "t.doc.childNodes[1].data", "'bcde'");
        r.shouldBe(t, "t.doc.childNodes[2].data", "'f'");
        r.shouldBe(t, "t.range.startContainer", "t.doc.childNodes[1]");
        r.shouldBe(t, "t.range.startOffset", "0");
        r.shouldBe(t, "t.range.endContainer", "t.doc.childNodes[1]");
        r.shouldBe(t, "t.range.endOffset", "4");
        r.shouldBe(t, "t.range.toString()", "'bcde'");
    }

    function splitBoundaries_StartAndEnd_SameTextNodes_EndAtTextNode() {
        t.doc.appendChild(document.createTextNode("abcde"));
        t.range.setStart(t.doc.firstChild, 1);
        t.range.setEnd(t.doc.firstChild, 5);

        t.utils.splitBoundaries(t.range);

        r.shouldBe(t, "t.doc.childNodes.length", "2");
        r.shouldBe(t, "t.doc.childNodes[0].data", "'a'");
        r.shouldBe(t, "t.doc.childNodes[1].data", "'bcde'");
        r.shouldBe(t, "t.range.startContainer", "t.doc.childNodes[1]");
        r.shouldBe(t, "t.range.startOffset", "0");
        r.shouldBe(t, "t.range.endContainer", "t.doc.childNodes[1]");
        r.shouldBe(t, "t.range.endOffset", "4");
        r.shouldBe(t, "t.range.toString()", "'bcde'");
    }

    function splitBoundaries_StartInTextNode_EndAtParagraph() {
        t.doc.appendChild(document.createTextNode("abcde"));
        t.range.setStart(t.doc.firstChild, 1);
        t.range.setEnd(t.doc, 1);

        t.utils.splitBoundaries(t.range);

        r.shouldBe(t, "t.doc.childNodes.length", "2");
        r.shouldBe(t, "t.doc.childNodes[0].data", "'a'");
        r.shouldBe(t, "t.doc.childNodes[1].data", "'bcde'");
        r.shouldBe(t, "t.range.startContainer", "t.doc.childNodes[1]");
        r.shouldBe(t, "t.range.startOffset", "0");
        r.shouldBe(t, "t.range.endContainer", "t.doc");
        r.shouldBe(t, "t.range.endOffset", "2");
        r.shouldBe(t, "t.range.toString()", "'bcde'");
    }

    function splitBoundaries_StartAndEnd_AlreadySplit() {
        t.doc.appendChild(document.createElement("span"));
        t.doc.appendChild(document.createElement("span"));
        t.doc.appendChild(document.createElement("span"));
        t.doc.childNodes[1].appendChild(document.createTextNode("bcde"));
        t.range.setStart(t.doc, 1);
        t.range.setEnd(t.doc, 2);

        t.utils.splitBoundaries(t.range);

        r.shouldBe(t, "t.doc.childNodes.length", "3");
        r.shouldBe(t, "t.range.startContainer", "t.doc");
        r.shouldBe(t, "t.range.startOffset", "1");
        r.shouldBe(t, "t.range.endContainer", "t.doc");
        r.shouldBe(t, "t.range.endOffset", "2");
        r.shouldBe(t, "t.range.toString()", "'bcde'");
    }

    function splitBoundaries_StartRequiresSplitting_EndAlreadySplit() {
        t.doc.appendChild(document.createTextNode("ab"));
        t.doc.appendChild(document.createElement("span"));
        t.doc.childNodes[1].appendChild(document.createTextNode("cde"));
        t.range.setStart(t.doc.firstChild, 1);
        t.range.setEnd(t.doc, 2);

        t.utils.splitBoundaries(t.range);

        r.shouldBe(t, "t.doc.childNodes.length", "3");
        r.shouldBe(t, "t.doc.childNodes[0].data", "'a'");
        r.shouldBe(t, "t.doc.childNodes[1].data", "'b'");
        r.shouldBe(t, "t.range.startContainer", "t.doc.childNodes[1]");
        r.shouldBe(t, "t.range.startOffset", "0");
        r.shouldBe(t, "t.range.endContainer", "t.doc");
        r.shouldBe(t, "t.range.endOffset", "3");
        r.shouldBe(t, "t.range.toString()", "'bcde'");
    }

    function splitBoundaries_StartAlreadySplit_EndRequiresSplitting() {
        t.doc.appendChild(document.createElement("span"));
        t.doc.appendChild(document.createElement("span"));
        t.doc.appendChild(document.createTextNode("cde"));
        t.doc.childNodes[0].appendChild(document.createTextNode("a"));
        t.doc.childNodes[1].appendChild(document.createTextNode("b"));
        t.range.setStart(t.doc, 1);
        t.range.setEnd(t.doc.lastChild, 2);

        t.utils.splitBoundaries(t.range);

        r.shouldBe(t, "t.doc.childNodes.length", "4");
        r.shouldBe(t, "t.doc.childNodes[0].textContent", "'a'");
        r.shouldBe(t, "t.doc.childNodes[1].textContent", "'b'");
        r.shouldBe(t, "t.doc.childNodes[2].textContent", "'cd'");
        r.shouldBe(t, "t.doc.childNodes[3].textContent", "'e'");
        r.shouldBe(t, "t.range.startContainer", "t.doc");
        r.shouldBe(t, "t.range.startOffset", "1");
        r.shouldBe(t, "t.range.endContainer", "t.doc.childNodes[2]");
        r.shouldBe(t, "t.range.endOffset", "2");
        r.shouldBe(t, "t.range.toString()", "'bcd'");
    }

    function rangeContainsNode_ForFullyBracketedSpan_ReturnsTrue() {
        var start = document.createTextNode("before"),
            target = document.createElement("span"),
            end = document.createTextNode("after");
        t.doc.appendChild(start);
        t.doc.appendChild(target);
        t.doc.appendChild(end);

        t.result = t.utils.rangeContainsNode({startContainer: start, startOffset: 0, endContainer: end, endOffset: 0}, target);

        r.shouldBe(t, "t.result", "true");
    }

    function rangeContainsNode_ForDifferentDepths_ReturnsTrue() {
        var start = document.createTextNode("before"),
            startContainer = document.createElement("span"),
            target = document.createElement("span"),
            end = document.createTextNode("after");
        startContainer.appendChild(start);
        t.doc.appendChild(startContainer);
        t.doc.appendChild(target);
        t.doc.appendChild(end);

        t.result = t.utils.rangeContainsNode({startContainer: start, startOffset: 0, endContainer: end, endOffset: 0}, target);

        r.shouldBe(t, "t.result", "true");
    }

    function rangeContainsNode_ForAdjacentSpan_ReturnsFalse() {
        var start = document.createTextNode("before"),
            target = document.createElement("span"),
            end = document.createTextNode("after");
        t.doc.appendChild(start);
        t.doc.appendChild(end);
        t.doc.appendChild(target);

        t.result = t.utils.rangeContainsNode({startContainer: start, startOffset: 0, endContainer: end, endOffset: 0}, target);

        r.shouldBe(t, "t.result", "false");
    }

    function rangeContainsNode_IdenticalBoundaries_ReturnsTrue() {
        var target = document.createElement("span");
        t.doc.appendChild(target);

        t.result = t.utils.rangeContainsNode({startContainer: target, startOffset: 0, endContainer: target, endOffset: 0}, target);

        r.shouldBe(t, "t.result", "true");
    }

    function rangeIntersectsRange_IdenticalBoundaries_ReturnsTrue() {
        var container = document.createElement("p"),
            span1 = document.createElement("span"),
            span2 = document.createElement("span"),
            start = document.createTextNode("start"),
            end = document.createTextNode("end"),
            range1 = document.createRange(),
            range2 = document.createRange();

        span1.appendChild(start);
        span2.appendChild(end);
        container.appendChild(span1);
        container.appendChild(span2);
        t.doc.appendChild(container);

        range1.setStart(start, 0);
        range1.setEnd(end, 0);
        range2.setStart(start, 0);
        range2.setEnd(end, 0);

        t.result = t.utils.rangesIntersect(range1, range2);

        r.shouldBe(t, "t.result", "true");
    }

    function rangeIntersectsRange_Partial_ReturnsTrue() {
        var container = document.createElement("p"),
            span1 = document.createElement("span"),
            span2 = document.createElement("span"),
            start = document.createTextNode("start"),
            end = document.createTextNode("end"),
            range1 = document.createRange(),
            range2 = document.createRange();

        span1.appendChild(start);
        span2.appendChild(end);
        container.appendChild(span1);
        container.appendChild(span2);
        t.doc.appendChild(container);

        range1.setStart(start, 0);
        range1.setEnd(end, 0);
        range2.setStart(start, 2);
        range2.setEnd(end, end.length);

        t.result = t.utils.rangesIntersect(range1, range2);

        r.shouldBe(t, "t.result", "true");
    }

    function rangeIntersectsRange_Encapsulator_ReturnsTrue() {
        var container = document.createElement("p"),
            span1 = document.createElement("span"),
            span2 = document.createElement("span"),
            start = document.createTextNode("start"),
            end = document.createTextNode("end"),
            range1 = document.createRange(),
            range2 = document.createRange();

        span1.appendChild(start);
        span2.appendChild(end);
        container.appendChild(span1);
        container.appendChild(span2);
        t.doc.appendChild(container);

        range1.setStart(start, 0);
        range1.setEnd(end, end.length);
        range2.setStart(start, 2);
        range2.setEnd(end, 1);

        t.result = t.utils.rangesIntersect(range1, range2);

        r.shouldBe(t, "t.result", "true");
    }

    function rangeIntersectsRange_Encapsulatee_ReturnsTrue() {
        var container = document.createElement("p"),
            span1 = document.createElement("span"),
            span2 = document.createElement("span"),
            start = document.createTextNode("start"),
            end = document.createTextNode("end"),
            range1 = document.createRange(),
            range2 = document.createRange();

        span1.appendChild(start);
        span2.appendChild(end);
        container.appendChild(span1);
        container.appendChild(span2);
        t.doc.appendChild(container);

        range1.setStart(start, 3);
        range1.setEnd(end, 0);
        range2.setStart(start, 1);
        range2.setEnd(end, 2);

        t.result = t.utils.rangesIntersect(range1, range2);

        r.shouldBe(t, "t.result", "true");
    }

    function rangeIntersectsRange_Disjoint_ReturnsFalse() {
        var container = document.createElement("p"),
            span1 = document.createElement("span"),
            span2 = document.createElement("span"),
            start = document.createTextNode("start"),
            end = document.createTextNode("end"),
            range1 = document.createRange(),
            range2 = document.createRange();

        span1.appendChild(start);
        span2.appendChild(end);
        container.appendChild(span1);
        container.appendChild(span2);
        t.doc.appendChild(container);

        range1.setStart(start, 0);
        range1.setEnd(start, start.length);
        range2.setStart(end, 0);
        range2.setEnd(end, end.length);

        t.result = t.utils.rangesIntersect(range1, range2);

        r.shouldBe(t, "t.result", "false");
    }

    function rangeIntersectsRange_LeftTouch_ReturnsTrue() {
        var container = document.createElement("p"),
            span1 = document.createElement("span"),
            span2 = document.createElement("span"),
            start = document.createTextNode("start"),
            end = document.createTextNode("end"),
            range1 = document.createRange(),
            range2 = document.createRange();

        span1.appendChild(start);
        span2.appendChild(end);
        container.appendChild(span1);
        container.appendChild(span2);
        t.doc.appendChild(container);

        range1.setStart(start, 0);
        range1.setEnd(start, 2);
        range2.setStart(start, 2);
        range2.setEnd(end, end.length);

        t.result = t.utils.rangesIntersect(range1, range2);

        r.shouldBe(t, "t.result", "true");
    }

    function rangeIntersectsRange_RightTouch_ReturnsTrue() {
        var container = document.createElement("p"),
            span1 = document.createElement("span"),
            span2 = document.createElement("span"),
            start = document.createTextNode("start"),
            end = document.createTextNode("end"),
            range1 = document.createRange(),
            range2 = document.createRange();

        span1.appendChild(start);
        span2.appendChild(end);
        container.appendChild(span1);
        container.appendChild(span2);
        t.doc.appendChild(container);

        range1.setStart(end, 1);
        range1.setEnd(end, end.length);
        range2.setStart(start, 0);
        range2.setEnd(end, 1);

        t.result = t.utils.rangesIntersect(range1, range2);

        r.shouldBe(t, "t.result", "true");
    }

    function removeUnwantedNodes_DiscardAll() {
        var p = document.createElement("p"),
            span1 = document.createElement("span"),
            span2 = document.createElement("span"),
            span3 = document.createElement("span"),
            b = document.createElement("b");
        b.textContent = "test";
        span1.textContent = "hello";
        span2.textContent = "world";
        span3.appendChild(b);
        p.appendChild(span1);
        p.appendChild(span2);
        p.appendChild(span3);
        t.doc.appendChild(p);
        t.parent = t.utils.removeUnwantedNodes(p, function (node) {
            return (node !== null) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        });
        r.shouldBe(t, "t.parent", "t.doc");
        r.shouldBe(t, "t.parent.childNodes.length", "0");
    }

    function removeUnwantedNodes_DiscardSpanOnly() {
        var p = document.createElement("p"),
            span1 = document.createElement("span"),
            span2 = document.createElement("span"),
            span3 = document.createElement("span"),
            b = document.createElement("b");
        b.textContent = "test";
        span1.textContent = "hello";
        span2.textContent = "world";
        span3.appendChild(b);
        p.appendChild(span1);
        p.appendChild(span2);
        p.appendChild(span3);
        t.doc.appendChild(p);
        t.parent = t.utils.removeUnwantedNodes(p, function (node) {
            return node.localName === 'span' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        });
        r.shouldBe(t, "t.parent", "t.doc");
        r.shouldBe(t, "t.parent.firstChild.localName", "'p'");
        r.shouldBe(t, "t.parent.firstChild.childNodes[0].textContent", "'hello'");
        r.shouldBe(t, "t.parent.firstChild.childNodes[1].textContent", "'world'");
        r.shouldBe(t, "t.parent.firstChild.childNodes[2].localName", "'b'");
        r.shouldBe(t, "t.parent.firstChild.childNodes[2].firstChild.textContent", "'test'");
    }

    function removeUnwantedNodes_SkipDiv() {
        var p = document.createElement("p"),
            span1 = document.createElement("span"),
            div = document.createElement("div"),
            divspan = document.createElement("span"),
            span3 = document.createElement("span"),
            b = document.createElement("b");
        b.textContent = "test";
        span1.textContent = "hello";
        divspan.textContent = "world";
        span3.appendChild(b);
        p.appendChild(span1);
        p.appendChild(div);
        div.appendChild(divspan);
        p.appendChild(span3);
        t.doc.appendChild(p);
        t.parent = t.utils.removeUnwantedNodes(p, function (node) {
            return (node.localName === "div") ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_REJECT;
        });
        r.shouldBe(t, "t.parent", "t.doc");
        r.shouldBe(t, "t.parent.childNodes.length", "1");
        r.shouldBe(t, "t.parent.firstChild.localName", "'div'");
        r.shouldBe(t, "t.parent.firstChild.childNodes.length", "1");
        r.shouldBe(t, "t.parent.firstChild.firstChild.localName", "'span'");
    }

    function removeAllChildNodes_None() {
        var p = document.createElement("p");
        t.doc.appendChild(p);
        t.utils.removeAllChildNodes(p);
        r.shouldBe(t, "t.doc.firstChild.localName", "'p'");
        r.shouldBe(t, "t.doc.firstChild.childNodes.length", "0");
    }

    function removeAllChildNodes_ElementAndTextNodes() {
        var p = document.createElement("p"),
            span1 = document.createElement("span"),
            text1 = document.createTextNode("t1"),
            span2 = document.createElement("br"),
            text2 = document.createTextNode("t2"),
            span3 = document.createElement("span");
        p.appendChild(span1);
        p.appendChild(text1);
        p.appendChild(span2);
        p.appendChild(text2);
        p.appendChild(span3);
        t.doc.appendChild(p);
        t.utils.removeAllChildNodes(p);
        r.shouldBe(t, "t.doc.firstChild.localName", "'p'");
        r.shouldBe(t, "t.doc.firstChild.childNodes.length", "0");
    }

    function getNodesInRange_EndContainerSkippedByFilter_CompletesIteration() {
        var range = document.createRange();
        createNodes("before<span/>middle<span/>after");

        range.setStart(t.doc.childNodes[0], 0);
        range.setEnd(t.doc.childNodes[3], 0);

        t.nodes = t.utils.getNodesInRange(range, ignoreSpans, NodeFilter.SHOW_ALL);

        r.shouldBe(t, "t.nodes.shift()", "t.doc.childNodes[0]");
        r.shouldBe(t, "t.nodes.shift()", "t.doc.childNodes[2]");
        r.shouldBe(t, "t.nodes.shift()", "undefined");
        range.detach();
    }

    function getNodesInRange_NodeStartToNodeEnd_ReturnsNode() {
        var range = document.createRange();
        createNodes("before<span/>middle<span/>after");

        range.setStart(t.doc.childNodes[0], 0);
        range.setEnd(t.doc.childNodes[0], t.doc.childNodes[0].length);

        t.nodes = t.utils.getNodesInRange(range, ignoreSpans, NodeFilter.SHOW_ALL);

        r.shouldBe(t, "t.nodes.shift()", "t.doc.childNodes[0]");
        r.shouldBe(t, "t.nodes.shift()", "undefined");
        range.detach();
    }

    function getNodesInRange_NodeEndToNodeStart_ReturnsTouchedNode() {
        var range = document.createRange();
        createNodes("before<span/>middle<span/>after");

        range.setStart(t.doc.childNodes[0], t.doc.childNodes[0].length);
        range.setEnd(t.doc.childNodes[4], 0);

        t.nodes = t.utils.getNodesInRange(range, ignoreSpans, NodeFilter.SHOW_ALL);

        r.shouldBe(t, "t.nodes.shift()", "t.doc.childNodes[2]");
        r.shouldBe(t, "t.nodes.shift()", "t.doc.childNodes[4]");
        r.shouldBe(t, "t.nodes.shift()", "undefined");
        range.detach();
    }

    function getNodesInRange_NodeEndToNodeEnd_ReturnsBracketedNode() {
        var range = document.createRange();
        createNodes("before<span/>middle<span>ignored</span>after");

        range.setStart(t.doc.childNodes[0], t.doc.childNodes[0].length);
        range.setEnd(t.doc.childNodes[3], 1);

        t.nodes = t.utils.getNodesInRange(range, ignoreSpans, NodeFilter.SHOW_ALL);

        r.shouldBe(t, "t.nodes.shift()", "t.doc.childNodes[2]");
        r.shouldBe(t, "t.nodes.shift()", "undefined");
        range.detach();
    }

    function getNodesInRange_StartsOnRejectedNode_IgnoresChildNodes() {
        var range = document.createRange();
        createNodes("<span>ignored</span>after");

        range.setStart(t.doc, 0);
        range.setEnd(t.doc, t.doc.childNodes.length);

        t.nodes = t.utils.getNodesInRange(range, ignoreSpans, NodeFilter.SHOW_ALL);

        r.shouldBe(t, "t.nodes.shift()", "t.doc.childNodes[1]");
        r.shouldBe(t, "t.nodes.shift()", "undefined");
        range.detach();
    }

    function getNodesInRange_StartsInRejectedNode_IgnoresChildNodes() {
        var range = document.createRange();
        createNodes("<span><div>ignored</div></span>after");

        range.setStart(t.doc.firstChild, 0);
        range.setEnd(t.doc, t.doc.childNodes.length);

        t.nodes = t.utils.getNodesInRange(range, ignoreSpans, NodeFilter.SHOW_ALL);

        r.shouldBe(t, "t.nodes.shift()", "t.doc.childNodes[1]");
        r.shouldBe(t, "t.nodes.shift()", "undefined");
        range.detach();
    }

    function getNodesInRange_EndsInEmptyNode_ReturnsNothing() {
        var range = document.createRange();
        createNodes("<div>a</div><div></div>after");

        range.setStart(t.doc.firstChild, t.doc.firstChild.childNodes.length);
        range.setEnd(t.doc.childNodes[1], 0);

        t.nodes = t.utils.getNodesInRange(range, textNodesOnly, NodeFilter.SHOW_ALL);

        r.shouldBe(t, "t.nodes.shift()", "undefined");
        range.detach();
    }

    function mapObjOntoNode_EmptyObject() {
        t.node = document.createElement("span");

        t.utils.mapObjOntoNode(t.node, {"prefix:empty-obj":{}}, function(prefix) { return prefix; });

        r.shouldBe(t, "t.node.hasAttributeNS('prefix','empty-obj')", "false");
        r.shouldBe(t, "t.node.getElementsByTagNameNS('prefix','empty-obj').length", "0");
    }

    function rangeIntersection_ReturnsOverlapBetweenTwoRanges() {
        var textContentNode,
            range1 = document.createRange(),
            range2 = document.createRange();

        createNodes("<span>abc</span>");
        textContentNode = t.doc.firstChild.firstChild;
        range1.setStart(textContentNode, 0);
        range1.setEnd(textContentNode, 2);

        range2.setStart(textContentNode, 1);
        range2.setEnd(textContentNode, 3);

        t.intersection = t.utils.rangeIntersection(range1, range2);
        t.startContainer = textContentNode;
        t.startOffset = 1;
        t.endContainer = textContentNode;
        t.endOffset = 2;
        r.shouldBe(t, "t.intersection.startContainer", "t.startContainer");
        r.shouldBe(t, "t.intersection.startOffset", "t.startOffset");
        r.shouldBe(t, "t.intersection.endContainer", "t.endContainer");
        r.shouldBe(t, "t.intersection.endOffset", "t.endOffset");
    }

    function rangeIntersection_Range1BeforeRange2_ReturnsUndefined() {
        var textContentNode,
            range1 = document.createRange(),
            range2 = document.createRange();

        createNodes("<span>abc</span>");
        textContentNode = t.doc.firstChild.firstChild;
        range1.setStart(textContentNode, 0);
        range1.setEnd(textContentNode, 1);

        range2.setStart(textContentNode, 2);
        range2.setEnd(textContentNode, 3);

        t.intersection = t.utils.rangeIntersection(range1, range2);
        r.shouldBe(t, "t.intersection", "undefined");
    }

    function rangeIntersection_Range2BeforeRange1_ReturnsUndefined() {
        var textContentNode,
            range1 = document.createRange(),
            range2 = document.createRange();

        createNodes("<span>abc</span>");
        textContentNode = t.doc.firstChild.firstChild;
        range1.setStart(textContentNode, 0);
        range1.setEnd(textContentNode, 1);

        range2.setStart(textContentNode, 2);
        range2.setEnd(textContentNode, 3);

        t.intersection = t.utils.rangeIntersection(range2, range1);
        r.shouldBe(t, "t.intersection", "undefined");
    }

    function rangeIntersection_Range1TouchesRange2_ReturnsCollapsedRangeOnPoint() {
        var textContentNode,
            range1 = document.createRange(),
            range2 = document.createRange();

        createNodes("<span>abc</span>");
        textContentNode = t.doc.firstChild.firstChild;
        range1.setStart(textContentNode, 0);
        range1.setEnd(textContentNode, 1);

        range2.setStart(textContentNode, 1);
        range2.setEnd(textContentNode, 3);

        t.intersection = t.utils.rangeIntersection(range1, range2);
        t.startContainer = textContentNode;
        t.startOffset = 1;
        t.endContainer = textContentNode;
        t.endOffset = 1;
        r.shouldBe(t, "t.intersection.startContainer", "t.startContainer");
        r.shouldBe(t, "t.intersection.startOffset", "t.startOffset");
        r.shouldBe(t, "t.intersection.endContainer", "t.endContainer");
        r.shouldBe(t, "t.intersection.endOffset", "t.endOffset");
    }

    function rangeIntersection_Range1ContainsRange2_ReturnsRange2Bounds() {
        var textContentNode,
            range1 = document.createRange(),
            range2 = document.createRange();

        createNodes("<span>abc</span>");
        textContentNode = t.doc.firstChild.firstChild;
        range1.setStart(textContentNode, 0);
        range1.setEnd(textContentNode, 3);

        range2.setStart(textContentNode, 1);
        range2.setEnd(textContentNode, 2);

        t.intersection = t.utils.rangeIntersection(range1, range2);
        t.startContainer = textContentNode;
        t.startOffset = 1;
        t.endContainer = textContentNode;
        t.endOffset = 2;
        r.shouldBe(t, "t.intersection.startContainer", "t.startContainer");
        r.shouldBe(t, "t.intersection.startOffset", "t.startOffset");
        r.shouldBe(t, "t.intersection.endContainer", "t.endContainer");
        r.shouldBe(t, "t.intersection.endOffset", "t.endOffset");
    }

    this.tests = function () {
        return r.name([
            normalizeTextNodes_TextWithTextSilblings,
            normalizeTextNodes_EmptyTextWithTextSilblings,
            normalizeTextNodes_TextWithPreviousTextSilbling,
            normalizeTextNodes_EmptyTextWithPreviousTextSilbling,
            normalizeTextNodes_TextWithNextTextSilbling,
            normalizeTextNodes_EmptyTextWithNextTextSilbling,
            normalizeTextNodes_TextWithNoTextSilblings,
            normalizeTextNodes_EmptyTextWithNoTextSilblings,
            splitBoundaries_StartAndEnd_SameTextNodes,
            splitBoundaries_StartAndEnd_SameTextNodes_EndAtTextNode,
            splitBoundaries_StartInTextNode_EndAtParagraph,
            splitBoundaries_StartAndEnd_AlreadySplit,
            splitBoundaries_StartRequiresSplitting_EndAlreadySplit,
            splitBoundaries_StartAlreadySplit_EndRequiresSplitting,

            rangeContainsNode_ForFullyBracketedSpan_ReturnsTrue,
            rangeContainsNode_ForDifferentDepths_ReturnsTrue,
            rangeContainsNode_ForAdjacentSpan_ReturnsFalse,
            rangeContainsNode_IdenticalBoundaries_ReturnsTrue,

            rangeIntersectsRange_IdenticalBoundaries_ReturnsTrue,
            rangeIntersectsRange_Partial_ReturnsTrue,
            rangeIntersectsRange_Encapsulator_ReturnsTrue,
            rangeIntersectsRange_Encapsulatee_ReturnsTrue,
            rangeIntersectsRange_Disjoint_ReturnsFalse,
            rangeIntersectsRange_LeftTouch_ReturnsTrue,
            rangeIntersectsRange_RightTouch_ReturnsTrue,

            removeUnwantedNodes_DiscardAll,
            removeUnwantedNodes_DiscardSpanOnly,
            removeUnwantedNodes_SkipDiv,

            removeAllChildNodes_None,
            removeAllChildNodes_ElementAndTextNodes,

            getNodesInRange_EndContainerSkippedByFilter_CompletesIteration,
            getNodesInRange_NodeStartToNodeEnd_ReturnsNode,
            getNodesInRange_NodeEndToNodeStart_ReturnsTouchedNode,
            getNodesInRange_NodeEndToNodeEnd_ReturnsBracketedNode,
            getNodesInRange_StartsOnRejectedNode_IgnoresChildNodes,
            getNodesInRange_StartsInRejectedNode_IgnoresChildNodes,
            getNodesInRange_EndsInEmptyNode_ReturnsNothing,

            mapObjOntoNode_EmptyObject,
            rangeIntersection_ReturnsOverlapBetweenTwoRanges,
            rangeIntersection_Range1BeforeRange2_ReturnsUndefined,
            rangeIntersection_Range2BeforeRange1_ReturnsUndefined,
            rangeIntersection_Range1TouchesRange2_ReturnsCollapsedRangeOnPoint,
            rangeIntersection_Range1ContainsRange2_ReturnsRange2Bounds
        ]);
    };
    this.asyncTests = function () {
        return [];
    };
};
core.DomUtilsTests.name = "DomUtilsTests";
core.DomUtilsTests.prototype.description = function () {
    "use strict";
    return "Test the DomUtils class.";
};
