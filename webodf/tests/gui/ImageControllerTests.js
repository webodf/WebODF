/**
 * Copyright (C) 2015 KO GmbH <copyright@kogmbh.com>
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

/*global runtime, core, gui, odf, ops, Node, NodeFilter, xmldom*/

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
gui.ImageControllerTests = function ImageControllerTests(runner) {
    "use strict";
    var r = runner,
        t,
        testarea,
        officens = odf.Namespaces.officens,
        inputMemberId = "Joe";

    /**
     * Trying to avoid having to load a complete document for these tests. Mocking ODF
     * canvas allows some simplification in the testing setup
     * @param {Element} node
     * @extends {odf.OdfCanvas} Well.... we don't really, but please shut your face closure compiler :)
     * @constructor
     */
    /*jslint emptyblock:true*/
    function MockOdfCanvas(node) {
        var self = this;
        this.odfContainer = function () { return self; };
        this.getContentElement = function () { return node.getElementsByTagNameNS(officens, 'text')[0]; };
        this.getElement = function () { return node; };
        this.rootElement = node;
        this.rootElement.body = node;
        this.rootElement.styles = node;
        this.rootElement.automaticStyles = node;
        this.refreshSize = function() { };
        this.rerenderAnnotations = function() { };
        this.getFormatting = function () { return new odf.Formatting(); };
        this.setBlob = function () {};
        this.refreshCSS = function () {};
        this.addCssForFrameWithImage = function () {};
    }
    /*jslint emptyblock:false*/

    /**
     * @extends {odf.ObjectNameGenerator}
     * @constructor
     */
    function MockObjectNameGenerator() {
        this.generateImageName = function () { return 'someImage'; };
        this.generateStyleName = function () { return 'someStyle'; };
        this.generateFrameName = function () { return 'someFrame'; };
    }

    /**
     * @param {!ops.OdtDocument} odtDocument
     * @extends {ops.Session} Don't mind me... I'm just lying to closure compiler again!
     * @constructor
     */
    function MockSession(odtDocument) {
        var self = this;
        this.operations = [];

        this.getOdtDocument = function() {
            return odtDocument;
        };

        this.enqueue = function(ops) {
            self.operations.push.apply(self.operations, ops);
            ops.forEach(function(op) { op.execute(odtDocument); });
        };

        this.reset = function() {
            self.operations.length = 0;
        };
    }

    /**
     * Create a new ODT document with the specified text body
     * @param {!string} xml
     * @return {!Element} Root document node
     */
    function createOdtDocument(xml) {
        var domDocument = testarea.ownerDocument,
            doc,
            node,
            mockCanvas;

        doc = core.UnitTest.createOdtDocument(
            "<office:text>" + xml + "</office:text>",
            odf.Namespaces.namespaceMap);
        node = /**@type{!Element}*/(domDocument.importNode(doc.documentElement, true));
        testarea.appendChild(node);

        mockCanvas = new MockOdfCanvas(node);
        t.odtDocument = new ops.OdtDocument(mockCanvas);
        t.session = new MockSession(t.odtDocument);
        t.sessionConstraints = new gui.SessionConstraints();
        t.sessionContext = new gui.SessionContext(t.session, inputMemberId);
        t.imageController = new gui.ImageController(
            t.session, t.sessionConstraints, t.sessionContext,
            inputMemberId, new MockObjectNameGenerator());
        t.cursor = new ops.OdtCursor(inputMemberId, t.odtDocument);
        t.odtDocument.addCursor(t.cursor);

        return node;
    }

    /**
     * Return a serialized string of the document content, excluding the wrapping <office:text>
     * tags and all non-odf elements.
     * @return {!string}
     */
    function serializeTextBodyContent() {
        var nsmap = odf.Namespaces.namespaceMap,
            serializer = new xmldom.LSSerializer(),
            filter = new odf.OdfNodeFilter(),
            result;

        serializer.filter = filter;
        result = serializer.writeToString(t.odtDocument.getRootNode(), nsmap);
        result = result.replace(/<[\/]{0,1}office:text>/g, "");
        return result;
    }

    this.setUp = function () {
        testarea = core.UnitTest.provideTestAreaDiv();
        t = { doc: testarea.ownerDocument };
    };
    this.tearDown = function () {
        core.UnitTest.cleanupTestAreaDiv();
        t = {};
    };

    function insertImage_PxToCm() {
        createOdtDocument('<text:p></text:p>');

        t.imageController.insertImage('image/png', 'suchcontent', 96, 192);

        t.actualDoc = serializeTextBodyContent();
        t.expectedDoc =
        '<text:p>' +
            '<draw:frame draw:style-name="someStyle" draw:name="someFrame" text:anchor-type="as-char" svg:width="2.54cm" svg:height="5.08cm">' +
                '<draw:image xlink:href="Pictures/someImage.png" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"></draw:image>' +
            '</draw:frame>' +
        '</text:p>';
        r.shouldBe(t, 't.actualDoc', 't.expectedDoc');
    }

    this.tests = function () {
        return r.name([
            insertImage_PxToCm
        ]);
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
gui.ImageControllerTests.prototype.description = function () {
    "use strict";
    return "Test the ImageController class.";
};
