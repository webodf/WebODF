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
/*global runtime, core, odf*/
runtime.loadClass("odf.OdfContainer");
/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
odf.OdfContainerTests = function OdfContainerTests(runner) {
    "use strict";
    var t, r = runner;
    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    function createNew() {
        t.odf = new odf.OdfContainer("", null);
        r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
        r.shouldBeNonNull(t, "t.odf.rootElement");
        r.shouldBeNonNull(t, "t.odf.rootElement.firstChild");
    }
    function createNewSaveAsAndLoad(callback) {
        t.odf = new odf.OdfContainer("", null);
        r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
        t.odf.saveAs("test.odt", function (err) {
            t.err = err;
            r.shouldBeNull(t, "t.err");
            t.odf = new odf.OdfContainer("test.odt", function (odf) {
                t.odf = odf;
                r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
                callback();
            });
        });
    }
    function compareZipEntryList(odf1path, odf2path, callback) {
        var z1 = new core.Zip(odf1path, function (e, z1) {
            var z2 = new core.Zip(odf2path, function (e, z2) {
                t.e1 = z1.getEntries();
                t.e2 = z2.getEntries();
                r.shouldBe(t, "t.e1.length", "t.e2.length");
                var i, j, f1, date1;
                t.allPresent = true;
                for (i = 0; t.allPresent && i < t.e1.length; i += 1) {
                    f1 = t.e1[i].filename;
                    date1 = t.e1[i].date;
                    j = 0;
                    while (t.e2[j].filename !== f1 && j < t.e2.length) {
                        j += 1;
                    }
                    if (j === t.e2.length) {
                        runtime.log("Not present: " + f1);
                    } else {
                        t.date1 = t.e1[i].date;
                        t.date2 = t.e2[j].date;
                        // new date should be newer but not more than 3 years
                        r.shouldBe(t, "t.date2.getTime() - t.date1.getTime() >= 0", "true");
                        r.shouldBe(t, "t.date2.getTime() - t.date1.getTime() < 100000000000", "true");
                    }
                    t.allPresent = j !== t.e2.length;
                }
                r.shouldBe(t, "t.allPresent", "true");
                callback();
            });
        });
    }
    function compare(odf1, odf2, odf1path, odf2path, callback) {
        compareZipEntryList(odf1path, odf2path, callback);
    }
    function loadAndSave(callback) {
        var path = "odf/styletest.odt",
            newpath = "odf/newstyletest.odt";
        t.odf = new odf.OdfContainer(path, function (o1) {
            t.odf = o1;
            r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
            t.odf.saveAs(newpath, function (err) {
                t.err = err;
                r.shouldBeNull(t, "t.err");
                t.odf2 = new odf.OdfContainer(newpath, function (o2) {
                    t.odf2 = o2;
                    r.shouldBe(t, "t.odf2.state", "odf.OdfContainer.DONE");
                    compare(o1, o2, path, newpath, callback);
                });
            });
        });
    }
    this.tests = function () {
        return [
            createNew
        ];
    };
    this.asyncTests = function () {
        return [
            createNewSaveAsAndLoad
            //loadAndSave
        ];
    };
};
odf.OdfContainerTests.prototype.description = function () {
    "use strict";
    return "Test the OdfContainer class.";
};
(function () {
    "use strict";
    return odf.OdfContainerTests;
}());
