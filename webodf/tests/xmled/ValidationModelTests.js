/**
 * Copyright (C) 2013 KO GmbH <jos.van.den.oever@kogmbh.com>
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
/*global runtime, xmled, document*/
runtime.loadClass("xmled.ValidationModel");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
xmled.ValidationModelTests = function ValidationModelTests(runner) {
    "use strict";
    var r = runner,
        t;

    function testSimpleRoot(callback) {
        var model = new xmled.ValidationModel("xmled/simple.xsd", function (e) {
            t.err = e;
            r.shouldBeNull(t, "t.err");
            t.reps = model.getPossibleReplacements(document);
            r.shouldBe(t, "t.reps.length", "1");
            callback();
        });
    }
    function testLoadXML(callback) {
        runtime.loadXML("tests.html", function (err, xml) {
            t.err = err || null;
            t.xml = xml || null;
            r.shouldBeNull(t, "t.err");
            r.shouldBeNonNull(t, "t.xml");
            callback();
        });
    }

    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    this.tests = function () {
        return [];
    };
    this.asyncTests = function () {
        return [
            testSimpleRoot,
            testLoadXML
        ];
    };
};
xmled.ValidationModelTests.prototype.description = function () {
    "use strict";
    return "Test the ValidationModel class.";
};
(function () {
    "use strict";
    return xmled.ValidationModelTests; 
}());
