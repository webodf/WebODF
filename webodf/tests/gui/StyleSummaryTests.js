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

/*global runtime, core, gui, odf, NodeFilter*/

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
gui.StyleSummaryTests = function StyleSummaryTests(runner) {
    "use strict";
    var t,
        r = runner,
        namespace = {
            "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
            "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
            "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
            "fo": "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
            "draw": "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
            "svg": "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
            "dr3d": "urn:oasis:names:tc:opendocument:xmlns:dr3d:1.0"
        };

    this.setUp = function () {
        t = {
            formatting: new odf.Formatting(),
            testArea : core.UnitTest.provideTestAreaDiv(),
            ns: namespace
        };
    };
    this.tearDown = function () {
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };
    function createDocument(dom) {
        var xml, container, fragment;

        xml = "<office:styles>";
        xml += "    <style:style style:name='P1' style:display-name='P1 Display' style:family='paragraph'>";
        xml += "        <style:text-properties fo:font-name='P1 Font' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='S1' style:display-name='S1 Display' style:family='text'>";
        xml += "        <style:text-properties fo:font-name='S1 Font' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='SBold' style:display-name='SBold Display' style:family='text'>";
        xml += "        <style:text-properties fo:font-weight='bold'/>";
        xml += "    </style:style>";
        xml += "    <style:style style:name='SItalic' style:family='text'>";
        xml += "        <style:text-properties fo:font-style='italic' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='SUnderline' style:family='text'>";
        xml += "        <style:text-properties style:text-underline-style='solid' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='SStrikeThrough' style:family='text'>";
        xml += "        <style:text-properties style:text-line-through-style='solid' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='AlignRight' style:display-name='AlignRight' style:family='paragraph'>";
        xml += "        <style:paragraph-properties fo:text-align='right' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='AlignLeft' style:display-name='AlignLeft' style:family='paragraph'>";
        xml += "        <style:paragraph-properties fo:text-align='left' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='AlignCenter' style:display-name='AlignCenter' style:family='paragraph'>";
        xml += "        <style:paragraph-properties fo:text-align='center' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='AlignJustify' style:display-name='AlignJustify' style:family='paragraph'>";
        xml += "        <style:paragraph-properties fo:text-align='justify' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='AlignStart' style:display-name='AlignStart' style:family='paragraph'>";
        xml += "        <style:paragraph-properties fo:text-align='start' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='AlignEnd' style:display-name='AlignEnd' style:family='paragraph'>";
        xml += "        <style:paragraph-properties fo:text-align='end' />";
        xml += "    </style:style>";
        xml += "</office:styles>";

        xml += "<office:automatic-styles>";
        xml += "    <text:list-style style:name='L1' style:display-name='L1 Display'>";
        xml += "        <text:list-level-style-bullet text:level='1' text:bullet-char='*' />";
        xml += "        <text:list-level-style-bullet text:level='2' text:bullet-char='@' />";
        xml += "    </text:list-style>";
        xml += "    <text:list-style style:name='L2' style:display-name='L2 Display'>";
        xml += "        <text:list-level-style-number text:level='1' text:num-format='1' />";
        xml += "    </text:list-style>";
        xml += "</office:automatic-styles>";

        xml += "<office:text>" + dom + "</office:text>";

        fragment = core.UnitTest.createOdtDocument(xml, namespace);
        t.testArea.appendChild(fragment.documentElement);
        container = { rootElement : {
            styles : t.testArea.firstChild.childNodes[0],
            automaticStyles: t.testArea.firstChild.childNodes[1]
        }};
        t.formatting.setOdfContainer(container);
        return t.testArea.firstChild.childNodes[2].childNodes.length === 1
            ? t.testArea.firstChild.childNodes[2].firstChild
            : t.testArea.firstChild.childNodes[2];
    }

    /**
     * Get all text nodes in the test div
     * @return {!Array.<!Node>}
     */
    function getTextNodes() {
        var document = t.testArea.ownerDocument,
            walker = document.createTreeWalker(t.doc, NodeFilter.SHOW_TEXT, null, false),
            nodes = [],
            n = walker.nextNode();

        while (n) {
            nodes.push(n);
            n = walker.nextNode();
        }
        return nodes;
    }

    /**
     * Create a new style summary containing all the text nodes in the test div
     * @return {!gui.StyleSummary}
     */
    function createStyleSummary() {
        return new gui.StyleSummary(t.formatting.getAppliedStyles(getTextNodes()));
    }

    function isBold_ReturnTrue() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='SBold'>A</text:span><text:span text:style-name='SBold'>B</text:span></text:p>");

        t.styleSummary = createStyleSummary();

        r.shouldBe(t, "t.styleSummary.isBold()", "true");
    }
    function isBold_ReturnFalse() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='S1'>A</text:span><text:span text:style-name='SBold'>B</text:span></text:p>");

        t.styleSummary = createStyleSummary();

        r.shouldBe(t, "t.styleSummary.isBold()", "false");
    }
    function isItalic_ReturnTrue() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='SItalic'>A</text:span><text:span text:style-name='SItalic'>B</text:span></text:p>");

        t.styleSummary = createStyleSummary();

        r.shouldBe(t, "t.styleSummary.isItalic()", "true");
    }
    function hasUnderline_ReturnTrue() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='SUnderline'>A</text:span><text:span text:style-name='SUnderline'>B</text:span></text:p>");

        t.styleSummary = createStyleSummary();

        r.shouldBe(t, "t.styleSummary.hasUnderline()", "true");
    }
    function hasStrikeThrough_ReturnTrue() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='SStrikeThrough'>A</text:span><text:span text:style-name='SStrikeThrough'>B</text:span></text:p>");

        t.styleSummary = createStyleSummary();

        r.shouldBe(t, "t.styleSummary.hasStrikeThrough()", "true");
    }

    function isAligned_MixedValues_ReturnsFalse() {
        t.doc = createDocument("<text:p text:style-name='AlignRight'>A</text:p>"
                                    + "<text:p text:style-name='AlignLeft'>A</text:p>"
                                    + "<text:p text:style-name='AlignCenter'>A</text:p>");

        t.styleSummary = createStyleSummary();

        r.shouldBe(t, "t.styleSummary.isAlignedLeft()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedRight()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedCenter()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedJustified()", "false");
    }

    function isAligned_Center_ReturnsTrue() {
        t.doc = createDocument("<text:p text:style-name='AlignCenter'>A</text:p>");

        t.styleSummary = createStyleSummary();

        r.shouldBe(t, "t.styleSummary.isAlignedLeft()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedRight()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedCenter()", "true");
        r.shouldBe(t, "t.styleSummary.isAlignedJustified()", "false");
    }

    function isAligned_Justify_ReturnsTrue() {
        t.doc = createDocument("<text:p text:style-name='AlignJustify'>A</text:p>");

        t.styleSummary = createStyleSummary();

        r.shouldBe(t, "t.styleSummary.isAlignedLeft()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedRight()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedCenter()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedJustified()", "true");
    }

    function isAligned_Left_ReturnsTrue() {
        t.doc = createDocument("<text:p text:style-name='AlignLeft'>A</text:p>");

        t.styleSummary = createStyleSummary();

        r.shouldBe(t, "t.styleSummary.isAlignedLeft()", "true");
        r.shouldBe(t, "t.styleSummary.isAlignedRight()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedCenter()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedJustified()", "false");
    }

    function isAligned_Start_ReturnsTrue() {
        t.doc = createDocument("<text:p text:style-name='AlignStart'>A</text:p>");

        t.styleSummary = createStyleSummary();

        r.shouldBe(t, "t.styleSummary.isAlignedLeft()", "true");
        r.shouldBe(t, "t.styleSummary.isAlignedRight()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedCenter()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedJustified()", "false");
    }

    function isAligned_LeftOrStart_ReturnsTrue() {
        t.doc = createDocument("<text:p text:style-name='AlignLeft'>A</text:p>"
                                + "<text:p text:style-name='AlignStart'>A</text:p>");

        t.styleSummary = createStyleSummary();

        r.shouldBe(t, "t.styleSummary.isAlignedLeft()", "true");
        r.shouldBe(t, "t.styleSummary.isAlignedRight()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedCenter()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedJustified()", "false");
    }

    function isAligned_Right_ReturnsTrue() {
        t.doc = createDocument("<text:p text:style-name='AlignRight'>A</text:p>");

        t.styleSummary = createStyleSummary();

        r.shouldBe(t, "t.styleSummary.isAlignedLeft()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedRight()", "true");
        r.shouldBe(t, "t.styleSummary.isAlignedCenter()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedJustified()", "false");
    }

    function isAligned_End_ReturnsTrue() {
        t.doc = createDocument("<text:p text:style-name='AlignEnd'>A</text:p>");

        t.styleSummary = createStyleSummary();

        r.shouldBe(t, "t.styleSummary.isAlignedLeft()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedRight()", "true");
        r.shouldBe(t, "t.styleSummary.isAlignedCenter()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedJustified()", "false");
    }

    function isAligned_RightOrEnd_ReturnsTrue() {
        t.doc = createDocument("<text:p text:style-name='AlignEnd'>A</text:p>"
                                + "<text:p text:style-name='AlignRight'>A</text:p>");

        t.styleSummary = createStyleSummary();

        r.shouldBe(t, "t.styleSummary.isAlignedLeft()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedRight()", "true");
        r.shouldBe(t, "t.styleSummary.isAlignedCenter()", "false");
        r.shouldBe(t, "t.styleSummary.isAlignedJustified()", "false");
    }

    this.tests = function () {
        return r.name([
            isBold_ReturnTrue,
            isBold_ReturnFalse,
            isItalic_ReturnTrue,
            hasUnderline_ReturnTrue,
            hasStrikeThrough_ReturnTrue,

            isAligned_MixedValues_ReturnsFalse,
            isAligned_Center_ReturnsTrue,
            isAligned_Justify_ReturnsTrue,
            isAligned_Left_ReturnsTrue,
            isAligned_Start_ReturnsTrue,
            isAligned_LeftOrStart_ReturnsTrue,
            isAligned_Right_ReturnsTrue,
            isAligned_End_ReturnsTrue,
            isAligned_RightOrEnd_ReturnsTrue
        ]);
    };
    this.asyncTests = function () {
        return [];
    };
};
gui.StyleSummaryTests.prototype.description = function () {
    "use strict";
    return "Test the StyleSummary class.";
};
