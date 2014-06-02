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

/*global runtime, core, odf*/

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
odf.StyleInfoTests = function StyleInfoTests(runner) {
    "use strict";
    var t,
        r = runner,
        namespace = {
            "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
            "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0"
        };

    this.setUp = function () {
        t = { styleInfo : new odf.StyleInfo() };
    };
    this.tearDown = function () {
        t = {};
    };
    function createDocument(dom) {
        return core.UnitTest.createXmlDocument("dummy", dom, namespace).documentElement.firstChild;

    }
    function determineStylesForNode() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='S1'>A</text:span></text:p>");

        t.usedStyles = t.styleInfo.determineStylesForNode(t.doc.firstChild);

        r.shouldBe(t, "t.usedStyles['text'] && t.usedStyles['text']['S1']", "1");
    }
    function determineStylesForNode_2() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='S1'></text:span>B</text:p>");
        t.usedStyles = {};

        t.styleInfo.determineStylesForNode(t.doc.childNodes[0], t.usedStyles);
        t.styleInfo.determineStylesForNode(t.doc, t.usedStyles);

        r.shouldBe(t, "t.usedStyles['text'] && t.usedStyles['text']['S1']", "1");
        r.shouldBe(t, "t.usedStyles['paragraph'] && t.usedStyles['paragraph']['P1']", "1");
    }
    function determineStylesForNode_NoStyles() {
        t.doc = createDocument("<text:p><text:span>B</text:span></text:p>");
        t.usedStyles = {};

        t.usedStyles = t.styleInfo.determineStylesForNode(t.doc.firstChild);

        r.shouldBe(t, "t.usedStyles", "undefined");
    }
    this.tests = function () {
        return r.name([
            determineStylesForNode,
            determineStylesForNode_2,
            determineStylesForNode_NoStyles
        ]);
    };
    this.asyncTests = function () {
        return [];
    };
};
odf.StyleInfoTests.prototype.description = function () {
    "use strict";
    return "Test the StyleInfo class.";
};
