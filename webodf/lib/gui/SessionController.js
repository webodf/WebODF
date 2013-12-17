/**
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
 *
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

/*global runtime, core, gui, Node, ops, odf */

runtime.loadClass("core.DomUtils");
runtime.loadClass("core.Async");
runtime.loadClass("core.ScheduledTask");
runtime.loadClass("odf.OdfUtils");
runtime.loadClass("odf.ObjectNameGenerator");
runtime.loadClass("ops.OdtCursor");
runtime.loadClass("ops.OpAddCursor");
runtime.loadClass("ops.OpRemoveCursor");
runtime.loadClass("ops.StepsTranslator");
runtime.loadClass("gui.Clipboard");
runtime.loadClass("gui.DirectTextStyler");
runtime.loadClass("gui.DirectParagraphStyler");
runtime.loadClass("gui.KeyboardHandler");
runtime.loadClass("gui.HyperlinkClickHandler");
runtime.loadClass("gui.HyperlinkController");
runtime.loadClass("gui.ImageManager");
runtime.loadClass("gui.ImageSelector");
runtime.loadClass("gui.TextManipulator");
runtime.loadClass("gui.AnnotationController");
runtime.loadClass("gui.EventManager");
runtime.loadClass("gui.PlainTextPasteboard");

/**
 * @constructor
 * @param {!ops.Session} session
 * @param {!string} inputMemberId
 * @param {!ops.OdtCursor} shadowCursor
 * @param {!{directParagraphStylingEnabled:boolean}=} args
 * @return {?}
 */
