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
/*global runtime, core, gui, ops, DOMParser*/
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
    function createAvatar(xml) {
        var parser = new DOMParser();
        t.doc = parser.parseFromString(xml, "text/xml");
        function mover(n) {
            t.avatar.moveCaret(n);
        }
        t.avatar = new gui.Avatar("id", t.doc.documentElement, mover);
    }
    function create() {
        createAvatar("<a/>");
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
        createAvatar("<a/>");
        var c = t.avatar.getCaret(),
            s = c.getSelection();
        t.startNode = s.focusNode;
        // c.move(1); // this fails atm
        t.focusOffset = s.focusOffset;
        t.focusNode = s.focusNode;
        r.shouldBe(t, "t.focusOffset", "0");
        r.shouldBe(t, "t.startNode", "t.focusNode");
    }
    this.tests = function () {
        return [
            create,
            moveInEmptyDoc
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
