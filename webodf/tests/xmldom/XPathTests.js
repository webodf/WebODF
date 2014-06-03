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

/*global runtime, core, xmldom, odf, XMLSerializer*/

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
xmldom.XPathTests = function XPathTests(runner) {
    "use strict";
    var r = runner,
        t;

    function setupDoc() {
        var stylens = odf.Namespaces.stylens,
            svgns = odf.Namespaces.svgns,
            drawns = odf.Namespaces.drawns,
            presentationns = odf.Namespaces.presentationns,
            textns = odf.Namespaces.textns,
            doc = runtime.getDOMImplementation().createDocument("", "a", null),
            d = doc.documentElement,
            fontFace = doc.createElementNS(stylens, "font-face"),
            fontFaceSrc = doc.createElementNS(svgns, "font-face-src"),
            drawFrame = doc.createElementNS(drawns, "frame"),
            p = doc.createElementNS(textns, "p");
        d.appendChild(p);
        d.appendChild(fontFace);
        fontFace = doc.createElementNS(stylens, "font-face");
        fontFace.appendChild(fontFaceSrc);
        fontFaceSrc.setAttributeNS(textns, "anchor-type", "paragraph");
        d.appendChild(fontFace);
        d.appendChild(drawFrame);
        drawFrame = doc.createElementNS(drawns, "frame");
        drawFrame.setAttributeNS(presentationns, "class", "title");
        d.appendChild(drawFrame);

        t = { doc: doc, fontFace: fontFace, drawFrame: drawFrame };
    }
    function test1() {
        setupDoc();
        var xpath = xmldom.XPath,
            xpaths = {
                "style:font-face[svg:font-face-src]": "t.fontFace",
                ".//*[*[@text:anchor-type='paragraph']]": "t.fontFace",
                "./draw:frame[@presentation:class='title']": "t.drawFrame"
            },
            x;
        for (x in xpaths) {
            if (xpaths.hasOwnProperty(x)) {
                t.result = xpath.getODFElementsWithXPath(t.doc.documentElement,
                        x, odf.Namespaces.lookupNamespaceURI);
                r.shouldBe(t, "t.result.length", "1");
                r.shouldBe(t, "t.result[0]", xpaths[x]);
            }
        }
    }
    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    this.tests = function () {
        return r.name([test1]);
    };
    this.asyncTests = function () {
        return [];
    };
};
xmldom.XPathTests.prototype.description = function () {
    "use strict";
    return "Test the XPath class.";
};
(function () {
    "use strict";
    return xmldom.XPathTests;
}());
