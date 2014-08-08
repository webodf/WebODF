/**
 * Copyright (C) 2014 KO GmbH <copyright@kogmbh.com>
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

/*global runtime, core, odf*/

/**
 * @constructor
 * @param {!core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
odf.StyleParseUtilsTests = function StyleParseUtilsTests(runner) {
    "use strict";
    var r = runner, t;

    /**
     * @param {?string|undefined} valueString
     * @param {!number|undefined} expectedResult
     * @return {undefined}
     */
    function doTestParseLength(valueString, expectedResult) {
        t.length = t.styleParseUtils.parseLength(valueString);
        t.expectedLength = expectedResult;
        r.shouldBe(t, "t.length", "t.expectedLength");
    }

    function testParseLength() {
        doTestParseLength(null,        undefined);
        doTestParseLength(undefined,   undefined);
        doTestParseLength("very long", undefined);
        doTestParseLength("",          undefined);
        doTestParseLength("1thumb",    undefined);

        doTestParseLength("1px",   1);
        doTestParseLength("1.2px", 1.2);
        doTestParseLength("0px",   0);

        doTestParseLength("1cm",   37.7952756);
        doTestParseLength("2.5cm", 94.488189);
        doTestParseLength("0cm",   0);

        doTestParseLength("1mm",   3.77952756);
        doTestParseLength("2.5mm", 9.4488189);
        doTestParseLength("0mm",   0);

        doTestParseLength("1in",   96);
        doTestParseLength("2.5in", 240);
        doTestParseLength("0in",   0);

        doTestParseLength("1pt",   1.33333333);
        doTestParseLength("2.5pt", 3.33333333);
        doTestParseLength("0pt", 0);

        doTestParseLength("1pc", 16);
        doTestParseLength("2.5pc", 40);
        doTestParseLength("0pc", 0);
    }

    function parseAttributeList_IgnoresLeadingAndTrailingSpace() {
        t.result = t.styleParseUtils.parseAttributeList("    a b c    ");
        r.shouldBe(t, "t.result", "['a', 'b', 'c']");
    }

    function parseAttributeList_CollapsesExcessiveSpace() {
        t.result = t.styleParseUtils.parseAttributeList("   a   bc def    ");
        r.shouldBe(t, "t.result", "['a', 'bc', 'def']");
    }

    function parseAttributeList_WhenInputIsUndefined_ReturnsEmptyArray() {
        t.result = t.styleParseUtils.parseAttributeList(null);
        r.shouldBe(t, "t.result", "[]");

        t.result = t.styleParseUtils.parseAttributeList(undefined);
        r.shouldBe(t, "t.result", "[]");
    }

    function parseAttributeList_WhenInputIsBlankString_ReturnsEmptyArray() {
        t.result = t.styleParseUtils.parseAttributeList("");
        r.shouldBe(t, "t.result", "[]");

        t.result = t.styleParseUtils.parseAttributeList("   ");
        r.shouldBe(t, "t.result", "[]");
    }

    this.setUp = function () {
        t = {
            styleParseUtils: new odf.StyleParseUtils()
        };
    };
    this.tearDown = function () {
        t = {};
    };
    this.tests = function () {
        return r.name([
            testParseLength,
            parseAttributeList_IgnoresLeadingAndTrailingSpace,
            parseAttributeList_CollapsesExcessiveSpace,
            parseAttributeList_WhenInputIsUndefined_ReturnsEmptyArray,
            parseAttributeList_WhenInputIsBlankString_ReturnsEmptyArray
        ]);
    };
    this.asyncTests = function () {
        return [];
    };
};
odf.StyleParseUtilsTests.prototype.description = function () {
    "use strict";
    return "Test the methods of StyleParseUtils.";
};
