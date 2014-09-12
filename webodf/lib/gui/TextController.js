/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
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

/*global core, ops, gui, odf, runtime*/

/**
 * @constructor
 * @implements {core.Destroyable}
 * @param {!ops.Session} session
 * @param {!gui.SessionConstraints} sessionConstraints
 * @param {!gui.SessionContext} sessionContext
 * @param {!string} inputMemberId
 * @param {function(!number, !number, !boolean):ops.Operation} directStyleOp
 * @param {function(!number):!Array.<!ops.Operation>} paragraphStyleOps
 */
gui.TextController = function TextController(
    session,
    sessionConstraints,
    sessionContext,
    inputMemberId,
    directStyleOp,
    paragraphStyleOps
    ) {
    "use strict";

    var odtDocument = session.getOdtDocument(),
        odfUtils = odf.OdfUtils,
        domUtils = core.DomUtils,
        /**
         * @const
         * @type {!boolean}
         */
        BACKWARD = false,
        /**
         * @const
         * @type {!boolean}
         */
        FORWARD = true,
        isEnabled = false,
        /** @const */
        textns = odf.Namespaces.textns,
        /**@const*/
        NEXT = core.StepDirection.NEXT;

    /**
     * @return {undefined}
     */
    function updateEnabledState() {
        if (sessionConstraints.getState(gui.CommonConstraints.EDIT.REVIEW_MODE) === true) {
            isEnabled = /**@type{!boolean}*/(sessionContext.isLocalCursorWithinOwnAnnotation());
        } else {
            isEnabled = true;
        }
    }

    /**
     * @param {!ops.OdtCursor} cursor
     * @return {undefined}
     */
    function onCursorEvent(cursor) {
        if (cursor.getMemberId() === inputMemberId) {
            updateEnabledState();
        }
    }

    /**
     * @return {!boolean}
     */
    this.isEnabled = function () {
        return isEnabled;
    };

    /**
     * Return the equivalent cursor range of the specified DOM range.
     * This is found by rounding the range's start and end DOM points to the closest step as defined by the document's
     * position filter (and optionally the root filter as well).
     *
     * @param {!Range} range Range to convert to an equivalent cursor selection
     * @param {!Element} subTree Subtree to limit step searches within. E.g., limit to steps within a certain paragraph.
     * @param {!boolean} withRootFilter Specify true to restrict steps to be within the same root as the range's
     *      start container.
     * @return {!{position: !number, length: !number}}
     */
    function domToCursorRange(range, subTree, withRootFilter) {
        var filters = [odtDocument.getPositionFilter()],
            startStep,
            endStep,
            stepIterator;

        if (withRootFilter) {
            filters.push(odtDocument.createRootFilter(/**@type{!Node}*/(range.startContainer)));
        }

        stepIterator = odtDocument.createStepIterator(/**@type{!Node}*/(range.startContainer), range.startOffset,
                                                            filters, subTree);
        if (!stepIterator.roundToClosestStep()) {
            runtime.assert(false, "No walkable step found in paragraph element at range start");
        }
        startStep = odtDocument.convertDomPointToCursorStep(stepIterator.container(), stepIterator.offset());

        if (range.collapsed) {
            endStep = startStep;
        } else {
            stepIterator.setPosition(/**@type{!Node}*/(range.endContainer), range.endOffset);
            if (!stepIterator.roundToClosestStep()) {
                runtime.assert(false, "No walkable step found in paragraph element at range end");
            }
            endStep = odtDocument.convertDomPointToCursorStep(stepIterator.container(), stepIterator.offset());
        }
        return {
            position: /**@type{!number}*/(startStep),
            length: /**@type{!number}*/(endStep - startStep)
        };
    }

    /**
     * Creates operations to remove the provided selection and update the destination
     * paragraph's style if necessary.
     * @param {!Range} range
     * @return {!Array.<!ops.Operation>}
     */
    function createRemoveSelectionOps(range) {
        var firstParagraph,
            lastParagraph,
            mergedParagraphStyleName,
            previousParagraphStart,
            paragraphs = odfUtils.getParagraphElements(range),
            paragraphRange = /**@type{!Range}*/(range.cloneRange()),
            operations = [];

        // If the removal range spans several paragraphs, decide the final paragraph's style name.
        firstParagraph = paragraphs[0];
        if (paragraphs.length > 1) {
            if (odfUtils.hasNoODFContent(firstParagraph)) {
                // If the first paragraph is empty, the last paragraph's style wins, otherwise the first wins.
                lastParagraph = paragraphs[paragraphs.length - 1];
                mergedParagraphStyleName = lastParagraph.getAttributeNS(odf.Namespaces.textns, 'style-name') || "";

                // Side note:
                // According to https://developer.mozilla.org/en-US/docs/Web/API/element.getAttributeNS, if there is no
                // explicitly defined style, getAttributeNS might return either "" or null or undefined depending on the
                // implementation. Simplify the operation by combining all these cases to be ""
            } else {
                mergedParagraphStyleName = firstParagraph.getAttributeNS(odf.Namespaces.textns, 'style-name') || "";
            }
        }

        // Note, the operations are built up in reverse order to the paragraph DOM order. This prevents the need for
        // any translation of paragraph start limits as the last paragraph will be removed and merged first
        paragraphs.forEach(function(paragraph, index) {
            var paragraphStart,
                removeLimits,
                intersectionRange,
                removeOp,
                mergeOp;

            paragraphRange.setStart(paragraph, 0);
            paragraphRange.collapse(true);
            paragraphStart = domToCursorRange(paragraphRange, paragraph, false).position;
            if (index > 0) {
                mergeOp = new ops.OpMergeParagraph();
                mergeOp.init({
                    memberid: inputMemberId,
                    paragraphStyleName: mergedParagraphStyleName,
                    destinationStartPosition: previousParagraphStart,
                    sourceStartPosition: paragraphStart,
                    // For perf reasons, only the very last merge paragraph op should move the cursor
                    moveCursor: index === 1
                });
                operations.unshift(mergeOp);
            }
            previousParagraphStart = paragraphStart;

            paragraphRange.selectNodeContents(paragraph);
            // The paragraph limits will differ from the text remove limits if either
            // 1. the remove range starts within an different inline root such as within an annotation
            // 2. the remove range doesn't cover the entire paragraph (i.e., it starts or ends within the paragraph)
            intersectionRange = domUtils.rangeIntersection(paragraphRange, range);
            if (intersectionRange) {
                removeLimits = domToCursorRange(intersectionRange, paragraph, true);

                if (removeLimits.length > 0) {
                    removeOp = new ops.OpRemoveText();
                    removeOp.init({
                        memberid: inputMemberId,
                        position: removeLimits.position,
                        length: removeLimits.length
                    });
                    operations.unshift(removeOp);
                }
            }
        });

        return operations;
    }

    /**
     * Ensures the provided selection is a "forward" selection (i.e., length is positive)
     * @param {!{position: number, length: number}} selection
     * @return {!{position: number, length: number}}
     */
    function toForwardSelection(selection) {
        if (selection.length < 0) {
            selection.position += selection.length;
            selection.length = -selection.length;
        }
        return selection;
    }

    /**
     * Insert a paragraph break at the current cursor location. Will remove any currently selected text first
     * @return {!boolean}
     */
    this.enqueueParagraphSplittingOps = function() {
        if (!isEnabled) {
            return false;
        }

        var cursor = odtDocument.getCursor(inputMemberId),
            range = cursor.getSelectedRange(),
            selection = toForwardSelection(odtDocument.getCursorSelection(inputMemberId)),
            op,
            operations = [],
            styleOps,
            originalParagraph = /**@type{!Element}*/(odfUtils.getParagraphElement(cursor.getNode())),
            paragraphStyle = originalParagraph.getAttributeNS(textns, "style-name") || "";

        if (selection.length > 0) {
            operations = operations.concat(createRemoveSelectionOps(range));
        }

        op = new ops.OpSplitParagraph();
        op.init({
            memberid: inputMemberId,
            position: selection.position,
            paragraphStyleName: paragraphStyle,
            sourceParagraphPosition: odtDocument.convertDomPointToCursorStep(originalParagraph, 0, NEXT),
            moveCursor: true
        });
        operations.push(op);

        // disabled for now, because nowjs seems to revert the order of the ops, which does not work here TODO: grouping of ops
        /*
         if (isAtEndOfParagraph) {
            paragraphNode = odfUtils.getParagraphElement(odtDocument.getCursor(inputMemberId).getNode());
            nextStyleName = odtDocument.getFormatting().getParagraphStyleAttribute(styleName, odf.Namespaces.stylens, 'next-style-name');

            if (nextStyleName && nextStyleName !== styleName) {
                op = new ops.OpSetParagraphStyle();
                op.init({
                    memberid: inputMemberId,
                    position: position + 1, // +1 should be at the start of the new paragraph
                    styleName: nextStyleName
                });
                operations.push(op);
            }
         }
         */

        if (paragraphStyleOps) {
            styleOps = paragraphStyleOps(selection.position + 1);
            operations = operations.concat(styleOps);
        }
        session.enqueue(operations);
        return true;
    };

    /**
     * Checks if there are any walkable positions in the specified direction within
     * the current root, starting at the specified node.
     * The iterator is constrained within the root element for the current cursor position so
     * iteration will stop once the root is entirely walked in the requested direction
     * @param {!Element} cursorNode
     * @return {!core.StepIterator}
     */
    function createStepIterator(cursorNode) {
        var cursorRoot = odtDocument.getRootElement(cursorNode),
            filters = [odtDocument.getPositionFilter(), odtDocument.createRootFilter(cursorRoot)];

        return odtDocument.createStepIterator(cursorNode, 0, filters, cursorRoot);
    }

    /**
     * Remove the current selection, or if the cursor is collapsed, remove the next step
     * in the specified direction.
     *
     * @param {!boolean} isForward True indicates delete the next step. False indicates delete the previous step
     * @return {!boolean}
     */
    function removeTextInDirection(isForward) {
        if (!isEnabled) {
            return false;
        }

        var cursorNode,
            // Take a clone of the range as it will be modified if the selection length is 0
            range = /**@type{!Range}*/(odtDocument.getCursor(inputMemberId).getSelectedRange().cloneRange()),
            selection = toForwardSelection(odtDocument.getCursorSelection(inputMemberId)),
            stepIterator;

        if (selection.length === 0) {
            selection = undefined;
            cursorNode = odtDocument.getCursor(inputMemberId).getNode();
            stepIterator = createStepIterator(cursorNode);
            // There must be at least one more step in the root same root as the cursor node
            // in order to do something if there is no selected text
            // TODO Superstition alert - Step rounding is probably not necessary as cursor should always be at a step
            if (stepIterator.roundToClosestStep()
                    && (isForward ? stepIterator.nextStep() : stepIterator.previousStep())) {
                selection = toForwardSelection(odtDocument.convertDomToCursorRange({
                    anchorNode: cursorNode,
                    anchorOffset: 0,
                    focusNode: stepIterator.container(),
                    focusOffset: stepIterator.offset()
                }));
                if (isForward) {
                    range.setStart(cursorNode, 0);
                    range.setEnd(stepIterator.container(), stepIterator.offset());
                } else {
                    range.setStart(stepIterator.container(), stepIterator.offset());
                    range.setEnd(cursorNode, 0);
                }
            }
        }
        if (selection) {
            session.enqueue(createRemoveSelectionOps(range));
        }
        return selection !== undefined;
    }

    /**
     * Removes the currently selected content. If no content is selected and there is at least
     * one character to the left of the current selection, that character will be removed instead.
     * @return {!boolean}
     */
    this.removeTextByBackspaceKey = function () {
        return removeTextInDirection(BACKWARD);
    };

    /**
     * Removes the currently selected content. If no content is selected and there is at least
     * one character to the right of the current selection, that character will be removed instead.
     * @return {!boolean}
     */
    this.removeTextByDeleteKey = function () {
        return removeTextInDirection(FORWARD);
    };

    /**
     * Removes the currently selected content
     * @return {!boolean}
     */
    this.removeCurrentSelection = function () {
        if (!isEnabled) {
            return false;
        }

        var range = odtDocument.getCursor(inputMemberId).getSelectedRange();
        session.enqueue(createRemoveSelectionOps(range));
        return true; // The function is always considered handled, even if nothing is removed
    };

    /**
     * Removes currently selected text (if any) before inserting the supplied text.
     * @param {!string} text
     * @return {undefined}
     */
    function insertText(text) {
        if (!isEnabled) {
            return;
        }

        var range = odtDocument.getCursor(inputMemberId).getSelectedRange(),
            selection = toForwardSelection(odtDocument.getCursorSelection(inputMemberId)),
            op, stylingOp, operations = [], useCachedStyle = false;

        if (selection.length > 0) {
            operations = operations.concat(createRemoveSelectionOps(range));
            useCachedStyle = true;
        }

        op = new ops.OpInsertText();
        op.init({
            memberid: inputMemberId,
            position: selection.position,
            text: text,
            moveCursor: true
        });
        operations.push(op);
        if (directStyleOp) {
            stylingOp = directStyleOp(selection.position, text.length, useCachedStyle);
            if (stylingOp) {
                operations.push(stylingOp);
            }
        }
        session.enqueue(operations);
    }
    this.insertText = insertText;

    /**
     * @param {!function(!Error=)} callback, passing an error object in case of error
     * @return {undefined}
     */
    this.destroy = function (callback) {
        odtDocument.unsubscribe(ops.Document.signalCursorMoved, onCursorEvent);
        sessionConstraints.unsubscribe(gui.CommonConstraints.EDIT.REVIEW_MODE, updateEnabledState);
        callback();
    };

    function init() {
        odtDocument.subscribe(ops.Document.signalCursorMoved, onCursorEvent);
        sessionConstraints.subscribe(gui.CommonConstraints.EDIT.REVIEW_MODE, updateEnabledState);
        updateEnabledState();
    }
    init();
};
