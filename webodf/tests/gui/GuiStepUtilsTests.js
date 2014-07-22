/**
 * Copyright (C) 2010-2014 KO GmbH <copyright@kogmbh.com>
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

/*global core, gui, Node*/

/**
 * @constructor
 * @param {!core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
gui.GuiStepUtilsTests = function GuiStepUtilsTests(runner) {
    "use strict";
    var r = runner,
        t,
        guiStepUtils = new gui.GuiStepUtils(),
        FILTER_ACCEPT = core.PositionFilter.FilterResult.FILTER_ACCEPT,
        FILTER_REJECT = core.PositionFilter.FilterResult.FILTER_REJECT,
        PREVIOUS = core.StepDirection.PREVIOUS,
        NEXT = core.StepDirection.NEXT,
        LETTER_A = /A/,
        ANY_CHAR = /[A-Z]/;

    /**
     * Create a simplified string summary of the supplied rectangles
     * @param {?ClientRect|undefined} previousRect
     * @param {?ClientRect|undefined} nextRect
     * @return {!string}
     */
    function createRectPairSummary(previousRect, nextRect) {
        function rectToString(rect) {
            return rect ? ("{left: " + rect.left + ", right: " + rect.right + "}") : "(null)";
        }
        return rectToString(previousRect) + " => " + rectToString(nextRect);
    }

    /**
     * Accepts all positions to the left of a text character
     * @constructor
     * @implements {core.PositionFilter}
     */
    function LeftOfTextFilter() {
        this.acceptPosition = function(iterator) {
            var text = /**@type{!Text}*/(iterator.container());
            if (iterator.container().nodeType === Node.TEXT_NODE
                && iterator.unfilteredDomOffset() < text.length) {
                return FILTER_ACCEPT;
            }
            return FILTER_REJECT;
        };
    }

    /**
     * Accept the a step to the left of a text character matching the supplied regular expression.
     * Terminate the iteration when the terminate regular expression matches the character to the left
     * of the current step.
     *
     * @constructor
     * @implements {gui.VisualStepScanner}
     * @param {?RegExp} tokenMatch If unspecified, never save a token
     * @param {?RegExp} terminateMatch If unspecified, never terminate iteration
     */
    function AcceptLeftOfChar(tokenMatch, terminateMatch) {
        var self = this;

        this.token = undefined;

        /**
         * @type {!Array.<!string>}
         */
        this.rects = [];

        /**
         * @type {!Array.<!string>}
         */
        this.chars = [];

        /**
         * @param {!gui.StepInfo} stepInfo
         * @param {?ClientRect} previousRect
         * @param {?ClientRect} nextRect
         * @return {!boolean}
         */
        this.process = function(stepInfo, previousRect, nextRect) {
            var container = /**@type{!Text}*/(stepInfo.container()),
                offset = stepInfo.offset(),
                leftCharacter = container.data[offset];

            self.rects.push(createRectPairSummary(previousRect, nextRect));
            self.chars.push(leftCharacter);

            if (tokenMatch && tokenMatch.test(leftCharacter)) {
                self.token = stepInfo.token;
            }

            return Boolean(terminateMatch && terminateMatch.test(leftCharacter));
        };
    }

    /**
     * Create a text node with the supplied text content
     * @param {!string} string
     * @return {!Text}
     */
    function text(string) {
        return t.doc.ownerDocument.createTextNode(string);
    }

    this.setUp = function () {
        var doc = core.UnitTest.provideTestAreaDiv(),
            iterator = new core.PositionIterator(doc);
        t = {
            doc: doc,
            steps: new core.StepIterator(new LeftOfTextFilter(), iterator)
        };
    };

    this.tearDown = function () {
        core.UnitTest.cleanupTestAreaDiv();
        t = {};
    };

    /**
     * Return an array of client rectangle pairs for each position within the text node
     * @param {!Text} textNode
     * @param {!core.StepDirection} direction
     * @return {!Array.<!string>}
     */
    function getClientRectPairs(textNode, direction) {
        var i,
            range = t.doc.ownerDocument.createRange(),
            individualRects = [],
            positionRects = [];

        for (i = 1; i < textNode.length; i += 1) {
            range.setStart(textNode, i - 1);
            range.setEnd(textNode, i);
            // See GuiStepUtils.getContentRect for notes about why this logic is
            // necessary to detect collapsed whitespace
            if (range.getBoundingClientRect().width <= 1) {
                individualRects.push(null);
            } else {
                individualRects.push(range.getBoundingClientRect());
            }
        }

        if (direction === PREVIOUS) {
            individualRects.reverse();
        }

        individualRects.forEach(function(clientRect, index) {
            positionRects.push(createRectPairSummary(individualRects[index - 1], clientRect));
        });
        positionRects.push(createRectPairSummary(individualRects[individualRects.length - 1], null));

        return positionRects;
    }


    function moveToFilteredStep_NEXT_IteratesTowardsNext() {
        t.stepScanner = new AcceptLeftOfChar(null, null);
        t.content = text("ABCD");
        t.doc.appendChild(t.content);
        t.steps.setPosition(t.content, 0);
        t.steps.roundToClosestStep();

        t.result = guiStepUtils.moveToFilteredStep(t.steps, NEXT, [t.stepScanner]);
        t.expectedRects = getClientRectPairs(t.content, NEXT);

        r.shouldBe(t, "t.result", "false");
        r.shouldBe(t, "t.stepScanner.chars", "['A', 'B', 'C', 'D']");
        r.shouldBe(t, "t.stepScanner.rects", "t.expectedRects");
        r.shouldBe(t, "t.steps.container()", "t.content");
        r.shouldBe(t, "t.steps.offset()", "0");
    }

    function moveToFilteredStep_PREVIOUS_IteratorsTowardsPrevious() {
        t.stepScanner = new AcceptLeftOfChar(null, null);
        t.content = text("ABCD");
        t.doc.appendChild(t.content);
        t.steps.setPosition(t.content, t.content.length);
        t.steps.roundToClosestStep();

        t.result = guiStepUtils.moveToFilteredStep(t.steps, PREVIOUS, [t.stepScanner]);
        t.expectedRects = getClientRectPairs(t.content, PREVIOUS);

        r.shouldBe(t, "t.result", "false");
        r.shouldBe(t, "t.stepScanner.chars", "['D', 'C', 'B', 'A']");
        r.shouldBe(t, "t.stepScanner.rects", "t.expectedRects");
        r.shouldBe(t, "t.steps.container()", "t.content");
        r.shouldBe(t, "t.steps.offset()", "t.content.length - 1"); // Closest step is to the LEFT of the last char
    }

    function moveToFilteredStep_OverCollapsedWhitespace() {
        t.stepScanner = new AcceptLeftOfChar(null, null);
        t.content = text("A  BCD");
        t.doc.appendChild(t.content);
        t.steps.setPosition(t.content, 0);
        t.steps.roundToClosestStep();

        t.result = guiStepUtils.moveToFilteredStep(t.steps, NEXT, [t.stepScanner]);
        t.expectedRects = getClientRectPairs(t.content, NEXT);

        r.shouldBe(t, "t.result", "false");
        r.shouldBe(t, "t.stepScanner.chars", "['A', ' ', ' ', 'B', 'C', 'D']");
        r.shouldBe(t, "t.stepScanner.rects", "t.expectedRects");
        r.shouldBe(t, "t.steps.container()", "t.content");
        r.shouldBe(t, "t.steps.offset()", "0");
    }

    function moveToFilteredStep_ScannerDoesntTerminateIteration_WithStep_ModifiesIterator() {
        t.stepScanner = new AcceptLeftOfChar(LETTER_A, null);
        t.content = text("BACAD");
        t.doc.appendChild(t.content);
        t.steps.setPosition(t.content, 0);
        t.steps.roundToClosestStep();

        t.result = guiStepUtils.moveToFilteredStep(t.steps, NEXT, [t.stepScanner]);

        r.shouldBe(t, "t.result", "true");
        r.shouldBe(t, "t.stepScanner.chars", "['B', 'A', 'C', 'A', 'D']");
        r.shouldBe(t, "t.steps.container()", "t.content");
        r.shouldBe(t, "t.steps.offset()", "3");
    }

    function moveToFilteredStep_ScannerDoesntTerminateIteration_WithoutStep_DoesNotModifyIterator() {
        t.stepScanner = new AcceptLeftOfChar(null, null);
        t.content = text("BACAD");
        t.doc.appendChild(t.content);
        t.steps.setPosition(t.content, 0);
        t.steps.roundToClosestStep();

        t.result = guiStepUtils.moveToFilteredStep(t.steps, NEXT, [t.stepScanner]);

        r.shouldBe(t, "t.result", "false");
        r.shouldBe(t, "t.stepScanner.chars", "['B', 'A', 'C', 'A', 'D']");
        r.shouldBe(t, "t.steps.container()", "t.content");
        r.shouldBe(t, "t.steps.offset()", "0");
    }

    function moveToFilteredStep_ScannerTerminatesIteration_WithStep_ModifiesIterator() {
        t.stepScanner = new AcceptLeftOfChar(LETTER_A, LETTER_A);
        t.content = text("BACAD");
        t.doc.appendChild(t.content);
        t.steps.setPosition(t.content, 0);
        t.steps.roundToClosestStep();

        t.result = guiStepUtils.moveToFilteredStep(t.steps, NEXT, [t.stepScanner]);

        r.shouldBe(t, "t.result", "true");
        r.shouldBe(t, "t.stepScanner.chars", "['B', 'A']");
        r.shouldBe(t, "t.steps.container()", "t.content");
        r.shouldBe(t, "t.steps.offset()", "1");
    }

    function moveToFilteredStep_ScannerTerminatesIteration_WithoutStep_DoesNotModifyIterator() {
        t.stepScanner = new AcceptLeftOfChar(null, LETTER_A);
        t.content = text("BACAD");
        t.doc.appendChild(t.content);
        t.steps.setPosition(t.content, 0);
        t.steps.roundToClosestStep();

        t.result = guiStepUtils.moveToFilteredStep(t.steps, NEXT, [t.stepScanner]);

        r.shouldBe(t, "t.result", "false");
        r.shouldBe(t, "t.stepScanner.chars", "['B', 'A']");
        r.shouldBe(t, "t.steps.container()", "t.content");
        r.shouldBe(t, "t.steps.offset()", "0");
    }

    function moveToFilteredStep_MultipleScannersTerminate_SetsToFirstValidStep() {
        var saveBEndC = new AcceptLeftOfChar(/B/, /C/),// Save B and terminate at first C
            saveAEndC = new AcceptLeftOfChar(LETTER_A, /C/),// Save A and terminate at first C
            saveAll = new AcceptLeftOfChar(ANY_CHAR, null);// Always save, never terminate

        t.stepScanner = saveAll;
        t.content = text("BACAD");
        t.doc.appendChild(t.content);
        t.steps.setPosition(t.content, 0);
        t.steps.roundToClosestStep();

        t.result = guiStepUtils.moveToFilteredStep(t.steps, NEXT, [saveAll, saveAEndC, saveBEndC]);

        r.shouldBe(t, "t.result", "true");
        r.shouldBe(t, "t.stepScanner.chars", "['B', 'A', 'C']"); // Only two steps should have been checked
        r.shouldBe(t, "t.steps.container()", "t.content");
        r.shouldBe(t, "t.steps.offset()", "1"); // Restore back to letter A
    }

    function moveToFilteredStep_NoScannersTerminate_SetsToFirstValidStep() {
        var saveA = new AcceptLeftOfChar(LETTER_A, null),
            saveAll = new AcceptLeftOfChar(ANY_CHAR, null);

        // Both filters store the last matched token but never terminate
        t.stepScanner = saveAll;
        t.content = text("BACAD");
        t.doc.appendChild(t.content);
        t.steps.setPosition(t.content, 0);
        t.steps.roundToClosestStep();

        t.result = guiStepUtils.moveToFilteredStep(t.steps, NEXT, [saveA, saveAll]);

        r.shouldBe(t, "t.result", "true");
        r.shouldBe(t, "t.stepScanner.chars", "['B', 'A', 'C', 'A', 'D']"); // All steps should be checked
        r.shouldBe(t, "t.steps.container()", "t.content");
        r.shouldBe(t, "t.steps.offset()", "3"); // Last letter A that was encountered is used
    }

    function moveToFilteredStep_OneScannerTerminatesWithStep_DoesNotModifyIterator() {
        var saveNoneTerminateA = new AcceptLeftOfChar(null, LETTER_A),
            saveAll = new AcceptLeftOfChar(ANY_CHAR, null);

        t.stepScanner = saveAll;
        t.content = text("BACAD");
        t.doc.appendChild(t.content);
        t.steps.setPosition(t.content, 0);
        t.steps.roundToClosestStep();

        t.result = guiStepUtils.moveToFilteredStep(t.steps, NEXT, [saveAll, saveNoneTerminateA]);

        r.shouldBe(t, "t.result", "false");
        r.shouldBe(t, "t.stepScanner.chars", "['B', 'A']"); // All steps should be checked
        r.shouldBe(t, "t.steps.container()", "t.content");
        r.shouldBe(t, "t.steps.offset()", "0"); // Last letter A that was encountered is used
    }

    this.tests = function () {
        return r.name([
            moveToFilteredStep_NEXT_IteratesTowardsNext,
            moveToFilteredStep_PREVIOUS_IteratorsTowardsPrevious,
            moveToFilteredStep_OverCollapsedWhitespace,

            moveToFilteredStep_ScannerDoesntTerminateIteration_WithStep_ModifiesIterator,
            moveToFilteredStep_ScannerDoesntTerminateIteration_WithoutStep_DoesNotModifyIterator,

            moveToFilteredStep_ScannerTerminatesIteration_WithStep_ModifiesIterator,
            moveToFilteredStep_ScannerTerminatesIteration_WithoutStep_DoesNotModifyIterator,

            moveToFilteredStep_MultipleScannersTerminate_SetsToFirstValidStep,
            moveToFilteredStep_NoScannersTerminate_SetsToFirstValidStep,
            moveToFilteredStep_OneScannerTerminatesWithStep_DoesNotModifyIterator
        ]);
    };

    this.asyncTests = function () {
        return [
        ];
    };
};


gui.GuiStepUtilsTests.prototype.description = function () {
    "use strict";
    return "Test the GuiStepUtils class.";
};
