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
core.ZipTests = function ZipTests(runner) {
    "use strict";
    var r = runner,
        t;

    function testNonExistingFile(callback) {
        var zip = new core.Zip("whatever", function (err) {
            t.err = err;
            r.shouldBeNonNull(t, "t.err");
            callback();
        });
        return zip;
    }

    function testNonZipFile(callback) {
        var path = "core/ZipTests.js";
        // check that file exists
        path = r.resourcePrefix() + path;
        runtime.readFile(path, "binary", function (error, data) {
            t.exists = !error && Boolean(data);
            r.shouldBe(t, "t.exists", "true");
            // check that zip file opening returns an error
            t.zip = new core.Zip("core/ZipTests.js", function (err) {
                t.err = err;
                r.shouldBeNonNull(t, "t.err");
                callback();
            });
        });
    }

    function testHi(path, callback) {
        path = r.resourcePrefix() + path;
        t.zip = new core.Zip(path, function (err, zip) {
            t.err = err;
            t.zip = zip;
            r.shouldBeNull(t, "t.err");
            zip.load("hello", function (err, data) {
                t.err = err;
                r.shouldBeNull(t, "t.err");
                if (data) {
                    t.data = runtime.byteArrayToString(data, "utf8");
                }
                r.shouldBe(t, "t.data.length", "16");
                r.shouldBe(t, "t.data", "'bonjour\\nbonjour\\n'");
                callback();
            });
        });
    }

    function testHiUncompressed(callback) {
        testHi("core/hi-uncompressed.zip", callback);
    }

    function testHiCompressed(callback) {
        testHi("core/hi-compressed.zip", callback);
    }

    function testCreateZip(callback) {
        var filename = r.resourcePrefix() + "writetest.zip",
            zip = new core.Zip(filename, null),
            data = runtime.byteArrayFromString(
                "application/vnd.oasis.opendocument.text",
                "utf8"
            );
        zip.save("mimetype", data, false, new Date());
        zip.load("mimetype", function (err, newdata) {
            t.err = err;
            r.shouldBeNull(t, "t.err");
            t.data = data;
            t.newdata = newdata;
            r.shouldBe(t, "t.data", "t.newdata");
            zip.write(function (err) {
                t.err = err;
                r.shouldBeNull(t, "t.err");
                runtime.deleteFile(filename, function () {
                    callback();
                });
            });
        });
    }

    function testSave() {
        var zip = new core.Zip("savetest.zip", null),
            data = runtime.byteArrayFromString("hello", "utf8");
        zip.save("a", data, false, new Date());
        zip.save("b", data, false, new Date());
        zip.save("c", data, false, new Date());
        t.entries = zip.getEntries();
        r.shouldBe(t, "t.entries.length", "3");
        r.shouldBe(t, "t.entries[0].filename", "'a'");
        r.shouldBe(t, "t.entries[1].filename", "'b'");
        r.shouldBe(t, "t.entries[2].filename", "'c'");
    }

    function testRemove() {
        var zip = new core.Zip("savetest.zip", null),
            data = runtime.byteArrayFromString("hello", "utf8");
        zip.save("a", data, false, new Date());
        zip.save("b", data, false, new Date());
        zip.save("c", data, false, new Date());
        t.removeA = zip.remove("a");
        t.remove1 = zip.remove("1");
        t.entries = zip.getEntries();
        r.shouldBe(t, "t.removeA", "true");
        r.shouldBe(t, "t.remove1", "false");
        r.shouldBe(t, "t.entries.length", "2");
        r.shouldBe(t, "t.entries[0].filename", "'b'");
        r.shouldBe(t, "t.entries[1].filename", "'c'");
    }

    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    this.tests = function () {
        return r.name([
            testSave,
            testRemove
        ]);
    };
    this.asyncTests = function () {
        return r.name([
            testNonExistingFile,
            testNonZipFile,
            testHiUncompressed,
            testHiCompressed,
            testCreateZip
        ]);
    };
};
core.ZipTests.prototype.description = function () {
    "use strict";
    return "Test the Zip class.";
};
