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
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
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
 * @source: https://github.com/kogmbh/WebODF/
 */
/*global runtime, core, odf*/
runtime.loadClass("odf.StyleInfo");
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
        var header = "<?xml version='1.0' encoding='UTF-8'?>",
            footer = "</office:text>";

        header += "<office:text";
        Object.keys(namespace).forEach(function (key) {
            header += " xmlns:" + key + '="' + namespace[key] + '"';
        });
        header += ">";

        return runtime.parseXML(header + dom + footer).documentElement.firstChild;
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
(function () {
    "use strict";
    return odf.StyleInfoTests;
}());
