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

/*global core, runtime, Uint8Array, ArrayBuffer*/

/**
 * @constructor
 * @param runner {UnitTestRunner}
 * @implements {core.UnitTest}
 */
core.Base64Tests = function Base64Tests(runner) {
    "use strict";
    var t, r = runner, base64 = new core.Base64();

    function testConvertByteArrayToBase64() {
        var a = new Uint8Array(new ArrayBuffer(3));
        a[0] = a[1] = a[2] = 65;
        t.encoded = base64.convertByteArrayToBase64(a.subarray(0, 1));
        r.shouldBe(t, "t.encoded", "'QQ=='");
        t.encoded = base64.convertByteArrayToBase64(a.subarray(0, 2));
        r.shouldBe(t, "t.encoded", "'QUE='");
        t.encoded = base64.convertByteArrayToBase64(a);
        r.shouldBe(t, "t.encoded", "'QUFB'");
    }

    function testToBase64() {
        t.encoded = base64.toBase64("A");
        r.shouldBe(t, "t.encoded", "'QQ=='");
        t.encoded = base64.toBase64("AA");
        r.shouldBe(t, "t.encoded", "'QUE='");
        t.encoded = base64.toBase64("AAA");
        r.shouldBe(t, "t.encoded", "'QUFB'");
    }

    function testConvertUTF8StringToUTF16String(callback) {
        var bin = "1234567890";
        while (bin.length < 100000) {
            bin += bin;
        }
        t.numcallbacks = 0;
        base64.convertUTF8StringToUTF16String(bin, function (str, done) {
            t.numcallbacks += 1;
            t.done = done;
            if (t.numcallbacks === 1) {
                r.shouldBe(t, "t.done", "false");
            } else {
                r.shouldBe(t, "t.done", "true");
            }
            if (done) {
                r.shouldBe(t, "t.numcallbacks", "2");
                t.str = str;
                t.bin = bin;
                r.shouldBe(t, "t.str.length", "t.bin.length");
                callback();
            }
            return true;
        });
    }

    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    this.tests = function () {
        return r.name([
            testConvertByteArrayToBase64,
            testToBase64
        ]);
    };
    this.asyncTests = function () {
        return r.name([ testConvertUTF8StringToUTF16String ]);
    };
    this.description = function () {
        return "Test the Base64 class.";
    };
};
