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
/*global runtime, core, gui, ops, odf, window */

runtime.loadClass("ops.OpAddCursor");
runtime.loadClass("ops.OpRemoveCursor");
runtime.loadClass("ops.OpMoveCursor");
runtime.loadClass("ops.OpInsertText");
runtime.loadClass("ops.OpRemoveText");
runtime.loadClass("ops.OpSplitParagraph");
runtime.loadClass("ops.OpSetParagraphStyle");

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
        var self = this;

        function listenEvent(eventTarget, eventType, eventHandler) {
            if (eventTarget.addEventListener) {
                eventTarget.addEventListener(eventType, eventHandler, false);
            } else if (eventTarget.attachEvent) {
                eventType = "on" + eventType;
                eventTarget.attachEvent(eventType, eventHandler);
            } else {
                eventTarget["on" + eventType] = eventHandler;
            }
        }

        function removeEvent(eventTarget, eventType, eventHandler) {
            if (eventTarget.removeEventListener) {
                eventTarget.removeEventListener(eventType, eventHandler, false);
            } else if (eventTarget.detachEvent) {
                eventType = "on" + eventType;
                eventTarget.detachEvent(eventType, eventHandler);
            } else {
                eventTarget["on" + eventType] = null;
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

        /**
         * @param {!Event} e
         */
        function handleMouseUp(e) {
            var selection = runtime.getWindow().getSelection(),
                focusNode = selection.focusNode,
                focusOffset = selection.focusOffset,
                range,
                steps,
                op,
                node,
                odtDocument = session.getOdtDocument(),
                canvasElement = odtDocument.getOdfCanvas().getElement();

            // check that the node or one of its parent nodes til the canvas are
            // not belonging to a cursor, like e.g. the caret and the cursor
            // avatarflag are.
            node = focusNode;
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

            if (node !== canvasElement && focusNode !== node) {
                // This happens when the click event has been captured by a cursor or editinfo.
                // In that case, put the cursor in the capturer's container, just after it.
                focusNode = node.parentNode;
                focusOffset = Array.prototype.indexOf.call(focusNode.childNodes, node);
            }

            // save the end position
            range = focusNode.ownerDocument.createRange();
            range.setStart(focusNode, focusOffset);
            range.setEnd(focusNode, focusOffset);

            // create a move op with the distance to that position
            steps = odtDocument.getDistanceFromCursor(inputMemberId, focusNode, focusOffset);

            // Remove any possible selection now, as selections are not supported in WebODF ATM
            // Used to be done by calling "selection.collapseToStart();" but it seems that
            // older WebKits are broken and are extending the selection again on next change of the DOM,
            // extending it to node where the DOM change happens. Removing any ranges here prevents that
            selection.removeAllRanges();
            selection.addRange(range); // onpaste event requires non-empty selection to fire

            if (steps !== 0) {
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, number: steps});
                session.enqueue(op);
            }
        }

        /**
         * @return {!ops.Operation}
         */
        function createOpMoveCursor(number) {
            var op = new ops.OpMoveCursor();

            op.init({memberid: inputMemberId, number: number});
            return op;
        }

        /**
         * @return {?ops.Operation}
         */
        function createOpMoveCursorByUpKey() {
            var odtDocument = session.getOdtDocument(),
                iterator = gui.SelectionMover.createPositionIterator(odtDocument.getRootNode()),
                steps,
                cursorNode = odtDocument.getCursor(inputMemberId).getNode(),
                paragraphNode = odtDocument.getParagraphElement(cursorNode),
                op = null;

            runtime.assert(Boolean(paragraphNode), "SessionController: Cursor outside paragraph");
            steps = -odtDocument.getCursor(inputMemberId).getStepCounter().countLinesUpSteps(1, odtDocument.getPositionFilter());
            if (steps !== 0) {
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, number: steps});
            }
            return op;
        }

        /**
         * @return {?ops.Operation}
         */
        function createOpMoveCursorByDownKey() {
            var odtDocument = session.getOdtDocument(),
                iterator = gui.SelectionMover.createPositionIterator(odtDocument.getRootNode()),
                steps,
                cursorNode = odtDocument.getCursor(inputMemberId).getNode(),
                paragraphNode = odtDocument.getParagraphElement(cursorNode),
                op = null;

            runtime.assert(Boolean(paragraphNode), "SessionController: Cursor outside paragraph");
            steps = odtDocument.getCursor(inputMemberId).getStepCounter().countLinesDownSteps(1, odtDocument.getPositionFilter());
            if (steps !== 0) {
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, number: steps});
            }
            return op;
        }


        /**
         * @return {?ops.Operation}
         */
        function createOpMoveCursorByEndKey() {
            var odtDocument = session.getOdtDocument(),
                iterator = gui.SelectionMover.createPositionIterator(odtDocument.getRootNode()),
                steps,
                cursorNode = odtDocument.getCursor(inputMemberId).getNode(),
                paragraphNode = odtDocument.getParagraphElement(cursorNode),
                op = null;

            runtime.assert(Boolean(paragraphNode), "SessionController: Cursor outside paragraph");

            iterator.moveToEndOfNode(paragraphNode);
            // create a move op with the distance to that position
            steps = odtDocument.getDistanceFromCursor(inputMemberId, paragraphNode, iterator.offset());

            if (steps !== 0) {
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, number: steps});
            }

            return op;
        }

        /**
         * @return {?ops.Operation}
         */
        function createOpMoveCursorByHomeKey() {
            var odtDocument = session.getOdtDocument(),
                steps,
                paragraphNode,
                op = null;

            // TODO: instead of going to begin of paragraph go to begin of line
            paragraphNode = odtDocument.getParagraphElement(odtDocument.getCursor(inputMemberId).getNode());
            steps = odtDocument.getDistanceFromCursor(inputMemberId, paragraphNode, 0);
            if (steps !== 0) {
                op = new ops.OpMoveCursor();
                op.init({memberid: inputMemberId, number: steps});
            }
            return op;
        }

        /**
         * @return {?ops.Operation}
         */
        function createOpRemoveTextByBackspaceKey() {
            var odtDocument = session.getOdtDocument(),
                position = odtDocument.getCursorPosition(inputMemberId),
                domPosition,
                op = null;

            if (position > 0) {
                // position-1 must exist for backspace to be valid
                domPosition = odtDocument.getPositionInTextNode(position - 1);

                if (domPosition) {
                    op = new ops.OpRemoveText();
                    op.init({
                        memberid: inputMemberId,
                        position: position,
                        length: -1
                    });
                }
            }

            return op;
        }
        /**
         * @return {?ops.Operation}
         */
        function createOpRemoveTextByDeleteKey() {
            var odtDocument = session.getOdtDocument(),
                position = odtDocument.getCursorPosition(inputMemberId),
                // position+1 must exist for delete to be valid
                domPosition = odtDocument.getPositionInTextNode(position + 1),
                op = null;

            if (domPosition) {
                op = new ops.OpRemoveText();
                op.init({
                    memberid: inputMemberId,
                    position: position,
                    length: 1
                });
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
                styleName = paragraphNode.getAttributeNS(odf.Namespaces.textns, 'style-name');
                nextStyleName = odtDocument.getFormatting().getParagraphStyleAttribute(styleName, odf.Namespaces.stylens, 'next-style-name');

                if (nextStyleName && nextStyleName !== styleName) {
                    op = new ops.OpSetParagraphStyle();
                    op.init({
                        memberid: inputMemberId,
                        position: position + 1, // +1 should be at the start of the new paragraph
                        styleNameBefore: styleName,
                        styleNameAfter: nextStyleName
                    });
                    session.enqueue(op);
                }
            }
            */
        }
        /**
         * @param {!Event} e
         */
        function handleKeyDown(e) {
            var keyCode = e.keyCode,
                op = null,
                handled = false;

            if (keyCode === 37) { // left
                op = createOpMoveCursor(-1);
                handled = true;
            } else if (keyCode === 39) { // right
                op = createOpMoveCursor(1);
                handled = true;
            } else if (keyCode === 38) { // up
                // TODO: fimd a way to get the number of needed steps here, for now hardcoding 10
                op = createOpMoveCursorByUpKey();
                handled = true;
            } else if (keyCode === 40) { // down
                // TODO: fimd a way to get the number of needed steps here, for now hardcoding 10
                op = createOpMoveCursorByDownKey();
                handled = true;
            } else if (keyCode === 36) { // home
                op = createOpMoveCursorByHomeKey();
                handled = true;
            } else if (keyCode === 35) { // end
                op = createOpMoveCursorByEndKey();
                handled = true;
            } else if (keyCode === 8) { // Backspace
                op = createOpRemoveTextByBackspaceKey();
                handled = (op !== null);
            } else if (keyCode === 46) { // Delete
                op = createOpRemoveTextByDeleteKey();
                handled = (op !== null);
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
        */
        this.startEditing = function () {
            var canvasElement, op;

            canvasElement = session.getOdtDocument().getOdfCanvas().getElement();
            listenEvent(canvasElement, "keydown", handleKeyDown);
            listenEvent(canvasElement, "keypress", handleKeyPress);
            listenEvent(canvasElement, "keyup", dummyHandler);
            listenEvent(canvasElement, "copy", dummyHandler);
            listenEvent(canvasElement, "cut", dummyHandler);
            listenEvent(canvasElement, "paste", handlePaste);
            listenEvent(canvasElement, "mouseup", handleMouseUp);

            op = new ops.OpAddCursor();
            op.init({memberid: inputMemberId});
            session.enqueue(op);
        };

        /**
         */
        this.endEditing = function () {
            var canvasElement, op;

            canvasElement = session.getOdtDocument().getOdfCanvas().getElement();
            removeEvent(canvasElement, "keydown", handleKeyDown);
            removeEvent(canvasElement, "keypress", handleKeyPress);
            removeEvent(canvasElement, "keyup", dummyHandler);
            removeEvent(canvasElement, "copy", dummyHandler);
            removeEvent(canvasElement, "cut", dummyHandler);
            removeEvent(canvasElement, "paste", handlePaste);
            removeEvent(canvasElement, "mouseup", handleMouseUp);

            op = new ops.OpRemoveCursor();
            op.init({memberid: inputMemberId});
            session.enqueue(op);
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
    };

    return gui.SessionController;
}());
// vim:expandtab
