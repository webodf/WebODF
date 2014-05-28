/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
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

/*global runtime, core, gui, odf, ops, Node */


/**
 * @constructor
 * @param {!ops.Session} session
 * @param {!string} inputMemberId
 */
gui.SelectionController = function SelectionController(session, inputMemberId) {
    "use strict";
    var odtDocument = session.getOdtDocument(),
        domUtils = new core.DomUtils(),
        odfUtils = new odf.OdfUtils(),
        baseFilter = odtDocument.getPositionFilter(),
        keyboardMovementsFilter = new core.PositionFilterChain(),
        rootFilter = odtDocument.createRootFilter(inputMemberId),
        TRAILING_SPACE = odf.WordBoundaryFilter.IncludeWhitespace.TRAILING,
        LEADING_SPACE = odf.WordBoundaryFilter.IncludeWhitespace.LEADING,
        /**
         * @const
         * @type {!number}
         */
        PREVIOUS = -1,
        /**
         * @const
         * @type {!number}
         */
        NEXT = 1;

    /**
     * Create a new step iterator with the base Odt filter, and a root filter for the current input member.
     * The step iterator subtree is set to the root of the current cursor node
     * @return {!core.StepIterator}
     */
    function createKeyboardStepIterator() {
        var cursor = odtDocument.getCursor(inputMemberId),
            node = cursor.getNode();

        return odtDocument.createStepIterator(node, 0, [baseFilter, rootFilter], odtDocument.getRootElement(node));
    }

    /**
     * Create a new step iterator that will iterate by word boundaries
     * @param {!Node} node
     * @param {!number} offset
     * @param {!odf.WordBoundaryFilter.IncludeWhitespace} includeWhitespace
     * @return {!core.StepIterator}
     */
    function createWordBoundaryStepIterator(node, offset, includeWhitespace) {
        var wordBoundaryFilter = new odf.WordBoundaryFilter(odtDocument, includeWhitespace),
            nodeRoot = odtDocument.getRootElement(node),
            nodeRootFilter = odtDocument.createRootFilter(nodeRoot);
        return odtDocument.createStepIterator(node, offset, [baseFilter, nodeRootFilter, wordBoundaryFilter], nodeRoot);
    }

    /**
     * Derive a selection-type object from the provided cursor
     * @param {!{anchorNode: Node, anchorOffset: !number, focusNode: Node, focusOffset: !number}} selection
     * @return {{range: !Range, hasForwardSelection: !boolean}}
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
    this.selectionToRange = selectionToRange;

    /**
     * Derive a selection-type object from the provided cursor
     * @param {!Range} range
     * @param {!boolean} hasForwardSelection
     * @return {!{anchorNode: !Node, anchorOffset: !number, focusNode: !Node, focusOffset: !number}}
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
    this.rangeToSelection = rangeToSelection;

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
     * Move or extend the local member's selection to the specified focus point.
     *
     * @param {!Node} focusNode
     * @param {!number} focusOffset
     * @param {!boolean} extend Set to true to extend the selection (i.e., the current selection anchor
     *                          will remain unchanged)
     * @return {undefined}
     */
    function moveCursorFocusPoint(focusNode, focusOffset, extend) {
        var cursor,
            newSelection,
            newCursorSelection;

        cursor = odtDocument.getCursor(inputMemberId);
        newSelection = rangeToSelection(cursor.getSelectedRange(), cursor.hasForwardSelection());
        newSelection.focusNode = focusNode;
        newSelection.focusOffset = focusOffset;

        if (!extend) {
            newSelection.anchorNode = newSelection.focusNode;
            newSelection.anchorOffset = newSelection.focusOffset;
        }
        newCursorSelection = odtDocument.convertDomToCursorRange(newSelection);
        session.enqueue([createOpMoveCursor(newCursorSelection.position, newCursorSelection.length)]);
    }

    /**
     * @param {!Node} frameNode
     */
    function selectImage(frameNode) {
        var frameRoot = odtDocument.getRootElement(frameNode),
            frameRootFilter = odtDocument.createRootFilter(frameRoot),
            stepIterator = odtDocument.createStepIterator(frameNode, 0, [frameRootFilter, odtDocument.getPositionFilter()], frameRoot),
            anchorNode,
            anchorOffset,
            newSelection,
            op;

        if (!stepIterator.roundToPreviousStep()) {
            runtime.assert(false, "No walkable position before frame");
        }
        anchorNode = stepIterator.container();
        anchorOffset = stepIterator.offset();

        stepIterator.setPosition(frameNode, frameNode.childNodes.length);
        if (!stepIterator.roundToNextStep()) {
            runtime.assert(false, "No walkable position after frame");
        }

        newSelection = odtDocument.convertDomToCursorRange({
            anchorNode: anchorNode,
            anchorOffset: anchorOffset,
            focusNode: stepIterator.container(),
            focusOffset: stepIterator.offset()
        });
        op = createOpMoveCursor(newSelection.position, newSelection.length, ops.OdtCursor.RegionSelection);
        session.enqueue([op]);
    }
    this.selectImage = selectImage;

    /**
     * Expands the supplied selection to the nearest word boundaries
     * @param {!Range} range
     */
    function expandToWordBoundaries(range) {
        var stepIterator;

        stepIterator = createWordBoundaryStepIterator(/**@type{!Node}*/(range.startContainer), range.startOffset, TRAILING_SPACE);
        if (stepIterator.roundToPreviousStep()) {
            range.setStart(stepIterator.container(), stepIterator.offset());
        }

        stepIterator = createWordBoundaryStepIterator(/**@type{!Node}*/(range.endContainer), range.endOffset, LEADING_SPACE);
        if (stepIterator.roundToNextStep()) {
            range.setEnd(stepIterator.container(), stepIterator.offset());
        }
    }
    this.expandToWordBoundaries = expandToWordBoundaries;

    /**
     * Expands the supplied selection to the nearest paragraph boundaries
     * @param {!Range} range
     */
    function expandToParagraphBoundaries(range) {
        var paragraphs = odfUtils.getParagraphElements(range),
            startParagraph = paragraphs[0],
            endParagraph = paragraphs[paragraphs.length - 1];

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
    this.expandToParagraphBoundaries = expandToParagraphBoundaries;

    /**
     * Rounds to the closest available step inside the supplied root, and preferably
     * inside the original paragraph the node and offset are within. If (node, offset) is
     * outside the root, the closest root boundary is used instead.
     * This function will assert if no valid step is found within the supplied root.
     *
     * @param {!Node} root Root to contain iteration within
     * @param {!Array.<!core.PositionFilter>} filters Position filters
     * @param {!Range} range Range to modify
     * @param {!boolean} modifyStart Set to true to modify the start container & offset. If false, the end
     * container and offset will be modified instead.
     *
     * @return {undefined}
     */
    function roundToClosestStep(root, filters, range, modifyStart) {
        var stepIterator,
            node,
            offset;

        if (modifyStart) {
            node = /**@type{!Node}*/(range.startContainer);
            offset = range.startOffset;
        } else {
            node = /**@type{!Node}*/(range.endContainer);
            offset = range.endOffset;
        }

        if (!domUtils.containsNode(root, node)) {
            if (domUtils.comparePoints(root, 0, node, offset) < 0) {
                offset = 0;
            } else {
                offset = root.childNodes.length;
            }
            node = root;
        }
        stepIterator = odtDocument.createStepIterator(node, offset, filters, odfUtils.getParagraphElement(node) || root);
        if (!stepIterator.roundToClosestStep()) {
            runtime.assert(false, "No step found in requested range");
        }
        if (modifyStart) {
            range.setStart(stepIterator.container(), stepIterator.offset());
        } else {
            range.setEnd(stepIterator.container(), stepIterator.offset());
        }
    }

    /**
     * Set the user's cursor to the specified selection. If the start and end containers are in different roots,
     * the anchor's root constraint is used (the anchor is the startContainer for a forward selection, or the
     * endContainer for a reverse selection).
     *
     * If both the range start and range end are outside of the canvas element, no operations are generated.
     *
     * @param {!Range} range
     * @param {!boolean} hasForwardSelection Set to true to indicate the range is from anchor (startContainer) to focus
     * (endContainer)
     * @param {number=} clickCount A value of 2 denotes expandToWordBoundaries, while a value of 3 and above will expand
     * to paragraph boundaries.
     * @return {undefined}
     */
    function selectRange(range, hasForwardSelection, clickCount) {
        var canvasElement = odtDocument.getOdfCanvas().getElement(),
            validSelection,
            startInsideCanvas,
            endInsideCanvas,
            existingSelection,
            newSelection,
            anchorRoot,
            filters = [baseFilter],
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

        if (hasForwardSelection) {
            anchorRoot = odtDocument.getRootElement(/**@type{!Node}*/(range.startContainer));
        } else {
            anchorRoot = odtDocument.getRootElement(/**@type{!Node}*/(range.endContainer));
        }
        if (!anchorRoot) {
            // If the range end is not within a root element, use the document root instead
            anchorRoot = odtDocument.getRootNode();
        }
        filters.push(odtDocument.createRootFilter(anchorRoot));
        roundToClosestStep(anchorRoot, filters, range, true);
        roundToClosestStep(anchorRoot, filters, range, false);
        validSelection = rangeToSelection(range, hasForwardSelection);
        newSelection = odtDocument.convertDomToCursorRange(validSelection);
        existingSelection = odtDocument.getCursorSelection(inputMemberId);
        if (newSelection.position !== existingSelection.position || newSelection.length !== existingSelection.length) {
            op = createOpMoveCursor(newSelection.position, newSelection.length, ops.OdtCursor.RangeSelection);
            session.enqueue([op]);
        }
    }
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
            if (lengthAdjust > 0) {
                lengthAdjust = stepCounter.convertForwardStepsBetweenFilters(lengthAdjust, keyboardMovementsFilter, baseFilter);
            } else {
                lengthAdjust = -stepCounter.convertBackwardStepsBetweenFilters(-lengthAdjust, keyboardMovementsFilter, baseFilter);
            }

            newLength = selection.length + lengthAdjust;
            session.enqueue([createOpMoveCursor(selection.position, newLength)]);
        }
    }

    /**
     * @param {!function(!core.StepIterator):!boolean} advanceIterator
     * @return {undefined}
     */
    function extendSelection(advanceIterator) {
        var stepIterator = createKeyboardStepIterator(),
            anchorNode = odtDocument.getCursor(inputMemberId).getAnchorNode(),
            newSelection;

        if (advanceIterator(stepIterator)) {
            newSelection = odtDocument.convertDomToCursorRange({
                anchorNode: anchorNode,
                anchorOffset: 0,
                focusNode: stepIterator.container(),
                focusOffset: stepIterator.offset()
            });
            session.enqueue([createOpMoveCursor(newSelection.position, newSelection.length)]);
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
     * @param {!function(!core.StepIterator):!boolean} advanceIterator
     * @return {undefined}
     */
    function moveCursor(advanceIterator) {
        var stepIterator = createKeyboardStepIterator(),
            position;

        if (advanceIterator(stepIterator)) {
            position = odtDocument.convertDomPointToCursorStep(stepIterator.container(), stepIterator.offset());
            session.enqueue([createOpMoveCursor(position, 0)]);
        }
    }

    /**
     * @return {!boolean}
     */
    function moveCursorToLeft() {
        moveCursor(function(iterator) { return iterator.previousStep(); });
        return true;
    }
    this.moveCursorToLeft = moveCursorToLeft;

    /**
     * @return {!boolean}
     */
    function moveCursorToRight() {
        moveCursor(function(iterator) { return iterator.nextStep(); });
        return true;
    }
    this.moveCursorToRight = moveCursorToRight;

    /**
     * @return {!boolean}
     */
    function extendSelectionToLeft() {
        extendSelection(function(iterator) { return iterator.previousStep(); });
        return true;
    }
    this.extendSelectionToLeft = extendSelectionToLeft;

    /**
     * @return {!boolean}
     */
    function extendSelectionToRight() {
        extendSelection(function (iterator) { return iterator.nextStep(); });
        return true;
    }
    this.extendSelectionToRight = extendSelectionToRight;

    /**
     * @param {!number} direction PREVIOUS for upwards NEXT for downwards
     * @param {!boolean} extend
     * @return {undefined}
     */
    function moveCursorByLine(direction, extend) {
        var paragraphNode = odtDocument.getParagraphElement(odtDocument.getCursor(inputMemberId).getNode()),
            steps;

        runtime.assert(Boolean(paragraphNode), "SelectionController: Cursor outside paragraph");
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
        moveCursorByLine(PREVIOUS, false);
        return true;
    }
    this.moveCursorUp = moveCursorUp;

    /**
     * @return {!boolean}
     */
    function moveCursorDown() {
        moveCursorByLine(NEXT, false);
        return true;
    }
    this.moveCursorDown = moveCursorDown;

    /**
     * @return {!boolean}
     */
    function extendSelectionUp() {
        moveCursorByLine(PREVIOUS, true);
        return true;
    }
    this.extendSelectionUp = extendSelectionUp;

    /**
     * @return {!boolean}
     */
    function extendSelectionDown() {
        moveCursorByLine(NEXT, true);
        return true;
    }
    this.extendSelectionDown = extendSelectionDown;

    /**
     * @param {!number} direction PREVIOUS (-1) or NEXT (1)
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
     * @param {!number} direction PREVIOUS (-1) or NEXT (1)
     * @param {!boolean} extend whether extend the selection instead of moving the cursor
     * @return {undefined}
     */
    function moveCursorByWord(direction, extend) {
        var cursor = odtDocument.getCursor(inputMemberId),
            newSelection = rangeToSelection(cursor.getSelectedRange(), cursor.hasForwardSelection()),
            selectionUpdated,
            stepIterator = createWordBoundaryStepIterator(newSelection.focusNode, newSelection.focusOffset, TRAILING_SPACE);

        if (direction === PREVIOUS) {
            selectionUpdated = stepIterator.previousStep();
        } else {
            selectionUpdated = stepIterator.nextStep();
        }

        if (selectionUpdated) {
            moveCursorFocusPoint(stepIterator.container(), stepIterator.offset(), extend);
        }
    }
    
    /**
     * @return {!boolean}
     */
    function moveCursorBeforeWord() {
        moveCursorByWord(PREVIOUS, false);
        return true;
    }
    this.moveCursorBeforeWord = moveCursorBeforeWord;

    /**
     * @return {!boolean}
     */
    function moveCursorPastWord() {
        moveCursorByWord(NEXT, false);
        return true;
    }
    this.moveCursorPastWord = moveCursorPastWord;

    /**
     * @return {!boolean}
     */
    function extendSelectionBeforeWord() {
        moveCursorByWord(PREVIOUS, true);
        return true;
    }
    this.extendSelectionBeforeWord = extendSelectionBeforeWord;

    /**
     * @return {!boolean}
     */
    function extendSelectionPastWord() {
        moveCursorByWord(NEXT, true);
        return true;
    }
    this.extendSelectionPastWord = extendSelectionPastWord;

    /**
     * @return {!boolean}
     */
    function moveCursorToLineStart() {
        moveCursorToLineBoundary(PREVIOUS, false);
        return true;
    }
    this.moveCursorToLineStart = moveCursorToLineStart;

    /**
     * @return {!boolean}
     */
    function moveCursorToLineEnd() {
        moveCursorToLineBoundary(NEXT, false);
        return true;
    }
    this.moveCursorToLineEnd = moveCursorToLineEnd;

    /**
     * @return {!boolean}
     */
    function extendSelectionToLineStart() {
        moveCursorToLineBoundary(PREVIOUS, true);
        return true;
    }
    this.extendSelectionToLineStart = extendSelectionToLineStart;

    /**
     * @return {!boolean}
     */
    function extendSelectionToLineEnd() {
        moveCursorToLineBoundary(NEXT, true);
        return true;
    }
    this.extendSelectionToLineEnd = extendSelectionToLineEnd;

    /**
     * @param {!number} direction PREVIOUS (-1) or NEXT (1)
     * @param {!boolean} extend True to extend the selection
     * @param {!function(!Node):Node} getContainmentNode Returns a node container for the supplied node.
     *  Usually this will be something like the parent paragraph or root the supplied node is within
     * @return {undefined}
     */
    function adjustSelectionByNode(direction, extend, getContainmentNode) {
        var validStepFound = false,
            cursor = odtDocument.getCursor(inputMemberId),
            containmentNode,
            selection = rangeToSelection(cursor.getSelectedRange(), cursor.hasForwardSelection()),
            rootElement = odtDocument.getRootElement(selection.focusNode),
            stepIterator;

        runtime.assert(Boolean(rootElement), "SelectionController: Cursor outside root");
        stepIterator = odtDocument.createStepIterator(selection.focusNode, selection.focusOffset, [baseFilter, rootFilter], rootElement);
        stepIterator.roundToClosestStep();
        if (direction === PREVIOUS) {
            if (stepIterator.previousStep()) {
                containmentNode = getContainmentNode(stepIterator.container());
                if (containmentNode) {
                    stepIterator.setPosition(/**@type{!Node}*/(containmentNode), 0);
                    // Round up to the first walkable step in the containment node
                    validStepFound = stepIterator.roundToNextStep();
                }
            }
        } else {
            if (stepIterator.nextStep()) {
                containmentNode = getContainmentNode(stepIterator.container());
                if (containmentNode) {
                    stepIterator.setPosition(/**@type{!Node}*/(containmentNode), containmentNode.childNodes.length);
                    // Round down to the last walkable step in the containment node
                    validStepFound = stepIterator.roundToPreviousStep();
                }
            }
        }
        if (validStepFound) {
            moveCursorFocusPoint(stepIterator.container(), stepIterator.offset(), extend);
        }
    }

    /**
     * @return {!boolean}
     */
    this.extendSelectionToParagraphStart = function() {
        adjustSelectionByNode(PREVIOUS, true, odtDocument.getParagraphElement);
        return true;
    };

    /**
     * @return {!boolean}
     */
    this.extendSelectionToParagraphEnd = function () {
        adjustSelectionByNode(NEXT, true, odtDocument.getParagraphElement);
        return true;
    };

    /**
     * @return {!boolean}
     */
    this.moveCursorToParagraphStart = function () {
        adjustSelectionByNode(PREVIOUS, false, odtDocument.getParagraphElement);
        return true;
    };

    /**
     * @return {!boolean}
     */
    this.moveCursorToParagraphEnd = function () {
        adjustSelectionByNode(NEXT, false, odtDocument.getParagraphElement);
        return true;
    };

    /**
     * @return {!boolean}
     */
    this.moveCursorToDocumentStart = function () {
        adjustSelectionByNode(PREVIOUS, false, odtDocument.getRootElement);
        return true;
    };

    /**
     * @return {!boolean}
     */
    this.moveCursorToDocumentEnd = function () {
        adjustSelectionByNode(NEXT, false, odtDocument.getRootElement);
        return true;
    };

    /**
     * @return {!boolean}
     */
    this.extendSelectionToDocumentStart = function () {
        adjustSelectionByNode(PREVIOUS, true, odtDocument.getRootElement);
        return true;
    };

    /**
     * @return {!boolean}
     */
    this.extendSelectionToDocumentEnd = function () {
        adjustSelectionByNode(NEXT, true, odtDocument.getRootElement);
        return true;
    };

    /**
     * @return {!boolean}
     */
    function extendSelectionToEntireDocument() {
        var cursor = odtDocument.getCursor(inputMemberId),
            rootElement = odtDocument.getRootElement(cursor.getNode()),
            anchorNode,
            anchorOffset,
            stepIterator,
            newCursorSelection;

        runtime.assert(Boolean(rootElement), "SelectionController: Cursor outside root");
        stepIterator = odtDocument.createStepIterator(rootElement, 0, [baseFilter, rootFilter], rootElement);
        stepIterator.roundToClosestStep();
        anchorNode = stepIterator.container();
        anchorOffset = stepIterator.offset();

        stepIterator.setPosition(rootElement, rootElement.childNodes.length);
        stepIterator.roundToClosestStep();
        newCursorSelection = odtDocument.convertDomToCursorRange({
            anchorNode: anchorNode,
            anchorOffset: anchorOffset,
            focusNode: stepIterator.container(),
            focusOffset: stepIterator.offset()
        });
        session.enqueue([createOpMoveCursor(newCursorSelection.position, newCursorSelection.length)]);
        return true;
    }
    this.extendSelectionToEntireDocument = extendSelectionToEntireDocument;
    
    /**
     * @return {undefined}
     */
    function init() {
        keyboardMovementsFilter.addFilter(baseFilter);
        keyboardMovementsFilter.addFilter(odtDocument.createRootFilter(inputMemberId));
    }
    init();
};
