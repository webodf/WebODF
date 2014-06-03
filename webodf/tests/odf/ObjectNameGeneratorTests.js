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
odf.ObjectNameGeneratorTests = function ObjectNameGeneratorTests(runner) {
    "use strict";
    var t,
        r = runner,
        namespace = {
            "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
            "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
            "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
            "draw": "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
            "fo": "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
            "xlink": "http://www.w3.org/1999/xlink"
        };

    /**
     * Mocking OdfContainer allows some simplification in the testing setup
     * @param {!Node} styles
     * @param {!Node} automaticStyles
     * @param {!Node} body
     * @extends {odf.OdfContainer} Well.... we don't really, but please shut your face closure compiler :)
     * @constructor
     */
    function OdfContainerMock(styles, automaticStyles, body) {
        var root = styles.ownerDocument.createElementNS(
            namespace.office,
            "office:document"
        );
        root.styles = styles;
        root.automaticStyles = automaticStyles;
        root.body = body;
        this.rootElement = /**@type{!odf.ODFDocumentElement}}*/(root);
    }

    this.setUp = function () {
        t = {
            testArea : core.UnitTest.provideTestAreaDiv(),
            ns : namespace
        };

        var xml = "", containerMock;

        xml += "<office:styles>";
        xml += "    <style:style style:name='P1' style:family='paragraph'>";
        xml += "        <style:text-properties fo:font-weight='bold' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='P2' style:family='text'>";
        xml += "        <style:text-properties fo:font-weight='bold' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='auto105408_0' style:family='text'>";
        xml += "        <style:text-properties style:text-underline-style='solid' />";
        xml += "    </style:style>";
        xml += "</office:styles>";

        xml += "<office:automatic-styles>";
        xml += "    <style:style style:name='auto105408_1' style:family='text'>";
        xml += "        <style:text-properties fo:font-weight='bold' />";
        xml += "    </style:style>";
        xml += "    <style:style style:name='auto105408_2' style:family='text'>";
        xml += "        <style:text-properties style:text-underline-style='solid' />";
        xml += "    </style:style>";
        xml += "</office:automatic-styles>";

        xml += "<office:text>";
        xml += "    <text:p text:style-name='auto105408_0'>";
        xml += "        <draw:frame draw:name='fr_105408_0'><draw:image xlink:href='Pictures/1.105408_0.jpg'/></draw:frame>";
        xml += "        <draw:frame draw:name='fr105408_0'><draw:image xlink:href='Pictures/img105408_0.jpg'/></draw:frame>";
        xml += "        <draw:frame draw:name='fr105408_1'><draw:image xlink:href='Pictures/img105408_3.png'/></draw:frame>";
        xml += "    </text:p>";
        xml += "</office:text>";

        t.testArea.appendChild(core.UnitTest.createXmlDocument("office:document", xml, namespace).documentElement);

        containerMock = new OdfContainerMock(
            t.testArea.firstChild.childNodes[0],
            t.testArea.firstChild.childNodes[1],
            t.testArea.firstChild.childNodes[2]
        );

        t.generator = new odf.ObjectNameGenerator(containerMock, 'joe');
    };
    this.tearDown = function () {
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };
    function generateStyleName_ReturnsUniqueName() {
        t.result0 = t.generator.generateStyleName();
        t.result1 = t.generator.generateStyleName();
        t.result2 = t.generator.generateStyleName();

        r.shouldBe(t, "t.result0", "'auto105408_3'");
        r.shouldBe(t, "t.result1", "'auto105408_4'");
        r.shouldBe(t, "t.result2", "'auto105408_5'");
    }
    function generateFrameName_ReturnsUniqueName() {
        t.result0 = t.generator.generateFrameName();
        t.result1 = t.generator.generateFrameName();
        t.result2 = t.generator.generateFrameName();

        r.shouldBe(t, "t.result0", "'fr105408_2'");
        r.shouldBe(t, "t.result1", "'fr105408_3'");
        r.shouldBe(t, "t.result2", "'fr105408_4'");
    }
    function generateImageName_ReturnsUniqueName() {
        t.result0 = t.generator.generateImageName();
        t.result1 = t.generator.generateImageName();
        t.result2 = t.generator.generateImageName();

        r.shouldBe(t, "t.result0", "'img105408_1'");
        r.shouldBe(t, "t.result1", "'img105408_2'");
        r.shouldBe(t, "t.result2", "'img105408_4'");
    }
    this.tests = function () {
        return r.name([
            generateStyleName_ReturnsUniqueName,
            generateFrameName_ReturnsUniqueName,
            generateImageName_ReturnsUniqueName
        ]);
    };
    this.asyncTests = function () {
        return [];
    };
};
odf.ObjectNameGeneratorTests.prototype.description = function () {
    "use strict";
    return "Test the ObjectNameGenerator class.";
};