gui.SessionController = (function () {
    "use strict";

    var /**@const*/FILTER_ACCEPT = core.PositionFilter.FilterResult.FILTER_ACCEPT;

    /**
     * @constructor
     * @param {!ops.Session} session
     * @param {!string} inputMemberId
     * @param {!ops.OdtCursor} shadowCursor
     * @param {!{directParagraphStylingEnabled:boolean}=} args
     * @return {?}
     */
    gui.SessionController = function SessionController(session, inputMemberId, shadowCursor, args) {
        var /**@type{!Window}*/window = /**@type{!Window}*/(runtime.getWindow()),
            odtDocument = session.getOdtDocument(),
            async = new core.Async(),
            domUtils = new core.DomUtils(),
            odfUtils = new odf.OdfUtils(),
            clipboard = new gui.Clipboard(),
            keyDownHandler = new gui.KeyboardHandler(),
            keyPressHandler = new gui.KeyboardHandler(),
            keyUpHandler = new gui.KeyboardHandler(),
            keyboardMovementsFilter = new core.PositionFilterChain(),
            baseFilter = odtDocument.getPositionFilter(),
            clickStartedWithinContainer = false,
            objectNameGenerator = new odf.ObjectNameGenerator(odtDocument.getOdfCanvas().odfContainer(), inputMemberId),
            isMouseMoved = false,
            mouseDownRootFilter = null,
            handleMouseClickTimeoutId,
            undoManager = null,
            eventManager = new gui.EventManager(odtDocument),
            annotationController = new gui.AnnotationController(session, inputMemberId),
            directTextStyler = new gui.DirectTextStyler(session, inputMemberId),
            directParagraphStyler = args && args.directParagraphStylingEnabled ? new gui.DirectParagraphStyler(session, inputMemberId, objectNameGenerator) : null,
            createCursorStyleOp = /**@type {function (!number, !number):ops.Operation}*/ (directTextStyler.createCursorStyleOp),
            textManipulator = new gui.TextManipulator(session, inputMemberId, createCursorStyleOp),
            imageManager = new gui.ImageManager(session, inputMemberId, objectNameGenerator),
            imageSelector = new gui.ImageSelector(odtDocument.getOdfCanvas()),
            shadowCursorIterator = gui.SelectionMover.createPositionIterator(odtDocument.getRootNode()),
            drawShadowCursorTask,
            redrawRegionSelectionTask,
            pasteHandler = new gui.PlainTextPasteboard(odtDocument, inputMemberId),
            clickCount = 0,
            hyperlinkClickHandler = new gui.HyperlinkClickHandler(odtDocument.getRootNode),
            hyperlinkController = new gui.HyperlinkController(session, inputMemberId);

        runtime.assert(window !== null,
            "Expected to be run in an environment which has a global window, like a browser.");

        keyboardMovementsFilter.addFilter('BaseFilter', baseFilter);
        keyboardMovementsFilter.addFilter('RootFilter', odtDocument.createRootFilter(inputMemberId));

        function getTarget(e) {
            // e.srcElement because IE10 likes to be different...
            return e.target || e.srcElement;
        }

        /**
         * @param {!Event} event
         * @return {undefined}
         */
        function cancelEvent(event) {
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        }

        /**
         * @param {!number} position
         * @param {!number} length
         * @param {string=} selectionType
         * @return {!ops.Operation}
         */
        function createOpMoveCursor(position, length, selectionType) {
            var op = new ops.OpMoveCursor();
            op.init({
                memberid: inputMemberId,
                position: position,
                length: length || 0,
                selectionType: selectionType
            });
            return op;
        }

        /**
         * @param {!number} x
         * @param {!number} y
         * @return {?{container:!Node, offset:!number}}
         */
        function caretPositionFromPoint(x, y) {
            var doc = odtDocument.getDOM(),
                c,
                result = null;

            if (doc.caretRangeFromPoint) {
                c = doc.caretRangeFromPoint(x, y);
                result = {
                    container: c.startContainer,
                    offset: c.startOffset
                };
            } else if (doc.caretPositionFromPoint) {
                c = doc.caretPositionFromPoint(x, y);
                if (c && c.offsetNode) {
                    result = {
                        container: c.offsetNode,
                        offset: c.offset
                    };
                }
            }
            return result;
        }

        /**
         * Expands the supplied selection to the nearest word boundaries
         * @param {!Range} range
         */
        function expandToWordBoundaries(range) {
            var alphaNumeric = /[A-Za-z0-9]/,
                iterator = gui.SelectionMover.createPositionIterator(odtDocument.getRootNode()),
                currentNode, c;

            iterator.setUnfilteredPosition(/**@type{!Node}*/(range.startContainer), range.startOffset);
            while (iterator.previousPosition()) {
                currentNode = iterator.getCurrentNode();
                if (currentNode.nodeType === Node.TEXT_NODE) {
                    c = currentNode.data[iterator.unfilteredDomOffset()];
                    if (!alphaNumeric.test(c)) {
                        break;
                    }
                } else if (!odfUtils.isTextSpan(currentNode)) {
                    break;
                }
                range.setStart(iterator.container(), iterator.unfilteredDomOffset());
            }

            iterator.setUnfilteredPosition(/**@type{!Node}*/(range.endContainer), range.endOffset);
            do {
                currentNode = iterator.getCurrentNode();
                if (currentNode.nodeType === Node.TEXT_NODE) {
                    c = currentNode.data[iterator.unfilteredDomOffset()];
                    if (!alphaNumeric.test(c)) {
                        break;
                    }
                } else if (!odfUtils.isTextSpan(currentNode)) {
                    break;
                }
            } while (iterator.nextPosition());
            range.setEnd(iterator.container(), iterator.unfilteredDomOffset());
        }

        /**
         * Expands the supplied selection to the nearest paragraph boundaries
         * @param {!Range} range
         */
        function expandToParagraphBoundaries(range) {
            var startParagraph = odtDocument.getParagraphElement(range.startContainer),
                endParagraph = odtDocument.getParagraphElement(range.endContainer);

            if (startParagraph) {
                range.setStart(startParagraph, 0);
            }

            if (endParagraph) {
                if (odfUtils.isParagraph(range.endContainer) && range.endOffset === 0) {
                    // Chrome's built-in paragraph expansion will put the end of the selection
                    // at (p,0) of the FOLLOWING paragraph. Round this back down to ensure
                    // the next paragraph doesn't get incorrectly selected
                    range.setEndBefore(endParagraph);
                } else {
                    range.setEnd(endParagraph, endParagraph.childNodes.length);
                }
            }
        }

        /**
         * @param {!Node} frameNode
         */
        function selectImage(frameNode) {
            var stepsToAnchor = odtDocument.getDistanceFromCursor(inputMemberId, frameNode, 0),
                stepsToFocus = stepsToAnchor !== null ? stepsToAnchor + 1 : null,
                oldPosition,
                op;

            if (stepsToFocus || stepsToAnchor) {
                oldPosition = odtDocument.getCursorPosition(inputMemberId);
                op = createOpMoveCursor(
                    oldPosition + stepsToAnchor,
                    stepsToFocus - stepsToAnchor,
                    ops.OdtCursor.RegionSelection
                );
                session.enqueue([op]);
            }

            // canvas element won't have focus if user click somewhere outside the canvas then drag and
            // release click inside the canvas.
            eventManager.focus();
        }

        /**
         * Derive a selection-type object from the provided cursor
         * @param {!{anchorNode: Node, anchorOffset: !number, focusNode: Node, focusOffset: !number}} selection
         * @returns {{range: !Range, hasForwardSelection: !boolean}}
         */
        function selectionToRange(selection) {
            var hasForwardSelection = domUtils.comparePoints(/**@type{!Node}*/(selection.anchorNode), selection.anchorOffset,
                                                            /**@type{!Node}*/(selection.focusNode), selection.focusOffset) >= 0,
                range = selection.focusNode.ownerDocument.createRange();
            if (hasForwardSelection) {
                range.setStart(selection.anchorNode, selection.anchorOffset);
                range.setEnd(selection.focusNode, selection.focusOffset);
            } else {
                range.setStart(selection.focusNode, selection.focusOffset);
                range.setEnd(selection.anchorNode, selection.anchorOffset);
            }
            return {
                range: range,
                hasForwardSelection: hasForwardSelection
            };
        }

        /**
         * Derive a selection-type object from the provided cursor
         * @param {!Range} range
         * @param {!boolean} hasForwardSelection
         * @returns {!{anchorNode: !Node, anchorOffset: !number, focusNode: !Node, focusOffset: !number}}
         */
        function rangeToSelection(range, hasForwardSelection) {
            if (hasForwardSelection) {
                return {
                    anchorNode: /**@type{!Node}*/(range.startContainer),
                    anchorOffset: range.startOffset,
                    focusNode: /**@type{!Node}*/(range.endContainer),
                    focusOffset: range.endOffset
                };
            }
            return {
                anchorNode: /**@type{!Node}*/(range.endContainer),
                anchorOffset: range.endOffset,
                focusNode: /**@type{!Node}*/(range.startContainer),
                focusOffset: range.startOffset
            };
        }

        /**
         * @param {Function} lookup
         * @returns {!function(!Node, !number):!function(!number, !Node, !number):!boolean}
         */
        /*jslint unparam:true*/
        function constrain(lookup) {
            return function(originalNode) {
                var originalContainer = lookup(originalNode);
                return function(step, node) {
                    return lookup(node) === originalContainer;
                };
            };
        }
        /*jslint unparam:false*/

        /**
         * @param {!Range} range
         * @param {!boolean} hasForwardSelection
         * @param {number=} clickCount
         */
        function selectRange(range, hasForwardSelection, clickCount) {
            var canvasElement = odtDocument.getOdfCanvas().getElement(),
                validSelection,
                startInsideCanvas,
                endInsideCanvas,
                existingSelection,
                newSelection,
                op;

            startInsideCanvas = domUtils.containsNode(canvasElement, range.startContainer);
            endInsideCanvas = domUtils.containsNode(canvasElement, range.endContainer);
            if (!startInsideCanvas && !endInsideCanvas) {
                return;
            }

            if (startInsideCanvas && endInsideCanvas) {
                // Expansion behaviour should only occur when double & triple clicking is inside the canvas
                if (clickCount === 2) {
                    expandToWordBoundaries(range);
                } else if (clickCount >= 3) {
                    expandToParagraphBoundaries(range);
                }
            }

            validSelection = rangeToSelection(range, hasForwardSelection);
            newSelection = odtDocument.convertDomToCursorRange(validSelection, constrain(odfUtils.getParagraphElement));
            existingSelection = odtDocument.getCursorSelection(inputMemberId);
            if (newSelection.position !== existingSelection.position || newSelection.length !== existingSelection.length) {
                op = createOpMoveCursor(newSelection.position, newSelection.length, ops.OdtCursor.RangeSelection);
                session.enqueue([op]);
            }
        }
        // TODO Extract selection functions into a standalone SelectionManipulator
        this.selectRange = selectRange;

        /**
         * @param {!number} lengthAdjust   length adjustment
         * @return {undefined}
         */
        function extendCursorByAdjustment(lengthAdjust) {
            var selection = odtDocument.getCursorSelection(inputMemberId),
                stepCounter = odtDocument.getCursor(inputMemberId).getStepCounter(),
                newLength;
            if (lengthAdjust !== 0) {
                lengthAdjust = (lengthAdjust > 0)
                    ? stepCounter.convertForwardStepsBetweenFilters(lengthAdjust, keyboardMovementsFilter, baseFilter)
                    : -stepCounter.convertBackwardStepsBetweenFilters(-lengthAdjust, keyboardMovementsFilter, baseFilter);

                newLength = selection.length + lengthAdjust;
                session.enqueue([createOpMoveCursor(selection.position, newLength)]);
            }
        }

        /**
         * @param {!number} positionAdjust   position adjustment
         * @return {undefined}
         */
        function moveCursorByAdjustment(positionAdjust) {
            var position = odtDocument.getCursorPosition(inputMemberId),
                stepCounter = odtDocument.getCursor(inputMemberId).getStepCounter();
            if (positionAdjust !== 0) {
                positionAdjust = (positionAdjust > 0)
                    ? stepCounter.convertForwardStepsBetweenFilters(positionAdjust, keyboardMovementsFilter, baseFilter)
                    : -stepCounter.convertBackwardStepsBetweenFilters(-positionAdjust, keyboardMovementsFilter, baseFilter);

                position = position + positionAdjust;
                session.enqueue([createOpMoveCursor(position, 0)]);
            }
        }

        /**
         * @return {!boolean}
         */
        function moveCursorToLeft() {
            moveCursorByAdjustment(-1);
            return true;
        }
        // TODO Extract selection functions into a standalone SelectionManipulator
        this.moveCursorToLeft = moveCursorToLeft;

        /**
         * @return {!boolean}
         */
        function moveCursorToRight() {
            moveCursorByAdjustment(1);
            return true;
        }

        /**
         * @return {!boolean}
         */
        function extendSelectionToLeft() {
            extendCursorByAdjustment(-1);
            return true;
        }

        /**
         * @return {!boolean}
         */
        function extendSelectionToRight() {
            extendCursorByAdjustment(1);
            return true;
        }

        /**
         * @param {!number} direction -1 for upwards 1 for downwards
         * @param {!boolean} extend
         * @return {undefined}
         */
        function moveCursorByLine(direction, extend) {
            var paragraphNode = odtDocument.getParagraphElement(odtDocument.getCursor(inputMemberId).getNode()),
                steps;

            runtime.assert(Boolean(paragraphNode), "SessionController: Cursor outside paragraph");
            steps = odtDocument.getCursor(inputMemberId).getStepCounter().countLinesSteps(direction, keyboardMovementsFilter);
            if (extend) {
                extendCursorByAdjustment(steps);
            } else {
                moveCursorByAdjustment(steps);
            }
        }

        /**
         * @return {!boolean}
         */
        function moveCursorUp() {
            moveCursorByLine(-1, false);
            return true;
        }

        /**
         * @return {!boolean}
         */
        function moveCursorDown() {
            moveCursorByLine(1, false);
            return true;
        }

        /**
         * @return {!boolean}
         */
        function extendSelectionUp() {
            moveCursorByLine(-1, true);
            return true;
        }

        /**
         * @return {!boolean}
         */
        function extendSelectionDown() {
            moveCursorByLine(1, true);
            return true;
        }

        /**
         * @param {!number} direction -1 for beginning 1 for end
         * @param {!boolean} extend
         * @return {undefined}
         */
        function moveCursorToLineBoundary(direction, extend) {
            var steps = odtDocument.getCursor(inputMemberId).getStepCounter().countStepsToLineBoundary(
                direction,
                keyboardMovementsFilter
            );
            if (extend) {
                extendCursorByAdjustment(steps);
            } else {
                moveCursorByAdjustment(steps);
            }
        }

        /**
         * @return {!boolean}
         */
        function moveCursorToLineStart() {
            moveCursorToLineBoundary(-1, false);
            return true;
        }

        /**
         * @return {!boolean}
         */
        function moveCursorToLineEnd() {
            moveCursorToLineBoundary(1, false);
            return true;
        }

        /**
         * @return {!boolean}
         */
        function extendSelectionToLineStart() {
            moveCursorToLineBoundary(-1, true);
            return true;
        }

        /**
         * @return {!boolean}
         */
        function extendSelectionToLineEnd() {
            moveCursorToLineBoundary(1, true);
            return true;
        }

        /**
         * @param {!number} direction -1 for beginning, 1 for end
         * @param {!function(!Node):Node} getContainmentNode Returns a node container for the supplied node.
         *  Usually this will be something like the parent paragraph or root the supplied node is within
         * @return {undefined}
         */
        function extendCursorToNodeBoundary(direction, getContainmentNode) {
            var cursor = odtDocument.getCursor(inputMemberId),
                node = getContainmentNode(cursor.getNode()),
                selection = rangeToSelection(cursor.getSelectedRange(), cursor.hasForwardSelection()),
                newCursorSelection;

            runtime.assert(Boolean(node), "SessionController: Cursor outside root");
            if (direction < 0) {
                selection.focusNode = /**@type{!Node}*/(node);
                selection.focusOffset = 0;
            } else {
                selection.focusNode = /**@type{!Node}*/(node);
                selection.focusOffset = node.childNodes.length;
            }
            newCursorSelection = odtDocument.convertDomToCursorRange(selection, constrain(getContainmentNode));
            session.enqueue([createOpMoveCursor(newCursorSelection.position, newCursorSelection.length)]);
        }

        /**
         * @return {!boolean}
         */
        function extendSelectionToParagraphStart() {
            extendCursorToNodeBoundary(-1, odtDocument.getParagraphElement);
            return true;
        }

        /**
         * @return {!boolean}
         */
        function extendSelectionToParagraphEnd() {
            extendCursorToNodeBoundary(1, odtDocument.getParagraphElement);
            return true;
        }

        /**
         * @param {!number} direction -1 for beginning, 1 for end
         * @return {!boolean}
         */
        function moveCursorToRootBoundary(direction) {
            var cursor = odtDocument.getCursor(inputMemberId),
                root = odtDocument.getRootElement(cursor.getNode()),
                newPosition;

            runtime.assert(Boolean(root), "SessionController: Cursor outside root");
            if (direction < 0) {
                // The anchor node will already be in a walkable position having just been retrieved from the cursor
                // The rounding will only impact the new focus node
                // Need to round up as (p, 0) is potentially before the first walkable position in the paragraph
                newPosition = odtDocument.convertDomPointToCursorStep(root, 0, function (step) {
                    return step === ops.StepsTranslator.NEXT_STEP;
                });
            } else {
                // Default behaviour is to round down to the previous walkable step if (p, p.childNodes.length) isn't
                // walkable. Either way, this still equates to moving to the last walkable step in the paragraph
                newPosition = odtDocument.convertDomPointToCursorStep(root, root.childNodes.length);
            }
            session.enqueue([createOpMoveCursor(newPosition, 0)]);
            return true;
        }

        /**
         * @return {!boolean}
         */
        function moveCursorToDocumentStart() {
            moveCursorToRootBoundary(-1);
            return true;
        }
        // TODO Extract selection functions into a standalone SelectionManipulator
        this.moveCursorToDocumentStart = moveCursorToDocumentStart;

        /**
         * @return {!boolean}
         */
        function moveCursorToDocumentEnd() {
            moveCursorToRootBoundary(1);
            return true;
        }
        // TODO Extract selection functions into a standalone SelectionManipulator
        this.moveCursorToDocumentEnd = moveCursorToDocumentEnd;

        /**
         * @return {!boolean}
         */
        function extendSelectionToDocumentStart() {
            extendCursorToNodeBoundary(-1, odtDocument.getRootElement);
            return true;
        }
        // TODO Extract selection functions into a standalone SelectionManipulator
        this.extendSelectionToDocumentStart = extendSelectionToDocumentStart;

        /**
         * @return {!boolean}
         */
        function extendSelectionToDocumentEnd() {
            extendCursorToNodeBoundary(1, odtDocument.getRootElement);
            return true;
        }
        // TODO Extract selection functions into a standalone SelectionManipulator
        this.extendSelectionToDocumentEnd = extendSelectionToDocumentEnd;

        /**
         * @return {!boolean}
         */
        function extendSelectionToEntireDocument() {
            var cursor = odtDocument.getCursor(inputMemberId),
                root = odtDocument.getRootElement(cursor.getNode()),
                newSelection,
                newCursorSelection;

            runtime.assert(Boolean(root), "SessionController: Cursor outside root");
            newSelection = {
                anchorNode: root,
                anchorOffset: 0,
                focusNode: root,
                focusOffset: root.childNodes.length
            };
            newCursorSelection = odtDocument.convertDomToCursorRange(newSelection, constrain(odtDocument.getRootElement));
            session.enqueue([createOpMoveCursor(newCursorSelection.position, newCursorSelection.length)]);
            return true;
        }
        // TODO Extract selection functions into a standalone SelectionManipulator
        this.extendSelectionToEntireDocument = extendSelectionToEntireDocument;

        /**
         * If the user's current selection is region selection (e.g., an image), any executed operations
         * could cause the picture to shift relative to the selection rectangle.
         * @return {undefined}
         */
        function redrawRegionSelection() {
            var cursor = odtDocument.getCursor(inputMemberId),
                imageElement;

            if (cursor && cursor.getSelectionType() === ops.OdtCursor.RegionSelection) {
                imageElement = odfUtils.getImageElements(cursor.getSelectedRange())[0];
                if (imageElement) {
                    imageSelector.select(/**@type{!Element}*/(imageElement.parentNode));
                    return;
                }
            }

            // May have just processed our own remove cursor operation...
            // In this case, clear any image selection chrome to prevent user confusion
            imageSelector.clearSelection();
        }

        /**
         * @param {!Event} event
         * @return {?string}
         */
        function stringFromKeyPress(event) {
            if (event.which === null || event.which === undefined) {
                return String.fromCharCode(event.keyCode); // IE
            }
            if (event.which !== 0 && event.charCode !== 0) {
                return String.fromCharCode(event.which);   // the rest
            }
            return null; // special key
        }

        /**
         * Handle the cut operation request
         * @param {!Event} e
         * @return {undefined}
         */
        function handleCut(e) {
            var cursor = odtDocument.getCursor(inputMemberId),
                selectedRange = cursor.getSelectedRange();

            if (selectedRange.collapsed) {
                // Modifying the clipboard data will clear any existing data,
                // so cut shouldn't touch the clipboard if there is nothing selected
                e.preventDefault();
                return;
            }

            // The document is readonly, so the data will never get placed on
            // the clipboard in most browsers unless we do it ourselves.
            if (clipboard.setDataFromRange(e, selectedRange)) {
                textManipulator.removeCurrentSelection();
            } else {
                // TODO What should we do if cut isn't supported?
                runtime.log("Cut operation failed");
            }
        }

        /**
         * Tell the browser that it's ok to perform a cut action on our read-only body
         * @returns {!boolean}
         */
        function handleBeforeCut() {
            var cursor = odtDocument.getCursor(inputMemberId),
                selectedRange = cursor.getSelectedRange();
            return selectedRange.collapsed !== false; // return false to enable cut menu... straightforward right?!
        }

        /**
         * Handle the copy operation request
         * @param {!Event} e
         * @return {undefined}
         */
        function handleCopy(e) {
            var cursor = odtDocument.getCursor(inputMemberId),
                selectedRange = cursor.getSelectedRange();

            if (selectedRange.collapsed) {
                // Modifying the clipboard data will clear any existing data,
                // so copy shouldn't touch the clipboard if there is nothing
                // selected
                e.preventDefault();
                return;
            }

            // Place the data on the clipboard ourselves to ensure consistency
            // with cut behaviours
            if (!clipboard.setDataFromRange(e, selectedRange)) {
                // TODO What should we do if copy isn't supported?
                runtime.log("Copy operation failed");
            }
        }

        /**
         * @param {!Event} e
         * @return {undefined}
         */
        function handlePaste(e) {
            var plainText;

            if (window.clipboardData && window.clipboardData.getData) { // IE
                plainText = window.clipboardData.getData('Text');
            } else if (e.clipboardData && e.clipboardData.getData) { // the rest
                plainText = e.clipboardData.getData('text/plain');
            }

            if (plainText) {
                textManipulator.removeCurrentSelection();
                session.enqueue(pasteHandler.createPasteOps(plainText));
            }
            cancelEvent(e);
        }

        /**
         * Tell the browser that it's ok to perform a paste action on our read-only body
         * @returns {!boolean}
         */
        function handleBeforePaste() {
            return false;
        }

        /**
         * @param {!ops.Operation} op
         * @return {undefined}
         */
        function updateUndoStack(op) {
            if (undoManager) {
                undoManager.onOperationExecuted(op);
            }
        }

        /**
         * @param {?Event} e
         * @return {undefined}
         */
        function forwardUndoStackChange(e) {
            odtDocument.emit(ops.OdtDocument.signalUndoStackChanged, e);
        }

        /**
         * @return {!boolean}
         */
        function undo() {
            if (undoManager) {
                undoManager.moveBackward(1);
                redrawRegionSelectionTask.trigger();
                return true;
            }

            return false;
        }

        /**
         * @return {!boolean}
         */
        function redo() {
            if (undoManager) {
                undoManager.moveForward(1);
                redrawRegionSelectionTask.trigger();
                return true;
            }

            return false;
        }

        function updateShadowCursor() {
            var selection = window.getSelection(),
                selectionRange = selection.rangeCount > 0 && selectionToRange(selection);

            if (clickStartedWithinContainer && selectionRange) {
                isMouseMoved = true;

                imageSelector.clearSelection();
                shadowCursorIterator.setUnfilteredPosition(/**@type {!Node}*/(selection.focusNode), selection.focusOffset);
                if (mouseDownRootFilter.acceptPosition(shadowCursorIterator) === FILTER_ACCEPT) {
                    if (clickCount === 2) {
                        expandToWordBoundaries(selectionRange.range);
                    } else if (clickCount >= 3) {
                        expandToParagraphBoundaries(selectionRange.range);
                    }
                    shadowCursor.setSelectedRange(selectionRange.range, selectionRange.hasForwardSelection);
                    odtDocument.emit(ops.OdtDocument.signalCursorMoved, shadowCursor);
                }
            }
        }

        /**
         * In order for drag operations to work, the browser needs to have it's current
         * selection set. This is called on mouse down to synchronize the user's last selection
         * to the browser selection
         * @param {ops.OdtCursor} cursor
         * @return {undefined}
         */
        function synchronizeWindowSelection(cursor) {
            var selection = window.getSelection(),
                range = cursor.getSelectedRange();
            if (selection.extend) {
                if (cursor.hasForwardSelection()) {
                    selection.collapse(range.startContainer, range.startOffset);
                    selection.extend(range.endContainer, range.endOffset);
                } else {
                    selection.collapse(range.endContainer, range.endOffset);
                    selection.extend(range.startContainer, range.startOffset);
                }
            } else {
                // Internet explorer does provide any method for
                // preserving the range direction
                // See http://msdn.microsoft.com/en-us/library/ie/ff974359%28v=vs.85%29.aspx
                // Unfortunately, clearing the range will also blur the current focus.
                selection.removeAllRanges();
                selection.addRange(range.cloneRange());
                /**@type{!IEElement}*/(odtDocument.getOdfCanvas().getElement()).setActive();
            }
        }

        /**
         * Updates a flag indicating whether the mouse down event occurred within the OdfCanvas element.
         * This is necessary because the mouse-up binding needs to be global in order to handle mouse-up
         * events that occur when the user releases the mouse button outside the canvas.
         * This filter limits selection changes to mouse down events that start inside the canvas
         * @param e
         */
        function handleMouseDown(e) {
            var target = getTarget(e),
                cursor = odtDocument.getCursor(inputMemberId);
            clickStartedWithinContainer = target && domUtils.containsNode(odtDocument.getOdfCanvas().getElement(), target);
            if (clickStartedWithinContainer) {
                isMouseMoved = false;
                mouseDownRootFilter = odtDocument.createRootFilter(target);
                clickCount = e.detail;
                if (cursor && e.shiftKey) {
                    // Firefox seems to get rather confused about the window selection when shift+extending it.
                    // Help this poor browser by resetting the window selection back to the anchor node if the user
                    // is holding shift.
                    window.getSelection().collapse(cursor.getAnchorNode(), 0);
                } else {
                    synchronizeWindowSelection(cursor);
                }
                if (clickCount > 1) {
                    updateShadowCursor();
                }
            }
        }

        /**
         * Return a mutable version of a selection-type object.
         * @param {?Selection} selection
         * @returns {?{anchorNode: ?Node, anchorOffset: !number, focusNode: ?Node, focusOffset: !number}}
         */
        function mutableSelection(selection) {
            if (selection) {
                return {
                    anchorNode: selection.anchorNode,
                    anchorOffset: selection.anchorOffset,
                    focusNode: selection.focusNode,
                    focusOffset: selection.focusOffset
                };
            }
            return null;
        }

        function handleMouseClickEvent(event) {
            var target = getTarget(event),
                eventDetails = {
                    detail: event.detail,
                    clientX: event.clientX,
                    clientY: event.clientY,
                    target: target
                };
            drawShadowCursorTask.processRequests(); // Resynchronise the shadow cursor before processing anything else
            if (odfUtils.isImage(target) && odfUtils.isCharacterFrame(target.parentNode)) {
                selectImage(target.parentNode);
                eventManager.focus(); // Mouse clicks often cause focus to shift. Recapture this straight away
            } else if (clickStartedWithinContainer && !imageSelector.isSelectorElement(target)) {
                if (isMouseMoved) {
                    selectRange(shadowCursor.getSelectedRange(), shadowCursor.hasForwardSelection(), event.detail);
                    eventManager.focus(); // Mouse clicks often cause focus to shift. Recapture this straight away
                } else {
                    // Clicking in already selected text won't update window.getSelection() until just after
                    // the click is processed. Set 0 timeout here so the newly clicked position can be updated
                    // by the browser. Unfortunately this is only working in Firefox. For other browsers, we have to work
                    // out the caret position from two coordinates.
                    handleMouseClickTimeoutId = runtime.setTimeout(function() {
                        var selection = mutableSelection(window.getSelection()),
                            selectionRange,
                            caretPos;
                        if (!selection.anchorNode && !selection.focusNode) {
                            // chrome & safari will report null for focus and anchor nodes after a right-click in text selection
                            caretPos = caretPositionFromPoint(eventDetails.clientX, eventDetails.clientY);
                            if (caretPos) {
                                selection.anchorNode = /**@type{!Node}*/(caretPos.container);
                                selection.anchorOffset = caretPos.offset;
                                selection.focusNode = selection.anchorNode;
                                selection.focusOffset = selection.anchorOffset;
                            }
                        }
                        // Need to check the selection again in case the caret position didn't return any result
                        if (selection.anchorNode && selection.focusNode) {
                            selectionRange = selectionToRange(selection);
                            selectRange(selectionRange.range, selectionRange.hasForwardSelection, eventDetails.detail);
                        }
                        eventManager.focus(); // Mouse clicks often cause focus to shift. Recapture this straight away
                    }, 0);
                }
            }
            clickCount = 0;
            clickStartedWithinContainer = false;
            isMouseMoved = false;
        }

        function handleDragEnd() {
            // Drag operations consume the corresponding mouse up event.
            // If this happens, the selection should still be reset.
            if (clickStartedWithinContainer) {
                eventManager.focus();
            }
            clickCount = 0;
            clickStartedWithinContainer = false;
            isMouseMoved = false;
        }

        function handleContextMenu(e) {
            // TODO Various browsers have different default behaviours on right click
            // We can detect this at runtime without doing any kind of platform sniffing
            // simply by observing what the browser has tried to do on right-click.
            // - OSX: Safari/Chrome - Expand to word boundary
            // - OSX: Firefox - No expansion
            // - Windows: Safari/Chrome/Firefox - No expansion
            handleMouseClickEvent(e);
        }

        function handleMouseUp(event) {
            var target = getTarget(event),
                annotationNode = null;

            if (target.className === "annotationRemoveButton") {
                annotationNode = domUtils.getElementsByTagNameNS(target.parentNode, odf.Namespaces.officens, 'annotation')[0];
                annotationController.removeAnnotation(annotationNode);
            } else {
                handleMouseClickEvent(event);
            }
        }

        /**
         * @return {undefined}
         */
        this.startEditing = function () {
            var op;

            odtDocument.getOdfCanvas().getElement().classList.add("virtualSelections");
            eventManager.subscribe("keydown", keyDownHandler.handleEvent);
            eventManager.subscribe("keypress", keyPressHandler.handleEvent);
            eventManager.subscribe("keyup", keyUpHandler.handleEvent);
            eventManager.subscribe("beforecut", handleBeforeCut);
            eventManager.subscribe("cut", handleCut);
            eventManager.subscribe("copy", handleCopy);
            eventManager.subscribe("beforepaste", handleBeforePaste);
            eventManager.subscribe("paste", handlePaste);
            eventManager.subscribe("mousedown", handleMouseDown);
            eventManager.subscribe("mousemove", drawShadowCursorTask.trigger);
            eventManager.subscribe("mouseup", handleMouseUp);
            eventManager.subscribe("contextmenu", handleContextMenu);
            eventManager.subscribe("dragend", handleDragEnd);

            // start maintaining the cursor selection now
            odtDocument.subscribe(ops.OdtDocument.signalOperationExecuted, redrawRegionSelectionTask.trigger);
            odtDocument.subscribe(ops.OdtDocument.signalOperationExecuted, updateUndoStack);

            op = new ops.OpAddCursor();
            op.init({memberid: inputMemberId});
            session.enqueue([op]);

            if (undoManager) {
                // For most undo managers, the initial state is a clean document *with* a cursor present
                undoManager.saveInitialState();
            }
            hyperlinkClickHandler.setEditing(true);
        };

        /**
         * @return {undefined}
         */
        this.endEditing = function () {
            var op;

            op = new ops.OpRemoveCursor();
            op.init({memberid: inputMemberId});
            session.enqueue([op]);

            if (undoManager) {
                undoManager.resetInitialState();
            }

            odtDocument.unsubscribe(ops.OdtDocument.signalOperationExecuted, updateUndoStack);
            odtDocument.unsubscribe(ops.OdtDocument.signalOperationExecuted, redrawRegionSelectionTask.trigger);

            eventManager.unsubscribe("keydown", keyDownHandler.handleEvent);
            eventManager.unsubscribe("keypress", keyPressHandler.handleEvent);
            eventManager.unsubscribe("keyup", keyUpHandler.handleEvent);
            eventManager.unsubscribe("cut", handleCut);
            eventManager.unsubscribe("beforecut", handleBeforeCut);
            eventManager.unsubscribe("copy", handleCopy);
            eventManager.unsubscribe("paste", handlePaste);
            eventManager.unsubscribe("beforepaste", handleBeforePaste);
            eventManager.unsubscribe("mousemove", drawShadowCursorTask.trigger);
            eventManager.unsubscribe("mousedown", handleMouseDown);
            eventManager.unsubscribe("mouseup", handleMouseUp);
            eventManager.unsubscribe("contextmenu", handleContextMenu);
            eventManager.unsubscribe("dragend", handleDragEnd);
            odtDocument.getOdfCanvas().getElement().classList.remove("virtualSelections");

            hyperlinkClickHandler.setEditing(false);
        };

        /**
         * @return {!string}
         */
        this.getInputMemberId = function () {
            return inputMemberId;
        };

        /**
         * @return {!ops.Session}
         */
        this.getSession = function () {
            return session;
        };

        /**
         * @param {?gui.UndoManager} manager
         * @return {undefined}
         */
        this.setUndoManager = function (manager) {
            if (undoManager) {
                undoManager.unsubscribe(gui.UndoManager.signalUndoStackChanged, forwardUndoStackChange);
            }

            undoManager = manager;
            if (undoManager) {
                undoManager.setOdtDocument(odtDocument);
                // As per gui.UndoManager, this should NOT fire any signals or report
                // events being executed back to the undo manager.
                undoManager.setPlaybackFunction(function (op) {
                    op.execute(odtDocument);
                });
                undoManager.subscribe(gui.UndoManager.signalUndoStackChanged, forwardUndoStackChange);
            }
        };

        /**
         * @returns {?gui.UndoManager}
         */
        this.getUndoManager = function () {
            return undoManager;
        };

        /**
         * @returns {?gui.AnnotationController}
         */
        this.getAnnotationController = function () {
            return annotationController;
        };

        /**
         * @returns {?gui.DirectTextStyler}
         */
        this.getDirectTextStyler = function () {
            return directTextStyler;
        };

        /**
         * @returns {?gui.DirectParagraphStyler}
         */
        this.getDirectParagraphStyler = function () {
            return directParagraphStyler;
        };

        /**
         * @returns {!gui.HyperlinkController}
         */
        this.getHyperlinkController = function () {
            return hyperlinkController;
        };

        /**
         * @returns {!gui.ImageManager}
         */
        this.getImageManager = function () {
            return imageManager;
        };

        /**
         * @returns {!gui.TextManipulator}
         */
        this.getTextManipulator = function() {
            return textManipulator;
        };

        /**
         * @returns {!gui.EventManager}
         */
        this.getEventManager = function() {
            return eventManager;
        };

        /**
         * Return the keyboard event handlers
         * @returns {{keydown: gui.KeyboardHandler, keypress: gui.KeyboardHandler}}
         */
        this.getKeyboardHandlers = function() {
            return {
                keydown: keyDownHandler,
                keypress: keyPressHandler
            };
        };

        /**
         * @param {!function(!Object=)} callback passing an error object in case of error
         * @return {undefined}
         */
        this.destroy = function(callback) {
            var destroyCallbacks = [drawShadowCursorTask.destroy, directTextStyler.destroy];
            runtime.clearTimeout(handleMouseClickTimeoutId);
            if (directParagraphStyler) {
                destroyCallbacks.push(directParagraphStyler.destroy);
            }
            async.destroyAll(destroyCallbacks, callback);
        };

        /**
         * Executes the provided function and returns true
         * Used to swallow events regardless of whether an operation was created
         * @param {!Function} fn
         * @returns {!Function}
         */
        function returnTrue(fn) {
            return function() {
                fn();
                return true;
            };
        }

        /**
         * Executes the given function only on range selection only
         * @param {!Function} fn
         * @return {!Function}
         */
        function rangeSelectionOnly(fn) {
            return function (e) {
                var selectionType = odtDocument.getCursor(inputMemberId).getSelectionType();
                if (selectionType === ops.OdtCursor.RangeSelection) {
                    return fn(e);
                }
                return true;
            };
        }

        function init() {
            var isMacOS = window.navigator.appVersion.toLowerCase().indexOf("mac") !== -1,
                modifier = gui.KeyboardHandler.Modifier,
                keyCode = gui.KeyboardHandler.KeyCode;

            drawShadowCursorTask = new core.ScheduledTask(updateShadowCursor, 0);
            redrawRegionSelectionTask = new core.ScheduledTask(redrawRegionSelection, 0);

            // TODO: deselect the currently selected image when press Esc
            // TODO: move the image selection box to next image/frame when press tab on selected image
            keyDownHandler.bind(keyCode.Tab, modifier.None, rangeSelectionOnly(function () {
                textManipulator.insertText("\t");
                return true;
            }));
            keyDownHandler.bind(keyCode.Left, modifier.None, rangeSelectionOnly(moveCursorToLeft));
            keyDownHandler.bind(keyCode.Right, modifier.None, rangeSelectionOnly(moveCursorToRight));
            keyDownHandler.bind(keyCode.Up, modifier.None, rangeSelectionOnly(moveCursorUp));
            keyDownHandler.bind(keyCode.Down, modifier.None, rangeSelectionOnly(moveCursorDown));
            // Most browsers will go back one page when given an unhandled backspace press
            // To prevent this, the event handler for this key should always return true
            keyDownHandler.bind(keyCode.Backspace, modifier.None, returnTrue(textManipulator.removeTextByBackspaceKey));
            keyDownHandler.bind(keyCode.Delete, modifier.None, textManipulator.removeTextByDeleteKey);
            keyDownHandler.bind(keyCode.Left, modifier.Shift, rangeSelectionOnly(extendSelectionToLeft));
            keyDownHandler.bind(keyCode.Right, modifier.Shift, rangeSelectionOnly(extendSelectionToRight));
            keyDownHandler.bind(keyCode.Up, modifier.Shift, rangeSelectionOnly(extendSelectionUp));
            keyDownHandler.bind(keyCode.Down, modifier.Shift, rangeSelectionOnly(extendSelectionDown));

            keyDownHandler.bind(keyCode.Home, modifier.None, rangeSelectionOnly(moveCursorToLineStart));
            keyDownHandler.bind(keyCode.End, modifier.None, rangeSelectionOnly(moveCursorToLineEnd));
            keyDownHandler.bind(keyCode.Home, modifier.Ctrl, rangeSelectionOnly(moveCursorToDocumentStart));
            keyDownHandler.bind(keyCode.End, modifier.Ctrl, rangeSelectionOnly(moveCursorToDocumentEnd));
            keyDownHandler.bind(keyCode.Home, modifier.Shift, rangeSelectionOnly(extendSelectionToLineStart));
            keyDownHandler.bind(keyCode.End, modifier.Shift, rangeSelectionOnly(extendSelectionToLineEnd));
            keyDownHandler.bind(keyCode.Up, modifier.CtrlShift, rangeSelectionOnly(extendSelectionToParagraphStart));
            keyDownHandler.bind(keyCode.Down, modifier.CtrlShift, rangeSelectionOnly(extendSelectionToParagraphEnd));
            keyDownHandler.bind(keyCode.Home, modifier.CtrlShift, rangeSelectionOnly(extendSelectionToDocumentStart));
            keyDownHandler.bind(keyCode.End, modifier.CtrlShift, rangeSelectionOnly(extendSelectionToDocumentEnd));

            if (isMacOS) {
                keyDownHandler.bind(keyCode.Clear, modifier.None, textManipulator.removeCurrentSelection);
                keyDownHandler.bind(keyCode.Left, modifier.Meta, rangeSelectionOnly(moveCursorToLineStart));
                keyDownHandler.bind(keyCode.Right, modifier.Meta, rangeSelectionOnly(moveCursorToLineEnd));
                keyDownHandler.bind(keyCode.Home, modifier.Meta, rangeSelectionOnly(moveCursorToDocumentStart));
                keyDownHandler.bind(keyCode.End, modifier.Meta, rangeSelectionOnly(moveCursorToDocumentEnd));
                keyDownHandler.bind(keyCode.Left, modifier.MetaShift, rangeSelectionOnly(extendSelectionToLineStart));
                keyDownHandler.bind(keyCode.Right, modifier.MetaShift, rangeSelectionOnly(extendSelectionToLineEnd));
                keyDownHandler.bind(keyCode.Up, modifier.AltShift, rangeSelectionOnly(extendSelectionToParagraphStart));
                keyDownHandler.bind(keyCode.Down, modifier.AltShift, rangeSelectionOnly(extendSelectionToParagraphEnd));
                keyDownHandler.bind(keyCode.Up, modifier.MetaShift, rangeSelectionOnly(extendSelectionToDocumentStart));
                keyDownHandler.bind(keyCode.Down, modifier.MetaShift, rangeSelectionOnly(extendSelectionToDocumentEnd));
                keyDownHandler.bind(keyCode.A, modifier.Meta, rangeSelectionOnly(extendSelectionToEntireDocument));
                keyDownHandler.bind(keyCode.B, modifier.Meta, rangeSelectionOnly(directTextStyler.toggleBold));
                keyDownHandler.bind(keyCode.I, modifier.Meta, rangeSelectionOnly(directTextStyler.toggleItalic));
                keyDownHandler.bind(keyCode.U, modifier.Meta, rangeSelectionOnly(directTextStyler.toggleUnderline));
                if (directParagraphStyler) {
                    keyDownHandler.bind(keyCode.L, modifier.MetaShift, rangeSelectionOnly(directParagraphStyler.alignParagraphLeft));
                    keyDownHandler.bind(keyCode.E, modifier.MetaShift, rangeSelectionOnly(directParagraphStyler.alignParagraphCenter));
                    keyDownHandler.bind(keyCode.R, modifier.MetaShift, rangeSelectionOnly(directParagraphStyler.alignParagraphRight));
                    keyDownHandler.bind(keyCode.J, modifier.MetaShift, rangeSelectionOnly(directParagraphStyler.alignParagraphJustified));
                }
                if (annotationController) {
                    keyDownHandler.bind(keyCode.C, modifier.MetaShift, annotationController.addAnnotation);
                }
                keyDownHandler.bind(keyCode.Z, modifier.Meta, undo);
                keyDownHandler.bind(keyCode.Z, modifier.MetaShift, redo);

                keyDownHandler.bind(keyCode.LeftMeta, modifier.Meta, hyperlinkClickHandler.showPointerCursor);
                keyUpHandler.bind(keyCode.LeftMeta, modifier.None, hyperlinkClickHandler.showTextCursor);
                keyDownHandler.bind(keyCode.MetaInMozilla, modifier.Meta, hyperlinkClickHandler.showPointerCursor);
                keyUpHandler.bind(keyCode.MetaInMozilla, modifier.None, hyperlinkClickHandler.showTextCursor);
            } else {
                keyDownHandler.bind(keyCode.A, modifier.Ctrl, rangeSelectionOnly(extendSelectionToEntireDocument));
                keyDownHandler.bind(keyCode.B, modifier.Ctrl, rangeSelectionOnly(directTextStyler.toggleBold));
                keyDownHandler.bind(keyCode.I, modifier.Ctrl, rangeSelectionOnly(directTextStyler.toggleItalic));
                keyDownHandler.bind(keyCode.U, modifier.Ctrl, rangeSelectionOnly(directTextStyler.toggleUnderline));
                if (directParagraphStyler) {
                    keyDownHandler.bind(keyCode.L, modifier.CtrlShift, rangeSelectionOnly(directParagraphStyler.alignParagraphLeft));
                    keyDownHandler.bind(keyCode.E, modifier.CtrlShift, rangeSelectionOnly(directParagraphStyler.alignParagraphCenter));
                    keyDownHandler.bind(keyCode.R, modifier.CtrlShift, rangeSelectionOnly(directParagraphStyler.alignParagraphRight));
                    keyDownHandler.bind(keyCode.J, modifier.CtrlShift, rangeSelectionOnly(directParagraphStyler.alignParagraphJustified));
                }
                if (annotationController) {
                    keyDownHandler.bind(keyCode.C, modifier.CtrlAlt, annotationController.addAnnotation);
                }
                keyDownHandler.bind(keyCode.Z, modifier.Ctrl, undo);
                keyDownHandler.bind(keyCode.Z, modifier.CtrlShift, redo);

                keyDownHandler.bind(keyCode.Ctrl, modifier.Ctrl, hyperlinkClickHandler.showPointerCursor);
                keyUpHandler.bind(keyCode.Ctrl, modifier.None, hyperlinkClickHandler.showTextCursor);
            }

            // the default action is to insert text into the document
            keyPressHandler.setDefault(rangeSelectionOnly(function (e) {
                var text = stringFromKeyPress(e);
                if (text && !(e.altKey || e.ctrlKey || e.metaKey)) {
                    textManipulator.insertText(text);
                    return true;
                }
                return false;
            }));
            keyPressHandler.bind(keyCode.Enter, modifier.None, rangeSelectionOnly(textManipulator.enqueueParagraphSplittingOps));

            eventManager.subscribe("click", hyperlinkClickHandler.handleClick);
        }

        init();
    };

    return gui.SessionController;
}());
// vim:expandtab
