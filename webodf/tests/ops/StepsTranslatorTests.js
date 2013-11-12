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
/*global runtime, core, odf, ops, gui*/
runtime.loadClass("odf.Namespaces");
runtime.loadClass("ops.StepsTranslator");
runtime.loadClass("gui.SelectionMover");
/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
ops.StepsTranslatorTests = function StepsTranslatorTests(runner) {
    "use strict";
    var t,
        r = runner,
        testarea;

    /**
     * @param {!core.PositionFilter} filter
     * @implements {core.PositionFilter}
     * @constructor
     */
    function CallCountedPositionFilter(filter) {
        var self = this;

        this.acceptPositionCalls = 0;

        this.acceptPosition = function() {
            self.acceptPositionCalls += 1;
            return filter.acceptPosition.apply(filter, arguments);
        };
    }

    function createDoc(xml) {
        var domDocument = testarea.ownerDocument,
            doc = core.UnitTest.createOdtDocument("<office:text>" + xml + "</office:text>", odf.Namespaces.namespaceMap),
            node = /**@type{!Element}*/(domDocument.importNode(doc.documentElement, true));

        testarea.appendChild(node);
        return node;
    }

    this.setUp = function () {
        testarea = core.UnitTest.provideTestAreaDiv();
        t = {
            filter: new CallCountedPositionFilter(new ops.TextPositionFilter(function() { return testarea; }))
        };
        t.translator = new ops.StepsTranslator(function() { return testarea; },
            gui.SelectionMover.createPositionIterator,
            t.filter);
    };
    this.tearDown = function () {
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };

    function convertStepsToDomPoint_At0() {
        var doc = createDoc("<text:p>AB</text:p>"),
            p = doc.getElementsByTagName("p")[0];

        t.expected = {node: p.firstChild, offset: 0};
        t.position = t.translator.convertStepsToDomPoint(0);
        r.shouldBe(t, "t.filter.acceptPositionCalls", "4");
        r.shouldBe(t, "t.position.node", "t.expected.node");
        r.shouldBe(t, "t.position.offset", "t.expected.offset");
    }

    function convertStepsToDomPoint_At1() {
        var doc = createDoc("<text:p>AB</text:p>"),
            p = doc.getElementsByTagName("p")[0];

        t.expected = {node: p.firstChild, offset: 1};
        t.position = t.translator.convertStepsToDomPoint(1);
        r.shouldBe(t, "t.filter.acceptPositionCalls", "5");
        r.shouldBe(t, "t.position.node", "t.expected.node");
        r.shouldBe(t, "t.position.offset", "t.expected.offset");
    }

    function convertStepsToDomPoint_At5() {
        var doc = createDoc("<text:p>ABCD</text:p><text:p>EF</text:p>"),
            p = doc.getElementsByTagName("p")[1];

        t.expected = {node: p.firstChild, offset: 0};
        t.position = t.translator.convertStepsToDomPoint(5);
        r.shouldBe(t, "t.filter.acceptPositionCalls", "10");
        r.shouldBe(t, "t.position.node", "t.expected.node");
        r.shouldBe(t, "t.position.offset", "t.expected.offset");
    }

    function convertStepsToDomPoint_LessThan0_Returns0() {
        var doc = createDoc("<text:p>AB</text:p>"),
            p = doc.getElementsByTagName("p")[0];

        t.expected = {node: p.firstChild, offset: 0};
        t.position = t.translator.convertStepsToDomPoint(-1);
        r.shouldBe(t, "t.position.node", "t.expected.node");
        r.shouldBe(t, "t.position.offset", "t.expected.offset");
    }

    function convertStepsToDomPoint_BeyondMaxSteps_ReturnsMaxSteps() {
        createDoc("<text:p>ABCD</text:p><text:p>EF</text:p>");

        t.expected = {node: testarea, offset: testarea.childNodes.length};
        t.position = t.translator.convertStepsToDomPoint(100);
        r.shouldBe(t, "t.position.node", "t.expected.node");
        r.shouldBe(t, "t.position.offset", "t.expected.offset");
    }

    function convertDomPointsToSteps_At0() {
        var doc = createDoc("<text:p>AB</text:p>"),
            p = doc.getElementsByTagName("p")[0];

        t.steps = t.translator.convertDomPointToSteps(p.firstChild, 0);
        r.shouldBe(t, "t.filter.acceptPositionCalls", "4");
        r.shouldBe(t, "t.steps", "0");
    }

    function convertDomPointsToSteps_Before0() {
        var doc = createDoc("<text:p>AB</text:p>"),
            p = doc.getElementsByTagName("p")[0];

        t.steps = t.translator.convertDomPointToSteps(p, 0);
        r.shouldBe(t, "t.filter.acceptPositionCalls", "4");
        r.shouldBe(t, "t.steps", "0");
    }

    function convertDomPointsToSteps_BeforeRootNode_Returns0() {
        createDoc("<text:p>AB</text:p>");

        t.steps = t.translator.convertDomPointToSteps(testarea.parentNode, 0);
        r.shouldBe(t, "t.steps", "0");
    }

    function convertDomPointsToSteps_AfterRootNode_ReturnsMaxLength() {
        var doc = createDoc("<text:p>AB</text:p>"),
            afterRoot = doc.ownerDocument.createElement("span");

        testarea.parentNode.insertBefore(afterRoot, testarea.nextSibling);
        t.steps = t.translator.convertDomPointToSteps(afterRoot, 0);
        r.shouldBe(t, "t.steps", "2");
    }

    function convertDomPointsToSteps_AfterRootNode_LastPositionInParent_ReturnsMaxLength() {
        createDoc("<text:p>AB</text:p>");

        t.steps = t.translator.convertDomPointToSteps(testarea.parentNode, testarea.parentNode.childNodes.length);
        r.shouldBe(t, "t.steps", "2");
    }

    function convertDomPointsToSteps_At1() {
        var doc = createDoc("<text:p>AB</text:p>"),
            p = doc.getElementsByTagName("p")[0];

        t.steps = t.translator.convertDomPointToSteps(p.firstChild, 1);
        r.shouldBe(t, "t.filter.acceptPositionCalls", "5");
        r.shouldBe(t, "t.steps", "1");
    }

    function convertDomPointsToSteps_BetweenPositions_RoundsDown() {
        var doc = createDoc("<text:p>A<text:span/><text:span/>B</text:p>"),
            p = doc.getElementsByTagName("p")[0];

        t.steps1 = t.translator.convertDomPointToSteps(p, 1);
        t.steps2 = t.translator.convertDomPointToSteps(p, 2);
        r.shouldBe(t, "t.steps1", "1");
        r.shouldBe(t, "t.steps2", "1");
    }

    function convertDomPointsToSteps_At5() {
        var doc = createDoc("<text:p>ABCD</text:p><text:p>EF</text:p>"),
            p = doc.getElementsByTagName("p")[1];

        t.steps = t.translator.convertDomPointToSteps(p.firstChild, 0);
        r.shouldBe(t, "t.filter.acceptPositionCalls", "10");
        r.shouldBe(t, "t.steps", "5");
    }

    function convertDomPointsToSteps_WithinParagraph_BeforeFirstWalkablePosition_RoundsDown() {
        var doc = createDoc("<text:p>AB</text:p><text:p><text:span/>C</text:p>"),
            p = doc.getElementsByTagName("p")[1];

        t.steps = t.translator.convertDomPointToSteps(p, 0);
        r.shouldBe(t, "t.filter.acceptPositionCalls", "8");
        r.shouldBe(t, "t.steps", "2");
    }

    this.tests = function () {
        return [
            convertStepsToDomPoint_At0,
            convertStepsToDomPoint_At1,
            convertStepsToDomPoint_At5,
            convertStepsToDomPoint_LessThan0_Returns0,
            convertStepsToDomPoint_BeyondMaxSteps_ReturnsMaxSteps,
            convertDomPointsToSteps_At0,
            convertDomPointsToSteps_Before0,
            convertDomPointsToSteps_BeforeRootNode_Returns0,
            convertDomPointsToSteps_AfterRootNode_ReturnsMaxLength,
            convertDomPointsToSteps_AfterRootNode_LastPositionInParent_ReturnsMaxLength,
            convertDomPointsToSteps_At1,
            convertDomPointsToSteps_BetweenPositions_RoundsDown,
            convertDomPointsToSteps_At5,
            convertDomPointsToSteps_WithinParagraph_BeforeFirstWalkablePosition_RoundsDown
        ];
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
ops.StepsTranslatorTests.prototype.description = function () {
    "use strict";
    return "Test the StepsTranslator class.";
};
(function () {
    "use strict";
    return ops.StepsTranslatorTests;
}());
