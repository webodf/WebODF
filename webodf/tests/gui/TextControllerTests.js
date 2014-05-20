/**
 * Copyright (C) 2014 KO GmbH <copyright@kogmbh.com>
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
/*global runtime, core, gui, odf, ops, Node, NodeFilter, xmldom*/
/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
gui.TextControllerTests = function TextControllerTests(runner) {
    "use strict";
    var r = runner,
        t,
        testarea,
        officens = odf.Namespaces.officens,
        utils = new core.Utils(),
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
        this.refreshSize = function() { };
        this.rerenderAnnotations = function() { };
    }
    /*jslint emptyblock:false*/

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

    /*jslint unparam:true*/
    /**
     * @param {!number} position
     * @param {!number} length
     * @param {!boolean} useCachedStyle
     * @return {null}
     */
    function directStyleOp(position, length, useCachedStyle) {
        return null;
    }

    /**
     * @param {!number} position
     * @return {!Array.<!ops.Operation>}
     */
    function paragraphStyleOps(position) {
        return [];
    }
    /*jslint unparam:false*/

    /**
     * Create a new ODT document with the specified text body
     * @param {!string} xml
     * @return {!Element} Root document node
     */
    function createOdtDocument(xml) {
        var domDocument = testarea.ownerDocument,
            testns = "urn:webodf:textcontrollertest",
            namespaceMap = utils.mergeObjects(odf.Namespaces.namespaceMap, {"test": testns}),
            doc,
            node,
            range;

        xml = xml.replace("[", "<test:start/>").replace("]", "<test:end/>");
        doc = core.UnitTest.createOdtDocument("<office:text>" + xml + "</office:text>", namespaceMap);
        node = /**@type{!Element}*/(domDocument.importNode(doc.documentElement, true));
        testarea.appendChild(node);

        t.odtDocument = new ops.OdtDocument(new MockOdfCanvas(node));
        t.session = new MockSession(t.odtDocument);
        t.textController = new gui.TextController(t.session, inputMemberId, directStyleOp, paragraphStyleOps);
        t.cursor = new ops.OdtCursor(inputMemberId, t.odtDocument);
        t.odtDocument.addCursor(t.cursor);

        if (node.getElementsByTagNameNS(testns, "start")[0]) {
            range = node.ownerDocument.createRange();
            range.setStartAfter(node.getElementsByTagNameNS(testns, "start")[0]);
            range.setEndAfter(node.getElementsByTagNameNS(testns, "end")[0]);
            t.cursor.setSelectedRange(range, true);
        }
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

    function removeCurrentSelection_NothingSelected_DoesNothing() {
        createOdtDocument('<text:p text:style-name="A">[]ABC</text:p>');

        t.textController.removeCurrentSelection();

        t.actualDoc = serializeTextBodyContent();
        t.expectedDoc = '<text:p text:style-name="A">ABC</text:p>';
        r.shouldBe(t, "t.actualDoc", "t.expectedDoc");
    }

    function removeCurrentSelection_FirstParagraphEmpty_ReplacesWith2ndParagraphStyle() {
        createOdtDocument('<text:p text:style-name="A">[</text:p><text:p text:style-name="B">A]BC</text:p>');

        t.textController.removeCurrentSelection();

        t.actualDoc = serializeTextBodyContent();
        t.expectedDoc = '<text:p text:style-name="B">BC</text:p>';
        r.shouldBe(t, "t.actualDoc", "t.expectedDoc");
    }

    function removeCurrentSelection_FirstParagraphEmpty_ClearsAsPer2ndParagraphStyle() {
        createOdtDocument('<text:p text:style-name="A">[</text:p><text:p>A]BC</text:p>');

        t.textController.removeCurrentSelection();

        t.actualDoc = serializeTextBodyContent();
        t.expectedDoc = '<text:p>BC</text:p>';
        r.shouldBe(t, "t.actualDoc", "t.expectedDoc");
    }

    function removeCurrentSelection_FirstParagraphNonEmpty_PreservesParagraphStyle() {
        createOdtDocument('<text:p text:style-name="A">A[</text:p><text:p>B]C</text:p>');

        t.textController.removeCurrentSelection();

        t.actualDoc = serializeTextBodyContent();
        t.expectedDoc = '<text:p text:style-name="A">AC</text:p>';
        r.shouldBe(t, "t.actualDoc", "t.expectedDoc");
    }

    function removeCurrentSelection_BothParagraphsEmpty_ReplacesWith2ndParagraphStyle() {
        createOdtDocument('<text:p text:style-name="A">[</text:p><text:p text:style-name="B">]</text:p>');

        t.textController.removeCurrentSelection();

        t.actualDoc = serializeTextBodyContent();
        t.expectedDoc = '<text:p text:style-name="B"></text:p>';
        r.shouldBe(t, "t.actualDoc", "t.expectedDoc");
    }

    this.tests = function () {
        return r.name([
            removeCurrentSelection_NothingSelected_DoesNothing,
            removeCurrentSelection_FirstParagraphEmpty_ReplacesWith2ndParagraphStyle,
            removeCurrentSelection_FirstParagraphEmpty_ClearsAsPer2ndParagraphStyle,
            removeCurrentSelection_FirstParagraphNonEmpty_PreservesParagraphStyle,
            removeCurrentSelection_BothParagraphsEmpty_ReplacesWith2ndParagraphStyle
        ]);
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
gui.TextControllerTests.prototype.description = function () {
    "use strict";
    return "Test the TextController class.";
};
(function () {
    "use strict";
    return gui.TextControllerTests;
}());
