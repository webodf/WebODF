/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
 *
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
/*global runtime, core, gui, Node, ops, odf, window */

runtime.loadClass("ops.OpAddCursor");
runtime.loadClass("ops.OpRemoveCursor");
runtime.loadClass("ops.OpMoveCursor");
runtime.loadClass("ops.OpInsertText");
runtime.loadClass("ops.OpRemoveText");
runtime.loadClass("ops.OpSplitParagraph");
runtime.loadClass("ops.OpSetParagraphStyle");
runtime.loadClass("gui.ClickHandler");
runtime.loadClass("gui.Clipboard");

/**
 * @constructor
 * @param {!ops.Session} session
 * @param {!string} inputMemberId
 * @return {?}
 */
gui.SessionController = (function () {
    "use strict";

    /**
     * @constructor
     * @param {!ops.Session} session
     * @param {!string} inputMemberId
     * @return {?}
     */
    gui.SessionController = function SessionController(session, inputMemberId) {
        var self = this,
            odfUtils = new odf.OdfUtils(),
            isMacOS = runtime.getWindow().navigator.appVersion.toLowerCase().indexOf("mac") !== -1,
            clipboard = new gui.Clipboard(),
            clickHandler = new gui.ClickHandler(),
            undoManager;

        /**
         * @param {!Element} eventTarget
         * @param {!string} eventType
         * @param {function(!Event)|function()} eventHandler
         * @param {boolean=} includeDirect
         */
        function listenEvent(eventTarget, eventType, eventHandler, includeDirect) {
            var onVariant = "on" + eventType,
                bound = false;
            if (eventTarget.attachEvent) {
                bound = eventTarget.attachEvent(onVariant, eventHandler);
            }
            if (!bound && eventTarget.addEventListener) {
                eventTarget.addEventListener(eventType, eventHandler, false);
                bound = true;
            }

            if ((!bound || includeDirect) && eventTarget.hasOwnProperty(onVariant)) {
                eventTarget[onVariant] = eventHandler;
            }
        }

        function removeEvent(eventTarget, eventType, eventHandler) {
            var onVariant = "on" + eventType;
            if (eventTarget.detachEvent) {
                eventTarget.detachEvent(onVariant, eventHandler);
            }
            if (eventTarget.removeEventListener) {
                eventTarget.removeEventListener(eventType, eventHandler, false);
            }
            if (eventTarget[onVariant] === eventHandler) {
                eventTarget[onVariant] = null;
            }
        }

        /**
         * @param {!Event} event
         */
        function cancelEvent(event) {
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        }
        /**
         * @param {!Event} e
         */
        function dummyHandler(e) {
            // runtime.log("ignore event " + e.type);
            cancelEvent(e);
        }

        function countStepsToNode(targetNode, targetOffset) {
            var odtDocument = session.getOdtDocument(),
                iterator = gui.SelectionMover.createPositionIterator(odtDocument.getRootNode()),
                canvasElement = odtDocument.getOdfCanvas().getElement(),
                node;

            // check that the node or one of its parent nodes til the canvas are
            // not belonging to a cursor, like e.g. the caret and the cursor
            // avatarflag are.
            node = targetNode;
            if (!node) {
                return;
            }
            while (node !== canvasElement) {
                if ((node.namespaceURI === 'urn:webodf:names:cursor' && node.localName === 'cursor')
                    || (node.namespaceURI === 'urn:webodf:names:editinfo' && node.localName === 'editinfo')) {
                    break;
                }
                node = node.parentNode;

                // Sometimes when we click outside the canvasElement, the ancestry
                // will never reach canvasElement, and the node will eventually become null. In that case,
                // return.
                if (!node) {
                    return;
                }
            }

            if (node !== canvasElement && targetNode !== node) {
                // This happens when the click event has been captured by a cursor or editinfo.
                // In that case, put the cursor in the capturer's container, just after it.
                targetNode = node.parentNode;
                targetOffset = Array.prototype.indexOf.call(targetNode.childNodes, node);
            }

            // create a move op with the distance to that position
            iterator.setUnfilteredPosition(targetNode, targetOffset);
            return odtDocument.getDistanceFromCursor(inputMemberId, iterator.container(), iterator.unfilteredDomOffset());
        }

        function moveCursor() {
            var selection = runtime.getWindow().getSelection(),
                odtDocument = session.getOdtDocument(),
                oldPosition = odtDocument.getCursorPosition(inputMemberId),
                stepsToAnchor, stepsToFocus, op;

            stepsToAnchor = countStepsToNode(selection.anchorNode, selection.anchorOffset);
            stepsToFocus = countStepsToNode(selection.focusNode, selection.focusOffset);
            if (stepsToFocus !== 0 || stepsToAnchor !== 0) {
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, position: oldPosition+stepsToAnchor, length: stepsToFocus - stepsToAnchor});
                session.enqueue(op);
            }
        }

        function selectWord() {
            var odtDocument = session.getOdtDocument(),
                iterator = gui.SelectionMover.createPositionIterator(odtDocument.getRootNode()),
                cursorNode = odtDocument.getCursor(inputMemberId).getNode(),
                oldPosition = odtDocument.getCursorPosition(inputMemberId),
                alphaNumeric = /[A-Za-z0-9]/,
                stepsToStart = 0,
                stepsToEnd = 0,
                currentNode, i, c, op;

            iterator.setUnfilteredPosition(cursorNode, 0);
            if (iterator.previousPosition()) {
                currentNode = iterator.getCurrentNode();
                if (currentNode.nodeType === Node.TEXT_NODE) {
                    for (i=currentNode.data.length-1; i>=0; i-=1) {
                        c = currentNode.data[i];
                        if (alphaNumeric.test(c)) {
                            stepsToStart -= 1;
                        }
                        else {
                            break;
                        }
                    }
                }
            }

            iterator.setUnfilteredPosition(cursorNode, 0);
            if (iterator.nextPosition()) {
                currentNode = iterator.getCurrentNode();
                if (currentNode.nodeType === Node.TEXT_NODE) {
                    for (i=0; i<currentNode.data.length; i+=1) {
                        c = currentNode.data[i];
                        if (alphaNumeric.test(c)) {
                            stepsToEnd += 1;
                        }
                        else {
                            break;
                        }
                    }
                }
            }

            if (stepsToStart !== 0 || stepsToEnd !== 0) {
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, position: oldPosition+stepsToStart, length: Math.abs(stepsToStart) + Math.abs(stepsToEnd)});
                session.enqueue(op);
            }
        }

        function selectParagraph() {
            var odtDocument = session.getOdtDocument(),
                iterator = gui.SelectionMover.createPositionIterator(odtDocument.getRootNode()),
                paragraphNode = odtDocument.getParagraphElement(odtDocument.getCursor(inputMemberId).getNode()),
                oldPosition = odtDocument.getCursorPosition(inputMemberId),
                stepsToStart, stepsToEnd, op;

            stepsToStart = odtDocument.getDistanceFromCursor(inputMemberId, paragraphNode, 0);
            iterator.moveToEndOfNode(paragraphNode);
            stepsToEnd = odtDocument.getDistanceFromCursor(inputMemberId, paragraphNode, iterator.unfilteredDomOffset());

            if (stepsToStart !== 0 || stepsToEnd !== 0) {
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, position: oldPosition+stepsToStart, length: Math.abs(stepsToStart) + Math.abs(stepsToEnd)});
                session.enqueue(op);
            }
        }

        /**
         * @param {!number} steps
         * @return {!ops.Operation}
         */
        function createOpMoveCursor(steps) {
            var op = new ops.OpMoveCursor(),
                oldPosition = session.getOdtDocument().getCursorPosition(inputMemberId);

            op.init({memberid: inputMemberId, position: oldPosition+steps});
            return op;
        }

        /**
         * @param {!number} increment
         * @return {!ops.Operation}
         */
        function extendSelection(increment) {
            var op = new ops.OpMoveCursor(),
                selection = session.getOdtDocument().getCursorSelection(inputMemberId);

            op.init({memberid: inputMemberId, position: selection.position, length: selection.length+increment});
            return op;
        }

        /**
         * @param {!number} lines
         * @return {?ops.Operation}
         */
        function extendSelectionByLines(lines) {
            var odtDocument = session.getOdtDocument(),
                paragraphNode = odtDocument.getParagraphElement(odtDocument.getCursor(inputMemberId).getNode()),
                selection, steps, op = null;

            runtime.assert(Boolean(paragraphNode), "SessionController: Cursor outside paragraph");
            steps = odtDocument.getCursor(inputMemberId).getStepCounter().countLinesSteps(lines, odtDocument.getPositionFilter());
            if (steps !== 0) {
                selection = session.getOdtDocument().getCursorSelection(inputMemberId);
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, position: selection.position, length: selection.length+steps});
            }
            return op;
        }

        /**
         * @param {!number} lines
         * @return {?ops.Operation}
         */
        function createOpMoveCursorByLines(lines) {
            var odtDocument = session.getOdtDocument(),
                paragraphNode = odtDocument.getParagraphElement(odtDocument.getCursor(inputMemberId).getNode()),
                oldPosition, steps, op = null;

            runtime.assert(Boolean(paragraphNode), "SessionController: Cursor outside paragraph");
            steps = odtDocument.getCursor(inputMemberId).getStepCounter().countLinesSteps(lines, odtDocument.getPositionFilter());
            if (steps !== 0) {
                oldPosition = odtDocument.getCursorPosition(inputMemberId);
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, position: oldPosition+steps});
            }
            return op;
        }

        /**
         * @return {?ops.Operation}
         */
        function extendSelectionToParagraphStart() {
            var odtDocument = session.getOdtDocument(),
                paragraphNode = odtDocument.getParagraphElement(odtDocument.getCursor(inputMemberId).getNode()),
                iterator, node, selection, steps, op = null;

            if (!paragraphNode) {
                return op;
            }

            steps = odtDocument.getDistanceFromCursor(inputMemberId, paragraphNode, 0);
            iterator = gui.SelectionMover.createPositionIterator(odtDocument.getRootNode());
            iterator.setUnfilteredPosition(paragraphNode, 0);

            while (steps === 0 && iterator.previousPosition()) {
                node = iterator.getCurrentNode();

                if (odfUtils.isParagraph(node)) {
                    steps = odtDocument.getDistanceFromCursor(inputMemberId, node, 0);
                }
            }

            if (steps !== 0) {
                selection = odtDocument.getCursorSelection(inputMemberId);
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, position: selection.position, length: selection.length+steps});
            }

            return op;
        }

        /**
         * @return {?ops.Operation}
         */
        function extendSelectionToParagraphEnd() {
            var odtDocument = session.getOdtDocument(),
                paragraphNode = odtDocument.getParagraphElement(odtDocument.getCursor(inputMemberId).getNode()),
                iterator, node, selection, steps, op = null;

            if (!paragraphNode) {
                return op;
            }

            iterator = gui.SelectionMover.createPositionIterator(odtDocument.getRootNode());
            iterator.moveToEndOfNode(paragraphNode);
            steps = odtDocument.getDistanceFromCursor(
                inputMemberId, iterator.container(), iterator.unfilteredDomOffset());

            while (steps === 0 && iterator.nextPosition()) {
                node = iterator.getCurrentNode();

                if (odfUtils.isParagraph(node)) {
                    iterator.moveToEndOfNode(node);
                    steps = odtDocument.getDistanceFromCursor(
                        inputMemberId, iterator.container(), iterator.unfilteredDomOffset());
                }
            }

            if (steps !== 0) {
                selection = odtDocument.getCursorSelection(inputMemberId);
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, position: selection.position, length: selection.length+steps});
            }

            return op;
        }

        /**
         * @return {?ops.Operation}
         */
        function createOpMoveCursorByEndKey() {
            var odtDocument = session.getOdtDocument(),
                iterator = gui.SelectionMover.createPositionIterator(odtDocument.getRootNode()),
                oldPosition = odtDocument.getCursorPosition(inputMemberId),
                steps,
                cursorNode = odtDocument.getCursor(inputMemberId).getNode(),
                paragraphNode = odtDocument.getParagraphElement(cursorNode),
                op = null;

            runtime.assert(Boolean(paragraphNode), "SessionController: Cursor outside paragraph");

            iterator.moveToEndOfNode(paragraphNode);
            // create a move op with the distance to that position
            steps = odtDocument.getDistanceFromCursor(inputMemberId, paragraphNode, iterator.unfilteredDomOffset());

            if (steps !== 0) {
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, position: oldPosition+steps});
            }

            return op;
        }

        /**
         * @return {?ops.Operation}
         */
        function createOpMoveCursorByHomeKey() {
            var odtDocument = session.getOdtDocument(),
                oldPosition = odtDocument.getCursorPosition(inputMemberId),
                steps,
                paragraphNode,
                op = null;

            // TODO: instead of going to begin of paragraph go to begin of line
            paragraphNode = odtDocument.getParagraphElement(odtDocument.getCursor(inputMemberId).getNode());
            steps = odtDocument.getDistanceFromCursor(inputMemberId, paragraphNode, 0);
            if (steps !== 0) {
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, position: oldPosition+steps});
            }
            return op;
        }

        /**
         * @return {?ops.Operation}
         */
        function extendSelectionToDocumentEnd() {
            var odtDocument = session.getOdtDocument(),
                iterator = gui.SelectionMover.createPositionIterator(odtDocument.getRootNode()),
                selection, steps, op = null;

            iterator.moveToEnd();
            steps = odtDocument.getDistanceFromCursor(
                inputMemberId, iterator.container(), iterator.unfilteredDomOffset());

            if (steps !== 0) {
                selection = odtDocument.getCursorSelection(inputMemberId);
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, position: selection.position, length: selection.length+steps});
            }

            return op;
        }

        /**
         * @return {?ops.Operation}
         */
        function extendSelectionToDocumentStart() {
            var odtDocument = session.getOdtDocument(),
                selection, steps, op = null;

            steps = odtDocument.getDistanceFromCursor(inputMemberId, odtDocument.getRootNode(), 0);

            if (steps !== 0) {
                selection = odtDocument.getCursorSelection(inputMemberId);
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, position: selection.position, length: selection.length+steps});
            }

            return op;
        }

        /**
         * @return {?ops.Operation}
         */
        function moveCursorToDocumentEnd() {
            var odtDocument = session.getOdtDocument(),
                iterator = gui.SelectionMover.createPositionIterator(odtDocument.getRootNode()),
                oldPosition, steps, op = null;

            iterator.moveToEnd();
            steps = odtDocument.getDistanceFromCursor(
                inputMemberId, iterator.container(), iterator.unfilteredDomOffset());

            if (steps !== 0) {
                oldPosition = odtDocument.getCursorPosition(inputMemberId);
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, position: oldPosition + steps, length: 0});
            }

            return op;
        }

        /**
         * @return {?ops.Operation}
         */
        function moveCursorToDocumentStart() {
            var odtDocument = session.getOdtDocument(),
                oldPosition, steps, op = null;

            steps = odtDocument.getDistanceFromCursor(inputMemberId, odtDocument.getRootNode(), 0);

            if (steps !== 0) {
                oldPosition = odtDocument.getCursorPosition(inputMemberId);
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, position: oldPosition+steps, length: 0});
            }

            return op;
        }

        /**
         * Ensures the provided selection is a "forward" selection (i.e., length is positive)
         * @param {!{position: number, length: number}} selection
         * @returns {!{position: number, length: number}}
         */
        function toForwardSelection(selection) {
            if (selection.length < 0) {
                selection.position += selection.length;
                selection.length = -selection.length;
            }
            return selection;
        }

        /**
         * Creates an operation to remove the provided selection
         * @param {{position: number, length: number}} selection
         * @returns {!ops.OpRemoveText}
         */
        function createOpRemoveSelection(selection) {
            var op = new ops.OpRemoveText();
            op.init({
                memberid: inputMemberId,
                position: selection.position,
                length: selection.length
            });
            return op;
        }

        /**
         * @return {?ops.Operation}
         */
        function createOpRemoveTextByBackspaceKey() {
            var odtDocument = session.getOdtDocument(),
                selection = toForwardSelection(odtDocument.getCursorSelection(inputMemberId)),
                op = null;

            if (selection.length === 0) {
                // position-1 must exist for backspace to be valid
                if (selection.position > 0 && odtDocument.getPositionInTextNode(selection.position - 1)) {
                    op = new ops.OpRemoveText();
                    op.init({
                        memberid: inputMemberId,
                        position: selection.position - 1,
                        length: 1
                    });
                }
            } else {
                op = createOpRemoveSelection(selection);
            }
            return op;
        }
        /**
         * @return {?ops.Operation}
         */
        function createOpRemoveTextByDeleteKey() {
            var odtDocument = session.getOdtDocument(),
                selection = toForwardSelection(odtDocument.getCursorSelection(inputMemberId)),
                op = null;

            if (selection.length === 0) {
                // position+1 must exist for delete to be valid
                if (odtDocument.getPositionInTextNode(selection.position + 1)) {
                    op = new ops.OpRemoveText();
                    op.init({
                        memberid: inputMemberId,
                        position: selection.position,
                        length: 1
                    });
                }
            } else {
                op = createOpRemoveSelection(selection);
            }
            return op;
        }

        function enqueueParagraphSplittingOps() {
            var odtDocument = session.getOdtDocument(),
                position = odtDocument.getCursorPosition(inputMemberId),
                isAtEndOfParagraph = false, // TODO: find out if at end
                paragraphNode, styleName, nextStyleName,
                op;

            op = new ops.OpSplitParagraph();
            op.init({
                memberid: inputMemberId,
                position: position
            });
            session.enqueue(op);

            // disabled for now, because nowjs seems to revert the order of the ops, which does not work here TODO: grouping of ops
            /*
            if (isAtEndOfParagraph) {
                paragraphNode = odtDocument.getParagraphElement(odtDocument.getCursor(inputMemberId).getNode());
                styleName = odtDocument.getFormatting().getParagraphStyleAttribute(styleName, odf.Namespaces.stylens, 'next-style-name');

                if (nextStyleName && nextStyleName !== styleName) {
                    op = new ops.OpSetParagraphStyle();
                    op.init({
                        memberid: inputMemberId,
                        position: position + 1, // +1 should be at the start of the new paragraph
                        styleName: styleName
                    });
                    session.enqueue(op);
                }
            }
            */
        }
        // TODO: This method and associated event subscriptions really belong in SessionView
        // As this implementation relies on the current browser selection, only a single
        // cursor can be highlighted at a time. Eventually, when virtual selection & cursors are
        // implemented, this limitation will be eliminated
        function maintainCursorSelection() {
            var cursor = session.getOdtDocument().getCursor(inputMemberId),
                selection = runtime.getWindow().getSelection();
            selection.removeAllRanges();
            selection.addRange(cursor.getSelectedRange().cloneRange());
        }
        /**
         * @param {!Event} e
         */
        function handleKeyDown(e) {
            var keyCode = e.keyCode,
                op = null,
                handled = false;

            if (keyCode === 37) { // left
                op = e.shiftKey
                    ? extendSelection(-1)
                    : createOpMoveCursor(-1);
                handled = true;
            } else if (keyCode === 39) { // right
                op = e.shiftKey
                    ? extendSelection(1)
                    : createOpMoveCursor(1);
                handled = true;
            } else if (keyCode === 38) { // up
                if ((isMacOS && e.altKey && e.shiftKey) || (e.ctrlKey && e.shiftKey)) {
                    op = extendSelectionToParagraphStart();
                } else if (e.metaKey && e.shiftKey) {
                    op = extendSelectionToDocumentStart();
                } else if (e.shiftKey) {
                    op = extendSelectionByLines(-1);
                } else {
                    op = createOpMoveCursorByLines(-1);
                }
                handled = true;
            } else if (keyCode === 40) { // down
                if ((isMacOS && e.altKey && e.shiftKey) || (e.ctrlKey && e.shiftKey)) {
                    op = extendSelectionToParagraphEnd();
                } else if (e.metaKey && e.shiftKey) {
                    op = extendSelectionToDocumentEnd();
                } else if (e.shiftKey) {
                    op = extendSelectionByLines(1);
                } else {
                    op = createOpMoveCursorByLines(1);
                }
                handled = true;
            } else if (keyCode === 36) { // home
                if (!isMacOS && e.ctrlKey && e.shiftKey) {
                    op = extendSelectionToDocumentStart();
                } else if ((isMacOS && e.metaKey) || e.ctrlKey) {
                    op = moveCursorToDocumentStart();
                } else {
                    op = createOpMoveCursorByHomeKey();
                }
                handled = true;
            } else if (keyCode === 35) { // end
                if (!isMacOS && e.ctrlKey && e.shiftKey) {
                    op = extendSelectionToDocumentEnd();
                } else if ((isMacOS && e.metaKey) || e.ctrlKey) {
                    op = moveCursorToDocumentEnd();
                } else {
                    op = createOpMoveCursorByEndKey();
                }
                handled = true;
            } else if (keyCode === 8) { // Backspace
                op = createOpRemoveTextByBackspaceKey();
                handled = true;
            } else if (keyCode === 46) { // Delete
                op = createOpRemoveTextByDeleteKey();
                handled = (op !== null);
            } else if (undoManager && keyCode === 90) { // z
                if ((!isMacOS && e.ctrlKey) || (isMacOS && e.metaKey)) {
                    if (e.shiftKey) {
                        undoManager.moveForward(1);
                    } else {
                        undoManager.moveBackward(1);
                    }
                    maintainCursorSelection();
                    handled = true;
                }
            }
            if (op) {
                session.enqueue(op);
            }
            if (handled) {
                cancelEvent(e);
            }
        }

        /**
         * @param {!Event} event
         * @return {?string}
         */
        function stringFromKeyPress(event) {
            if (event.which === null) {
                return String.fromCharCode(event.keyCode); // IE
            }
            if (event.which !== 0 && event.charCode !== 0) {
                return String.fromCharCode(event.which);   // the rest
            }
            return null; // special key
        }

        /**
         * @param {!Event} e
         */
        function handleKeyPress(e) {
            var op,
                text = stringFromKeyPress(e);

            if (e.keyCode === 13) { // enter
                enqueueParagraphSplittingOps();
                cancelEvent(e);
            } else if (text && !(e.altKey || e.ctrlKey || e.metaKey)) {
                op = new ops.OpInsertText();
                op.init({
                    memberid: inputMemberId,
                    position: session.getOdtDocument().getCursorPosition(inputMemberId),
                    text: text
                });
                session.enqueue(op);
                cancelEvent(e);
            }
        }

        /**
         * Handle the cut operation request
         * @param {!Event} e
         */
        function handleCut(e) {
            var cursor = session.getOdtDocument().getCursor(inputMemberId),
                selectedRange = cursor.getSelectedRange(),
                selection,
                op;

            if (selectedRange.collapsed) {
                // Modifying the clipboard data will clear any existing data,
                // so cut shouldn't touch the clipboard if there is nothing selected
                return;
            }

            // The document is readonly, so the data will never get placed on the clipboard in
            // most browsers unless we do it ourselves.
            if (clipboard.setDataFromRange(e, cursor.getSelectedRange())) {
                op = new ops.OpRemoveText();
                selection = toForwardSelection(session.getOdtDocument().getCursorSelection(inputMemberId));
                op.init({
                    memberid: inputMemberId,
                    position: selection.position,
                    length: selection.length
                });
                session.enqueue(op);
            } else {
                // TODO What should we do if cut isn't supported?
                runtime.log("Cut operation failed");
            }
        }

        /**
         * Tell the browser that it's ok to perform a cut action on our read-only body
         * @returns {boolean}
         */
        function handleBeforeCut() {
            var cursor = session.getOdtDocument().getCursor(inputMemberId),
                selectedRange = cursor.getSelectedRange();
            return !(selectedRange.collapsed === false); // return false to enable cut menu... straightforward right?!
        }

        /**
         * @param {!Event} e
         */
        function handlePaste(e) {
            var plainText, op;

            if (window.clipboardData && window.clipboardData.getData) { // IE
                plainText = window.clipboardData.getData('Text');
            } else if (e.clipboardData && e.clipboardData.getData) { // the rest
                plainText = e.clipboardData.getData('text/plain');
            }

            if (plainText) {
                op = new ops.OpInsertText();
                op.init({
                    memberid: inputMemberId,
                    position: session.getOdtDocument().getCursorPosition(inputMemberId),
                    text: plainText
                });
                session.enqueue(op);
                cancelEvent(e);
            }
        }

        /**
         * Tell the browser that it's ok to perform a paste action on our read-only body
         * @returns {boolean}
         */
        function handleBeforePaste() {
            return false;
        }

        function updateUndoStack(op) {
            if (undoManager) {
                undoManager.onOperationExecuted(op);
            }
        }

        function forwardUndoStackChange(e) {
            session.getOdtDocument().emit(ops.OdtDocument.signalUndoStackChanged, e);
        }

       /**
        */
        this.startEditing = function () {
            var canvasElement, op,
                odtDocument = session.getOdtDocument();

            canvasElement = odtDocument.getOdfCanvas().getElement();
            listenEvent(canvasElement, "keydown", handleKeyDown);
            listenEvent(canvasElement, "keypress", handleKeyPress);
            listenEvent(canvasElement, "keyup", dummyHandler);
            // In Safari 6.0.5 (7536.30.1), Using either attachEvent or addEventListener
            // results in the beforecut return value being ignored which prevents cut from being called.
            listenEvent(canvasElement, "beforecut", handleBeforeCut, true);
            listenEvent(canvasElement, "mouseup", clickHandler.handleMouseUp);
            listenEvent(canvasElement, "cut", handleCut);
            // Epiphany 3.6.1 requires this to allow the paste event to fire
            listenEvent(canvasElement, "beforepaste", handleBeforePaste, true);
            listenEvent(canvasElement, "paste", handlePaste);

            // start maintaining the cursor selection now
            odtDocument.subscribe(ops.OdtDocument.signalOperationExecuted, maintainCursorSelection);
            odtDocument.subscribe(ops.OdtDocument.signalOperationExecuted, updateUndoStack);

            op = new ops.OpAddCursor();
            op.init({memberid: inputMemberId});
            session.enqueue(op);

            if (undoManager) {
                // For most undo managers, the initial state is a clean document *with* a cursor present
                undoManager.saveInitialState();
            }
        };

        /**
         */
        this.endEditing = function () {
            var canvasElement, op,
                odtDocument = session.getOdtDocument();

            odtDocument.unsubscribe(ops.OdtDocument.signalOperationExecuted, updateUndoStack);
            odtDocument.unsubscribe(ops.OdtDocument.signalOperationExecuted, maintainCursorSelection);

            canvasElement = odtDocument.getOdfCanvas().getElement();
            removeEvent(canvasElement, "keydown", handleKeyDown);
            removeEvent(canvasElement, "keypress", handleKeyPress);
            removeEvent(canvasElement, "keyup", dummyHandler);
            removeEvent(canvasElement, "cut", handleCut);
            removeEvent(canvasElement, "beforecut", handleBeforeCut);
            removeEvent(canvasElement, "paste", handlePaste);
            removeEvent(canvasElement, "mouseup", clickHandler.handleMouseUp);
            removeEvent(canvasElement, "beforepaste", handleBeforePaste);

            op = new ops.OpRemoveCursor();
            op.init({memberid: inputMemberId});
            session.enqueue(op);

            if (undoManager) {
                undoManager.resetInitialState();
            }
        };

        /**
         * @return {string}
         */
        this.getInputMemberId = function () {
            return inputMemberId;
        };

        /**
         * @return {ops.Session}
         */
        this.getSession = function () {
            return session;
        };

        /**
         * @param {gui.UndoManager} manager
         */
        this.setUndoManager = function(manager) {
            if (undoManager) {
                undoManager.unsubscribe(gui.UndoManager.signalUndoStackChanged, forwardUndoStackChange);
            }

            undoManager = manager;
            if (undoManager) {
                undoManager.setOdtDocument(session.getOdtDocument());
                // As per gui.UndoManager, this should NOT fire any signals or report
                // events being executed back to the undo manager.
                undoManager.setPlaybackFunction(function (op) {
                    op.execute(session.getOdtDocument());
                });
                undoManager.subscribe(gui.UndoManager.signalUndoStackChanged, forwardUndoStackChange);
            }
        };

        /**
         * @returns {gui.UndoManager}
         */
        this.getUndoManager = function() {
            return undoManager;
        };

        function init() {
            clickHandler.subscribe(gui.ClickHandler.signalSingleClick, moveCursor);
            clickHandler.subscribe(gui.ClickHandler.signalDoubleClick, selectWord);
            clickHandler.subscribe(gui.ClickHandler.signalTripleClick, selectParagraph);
        }

        init();
    };

    return gui.SessionController;
}());
// vim:expandtab
