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

/*global core, runtime*/

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
core.CursorTests = function CursorTests(runner) {
    "use strict";
    var r = runner, tests, t = {},
        domDocument = runtime.getWindow().document,
        ns = domDocument.body.namespaceURI,
        testarea;
    /**
     * @param {Node} startnode
     * @param {number} startoffset
     * @param {Node=} endnode
     * @param {number=} endoffset
     * @return {undefined}
     */
    function setSelection(startnode, startoffset, endnode, endoffset) {
        // call createRange() on the document, even if startnode is the document
        var range = (startnode.ownerDocument || startnode).createRange();
        range.setStart(startnode, startoffset);
        if (endnode) {
            range.setEnd(endnode, endoffset);
        } else {
            range.setEnd(startnode, startoffset);
        }
        t.cursor.setSelectedRange(range);
        if (range.startContainer !== startnode) {
            runtime.log("EVIL");
        }
    }

    function setupEmptyRootNode() {
        var root = domDocument.createElementNS(ns, "p"),
            cursor = new core.Cursor(domDocument, "Joe");
        testarea.appendChild(root);
        t = { root: root, cursor: cursor };
        runner.shouldBeNonNull(t, "t.cursor.getSelectedRange()");
    }

    function setupSimpleTextDoc() {
        setupEmptyRootNode();
        t.textnode = domDocument.createTextNode("abc");
        t.root.appendChild(t.textnode);
    }

    tests = r.name([
        // create a document, add a cursor and check that the cursor is present
        function testOnEmptyNode1() {
            // if the document is the container of the selection, the cursor
            // can not be in the DOM
            setupEmptyRootNode();
            setSelection(t.root, 0);
            //r.shouldBeNull(t, "t.cursor.getNode().parentNode");
        },
        function testOnEmptyNode2() {
            setupEmptyRootNode();
            setSelection(t.root, 0);
       //     t.selection.focusNode = r.root;
            r.shouldBeNonNull(t, "t.cursor.getNode().parentNode");
            r.shouldBeNull(t, "t.cursor.getNode().previousSibling");
            r.shouldBeNull(t, "t.cursor.getNode().nextSibling");
        },
        function testOnSimpleText() {
            setupSimpleTextDoc();
            // put the cursor at the start of the text node
            setSelection(t.textnode, 0);
            r.shouldBeNonNull(t, "t.cursor.getNode().parentNode");
            r.shouldBeNull(t, "t.cursor.getNode().previousSibling");
            r.shouldBe(t, "t.cursor.getNode().nextSibling.nodeValue", "'abc'");
        },
        function testOnSimpleText2() {
            setupSimpleTextDoc();
            // put the cursor in the middle of the text node
            setSelection(t.textnode, 1);
            r.shouldBeNonNull(t, "t.cursor.getNode().parentNode");
            r.shouldBe(t, "t.cursor.getNode().previousSibling.nodeValue", "'a'");
            r.shouldBe(t, "t.cursor.getNode().nextSibling.nodeValue", "'bc'");
        },
        function testOnSimpleText3() {
            setupSimpleTextDoc();
            // put the cursor at the end of the text node
            setSelection(t.textnode, 3);
            r.shouldBeNonNull(t, "t.cursor.getNode().parentNode");
            r.shouldBe(t, "t.cursor.getNode().previousSibling.nodeValue", "'abc'");
            r.shouldBeNull(t, "t.cursor.getNode().nextSibling");
        },
        function testOnSimpleText4() {
            var textnode2;
            setupSimpleTextDoc();
            // put the cursor between 'a' and 'b', then change the selection to
            // be between 'b' and 'c' and update the cursor
            setSelection(t.textnode, 1);
            textnode2 = t.cursor.getNode().nextSibling;
            setSelection(textnode2, 1);
            r.shouldBeNonNull(t, "t.cursor.getNode().parentNode");
            r.shouldBe(t, "t.cursor.getNode().previousSibling.nodeValue", "'ab'");
            r.shouldBe(t, "t.cursor.getNode().nextSibling.nodeValue", "'c'");
        },
        function testOnSimpleText5() {
            var textnode2;
            setupSimpleTextDoc();
            // put the cursor between 'a' and 'b', then change the selection to
            // span the entire text and update the cursor
            setSelection(t.textnode, 1);
            textnode2 = t.cursor.getNode().nextSibling;
            setSelection(t.textnode, 0, textnode2, 2);
            runner.shouldBeNonNull(t, "t.cursor.getSelectedRange()");
// only null if working on a separate document
//            r.shouldBeNull(t, "t.cursor.getNode().parentNode");
            t.range = t.cursor.getSelectedRange();
            r.shouldBe(t, "t.range.startContainer", "t.textnode");
            r.shouldBe(t, "t.range.startOffset", "0");
            r.shouldBe(t, "t.range.endContainer", "t.textnode");
            r.shouldBe(t, "t.range.endOffset", "3");
        },
        function testOnSimpleText5b() {
            var textnode2;
            setupSimpleTextDoc();
            setSelection(t.textnode, 1);
            textnode2 = t.cursor.getNode().nextSibling;
            setSelection(t.textnode.parentNode, 1, textnode2, 2);
            runner.shouldBeNonNull(t, "t.cursor.getSelectedRange()");
// only null if working on a separate document
//            r.shouldBeNull(t, "t.cursor.getNode().parentNode");
            t.range = t.cursor.getSelectedRange();
            r.shouldBe(t, "t.range.startContainer", "t.textnode");
            r.shouldBe(t, "t.range.startOffset", "1");
            r.shouldBe(t, "t.range.endContainer", "t.textnode");
            r.shouldBe(t, "t.range.endOffset", "3");
        },
        function testOnSimpleText6() {
            var somenode, textnode2;
            setupSimpleTextDoc();
            // add a child node to the cursor
            somenode = domDocument.createElementNS(ns, "p");
            t.cursor.getNode().appendChild(somenode);
            // select a single position so the cursor is put in the document
            setSelection(t.textnode, 1);
            r.shouldBeNonNull(t, "t.cursor.getNode().parentNode");
            textnode2 = t.cursor.getNode().nextSibling;
            // select a range starting at the node in the cursor, but extends
            // out of the the cursor
            // this should have the result that the cursor is removed from the
            // document and that the text nodes around the cursor are
            // merged
            setSelection(somenode, 0, textnode2, 2);
// only null if working on a separate document
//            r.shouldBeNull(t, "t.cursor.getNode().parentNode");
            t.range = t.cursor.getSelectedRange();
            r.shouldBe(t, "t.range.startContainer", "t.textnode");
            r.shouldBe(t, "t.range.startOffset", "1");
            r.shouldBe(t, "t.range.endContainer", "t.textnode");
            r.shouldBe(t, "t.range.endOffset", "3");
            r.shouldBe(t, "t.range.collapsed", "false");
        }
    ]);
    this.setUp = function () {
        t = {};
        testarea = core.UnitTest.provideTestAreaDiv();
    };
    this.tearDown = function () {
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };
    this.tests = function () {
        return tests;
    };
    this.asyncTests = function () {
        return [];
    };
};
core.CursorTests.name = "CursorTests";
core.CursorTests.prototype.description = function () {
    "use strict";
    return "Test the Cursor class.";
};
