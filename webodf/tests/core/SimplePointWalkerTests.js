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
runtime.loadClass("core.SimplePointWalker");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
core.SimplePointWalkerTests = function SimplePointWalkerTests(runner) {
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
        t.walker = new core.SimplePointWalker(t.doc.documentElement);
    }
    function create() {
        createWalker("<a/>");
        r.shouldBeNonNull(t, "t.walker");
        r.shouldBeNull(t, "t.walker.precedingSibling()");
        r.shouldBeNull(t, "t.walker.followingSibling()");
        r.shouldBe(t, "t.doc.documentElement", "t.walker.node()");
        r.shouldBe(t, "t.walker.position()", "0");
        r.shouldBe(t, "t.walker.countPositions(t.doc.documentElement)", "1");
    }
    function forwardInEmptyDoc() {
        createWalker("<a/>");
        r.shouldBe(t, "t.walker.stepForward()", "false");
        r.shouldBeNull(t, "t.walker.precedingSibling()");
        r.shouldBeNull(t, "t.walker.followingSibling()");
        r.shouldBe(t, "t.doc.documentElement", "t.walker.node()");
        r.shouldBe(t, "t.walker.position()", "0");
    }
    function backwardInEmptyDoc() {
        createWalker("<a/>");
        r.shouldBe(t, "t.walker.stepBackward()", "false");
        r.shouldBeNull(t, "t.walker.precedingSibling()");
        r.shouldBeNull(t, "t.walker.followingSibling()");
        r.shouldBe(t, "t.doc.documentElement", "t.walker.node()");
        r.shouldBe(t, "t.walker.position()", "0");
    }
    function forwardInSimpleDoc() {
        createWalker("<a>hello</a>");
        t.textNode = t.doc.documentElement.firstChild;
        r.shouldBe(t, "t.walker.position()", "0");
        var i;
        for (i = 1; i <= 4; i += 1) {
            r.shouldBe(t, "t.walker.stepForward()", "true");
            r.shouldBe(t, "t.walker.precedingSibling()", "t.textNode");
            r.shouldBe(t, "t.walker.followingSibling()", "t.textNode");
            r.shouldBe(t, "t.walker.node()", "t.doc.documentElement");
            r.shouldBe(t, "t.walker.position()", i.toString());
        }
        r.shouldBe(t, "t.walker.stepForward()", "true");
        r.shouldBe(t, "t.walker.precedingSibling()", "t.textNode");
        r.shouldBeNull(t, "t.walker.followingSibling()");
        r.shouldBe(t, "t.walker.node()", "t.doc.documentElement");
        r.shouldBe(t, "t.walker.position()", "5");
        r.shouldBe(t, "t.walker.stepForward()", "false");
        r.shouldBe(t, "t.walker.position()", "5");
    }
    function backwardInSimpleDoc() {
        createWalker("<a>hello</a>");
        t.textNode = t.doc.documentElement.firstChild;
        t.walker.setPoint(t.walker.node(), 5);
        r.shouldBe(t, "t.walker.position()", "5");
        var i;
        for (i = 4; i > 0; i -= 1) {
            r.shouldBe(t, "t.walker.stepBackward()", "true");
            r.shouldBe(t, "t.walker.precedingSibling()", "t.textNode");
            r.shouldBe(t, "t.walker.followingSibling()", "t.textNode");
            r.shouldBe(t, "t.doc.documentElement", "t.walker.node()");
            r.shouldBe(t, "t.walker.position()", i.toString());
        }
        r.shouldBe(t, "t.walker.stepBackward()", "true");
        r.shouldBeNull(t, "t.walker.precedingSibling()");
        r.shouldBe(t, "t.walker.followingSibling()", "t.textNode");
        r.shouldBe(t, "t.doc.documentElement", "t.walker.node()");
        r.shouldBe(t, "t.walker.position()", "0");
        r.shouldBe(t, "t.walker.stepBackward()", "false");
        r.shouldBe(t, "t.walker.position()", "0");
    }
    function forwardInDoc() {
        createWalker("<a>abc<a>abc</a>abc</a>");
        var i;
        for (i = 1; i <= 3; i += 1) {
            r.shouldBe(t, "t.walker.stepForward()", "true");
            r.shouldBe(t, "t.walker.position()", i.toString());
        }
        for (i = 0; i <= 3; i += 1) {
            r.shouldBe(t, "t.walker.stepForward()", "true");
            r.shouldBe(t, "t.walker.position()", i.toString());
        }
        for (i = 4; i <= 7; i += 1) {
            r.shouldBe(t, "t.walker.stepForward()", "true");
            r.shouldBe(t, "t.walker.position()", i.toString());
        }
        r.shouldBe(t, "t.walker.stepForward()", "false");
        r.shouldBe(t, "t.walker.position()", "7");
    }
    function backwardInDoc() {
        createWalker("<a>abc<a>abc</a>abc</a>");
        t.walker.setPoint(t.walker.node(), 7);
        var i;
        for (i = 6; i >= 4; i -= 1) {
            r.shouldBe(t, "t.walker.stepBackward()", "true");
            r.shouldBe(t, "t.walker.position()", i.toString());
        }
        for (i = 3; i >= 0; i -= 1) {
            r.shouldBe(t, "t.walker.stepBackward()", "true");
            r.shouldBe(t, "t.walker.position()", i.toString());
        }
        for (i = 3; i >= 0; i -= 1) {
            r.shouldBe(t, "t.walker.stepBackward()", "true");
            r.shouldBe(t, "t.walker.position()", i.toString());
        }
        r.shouldBe(t, "t.walker.stepBackward()", "false");
        r.shouldBe(t, "t.walker.position()", "0");
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
core.SimplePointWalkerTests.prototype.description = function () {
    "use strict";
    return "Test the SimplePointWalker class.";
};
(function () {
    "use strict";
    return core.SimplePointWalkerTests;
}());
