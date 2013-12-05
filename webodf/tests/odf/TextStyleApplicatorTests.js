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
/*global runtime, core, gui, odf, NodeFilter*/
runtime.loadClass("core.DomUtils");
runtime.loadClass("odf.Formatting");
runtime.loadClass("odf.OdfUtils");
runtime.loadClass("odf.TextStyleApplicator");
/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
odf.TextStyleApplicatorTests = function TextStyleApplicatorTests(runner) {
    "use strict";
    var t,
        r = runner,
        odfUtils = new odf.OdfUtils(),
        domUtils = new core.DomUtils(),
        namespace = {
            "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
            "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
            "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
            "fo": "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
        };

    this.setUp = function () {
        t = {
            formatting: new odf.Formatting(),
            testArea : core.UnitTest.provideTestAreaDiv(),
            ns: namespace
        };
    };
    this.tearDown = function () {
        t.range.detach();
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };
    function parseXML(data) {
        var xml = "<?xml version='1.0' encoding='UTF-8'?>";

        xml += "<office:document";
        Object.keys(namespace).forEach(function (key) {
            xml += " xmlns:" + key + '="' + namespace[key] + '"';
        });
        xml += ">";
        xml += data;
        xml += "</office:document>";
        return runtime.parseXML(xml).documentElement;
    }
    function createDocument(dom) {
        var xml = "";

        xml += "<office:styles>";
        xml += "    <style:style style:name='PBold' style:family='paragraph'>";
        xml += "        <style:text-properties fo:font-weight='bold' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='SBold' style:family='text'>";
        xml += "        <style:text-properties fo:font-weight='bold' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='SUnderline' style:family='text'>";
        xml += "        <style:text-properties style:text-underline-style='solid' />";
        xml += "    </style:style>";
        xml += "</office:styles>";

        xml += "<office:automatic-styles>";
        xml += "    <style:style style:name='ABold' style:family='text'>";
        xml += "        <style:text-properties fo:font-weight='bold' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='AUnderline' style:family='text'>";
        xml += "        <style:text-properties style:text-underline-style='solid' />";
        xml += "    </style:style>";
        xml += "</office:automatic-styles>";

        xml += "<office:text>" + dom + "</office:text>";

        t.testArea.appendChild(parseXML(xml));
        t.container = { rootElement : {
            styles : t.testArea.firstChild.childNodes[0],
            automaticStyles: t.testArea.firstChild.childNodes[1]
        }};
        t.formatting.setOdfContainer(t.container);
        t.range = t.testArea.ownerDocument.createRange();
        return t.testArea.firstChild.childNodes[2].firstChild;
    }
    function simplifyAutoStyleNames(root) {
        var iterator = root.ownerDocument.createNodeIterator(root, NodeFilter.SHOW_ELEMENT, null, false),
            n = iterator.nextNode(),
            styleName,
            replacedNames = [],
            existingIndex;

        while (n) {
            styleName = n.getAttributeNS(t.ns.text, 'style-name');
            if (styleName && styleName.search(/auto/) !== -1) {
                existingIndex = replacedNames.indexOf(styleName);
                if (existingIndex === -1) {
                    existingIndex = replacedNames.length;
                    replacedNames.push(styleName);
                }
                n.setAttributeNS(t.ns.text, 'style-name', 'auto' + existingIndex);
            }
            n = iterator.nextNode();
        }
        return replacedNames;
    }

    /**
     * Apply the specified style information to the supplied range
     * @param {!Range} range
     * @param {!Object} info
     * @retur {undefined}
     */
    function applyStyle(range, info) {
        var limits,
            newTextNodes = domUtils.splitBoundaries(t.range),
            textNodes = odfUtils.getTextNodes(range, false),
            textStyles = new odf.TextStyleApplicator(
                new odf.ObjectNameGenerator(/**@type{!odf.OdfContainer}*/(t.container), "tStyle"), // TODO: use the instance in SessionController
                t.formatting,
                t.container.rootElement.automaticStyles
            );

        // Avoid using the passed in range as boundaries move in strange ways as the DOM is modified
        limits = {
            startContainer: range.startContainer,
            startOffset: range.startOffset,
            endContainer: range.endContainer,
            endOffset: range.endOffset
        };

        textStyles.applyStyle(textNodes, limits, info);
        newTextNodes.forEach(domUtils.normalizeTextNodes);
    }
    function apply_ContainerInsertion_SimpleTextRange() {
        t.doc = createDocument("<text:p>ABCD</text:p>");
        t.range.setStart(t.doc.childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[0], 3);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p>A<text:span text:style-name='auto0'>BC</text:span>D</text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");
    }
    function apply_ContainerInsertion_SimpleTextRange_EndsAtNodeBeginning() {
        t.doc = createDocument("<text:p>ABCD</text:p>");
        t.doc.appendChild(t.doc.childNodes[0].splitText(3));
        t.range.setStart(t.doc.childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[1], 0);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        r.shouldBe(t, "t.doc.childNodes.length", "3");
        r.shouldBe(t, "t.doc.childNodes[0].textContent", "'A'");

        r.shouldBe(t, "t.doc.childNodes[1].getAttributeNS(t.ns.text, 'style-name')", "'auto0'");
        r.shouldBe(t, "t.doc.childNodes[1].childNodes.length", "1");
        r.shouldBe(t, "t.doc.childNodes[1].childNodes[0].textContent", "'BC'");

        r.shouldBe(t, "t.doc.childNodes[2].textContent", "'D'");
    }
    function apply_ContainerInsertion_TextBracketingLink() {
        t.doc = createDocument("<text:p>AB<text:a>C</text:a>DE</text:p>");
        t.range.setStart(t.doc.childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[2], 1);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p>A<text:span text:style-name='auto0'>B<text:a>C</text:a>D</text:span>E</text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");
    }
    function apply_ContainerInsertion_SimpleSpan() {
        t.doc = createDocument("<text:p><text:span>ABCD</text:span></text:p>");
        t.range.setStart(t.doc.childNodes[0].childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[0].childNodes[0], 3);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p><text:span>A</text:span>" +
            "<text:span text:style-name='auto0'>BC</text:span>" +
            "<text:span>D</text:span></text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");
    }
    function apply_ContainerInsertion_SimpleSpans() {
        t.doc = createDocument("<text:p><text:span>AB</text:span><text:span>CD</text:span></text:p>");
        t.range.setStart(t.doc.childNodes[0].childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[1].childNodes[0], 1);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p><text:span>A</text:span>" +
            "<text:span text:style-name='auto0'>B</text:span>" +
            "<text:span text:style-name='auto0'>C</text:span>" +
            "<text:span>D</text:span></text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");
    }
    function apply_ContainerInsertion_SpanBracketingLink() {
        t.doc = createDocument("<text:p><text:span>AB<text:a>C</text:a>DE</text:span></text:p>");
        t.range.setStart(t.doc.childNodes[0].childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[0].childNodes[2], 1);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p><text:span>A</text:span>" +
            "<text:span text:style-name='auto0'>B<text:a>C</text:a>D</text:span>" +
            "<text:span>E</text:span></text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");
    }
    function apply_ContainerInsertion_SpanContainsMixedContent() {
        t.doc = createDocument("<text:p><text:span>A<text:a>B</text:a><text:a/>CD</text:span></text:p>");
        t.range.setStart(t.doc.childNodes[0].childNodes[1], 0);
        t.range.setEnd(t.doc.childNodes[0].childNodes[3], 1);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p>" +
            "<text:span>A<text:a><text:span text:style-name='auto0'>B</text:span></text:a><text:a/></text:span>" +
            "<text:span text:style-name='auto0'>C</text:span>" +
            "<text:span>D</text:span></text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");
    }
    function apply_ContainerInsertion_SurroundedBySpans_EndsAfterText() {
        t.doc = createDocument("<text:p><text:span>AB</text:span>C<text:span>D</text:span></text:p>");
        t.range.setStart(t.doc.childNodes[0].childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[1], 1);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p><text:span>A</text:span>" +
            "<text:span text:style-name='auto0'>B</text:span>" +
            "<text:span text:style-name='auto0'>C</text:span>" +
            "<text:span>D</text:span></text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");
    }
    function apply_ContainerInsertion_SurroundedBySpans_BeforeText() {
        t.doc = createDocument("<text:p><text:span>AB</text:span>C<text:span>D</text:span></text:p>");
        t.range.setStart(t.doc.childNodes[0].childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[2].childNodes[0], 0);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p><text:span>A</text:span>" +
            "<text:span text:style-name='auto0'>B</text:span>" +
            "<text:span text:style-name='auto0'>C</text:span>" +
            "<text:span>D</text:span></text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");
    }
    function apply_ContainerInsertion_SurroundedBySpans_StartsAfterText() {
        t.doc = createDocument("<text:p><text:span>A</text:span>BC<text:span>D</text:span></text:p>");
        t.range.setStart(t.doc.childNodes[0].childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[2].childNodes[0], 0);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p><text:span>A</text:span>" +
            "<text:span text:style-name='auto0'>BC</text:span>" +
            "<text:span>D</text:span></text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");
    }
    function apply_ContainerInsertion_NestedSpan() {
        t.doc = createDocument("<text:p>A<text:span>B<text:span/>C</text:span>D</text:p>");
        t.range.setStart(t.doc, 1);
        t.range.setEnd(t.doc, 2);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p>A<text:span text:style-name='auto0'>B<text:span/>C</text:span>D</text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");
    }

    function apply_StyleDetection_ParagraphAlreadyStyled() {
        t.doc = createDocument("<text:p text:style-name='PBold'>ABCD</text:p>");
        t.range.setStart(t.doc.childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[0], 3);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p text:style-name='PBold'>ABCD</text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");
    }
    function apply_StyleDetection_SpanAlreadyStyled() {
        t.doc = createDocument("<text:p><text:span text:style-name='SBold'>ABCD</text:span></text:p>");
        t.range.setStart(t.doc.childNodes[0].childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[0].childNodes[0], 3);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p><text:span text:style-name='SBold'>ABCD</text:span></text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");
    }
    function apply_StyleDetection_SpanAlreadyAutoStyled() {
        t.doc = createDocument("<text:p><text:span text:style-name='ABold'>ABCD</text:span></text:p>");
        t.range.setStart(t.doc.childNodes[0].childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[0].childNodes[0], 3);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p><text:span text:style-name='ABold'>ABCD</text:span></text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");
    }
    function apply_StyleDetection_PartialSpanStyled() {
        t.doc = createDocument("<text:p>AB<text:span text:style-name='ABold'>CD</text:span></text:p>");
        t.range.setStart(t.doc.childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[1].childNodes[0], 1);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p>A<text:span text:style-name='auto0'>B</text:span><text:span text:style-name='ABold'>CD</text:span></text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");
    }
    function apply_CommonStyle_LinksParentStyle() {
        t.doc = createDocument("<text:p>AB<text:span text:style-name='SUnderline'>CD</text:span></text:p>");
        t.range.setStart(t.doc.childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[1].childNodes[0], 1);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        t.autoStyles = simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p>A<text:span text:style-name='auto0'>B</text:span>" +
            "<text:span text:style-name='auto1'>C</text:span><text:span text:style-name='SUnderline'>D</text:span></text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");

        r.shouldBe(t, "t.autoStyles.length", "2");
        t.autoStyle = t.formatting.getStyleAttributes(t.formatting.getStyleElement(t.autoStyles[1], "text"));
        t.expectedAutoStyle = {
            'style:name': 'auto-893758051_1',
            'style:parent-style-name': 'SUnderline',
            'style:family': 'text',
            'scope': 'document-content',
            'style:text-properties': {'fo:font-weight': 'bold'}
        };
        r.shouldBe(t, "t.autoStyle", "t.expectedAutoStyle");
    }
    function apply_AutoStyle_ClonesProperties() {
        t.doc = createDocument("<text:p>AB<text:span text:style-name='AUnderline'>CD</text:span></text:p>");
        t.range.setStart(t.doc.childNodes[0], 1);
        t.range.setEnd(t.doc.childNodes[1].childNodes[0], 1);

        applyStyle(t.range, {"style:text-properties": {"fo:font-weight": "bold"}});

        t.autoStyles = simplifyAutoStyleNames(t.doc);
        t.expected = parseXML("<text:p>A<text:span text:style-name='auto0'>B</text:span>" +
            "<text:span text:style-name='auto1'>C</text:span><text:span text:style-name='AUnderline'>D</text:span></text:p>");
        r.shouldBe(t, "t.doc", "t.expected.firstChild");

        r.shouldBe(t, "t.autoStyles.length", "2");
        t.autoStyle = t.formatting.getStyleAttributes(t.formatting.getStyleElement(t.autoStyles[1], "text"));
        t.expectedAutoStyle = {
            'style:name': 'auto-893758051_1',
            'style:family': 'text',
            'scope': 'document-content',
            'style:text-properties': {'fo:font-weight': 'bold', 'style:text-underline-style': 'solid'}
        };
        r.shouldBe(t, "t.autoStyle", "t.expectedAutoStyle");
    }
    this.tests = function () {
        return r.name([
            apply_ContainerInsertion_SimpleTextRange,
            apply_ContainerInsertion_SimpleTextRange_EndsAtNodeBeginning,
            apply_ContainerInsertion_TextBracketingLink,
            apply_ContainerInsertion_SimpleSpan,
            apply_ContainerInsertion_SimpleSpans,
            apply_ContainerInsertion_SpanBracketingLink,
            apply_ContainerInsertion_SpanContainsMixedContent,
            apply_ContainerInsertion_SurroundedBySpans_EndsAfterText,
            apply_ContainerInsertion_SurroundedBySpans_BeforeText,
            apply_ContainerInsertion_SurroundedBySpans_StartsAfterText,
            apply_ContainerInsertion_NestedSpan,

            apply_StyleDetection_ParagraphAlreadyStyled,
            apply_StyleDetection_SpanAlreadyStyled,
            apply_StyleDetection_SpanAlreadyAutoStyled,
            apply_StyleDetection_PartialSpanStyled,

            apply_CommonStyle_LinksParentStyle,
            apply_AutoStyle_ClonesProperties
        ]);
    };
    this.asyncTests = function () {
        return [];
    };
};
odf.TextStyleApplicatorTests.prototype.description = function () {
    "use strict";
    return "Test the TextStyleApplicator class.";
};
(function () {
    "use strict";
    return odf.TextStyleApplicatorTests;
}());
