/**
 * @license
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

/*global core, ops, gui, odf, runtime*/


/**
 * @constructor
 * @param {!ops.Session} session
 * @param {!string} inputMemberId
 * @param {function(!number, !number, !boolean):ops.Operation} directStyleOp
 * @param {function(!number):!Array.<!ops.Operation>} paragraphStyleOps
 */
gui.TextController = function TextController(session, inputMemberId, directStyleOp, paragraphStyleOps) {
    "use strict";

    var odtDocument = session.getOdtDocument(),
        odfUtils = new odf.OdfUtils(),
        /**
         * @const
         * @type {!boolean}
         */
        BACKWARD = false,
        /**
         * @const
         * @type {!boolean}
         */
        FORWARD = true;

    /**
     * Creates an operation to remove the provided selection
     * @param {!{position: number, length: number}} selection
     * @return {!ops.OpRemoveText}
     */
    function createOpRemoveSelection(selection) {
        var range = odtDocument.convertCursorToDomRange(selection.position, selection.length),
            firstParagraph,
            lastParagraph,
            mergedParagraphStyleName,
            op = new ops.OpRemoveText();

        firstParagraph = /**@type{!Element}*/(odtDocument.getParagraphElement(range.startContainer));
        lastParagraph = odtDocument.getParagraphElement(range.endContainer);
        // If the removal range spans several paragraphs,
        // decide the final paragraph's style name.
        if (firstParagraph !== lastParagraph) {
            // If the first paragraph is empty, the last paragraph's style wins,
            // otherwise the first wins.

            // According to https://developer.mozilla.org/en-US/docs/Web/API/element.getAttributeNS, if there is no
            // explicitly defined style, getAttributeNS might return either "" or null or undefined depending on the
            // implementation. Simplify the operation by combining all these cases to be ""
            if (odfUtils.hasNoODFContent(firstParagraph)) {
                mergedParagraphStyleName = lastParagraph.getAttributeNS(odf.Namespaces.textns, 'style-name') || "";
            } else {
                mergedParagraphStyleName = firstParagraph.getAttributeNS(odf.Namespaces.textns, 'style-name') || "";
            }
        }

        op.init({
            memberid: inputMemberId,
            position: selection.position,
            length: selection.length,
            mergedParagraphStyleName: mergedParagraphStyleName
        });
        return op;
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
        var selection = toForwardSelection(odtDocument.getCursorSelection(inputMemberId)),
            op, operations = [], styleOps;

        if (selection.length > 0) {
            op = createOpRemoveSelection(selection);
            operations.push(op);
        }

        op = new ops.OpSplitParagraph();
        op.init({
            memberid: inputMemberId,
            position: selection.position,
            moveCursor: true
        });
        operations.push(op);

        // disabled for now, because nowjs seems to revert the order of the ops, which does not work here TODO: grouping of ops
        /*
         if (isAtEndOfParagraph) {
            paragraphNode = odtDocument.getParagraphElement(odtDocument.getCursor(inputMemberId).getNode());
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
        var cursorNode,
            selection = toForwardSelection(odtDocument.getCursorSelection(inputMemberId)),
            stepIterator,
            op = null;

        if (selection.length === 0) {
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
                op = createOpRemoveSelection(selection);
                session.enqueue([op]);
            }
        } else {
            op = createOpRemoveSelection(selection);
            session.enqueue([op]);
        }
        return op !== null;
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
        var selection = toForwardSelection(odtDocument.getCursorSelection(inputMemberId)),
            op;
        if (selection.length !== 0) {
            op = createOpRemoveSelection(selection);
            session.enqueue([op]);
        }
        return true; // The function is always considered handled, even if nothing is removed
    };

    /**
     * Removes currently selected text (if any) before inserting the supplied text.
     * @param {!string} text
     * @return {undefined}
     */
    function insertText(text) {
        var selection = toForwardSelection(odtDocument.getCursorSelection(inputMemberId)),
            op, stylingOp, operations = [], useCachedStyle = false;

        if (selection.length > 0) {
            op = createOpRemoveSelection(selection);
            operations.push(op);
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
};
