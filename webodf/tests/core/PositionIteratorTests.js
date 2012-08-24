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
 * @source: http://gitorious.org/odfkit/webodf/
 */
/*global runtime, core, gui, ops*/
runtime.loadClass("core.PositionIterator");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
core.PositionIteratorTests = function PositionIteratorTests(runner) {
    "use strict";
    var r = runner, t;

    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    function createWalker(xml) {
        t.doc = runtime.parseXML(xml);
        t.iterator = new core.PositionIterator(t.doc.documentElement);
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
        t.iterator.setPosition(t.doc.documentElement, 1);
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
        t.iterator.setPosition(t.doc.documentElement, 1);
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
    this.tests = function () {
        return [
            create,
            forwardInEmptyDoc,
            backwardInEmptyDoc,
            forwardInSimpleDoc,
            backwardInSimpleDoc,
            forwardInDoc,
            backwardInDoc
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
