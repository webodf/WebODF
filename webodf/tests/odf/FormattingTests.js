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

/*global runtime, core, odf, NodeFilter*/

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
odf.FormattingTests = function FormattingTests(runner) {
    "use strict";
    var self = this,
        t,
        r = runner,
        namespace = odf.Namespaces.namespaceMap,
        cssUnits = new core.CSSUnits();

    this.setUp = function () {
        t = {
            formatting : new odf.Formatting(),
            body : core.UnitTest.provideTestAreaDiv(),
            ns : namespace
        };
    };
    this.tearDown = function () {
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };
    /**
     * @param {!string} dom
     * @param {string=} pageLayoutStyle
     * @return {!Node}
     */
    function createDocument(dom, pageLayoutStyle) {
        var xml, container, fragment;

        xml = "<office:styles>";
        xml += "    <style:style style:name='P1' style:display-name='P1 Display' style:family='paragraph' style:master-page-name='Index'>";
        xml += "        <style:text-properties fo:font-name='P1 Font' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='PEmpty' style:display-name='PEmpty Display' style:family='paragraph' style:master-page-name='Index'>";
        xml += "    </style:style>";
        xml += "    <style:style style:name='PMissingDefinition' style:display-name='Missing Def' style:family='paragraph' style:master-page-name='Missing'>";
        xml += "        <style:text-properties fo:font-name='PMissingDefinition Font' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='P2' style:display-name='P1 Display' style:family='paragraph'>";
        xml += "        <style:text-properties fo:font-name='P2 Font' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='S1' style:display-name='S1 Display' style:family='text'>";
        xml += "        <style:text-properties fo:font-name='S1 Font' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='S2' style:display-name='S2 Display' style:family='text'>";
        xml += "        <style:text-properties fo:font-weight='bold'/>";
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
        xml += "</office:styles>";

        xml += "<office:automatic-styles>";
        xml += pageLayoutStyle;
        xml += "    <text:list-style style:name='L1' style:display-name='L1 Display'>";
        xml += "        <text:list-level-style-bullet text:level='1' text:bullet-char='*' />";
        xml += "        <text:list-level-style-bullet text:level='2' text:bullet-char='@' />";
        xml += "    </text:list-style>";
        xml += "    <text:list-style style:name='L2' style:display-name='L2 Display'>";
        xml += "        <text:list-level-style-number text:level='1' text:num-format='1' />";
        xml += "    </text:list-style>";
        xml += "    <style:style style:name='autoWithInherit' style:parent-style-name='S1' style:family='text'>";
        xml += "        <style:text-properties fo:font-weight='bold'/>";
        xml += "    </style:style>";
        xml += "    <style:style style:name='autoWithoutInherit' style:family='text'>";
        xml += "        <style:text-properties fo:font-weight='bold'/>";
        xml += "    </style:style>";
        xml += "</office:automatic-styles>";
        xml += "<office:text>" + dom + "</office:text>";

        xml += "<office:master-styles>";
        xml += "    <style:master-page style:name='Standard' style:page-layout-name='pm1'/>";
        xml += "    <style:master-page style:name='Index' style:page-layout-name='pm2'/>";
        xml += "</office:master-styles>";

        fragment = core.UnitTest.createOdtDocument(xml, namespace);
        t.body.appendChild(fragment.documentElement);
        container = { rootElement : {
            styles : t.body.firstChild.childNodes[0],
            automaticStyles: t.body.firstChild.childNodes[1],
            masterStyles : t.body.firstChild.childNodes[3]
        }};
        t.formatting.setOdfContainer(container);
        t.range = t.body.ownerDocument.createRange();
        return t.body.firstChild.childNodes[2].firstChild;
    }

    /**
     * Return an array containing all attribute names defined for the node
     * @param {!Node} node
     * @return {!Array.<!string>}
     */
    function getAttributeNames(node) {
        return Array.prototype.slice.call(node.attributes).map(function(attr) { return attr.name; });
    }

    /**
     * Get all text nodes in the test div
     * @return {!Array.<!Node>}
     */
    function getTextNodes() {
        var document = t.body.ownerDocument,
            walker = document.createTreeWalker(t.body, NodeFilter.SHOW_TEXT, null, false),
            nodes = [],
            n = walker.nextNode();

        while (n) {
            nodes.push(n);
            n = walker.nextNode();
        }
        return nodes;
    }

    function getStyleElement_ParagraphStyle() {
        createDocument("<text:p/>");

        t.element = t.formatting.getStyleElement("P1", "paragraph");

        r.shouldBeNonNull(t, "t.element");
        r.shouldBe(t, "t.element.getAttributeNS(t.ns.style, 'name')", "'P1'");
    }
    function getStyleElement_TextStyle() {
        createDocument("<text:p/>");

        t.element = t.formatting.getStyleElement("S1", "text");

        r.shouldBeNonNull(t, "t.element");
        r.shouldBe(t, "t.element.getAttributeNS(t.ns.style, 'name')", "'S1'");
    }
    function getStyleElement_ListStyle() {
        createDocument("<text:p/>");

        t.element = t.formatting.getStyleElement("L2", "list-style");

        r.shouldBeNonNull(t, "t.element");
        r.shouldBe(t, "t.element.getAttributeNS(t.ns.style, 'name')", "'L2'");
    }
    function getStyleElement_MismatchedFamily_ReturnsNull() {
        createDocument("<text:p/>");

        t.element = t.formatting.getStyleElement("L2", "paragraph");

        r.shouldBeNull(t, "t.element");
    }
    function updateStyle_UpdatesStyleElement() {
        createDocument("<text:p/>");
        t.element = t.formatting.getStyleElement("P1", "paragraph");

        t.formatting.updateStyle(t.element, {
            "style:family" : "frog",
            "style:paragraph-properties": { "fo:background-color" : "red" },
            "style:text-properties": { "fo:font-size" : "12pt" }
        });

        r.shouldBe(t, "t.element.getAttributeNS(t.ns.style, 'family')", "'frog'");

        t.paragraphProperties = t.element.getElementsByTagNameNS(t.ns.style, 'paragraph-properties')[0];
        t.textProperties = t.element.getElementsByTagNameNS(t.ns.style, 'text-properties')[0];
        r.shouldBe(t, "t.paragraphProperties.getAttributeNS(t.ns.fo, 'background-color')", "'red'");
        r.shouldBe(t, "t.textProperties.getAttributeNS(t.ns.fo, 'font-size')", "'12pt'");
        r.shouldBe(t, "t.textProperties.getAttributeNS(t.ns.fo, 'font-name')", "'P1 Font'");
    }
    function updateStyle_UpdatesStyleElement_EmptyObjectOnSource() {
        createDocument("<text:p/>");
        t.element = t.formatting.getStyleElement("PEmpty", "paragraph");

        t.formatting.updateStyle(t.element, {
            "style:family" : "frog",
            "style:paragraph-properties": { "fo:background-color" : "red" },
            "style:text-properties": {}
        });

        t.attributeNames = getAttributeNames(t.element);
        r.shouldBe(t, "t.attributeNames", "['style:name', 'style:display-name', 'style:family', 'style:master-page-name']");
        r.shouldBe(t, "t.element.getAttributeNS(t.ns.style, 'family')", "'frog'");

        t.paragraphProperties = t.element.getElementsByTagNameNS(t.ns.style, 'paragraph-properties')[0];
        t.textProperties = t.element.getElementsByTagNameNS(t.ns.style, 'text-properties')[0];
        r.shouldBe(t, "t.paragraphProperties.getAttributeNS(t.ns.fo, 'background-color')", "'red'");
        r.shouldBe(t, "t.textProperties", "undefined");
    }
    function updateStyle_IgnoresUnknownElementPrefixes() {
        var i;
        createDocument("<text:p/>");
        t.element = t.formatting.getStyleElement("P1", "paragraph");

        t.formatting.updateStyle(t.element, {
            "custom:item" : "custom-value",
            "style:family" : "frog"
        });

        r.shouldBe(t, "t.element.getAttributeNS(t.ns.style, 'family')", "'frog'");
        for (i = 0; i < t.element.attributes.length; i += 1) {
            t.attribute = t.element.attributes[i];
            r.shouldBe(t, "t.attribute.value === 'custom-value'", "false");
        }
    }
    function createDerivedStyleObject_Style() {
        createDocument("<text:p/>");

        t.newStyle = t.formatting.createDerivedStyleObject("P1", "paragraph", {"derived" : true});

        r.shouldBe(t, "t.newStyle['style:parent-style-name']", "'P1'");
        r.shouldBe(t, "t.newStyle['style:family']", "'paragraph'");
        r.shouldBe(t, "t.newStyle['derived']", "true");
    }
    function createDerivedStyleObject_AutomaticStyle_Inherited() {
        createDocument("<text:p/>");

        t.newStyle = t.formatting.createDerivedStyleObject("autoWithInherit", "text", {"derived" : true});

        r.shouldBe(t, "t.newStyle['style:parent-style-name']", "'S1'");
        r.shouldBe(t, "t.newStyle['style:family']", "'text'");
        r.shouldBe(t, "t.newStyle['style:text-properties']", "({ 'fo:font-weight' : 'bold' })");
    }
    function createDerivedStyleObject_AutomaticStyle_NonInherited() {
        createDocument("<text:p/>");

        t.newStyle = t.formatting.createDerivedStyleObject("autoWithoutInherit", "text", {"derived" : true});

        r.shouldBe(t, "t.newStyle.hasOwnProperty('style:parent-style-name')", "false");
        r.shouldBe(t, "t.newStyle['style:family']", "'text'");
        r.shouldBe(t, "t.newStyle['style:text-properties']", "({ 'fo:font-weight' : 'bold' })");
    }
    function getStyleAttributes_ReturnsAllStyleAttributes() {
        createDocument("<text:p/>");
        t.styleElement = t.formatting.getStyleElement('P1', 'paragraph');

        t.styleAttributes = t.formatting.getStyleAttributes(t.styleElement);

        r.shouldBe(t, "t.styleAttributes['style:name']", "'P1'");
        r.shouldBe(t, "t.styleAttributes['style:display-name']", "'P1 Display'");
        r.shouldBe(t, "t.styleAttributes['style:family']", "'paragraph'");
        r.shouldBe(t, "t.styleAttributes['style:text-properties']", "({'fo:font-name':'P1 Font'})");
    }
    function getContentSize_PageSizePaddingAndMarginSpecified() {
        createDocument("<text:p style:name='P1'/>", "<style:page-layout style:name='pm2' scope='document-styles'><style:page-layout-properties fo:page-width='10px' fo:page-height='20px' fo:margin-top='1px' fo:margin-bottom='0px' fo:margin-left='1.5px' fo:margin-right='1.5px' fo:padding='3px' /></style:page-layout>");
        t.contentSize = t.formatting.getContentSize("P1", "paragraph");
        r.shouldBe(t, "t.contentSize", "({'width':1,'height':13})");
    }
    function getContentSize_PageSizePaddingAndMarginNotSpecified() {
        var heightPx = cssUnits.convertMeasure("21.001cm", "px"),
            widthPx = cssUnits.convertMeasure("29.7cm", "px"),
            marginPx = cssUnits.convertMeasure("2cm", "px");

        createDocument("<text:p style:name='P2'/>", "<style:page-layout style:name='pm1' scope='document-styles'><style:page-layout-properties style:print-orientation='landscape' /></style:page-layout>");
        t.contentSize = t.formatting.getContentSize("P2", "paragraph");
        t.expectedSize = {
            height: heightPx - marginPx - marginPx,
            width: widthPx - marginPx - marginPx
        };
        r.shouldBe(t, "t.contentSize", "t.expectedSize");
    }
    function getContentSize_MissingPageDefinition_DocumentHasStandard() {
        var heightPx = cssUnits.convertMeasure("21.001cm", "px"),
            widthPx = cssUnits.convertMeasure("29.7cm", "px"),
            marginPx = cssUnits.convertMeasure("2cm", "px");

        createDocument("<text:p style:name='PMissingDefinition'/>", "<style:page-layout style:name='pm1' scope='document-styles'><style:page-layout-properties style:print-orientation='landscape' /></style:page-layout>");
        t.contentSize = t.formatting.getContentSize("PMissingDefinition", "paragraph");
        t.expectedSize = {
            height: heightPx - marginPx - marginPx,
            width: widthPx - marginPx - marginPx
        };
        r.shouldBe(t, "t.contentSize", "t.expectedSize");
    }
    function getContentSize_NoMasterPageDefined() {
        var doc = createDocument("<text:p style:name='P2'/>"),
            pageDefinitions = doc.getElementsByTagNameNS(namespace.style, "master-page"),
            heightPx = cssUnits.convertMeasure("29.7cm", "px"),
            widthPx = cssUnits.convertMeasure("21.001cm", "px"),
            marginPx = cssUnits.convertMeasure("2cm", "px");

        while (pageDefinitions[0]) {
            pageDefinitions[0].parentNode.removeChild(pageDefinitions[0]);
        }
        t.contentSize = t.formatting.getContentSize("P2", "paragraph");

        t.expectedSize = {
            height: heightPx - marginPx - marginPx,
            width: widthPx - marginPx - marginPx
        };
        r.shouldBe(t, "t.contentSize", "t.expectedSize");
    }

    function getAppliedStyles_SimpleHierarchy() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='S1'>A</text:span></text:p>");

        t.appliedStyles = t.formatting.getAppliedStyles(getTextNodes());

        r.shouldBe(t, "t.appliedStyles.length", "1");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "2");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'S1', displayName: 'S1 Display', family: 'text', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].styleProperties['style:text-properties']", "({'fo:font-name': 'S1 Font'})");
    }
    function getAppliedStyles_NestedHierarchy() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='S1'><text:span text:style-name='SBold'>A</text:span></text:span></text:p>");

        t.appliedStyles = t.formatting.getAppliedStyles(getTextNodes());

        r.shouldBe(t, "t.appliedStyles.length", "1");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "3");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'SBold', displayName: 'SBold Display', family: 'text', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'S1', displayName: 'S1 Display', family: 'text', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].styleProperties['style:text-properties']", "({'fo:font-name': 'S1 Font', 'fo:font-weight': 'bold'})");
    }
    function getAppliedStyles_CompleteContent_OnlyReportsUniqueStyles() {
        t.doc = createDocument("<text:p text:style-name='P1'>A<text:span text:style-name='S1'>B</text:span>C</text:p>");

        t.appliedStyles = t.formatting.getAppliedStyles(getTextNodes());

        r.shouldBe(t, "t.appliedStyles.length", "2");

        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "1");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].styleProperties['style:text-properties']", "({'fo:font-name': 'P1 Font'})");

        t.appliedStyles.shift();

        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "2");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'S1', displayName: 'S1 Display', family: 'text', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].styleProperties['style:text-properties']", "({'fo:font-name': 'S1 Font'})");
    }
    function getAppliedStyles_EmptyArray() {
        t.appliedStyles = t.formatting.getAppliedStyles([]);

        r.shouldBe(t, "t.appliedStyles.length", "0");
    }
    function getAppliedStyles_StartsAndEnds_InSameTextNode() {
        t.doc = createDocument("<text:p text:style-name='P1'><text:span text:style-name='S1'></text:span>ABC</text:p>");

        t.appliedStyles = t.formatting.getAppliedStyles(getTextNodes());

        r.shouldBe(t, "t.appliedStyles.length", "1");

        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "1");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].styleProperties['style:text-properties']", "({'fo:font-name': 'P1 Font'})");
    }
    function getAppliedStyles_StartsAndEnds_InDifferentTextNodes() {
        t.doc = createDocument("<text:p text:style-name='P1'>A<text:span text:style-name='S1'>B</text:span>C</text:p>");

        t.appliedStyles = t.formatting.getAppliedStyles(getTextNodes());

        r.shouldBe(t, "t.appliedStyles.length", "2");

        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "1");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].styleProperties['style:text-properties']", "({'fo:font-name': 'P1 Font'})");

        t.appliedStyles.shift();

        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "2");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'S1', displayName: 'S1 Display', family: 'text', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].styleProperties['style:text-properties']", "({'fo:font-name': 'S1 Font'})");
    }
    function getAppliedStyles_SimpleList() {
        var xml = "<text:list text:style-name='L2'><text:list-item>" +
            "<text:p text:style-name='P1'><text:span text:style-name='S1'>A</text:span></text:p>" +
            "</text:list-item></text:list>";
        t.doc = createDocument(xml);

        t.appliedStyles = t.formatting.getAppliedStyles(getTextNodes());

        r.shouldBe(t, "t.appliedStyles.length", "1");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "3");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'S1', displayName: 'S1 Display', family: 'text', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'L2', displayName: 'L2 Display', family: 'list-style', isCommonStyle: false})");
        r.shouldBe(t, "t.appliedStyles[0].styleProperties['style:text-properties']", "({'fo:font-name': 'S1 Font'})");
    }
    function getAppliedStyles_NestedList() {
        var xml = "<text:list text:style-name='L1'><text:list-item>" +
            "<text:list text:style-name='L2'><text:list-item>" +
            "<text:p text:style-name='P1'><text:span text:style-name='S1'>A</text:span></text:p>" +
            "</text:list-item></text:list>" +
            "</text:list-item></text:list>";
        t.doc = createDocument(xml);

        t.appliedStyles = t.formatting.getAppliedStyles(getTextNodes());

        r.shouldBe(t, "t.appliedStyles.length", "1");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "4");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'S1', displayName: 'S1 Display', family: 'text', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph', isCommonStyle: true})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'L2', displayName: 'L2 Display', family: 'list-style', isCommonStyle: false})");
        r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'L1', displayName: 'L1 Display', family: 'list-style', isCommonStyle: false})");
        r.shouldBe(t, "t.appliedStyles[0].styleProperties['style:text-properties']", "({'fo:font-name': 'S1 Font'})");
    }
    function getAppliedStyles_InvalidNodes() {
        var i, node,
            invalidNodes = [
                "draw:text-box",
                "svg:title",
                "dr3d:scene",
                "text:note-body",
                "text:ruby-text",
                "office:binary-data",
                "office:event-listeners",
                "editinfo"
            ];

        for (i = 0; i < invalidNodes.length; i += 1) {
            if (i > 0) {
                self.setUp();
            }

            node = "<" + invalidNodes[i] + "><text:span text:style-name='S1'>test</text:span></" + invalidNodes[i] + ">";
            t.doc = createDocument("<text:p text:style-name='P1'>" + node + "</text:p>");

            t.appliedStyles = t.formatting.getAppliedStyles(getTextNodes());

            r.shouldBe(t, "t.appliedStyles.length", "1");
            r.shouldBe(t, "t.appliedStyles[0].orderedStyles.length", "2");
            r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'S1', displayName: 'S1 Display', family: 'text', isCommonStyle: true})");
            r.shouldBe(t, "t.appliedStyles[0].orderedStyles.shift()", "({name: 'P1', displayName: 'P1 Display', family: 'paragraph', isCommonStyle: true})");

            if (i < invalidNodes.length - 1) {
                self.tearDown();
            }
        }
    }

    this.tests = function () {
        return r.name([
            getStyleElement_ParagraphStyle,
            getStyleElement_TextStyle,
            getStyleElement_ListStyle,
            getStyleElement_MismatchedFamily_ReturnsNull,

            updateStyle_UpdatesStyleElement,
            updateStyle_IgnoresUnknownElementPrefixes,
            updateStyle_UpdatesStyleElement_EmptyObjectOnSource,

            createDerivedStyleObject_Style,
            createDerivedStyleObject_AutomaticStyle_Inherited,
            createDerivedStyleObject_AutomaticStyle_NonInherited,

            getStyleAttributes_ReturnsAllStyleAttributes,

            getContentSize_PageSizePaddingAndMarginSpecified,
            getContentSize_PageSizePaddingAndMarginNotSpecified,
            getContentSize_MissingPageDefinition_DocumentHasStandard,
            getContentSize_NoMasterPageDefined,

            getAppliedStyles_SimpleHierarchy,
            getAppliedStyles_NestedHierarchy,
            getAppliedStyles_EmptyArray,
            getAppliedStyles_CompleteContent_OnlyReportsUniqueStyles,
            getAppliedStyles_StartsAndEnds_InSameTextNode,
            getAppliedStyles_StartsAndEnds_InDifferentTextNodes,
            getAppliedStyles_SimpleList,
            getAppliedStyles_NestedList,
            getAppliedStyles_InvalidNodes
        ]);
    };
    this.asyncTests = function () {
        return [];
    };
};
odf.FormattingTests.prototype.description = function () {
    "use strict";
    return "Test the Formatting class.";
};
