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
gui.SelectionControllerTests = function SelectionControllerTests(runner) {
    "use strict";
    var r = runner,
        t,
        testarea,
        textns = odf.Namespaces.textns,
        officens = odf.Namespaces.officens,
        inputMemberId = "Joe";

    /**
     * Trying to avoid having to load a complete document for these tests. Mocking ODF
     * canvas allows some simplification in the testing setup
     * @param {Element} node
     * @extends {odf.OdfCanvas} Well.... we don't really, but please shut your face closure compiler :)
     * @constructor
     */
    function MockOdfCanvas(node) {
        var self = this;
        this.odfContainer = function () { return self; };
        this.getContentElement = function () { return node.getElementsByTagNameNS(odf.Namespaces.officens, 'text')[0]; };
        this.getElement = function () { return node; };
        this.rootElement = node;
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
            doc = core.UnitTest.createOdtDocument("<office:text>" + xml + "</office:text>", odf.Namespaces.namespaceMap),
            node = /**@type{!Element}*/(domDocument.importNode(doc.documentElement, true));

        testarea.appendChild(node);

        t.odtDocument = new ops.OdtDocument(new MockOdfCanvas(node));
        t.session = new MockSession(t.odtDocument);
        t.selectionController = new gui.SelectionController(t.session, inputMemberId);
        t.selectionToRange = t.selectionController.selectionToRange;
        t.rangeToSelection = t.selectionController.rangeToSelection;
        t.cursor = new ops.OdtCursor(inputMemberId, t.odtDocument);
        t.odtDocument.addCursor(t.cursor);
        return node;
    }

    /**
     * Gets the position of the local cursor in cursor steps
     * @return {!{position: !number, length: number}}
     */
    function getCursorPosition() {
        var selection = t.rangeToSelection(t.cursor.getSelectedRange(), t.cursor.hasForwardSelection());
        return t.odtDocument.convertDomToCursorRange(selection);
    }

    /**
     * Find and return an array of numbers indicating each move cursor operation's position as it
     * iterates over the document content.
     * @param {!string} docContent Odt content
     * @param {!number} direction if negative, iterate from right to left over the document instead of left to right
     * @return {!Array.<!number>} valid cursor positions within the specified doc content
     */
    function getMovementByWordsPositions(docContent, direction) {
        var bounds = [],
            loopGuard = new core.LoopWatchDog(100000, 100), // Don't care really how long this takes
            lastSpec,
            generatedOps = false;

        createOdtDocument(docContent);
        if(direction < 0) {
            t.selectionController.moveCursorToDocumentEnd();
        }
        t.session.reset();
        do {
            loopGuard.check();
            if(direction < 0) {
                t.selectionController.moveCursorBeforeWord();
            } else {
                t.selectionController.moveCursorPastWord();
            }
            generatedOps = t.session.operations.length > 0;
            if (generatedOps) {
                // Only ever expect a single operation to be queued here
                lastSpec = t.session.operations[0].spec();
                bounds.push(lastSpec.position);
                t.session.reset();
            }
        } while(generatedOps);

        return bounds;
    }

    function moveCursorPastWord_SimpleText() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the quick red fox</text:p>", 1);
        r.shouldBe(t, "t.movementPositions", "[4, 10, 14, 17]");
    }

    function moveCursorBeforeWord_SimpleText() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the quick red fox</text:p>", -1);
        r.shouldBe(t, "t.movementPositions", "[14, 10, 4, 0]");
    }

    function moveCursorPastWord_SimpleText_Punctuation() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the quick, re,d fox.</text:p>", 1);
        r.shouldBe(t, "t.movementPositions", "[4, 9, 11, 13, 14, 16, 19, 20]");
    }

    function moveCursorBeforeWord_SimpleText_Punctuation() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the quick, re,d fox.</text:p>", -1);
        r.shouldBe(t, "t.movementPositions", "[19, 16, 14, 13, 11, 9, 4, 0]");
    }

    function moveCursorPastWord_SimpleText_NonLatin() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the tes阿t rèd fox.</text:p>", 1);
        r.shouldBe(t, "t.movementPositions", "[4, 10, 14, 17, 18]");
    }

    function moveCursorBeforeWord_SimpleText_NonLatin() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the tes阿t rèd fox.</text:p>", -1);
        r.shouldBe(t, "t.movementPositions", "[17, 14, 10, 4, 0]");
    }

    function moveCursorPastWord_TextSplitBySpans() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the q<text:span>uick</text:span> red fox</text:p>", 1);
        r.shouldBe(t, "t.movementPositions", "[4, 10, 14, 17]");
    }

    function moveCursorBeforeWord_TextSplitBySpans() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the q<text:span>uick</text:span> red fox</text:p>", -1);
        r.shouldBe(t, "t.movementPositions", "[14, 10, 4, 0]");
    }

    function moveCursorPastWord_TextWithinSpan() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the <text:span>quick</text:span> <text:span>red.</text:span> fox</text:p>", 1);
        r.shouldBe(t, "t.movementPositions", "[4, 10, 13, 15, 18]");
    }

    function moveCursorBeforeWord_TextWithinSpan() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the <text:span>quick</text:span> <text:span>red.</text:span> fox</text:p>", -1);
        r.shouldBe(t, "t.movementPositions", "[15, 13, 10, 4, 0]");
    }

    function moveCursorPastWord_TextWithinSpan_2() {
        t.movementPositions = getMovementByWordsPositions("<text:p><text:span>the quick</text:span> red fox</text:p>", 1);
        r.shouldBe(t, "t.movementPositions", "[4, 10, 14, 17]");
    }

    function moveCursorBeforeWord_TextWithinSpan_2() {
        t.movementPositions = getMovementByWordsPositions("<text:p><text:span>the quick</text:span> red fox</text:p>", -1);
        r.shouldBe(t, "t.movementPositions", "[14, 10, 4, 0]");
    }

    function moveCursorPastWord_TextWithinSpan_3() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the <text:span>quick,</text:span> <text:span>re,</text:span>d fox.</text:p>", 1);
        r.shouldBe(t, "t.movementPositions", "[4, 9, 11, 13, 14, 16, 19, 20]");
    }

    function moveCursorBeforeWord_TextWithinSpan_3() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the <text:span>quick,</text:span> <text:span>re,</text:span>d fox.</text:p>", -1);
        r.shouldBe(t, "t.movementPositions", "[19, 16, 14, 13, 11, 9, 4, 0]");
    }

    function moveCursorPastWord_WordStartsNextToSpan() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the <text:span>quick </text:span>red fox</text:p>", 1);
        r.shouldBe(t, "t.movementPositions", "[4, 10, 14, 17]");
    }

    function moveCursorBeforeWord_WordStartsNextToSpan() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the <text:span>quick </text:span>red fox</text:p>", -1);
        r.shouldBe(t, "t.movementPositions", "[14, 10, 4, 0]");
    }

    function moveCursorPastWord_TextSplitByLink() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the q<text:a>uick</text:a> red fox</text:p>", 1);
        r.shouldBe(t, "t.movementPositions", "[4, 10, 14, 17]");
    }

    function moveCursorBeforeWord_TextSplitByLink() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the q<text:a>uick</text:a> red fox</text:p>", -1);
        r.shouldBe(t, "t.movementPositions", "[14, 10, 4, 0]");
    }

    function moveCursorPastWord_TextWithinLink() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the <text:a>quick</text:a> red fox</text:p>", 1);
        r.shouldBe(t, "t.movementPositions", "[4, 10, 14, 17]");
    }

    function moveCursorBeforeWord_TextWithinLink() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the <text:a>quick</text:a> red fox</text:p>", -1);
        r.shouldBe(t, "t.movementPositions", "[14, 10, 4, 0]");
    }

    function moveCursorPastWord_TextWithinLinkAndSpan() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the <text:a>q</text:a><text:a><text:span>u</text:span></text:a>ick red fox</text:p>", 1);
        r.shouldBe(t, "t.movementPositions", "[4, 10, 14, 17]");
    }

    function moveCursorBeforeWord_TextWithinLinkAndSpan() {
        t.movementPositions = getMovementByWordsPositions("<text:p>the <text:a>q</text:a><text:a><text:span>u</text:span></text:a>ick red fox</text:p>", -1);
        r.shouldBe(t, "t.movementPositions", "[14, 10, 4, 0]");
    }

    function extendCursorBeforeWord_IsWithinWord() {
        var doc = createOdtDocument("<text:p>one two three</text:p>"),
            p = doc.getElementsByTagNameNS(textns, "p")[0],
            text = p.childNodes[1],
            selection = t.selectionToRange({
                anchorNode: text,
                anchorOffset: 5,
                focusNode: text,
                focusOffset: 5
            });
        t.selectionController.selectRange(selection.range, selection.hasForwardSelection);

        t.selectionController.extendSelectionBeforeWord();

        t.cursorPosition = getCursorPosition();
        r.shouldBe(t, "t.cursorPosition.position", "5");
        r.shouldBe(t, "t.cursorPosition.length", "-1");
    }

    function extendCursorPastWord_IsWithinWord() {
        var doc = createOdtDocument("<text:p>one two three</text:p>"),
            p = doc.getElementsByTagNameNS(textns, "p")[0],
            text = p.childNodes[1],
            selection = t.selectionToRange({
                anchorNode: text,
                anchorOffset: 5,
                focusNode: text,
                focusOffset: 5
            });
        t.selectionController.selectRange(selection.range, selection.hasForwardSelection);

        t.selectionController.extendSelectionPastWord();

        t.cursorPosition = getCursorPosition();
        r.shouldBe(t, "t.cursorPosition.position", "5");
        r.shouldBe(t, "t.cursorPosition.length", "3");
    }

    function moveCursorToDocumentEnd_Simple() {
        t.position = undefined;
        createOdtDocument("<text:p>the <text:a>q</text:a><text:a><text:span>u</text:span></text:a>ick red fox</text:p>");

        t.selectionController.moveCursorToDocumentEnd();

        if(t.session.operations.length > 0) {
            t.position = t.session.operations[0].spec().position;
        }
        r.shouldBe(t, "t.position", "17");
    }

    function moveCursorToDocumentEnd_EndsBeforeAnnotation() {
        t.position = undefined;
        createOdtDocument("<text:p>the quick red fox<office:annotation><text:p>an</text:p></office:annotation></text:p>");

        t.selectionController.moveCursorToDocumentEnd();

        if(t.session.operations.length > 0) {
            t.position = t.session.operations[0].spec().position;
        }
        r.shouldBe(t, "t.position", "21");
    }

    function moveSelectionToParagraphEnd_OverAnnotation() {
        var lastPosition,
            loopGuard = new core.LoopWatchDog(100000, 100); // Don't care really how long this takes
        t.movementPositions = [];
        createOdtDocument("<text:p>ab<office:annotation><text:p>an</text:p></office:annotation></text:p>"
                            + "<text:p>cde</text:p>"
                            + "<text:p><text:span>fgh</text:span></text:p>");

        do {
            loopGuard.check();
            lastPosition = getCursorPosition().position;
            t.movementPositions.push(lastPosition);
            t.selectionController.moveCursorToParagraphEnd();
        } while (lastPosition !== getCursorPosition().position);

        r.shouldBe(t, "t.movementPositions", "[0, 6, 10, 14]");
    }

    function moveSelectionToParagraphStart_OverAnnotation() {
        var lastPosition,
            loopGuard = new core.LoopWatchDog(100000, 100); // Don't care really how long this takes
        t.movementPositions = [];
        createOdtDocument("<text:p><office:annotation><text:p>an</text:p></office:annotation>ab</text:p>"
            + "<text:p>cde</text:p>"
            + "<text:p><text:span>fgh</text:span></text:p>");
        t.selectionController.moveCursorToDocumentEnd();

        do {
            loopGuard.check();
            lastPosition = getCursorPosition().position;
            t.movementPositions.push(lastPosition);
            t.selectionController.moveCursorToParagraphStart();
        } while (lastPosition !== getCursorPosition().position);

        r.shouldBe(t, "t.movementPositions", "[14, 11, 7, 0]");
    }

    function selectRange_BridgesMultipleRoots_IsConstrainedWithinAnchorRoot() {
        var doc = createOdtDocument("<text:p><office:annotation><text:p>an</text:p></office:annotation>ab</text:p>"),
            range = testarea.ownerDocument.createRange();

        range.setStart(doc.getElementsByTagNameNS(officens, "annotation")[0], 0);
        range.setEnd(doc, doc.childNodes.length);

        t.selectionController.selectRange(range, true);

        t.position = getCursorPosition();
        r.shouldBe(t, "t.position.position", "1");
        r.shouldBe(t, "t.position.length", "2");
    }

    function selectRange_BridgesMultipleRoots_IsConstrainedWithinAnchorRoot_Reverse() {
        var doc = createOdtDocument("<text:p>ab<office:annotation><text:p>an</text:p></office:annotation></text:p>"),
            range = testarea.ownerDocument.createRange();

        range.setStart(doc, 0);
        range.setEnd(doc.getElementsByTagNameNS(officens, "annotation")[0], 1);

        t.selectionController.selectRange(range, false);

        t.position = getCursorPosition();
        r.shouldBe(t, "t.position.position", "5");
        r.shouldBe(t, "t.position.length", "-2");
    }

    function selectRange_SelectionOutsideRoot_ContainsToDocumentRoot() {
        var doc = createOdtDocument("<text:p>ab</text:p>"),
            range = testarea.ownerDocument.createRange();

        range.setStart(doc, 0);
        range.setEnd(doc, doc.childNodes.length);

        t.selectionController.selectRange(range, true);

        t.position = getCursorPosition();
        r.shouldBe(t, "t.position.position", "0");
        r.shouldBe(t, "t.position.length", "2");
    }

    function expandToWordBoundaries_CollapsedInWord() {
        var doc = createOdtDocument("<text:p>one two three</text:p>"),
            p = doc.getElementsByTagNameNS(textns, "p")[0],
            text = p.childNodes[1];

        t.selection = t.selectionToRange({
            anchorNode: text,
            anchorOffset: 5,
            focusNode: text,
            focusOffset: 5
        });

        t.selectionController.expandToWordBoundaries(t.selection.range);

        t.text = text;
        r.shouldBe(t, "t.selection.range.startContainer", "t.text");
        r.shouldBe(t, "t.selection.range.startOffset", "4");
        r.shouldBe(t, "t.selection.range.endContainer", "t.text");
        r.shouldBe(t, "t.selection.range.endOffset", "7");
    }

    function expandToWordBoundaries_CollasedAtWordStart() {
        var doc = createOdtDocument("<text:p>one two three</text:p>"),
            p = doc.getElementsByTagNameNS(textns, "p")[0],
            text = p.childNodes[1];

        t.selection = t.selectionToRange({
            anchorNode: text,
            anchorOffset: 4,
            focusNode: text,
            focusOffset: 4
        });

        t.selectionController.expandToWordBoundaries(t.selection.range);

        t.text = text;
        r.shouldBe(t, "t.selection.range.startContainer", "t.text");
        r.shouldBe(t, "t.selection.range.startOffset", "4");
        r.shouldBe(t, "t.selection.range.endContainer", "t.text");
        r.shouldBe(t, "t.selection.range.endOffset", "7");
    }

    function expandToWordBoundaries_CollasedAtWordEnd() {
        var doc = createOdtDocument("<text:p>one two three</text:p>"),
            p = doc.getElementsByTagNameNS(textns, "p")[0],
            text = p.childNodes[1];

        t.selection = t.selectionToRange({
            anchorNode: text,
            anchorOffset: 7,
            focusNode: text,
            focusOffset: 7
        });

        t.selectionController.expandToWordBoundaries(t.selection.range);

        t.text = text;
        r.shouldBe(t, "t.selection.range.startContainer", "t.text");
        r.shouldBe(t, "t.selection.range.startOffset", "4");
        r.shouldBe(t, "t.selection.range.endContainer", "t.text");
        r.shouldBe(t, "t.selection.range.endOffset", "7");
    }

    function expandToWordBoundaries_AlreadyAtWordBoundaries() {
        var doc = createOdtDocument("<text:p>one two three</text:p>"),
            p = doc.getElementsByTagNameNS(textns, "p")[0],
            text = p.childNodes[1];

        t.selection = t.selectionToRange({
            anchorNode: text,
            anchorOffset: 4,
            focusNode: text,
            focusOffset: 7
        });

        t.selectionController.expandToWordBoundaries(t.selection.range);

        t.text = text;
        r.shouldBe(t, "t.selection.range.startContainer", "t.text");
        r.shouldBe(t, "t.selection.range.startOffset", "4");
        r.shouldBe(t, "t.selection.range.endContainer", "t.text");
        r.shouldBe(t, "t.selection.range.endOffset", "7");
    }

    function expandToWordBoundaries_RangeInDifferentRootToCursor() {
        var doc = createOdtDocument("<text:p>one two three<office:annotation><text:p>four five</text:p></office:annotation></text:p>"),
            p = doc.getElementsByTagNameNS(textns, "p")[1],
            text = p.childNodes[0];

        t.selection = t.selectionToRange({
            anchorNode: text,
            anchorOffset: 0,
            focusNode: text,
            focusOffset: 1
        });

        t.selectionController.expandToWordBoundaries(t.selection.range);

        t.text = text;
        r.shouldBe(t, "t.selection.range.startContainer", "t.text");
        r.shouldBe(t, "t.selection.range.startOffset", "0");
        r.shouldBe(t, "t.selection.range.endContainer", "t.text");
        r.shouldBe(t, "t.selection.range.endOffset", "4");
    }

    this.setUp = function () {
        testarea = core.UnitTest.provideTestAreaDiv();
        t = { doc: testarea.ownerDocument };
    };
    this.tearDown = function () {
        core.UnitTest.cleanupTestAreaDiv();
        t = {};
    };

    this.tests = function () {
        return r.name([
            moveCursorPastWord_SimpleText,
            moveCursorBeforeWord_SimpleText,
            moveCursorPastWord_SimpleText_Punctuation,
            moveCursorBeforeWord_SimpleText_Punctuation,
            moveCursorBeforeWord_SimpleText_NonLatin,
            moveCursorPastWord_SimpleText_NonLatin,

            moveCursorPastWord_TextSplitBySpans,
            moveCursorBeforeWord_TextSplitBySpans,
            moveCursorPastWord_TextWithinSpan,
            moveCursorBeforeWord_TextWithinSpan,
            moveCursorPastWord_TextWithinSpan_2,
            moveCursorBeforeWord_TextWithinSpan_2,
            moveCursorPastWord_TextWithinSpan_3,
            moveCursorBeforeWord_TextWithinSpan_3,
            moveCursorPastWord_WordStartsNextToSpan,
            moveCursorBeforeWord_WordStartsNextToSpan,

            moveCursorPastWord_TextSplitByLink,
            moveCursorBeforeWord_TextSplitByLink,
            moveCursorPastWord_TextWithinLink,
            moveCursorBeforeWord_TextWithinLink,
            moveCursorPastWord_TextWithinLinkAndSpan,
            moveCursorBeforeWord_TextWithinLinkAndSpan,

            extendCursorBeforeWord_IsWithinWord,
            extendCursorPastWord_IsWithinWord,

            moveCursorToDocumentEnd_Simple,
            moveCursorToDocumentEnd_EndsBeforeAnnotation,

            moveSelectionToParagraphEnd_OverAnnotation,
            moveSelectionToParagraphStart_OverAnnotation,

            selectRange_BridgesMultipleRoots_IsConstrainedWithinAnchorRoot,
            selectRange_BridgesMultipleRoots_IsConstrainedWithinAnchorRoot_Reverse,
            selectRange_SelectionOutsideRoot_ContainsToDocumentRoot,

            expandToWordBoundaries_CollapsedInWord,
            expandToWordBoundaries_CollasedAtWordStart,
            expandToWordBoundaries_CollasedAtWordEnd,
            expandToWordBoundaries_AlreadyAtWordBoundaries,
            expandToWordBoundaries_RangeInDifferentRootToCursor
        ]);
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
gui.SelectionControllerTests.prototype.description = function () {
    "use strict";
    return "Test the SelectionController class.";
};
