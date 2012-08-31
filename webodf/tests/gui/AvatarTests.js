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
runtime.loadClass("ops.SessionImplementation");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
gui.AvatarTests = function AvatarTests(runner) {
    "use strict";
    var r = runner, t;

    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    function createAvatar(xml, filter) {
        t.doc = runtime.parseXML(xml);
        function mover(n) {
            t.avatar.getCaret().move(n);
        }
        t.avatar = new gui.Avatar("id", t.doc.documentElement, filter, mover);
    }
    function create() {
        createAvatar("<a/>", null);
        r.shouldBeNonNull(t, "t.avatar");
        r.shouldBe(t, "t.avatar.getMemberId()", "'id'");
        var c = t.avatar.getCaret(),
            s = c.getSelection();
        t.rangeCount = s.rangeCount;
        r.shouldBe(t, "t.rangeCount", "1");
        t.focusOffset = s.focusOffset;
        r.shouldBe(t, "t.focusOffset", "0");
        t.focusNode = s.focusNode;
        r.shouldBeNonNull(t, "t.focusNode");
    }
    function moveInEmptyDoc() {
        createAvatar("<a/>", null);
        var c = t.avatar.getCaret(),
            s = c.getSelection();
        t.startNode = s.focusNode;
        c.move(1);
        t.focusOffset = s.focusOffset;
        t.focusNode = s.focusNode;
        r.shouldBe(t, "t.focusOffset", "0");
        r.shouldBe(t, "t.startNode", "t.focusNode");
    }
    function moveInSimpleDoc() {
        createAvatar("<a>hello</a>", null);
        var c = t.avatar.getCaret(),
            s = c.getSelection(),
            i;
        t.startNode = s.focusNode;
        for (i = 1; i <= 4; i += 1) {
            c.move(1);
            t.focusOffset = s.focusOffset;
            t.focusNode = s.focusNode;
            r.shouldBe(t, "t.focusOffset", i.toString());
            r.shouldBe(t, "t.focusNode", "t.startNode");
        }
        c.move(1);
        t.focusOffset = s.focusOffset;
        t.focusNode = s.focusNode;
        r.shouldBe(t, "t.focusOffset", "1");
        r.shouldBe(t, "t.focusNode", "t.startNode.parentNode");
        c.move(1);
        r.shouldBe(t, "t.focusOffset", "1");
        r.shouldBe(t, "t.focusNode", "t.startNode.parentNode");
        for (i = 4; i >= 0; i -= 1) {
            c.move(-1);
            t.focusOffset = s.focusOffset;
            t.focusNode = s.focusNode;
            r.shouldBe(t, "t.focusOffset", i.toString());
            r.shouldBe(t, "t.focusNode", "t.startNode");
        }
        c.move(1);
        r.shouldBe(t, "t.focusOffset", "0");
        r.shouldBe(t, "t.focusNode", "t.startNode");
    }
    function backAndForth(xml, n) {
        var i,
            counter,
            filter = function acceptPosition(p) {
                t.pos.push({
                    c: p.container(),
                    o: p.offset()
                });
                return 1;
            };
        t.pos = [];
        filter.acceptPosition = filter;
        createAvatar(xml, filter);
        t.caret = t.avatar.getCaret();
        counter = t.caret.getStepCounter();
        t.stepsSum = 0;
        t.moveSum = 0;
        for (i = 1; i <= n; i += 1) {
            t.stepsSum += Math.abs(counter.countForwardSteps(1, filter));
            t.moveSum += Math.abs(t.caret.move(1));
        }
        r.shouldBe(t, "t.caret.move(1)", "0");
        r.shouldBe(t, "t.pos.length", n.toString());
        r.shouldBe(t, "t.stepsSum", n.toString());
        r.shouldBe(t, "t.moveSum", n.toString());
        t.prevPos = t.pos.reverse();
        t.pos = [];
        t.stepsSum = 0;
        t.moveSum = 0;
        for (i = 1; i <= n; i += 1) {
            t.stepsSum += Math.abs(counter.countBackwardSteps(1, filter));
            t.moveSum += Math.abs(t.caret.move(-1));
        }
        r.shouldBe(t, "t.caret.move(-1)", "-0");
        r.shouldBe(t, "t.pos.length", n.toString());
        r.shouldBe(t, "t.stepsSum", n.toString());
        r.shouldBe(t, "t.moveSum", n.toString());
    }
    function backAndForth1() {
        var xml = '<a>ab</a>\n';
        backAndForth(xml, 2);
    }
    function backAndForth2() {
        var xml = '<office:text text:use-soft-page-breaks="true" xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">\n'
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
                + '        <text:p text:style-name="P5">WebODF is an exiting new technology</text:p>\n'
                + '      </text:section>\n'
                + '</office:text>\n';
        backAndForth(xml, 167);
    }
    this.tests = function () {
        return [
            create,
            moveInEmptyDoc,
            moveInSimpleDoc,
            backAndForth1,
            backAndForth2
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
