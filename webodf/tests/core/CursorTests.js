/*global core runtime window*/
runtime.loadClass("core.Cursor");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
core.CursorTests = function CursorTests(runner) {
    var r = runner, tests, t = {};
    /**
     * @param {Selection} selection
     * @param {Node} startnode
     * @param {number} startoffset
     * @param {Node=} endnode
     * @param {number=} endoffset
     * @return {undefined}
     */
    function setSelection(selection, startnode, startoffset, endnode,
            endoffset) {
        // call createRange() on the document, even if startnode is the document
        var range = (startnode.ownerDocument || startnode).createRange();
        selection.removeAllRanges();
        range.setStart(startnode, startoffset);
        if (endnode) {
            range.setEnd(endnode, endoffset);
        } else {
            range.setEnd(startnode, startoffset);
        }
        selection.addRange(range);
    }

    function setupEmptyDoc() {
        var selection = window.getSelection(),
            doc = runtime.getDOMImplementation().createDocument("", "p", null),
            cursor = new core.Cursor(selection, doc);
        t = { selection: selection, doc: doc, cursor: cursor };
        runner.shouldBeNonNull(t, selection);
    }
 
    function setupSimpleTextDoc() {
        setupEmptyDoc();
        t.textnode = t.doc.createTextNode("abc");
        t.doc.documentElement.appendChild(t.textnode);
    }
    
    tests = {
        // create a document, add a cursor and check that the cursor is present
        testOnEmptyDocument1: function () {
            // if the document is the container of the selection, the cursor
            // can not be in the DOM
            setupEmptyDoc(); 
            setSelection(t.selection, t.doc, 0);
            t.cursor.updateToSelection();
            r.shouldBeNull(t, "t.cursor.getNode().parentNode");
        },
        testOnEmptyDocument2: function () {
            setupEmptyDoc(); 
            setSelection(t.selection, t.doc.documentElement, 0);
            t.cursor.updateToSelection();
runtime.log(t.cursor.getNode().nodeName);
            r.shouldBeNonNull(t, "t.cursor.getNode().parentNode");
            r.shouldBeNull(t, "t.cursor.getNode().previousSibling");
            r.shouldBeNull(t, "t.cursor.getNode().nextSibling");
        },
        testOnSimpleText: function () { 
            setupSimpleTextDoc(); 
            // put the cursor at the start of the text node 
            setSelection(t.selection, t.textnode, 0);
            t.cursor.updateToSelection();
            r.shouldBeNonNull(t, "t.cursor.getNode().parentNode");
            r.shouldBeNull(t, "t.cursor.getNode().previousSibling");
            r.shouldBe(t, "t.cursor.getNode().nextSibling.nodeValue", "'abc'");
        },
        testOnSimpleText2: function () { 
            setupSimpleTextDoc(); 
            // put the cursor in the middle of the text node 
            setSelection(t.selection, t.textnode, 1);
            t.cursor.updateToSelection();
            r.shouldBeNonNull(t, "t.cursor.getNode().parentNode");
            r.shouldBe(t, "t.cursor.getNode().previousSibling.nodeValue", "'a'");
            r.shouldBe(t, "t.cursor.getNode().nextSibling.nodeValue", "'bc'");
        },
        testOnSimpleText3: function () { 
            setupSimpleTextDoc(); 
            // put the cursor at the end of the text node
            setSelection(t.selection, t.textnode, 3);
            t.cursor.updateToSelection();
            r.shouldBeNonNull("t.cursor.getNode().parentNode");
            r.shouldBe("t.cursor.getNode().previousSibling.nodeValue", "'abc'");
            r.shouldBeNull("t.cursor.getNode().nextSibling");
        },
        testOnSimpleText4: function () {
            var textnode2; 
            setupSimpleTextDoc(); 
            // put the cursor between 'a' and 'b', then change the selection to
            // be between 'b' and 'c' and update the cursor
            setSelection(t.selection, t.textnode, 1);
            t.cursor.updateToSelection();
            textnode2 = t.cursor.getNode().nextSibling;
            setSelection(t.selection, textnode2, 1);
            t.cursor.updateToSelection();
            r.shouldBeNonNull("t.cursor.getNode().parentNode");
            r.shouldBe("t.cursor.getNode().previousSibling.nodeValue", "'ab'");
            r.shouldBe("t.cursor.getNode().nextSibling.nodeValue", "'c'");
        },
        testOnSimpleText5: function () {
            var textnode2; 
            setupSimpleTextDoc(); 
            // put the cursor between 'a' and 'b', then change the selection to
            // span the entire text and update the cursor
            setSelection(t.selection, t.textnode, 1);
            t.cursor.updateToSelection();
            textnode2 = t.cursor.getNode().nextSibling;
            setSelection(t.selection, t.textnode, 0, textnode2, 2);
            t.cursor.updateToSelection();
            r.shouldBe("t.selection.rangeCount", "1");
            r.shouldBeNull("t.cursor.getNode().parentNode");
            t.range = t.selection.getRangeAt(0);
            r.shouldBe("t.range.startContainer", "t.textnode");
            r.shouldBe("t.range.startOffset", "0");
            r.shouldBe("t.range.endContainer", "t.textnode");
            r.shouldBe("t.range.endOffset", "3");
        },
        testOnSimpleText5b: function () {
            var textnode2; 
            setupSimpleTextDoc(); 
            setSelection(t.selection, t.textnode, 1);
            t.cursor.updateToSelection();
            textnode2 = t.cursor.getNode().nextSibling;
            setSelection(t.selection, t.textnode.parentNode, 1, textnode2, 2);
            t.cursor.updateToSelection();
            r.shouldBe("t.selection.rangeCount", "1");
            r.shouldBeNull("t.cursor.getNode().parentNode");
            t.range = t.selection.getRangeAt(0);
            r.shouldBe("t.range.startContainer", "t.textnode");
            r.shouldBe("t.range.startOffset", "1");
            r.shouldBe("t.range.endContainer", "t.textnode");
            r.shouldBe("t.range.endOffset", "3");
        },
        testOnSimpleText6: function () {
            var somenode, textnode2;
            setupSimpleTextDoc();
            // add a child node to the cursor
            somenode = t.doc.createElement("p");
            t.cursor.getNode().appendChild(somenode);
            // select a single position so the cursor is put in the document
            setSelection(t.selection, t.textnode, 1);
            t.cursor.updateToSelection();
            r.shouldBeNonNull("t.cursor.getNode().parentNode");
            textnode2 = t.cursor.getNode().nextSibling;
            // select a range starting at the node in the cursor, but extends
            // out of the the cursor
            // this should have the result that the cursor is removed from the
            // document and that the text nodes around the cursor are
            // merged
            setSelection(t.selection, somenode, 0, textnode2, 2);
            t.cursor.updateToSelection();
            r.shouldBeNull("t.cursor.getNode().parentNode");
            t.range = t.selection.getRangeAt(0);
            r.shouldBe("t.range.startContainer", "t.textnode");
            r.shouldBe("t.range.startOffset", "1");
            r.shouldBe("t.range.endContainer", "t.textnode");
            r.shouldBe("t.range.endOffset", "3");
            r.shouldBe("t.range.collapsed", "false");
        }
    };
    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    this.tests = function () {
        return tests;
    };
};
core.CursorTests.name = "CursorTests";
core.CursorTests.prototype.description = function () {
    return "Test the Cursor class.";
};
(function () {
    return core.CursorTests;
}());
