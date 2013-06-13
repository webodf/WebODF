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
runtime.loadClass("odf.Formatting");
/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
odf.FormattingTests = function FormattingTests(runner) {
    "use strict";
    var t,
        r = runner,
        namespace = {
            "text":"urn:oasis:names:tc:opendocument:xmlns:text:1.0",
            "office":"urn:oasis:names:tc:opendocument:xmlns:office:1.0",
            "style":"urn:oasis:names:tc:opendocument:xmlns:style:1.0",
            "fo":"urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
        };

    this.setUp = function () {
        t = { formatting : new odf.Formatting() };
    };
    this.tearDown = function () {
        t.range.detach();
        t = {};
    };
    function createDocument(dom) {
        var xml = "<?xml version='1.0' encoding='UTF-8'?>",
            container, fragment;

        xml += "<office:document";
        Object.keys(namespace).forEach(function(key) {
            xml += " xmlns:" + key + '="' + namespace[key] + '"';
        });
        xml += ">";

        xml += "<office:styles>";
        xml += "    <style:style style:name='P1' style:display-name='P1 Display' style:family='paragraph'>";
        xml += "        <style:text-properties fo:font-name='P1 Font' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='S1' style:display-name='S1 Display' style:family='text'>";
        xml += "        <style:text-properties fo:font-name='S1 Font' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='S2' style:display-name='S2 Display' style:family='text'>";
        xml += "        <style:text-properties fo:font-weight='bold'/>";
        xml += "    </style:style>";
        xml += "</office:styles>";

        xml += "<office:automatic-styles />";

        xml += "<office:text>" + dom + "</office:text>";
        xml += "</office:document>";

        fragment = runtime.parseXML(xml);
        container = { rootElement : {
            styles : fragment.documentElement.childNodes[0],
            automaticStyles: fragment.documentElement.childNodes[1]
        }};
        t.formatting.setOdfContainer(container);
        t.range = fragment.createRange();
        return fragment.documentElement.childNodes[2].firstChild;
    }
    function getAppliedStyles_SimpleHierarchy() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='S1'>A</text:span></text:p>");
        t.range.selectNode(t.doc.firstChild.firstChild);

        t.appliedStyles = t.formatting.getAppliedStyles(t.range);

        r.shouldBe(t, "t.appliedStyles.length", "1");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "2");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'S1', displayName: 'S1 Display', family: 'text'})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph'})");
        r.shouldBe(t, "t.appliedStyles[0]['style:text-properties']", "({'fo:font-name': 'S1 Font'})");
    }
    function getAppliedStyles_NestedHierarchy() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='S1'><text:span text:style-name='S2'>A</text:span></text:span></text:p>");
        t.range.selectNode(t.doc.firstChild.firstChild);

        t.appliedStyles = t.formatting.getAppliedStyles(t.range);

        r.shouldBe(t, "t.appliedStyles.length", "1");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "3");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'S2', displayName: 'S2 Display', family: 'text'})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'S1', displayName: 'S1 Display', family: 'text'})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph'})");
        r.shouldBe(t, "t.appliedStyles[0]['style:text-properties']", "({'fo:font-name': 'S1 Font', 'fo:font-weight': 'bold'})");
    }
    function getAppliedStyles_CompleteContent_OnlyReportsUniqueStyles() {
        t.doc = createDocument("<text:p text:style-name='P1'>A<text:span text:style-name='S1'>B</text:span>C</text:p>");
        t.range.selectNode(t.doc);

        t.appliedStyles = t.formatting.getAppliedStyles(t.range);

        r.shouldBe(t, "t.appliedStyles.length", "2");

        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "1");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph'})");
        r.shouldBe(t, "t.appliedStyles[0]['style:text-properties']", "({'fo:font-name': 'P1 Font'})");

        t.appliedStyles.shift();

        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "2");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'S1', displayName: 'S1 Display', family: 'text'})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph'})");
        r.shouldBe(t, "t.appliedStyles[0]['style:text-properties']", "({'fo:font-name': 'S1 Font'})");
    }
    function getAppliedStyles_StartsAtChild_WithNoText() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='S1'></text:span>B</text:p>");
        t.range.setStart(t.doc, 0);
        t.range.setEndBefore(t.doc.childNodes[1]);

        t.appliedStyles = t.formatting.getAppliedStyles(t.range);

        r.shouldBe(t, "t.appliedStyles.length", "0");
    }
    function getAppliedStyles_StartsAfterChild() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='S1'></text:span>B</text:p>");
        t.range.setStart(t.doc, 1);
        t.range.setEnd(t.doc, 2);

        t.appliedStyles = t.formatting.getAppliedStyles(t.range);

        r.shouldBe(t, "t.appliedStyles.length", "1");

        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "1");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph'})");
        r.shouldBe(t, "t.appliedStyles[0]['style:text-properties']", "({'fo:font-name': 'P1 Font'})");
    }
    function getAppliedStyles_StartsAndEnds_InSameTextNode() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='S1'></text:span>ABC</text:p>");
        t.range.setStart(t.doc.childNodes[1], 1);
        t.range.setEnd(t.doc.childNodes[1], 2);

        t.appliedStyles = t.formatting.getAppliedStyles(t.range);

        r.shouldBe(t, "t.appliedStyles.length", "1");

        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "1");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph'})");
        r.shouldBe(t, "t.appliedStyles[0]['style:text-properties']", "({'fo:font-name': 'P1 Font'})");
    }
    function getAppliedStyles_StartsAndEnds_InDifferentTextNodes() {
        t.doc = createDocument("<text:p text:style-name='P1'>A<text:span text:style-name='S1'>B</text:span>C</text:p>");
        t.range.setStart(t.doc.childNodes[0], 0);
        t.range.setEnd(t.doc.childNodes[2], 1);

        t.appliedStyles = t.formatting.getAppliedStyles(t.range);

        r.shouldBe(t, "t.appliedStyles.length", "2");

        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "1");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph'})");
        r.shouldBe(t, "t.appliedStyles[0]['style:text-properties']", "({'fo:font-name': 'P1 Font'})");

        t.appliedStyles.shift();

        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "2");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'S1', displayName: 'S1 Display', family: 'text'})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph'})");
        r.shouldBe(t, "t.appliedStyles[0]['style:text-properties']", "({'fo:font-name': 'S1 Font'})");
    }
    this.tests = function () {
        return [
            getAppliedStyles_SimpleHierarchy,
            getAppliedStyles_NestedHierarchy,
            getAppliedStyles_StartsAtChild_WithNoText,
            getAppliedStyles_StartsAfterChild,
            getAppliedStyles_CompleteContent_OnlyReportsUniqueStyles,
            getAppliedStyles_StartsAndEnds_InSameTextNode,
            getAppliedStyles_StartsAndEnds_InDifferentTextNodes
        ];
    };
    this.asyncTests = function () {
        return [];
    };
};
odf.FormattingTests.prototype.description = function () {
    "use strict";
    return "Test the Formatting class.";
};
(function () {
    "use strict";
    return odf.FormattingTests;
}());
