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

/*global runtime, gui, ops, odf, core*/

/**
 * Provides a method to paste text at the current cursor
 * position, and processes the input string to understand
 * special structuring such as paragraph splits.
 * @implements {core.Destroyable}
 * @param {!ops.Session} session
 * @param {!gui.SessionConstraints} sessionConstraints
 * @param {!gui.SessionContext} sessionContext
 * @param {!string} inputMemberId
 * @constructor
 */
gui.PasteController = function PasteController(session, sessionConstraints, sessionContext, inputMemberId) {
    "use strict";

    var odtDocument = session.getOdtDocument(),
        isEnabled = false,
        /**@const*/
        textns = odf.Namespaces.textns,
        /**@const*/
        NEXT = core.StepDirection.NEXT,
        odfUtils = odf.OdfUtils;

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
     * @param {!string} data
     * @return {undefined}
     */
    this.paste = function (data) {
        if (!isEnabled) {
            return;
        }

        var originalCursorPosition = odtDocument.getCursorPosition(inputMemberId),
            cursorNode = odtDocument.getCursor(inputMemberId).getNode(),
            originalParagraph = /**@type{!Element}*/(odfUtils.getParagraphElement(cursorNode)),
            paragraphStyle = originalParagraph.getAttributeNS(textns, "style-name") || "",
            /**@type{number}*/
            cursorPosition = originalCursorPosition,
            operations = [],
            currentParagraphStartPosition = odtDocument.convertDomPointToCursorStep(originalParagraph, 0, NEXT),
            paragraphs;

        paragraphs = data.replace(/\r/g, "").split("\n");
        paragraphs.forEach(function (text) {
            var insertTextOp = new ops.OpInsertText(),
                splitParagraphOp = new ops.OpSplitParagraph();

            insertTextOp.init({
                memberid: inputMemberId,
                position: cursorPosition,
                text: text,
                moveCursor: true
            });
            operations.push(insertTextOp);
            cursorPosition += text.length;

            splitParagraphOp.init({
                memberid: inputMemberId,
                position: cursorPosition,
                paragraphStyleName: paragraphStyle,
                sourceParagraphPosition: currentParagraphStartPosition,
                moveCursor: true
            });
            operations.push(splitParagraphOp);
            cursorPosition += 1; // Splitting a paragraph introduces 1 walkable position, bumping the cursor forward
            currentParagraphStartPosition = cursorPosition; // Reset the source paragraph to the newly created one
        });

        // Discard the last split paragraph op as unnecessary.
        // Reasoning through the scenarios, this produces the most intuitive behaviour:
        // 1. Paste a single line - No line split should be added
        // 2. Paste two lines - Only one paragraph split is necessary per new paragraph. As pasting MUST occur within an
        //                      existing paragraph, only a single split should occur.
        operations.pop();

        session.enqueue(operations);
    };

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
