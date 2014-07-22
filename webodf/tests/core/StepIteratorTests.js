/**
 * Copyright (C) 2014 KO GmbH <copyright@kogmbh.com>
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

/*global core, runtime, Node*/

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
core.StepIteratorTests = function StepIteratorTests(runner) {
    "use strict";
    var r = runner, t = {},
        document = runtime.getWindow().document,
        FILTER_ACCEPT = core.PositionFilter.FilterResult.FILTER_ACCEPT,
        FILTER_REJECT = core.PositionFilter.FilterResult.FILTER_REJECT;

    /**
     * Accepts positions that are just to the left of a number. All other positions are rejected
     * @constructor
     * @implements {core.PositionFilter}
     */
    function LeftOfNumberFilter() {
        function isLeftOfNumber(node, offset) {
            return node && node.nodeType === Node.TEXT_NODE && offset < node.length && /[0-9]/.test(node.data[offset]);
        }

        this.acceptPosition = function(iterator) {
            var container = iterator.container(),
                offset = iterator.unfilteredDomOffset();

            if (isLeftOfNumber(container, offset) || isLeftOfNumber(container.childNodes[offset], 0)) {
                return FILTER_ACCEPT;
            }
            return FILTER_REJECT;
        };
    }

    this.setUp = function () {
        var doc = core.UnitTest.provideTestAreaDiv(),
            iterator = new core.PositionIterator(doc);
        t = {
            doc: doc,
            range: document.createRange(),
            steps: new core.StepIterator(new LeftOfNumberFilter(), iterator)
        };
    };

    this.tearDown = function () {
        t.range.detach();
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };

    /**
     * Create a text node with the supplied text content
     * @param {!string} string
     * @return {!Text}
     */
    function text(string) {
        return t.doc.ownerDocument.createTextNode(string);
    }

    /**
     * Perform an iteration test
     * @param {!string} string text content to put into the container
     * @param {!number} originalOffset Original offset to set the iterator to
     * @param {!number|!boolean} expectedOffset Expected offset the step should be found at, or false if
     *   no accepted step should be found.
     * @param {!function():!boolean} move Function to call to move the iterator
     * @return {undefined}
     */
    function performTest(string, originalOffset, expectedOffset, move) {
        t.doc.appendChild(text(string));
        t.steps.setPosition(t.doc.firstChild, originalOffset);
        if (expectedOffset !== false) {
            t.expectedOffset = expectedOffset;
            t.isStep = true;
        } else {
            t.isStep = false;
        }

        t.result = move();

        r.shouldBe(t, "t.result", "t.isStep");
        r.shouldBe(t, "t.steps.isStep()", "t.isStep");
        if (expectedOffset !== false) {
            r.shouldBe(t, "t.steps.container()", "t.doc.firstChild");
            r.shouldBe(t, "t.steps.offset()", "t.expectedOffset");
        }
    }

    function isStep_WhenAtStep_ReturnsTrue() {
        t.doc.appendChild(text("A1B"));
        t.steps.setPosition(t.doc.firstChild, 1);

        r.shouldBe(t, "t.steps.isStep()", "true");
    }

    function isStep_WhenNotAtStep_ReturnsFalse() {
        t.doc.appendChild(text("A1B"));
        t.steps.setPosition(t.doc.firstChild, 0);

        r.shouldBe(t, "t.steps.isStep()", "false");
    }

    function roundToClosestStep_OnStep_ReturnsTrue() {
        performTest("A1BBBB1", 1, 1, t.steps.roundToClosestStep);
    }

    function roundToClosestStep_RoundsToPreviousStep_ByDefault() {
        performTest("A1BBBB1", 4, 1, t.steps.roundToClosestStep);
    }

    function roundToClosestStep_WhenNoPrevious_RoundsToNextStep() {
        performTest("ABBB1B", 1, 4, t.steps.roundToClosestStep);
    }

    function roundToClosestStep_WhenNoAvailableStep_ReturnsFalse() {
        performTest("ABBBB", 1, false, t.steps.roundToClosestStep);
    }

    function roundToPreviousStep_OnStep_ReturnsTrue() {
        performTest("A1BBBB1", 1, 1, t.steps.roundToPreviousStep);
    }

    function roundToPreviousStep_RoundToPreviousStep_ReturnsTrue() {
        performTest("A1BBBB1", 3, 1, t.steps.roundToPreviousStep);
    }

    function roundToPreviousStep_WhenNoAvailableStep_ReturnsFalse() {
        performTest("ABBBB", 1, false, t.steps.roundToPreviousStep);
    }

    function roundToNextStep_OnStep_ReturnsTrue() {
        performTest("A1BBBB1", 1, 1, t.steps.roundToNextStep);
    }

    function roundToNextStep_RoundToNextStep_ReturnsTrue() {
        performTest("A1BBBB1", 3, 6, t.steps.roundToNextStep);
    }

    function roundToNextStep_WhenNoAvailableStep_ReturnsFalse() {
        performTest("ABBBB", 1, false, t.steps.roundToNextStep);
    }

    function nextStep_WhenNoAvailableStep_ReturnsFalse() {
        performTest("ABBBB", 1, false, t.steps.nextStep);
    }

    function nextStep_OnStep_MovesToStep_ReturnsTrue() {
        performTest("A1BBB1B", 1, 5, t.steps.nextStep);
    }

    function nextStep_AfterStep_MovesToStep_ReturnsTrue() {
        performTest("A1BBB1B", 2, 5, t.steps.nextStep);
    }

    function previousStep_WhenNoAvailableStep_ReturnsFalse() {
        performTest("ABBBB", 1, false, t.steps.previousStep);
    }

    function previousStep_OnStep_MovesToStep_ReturnsTrue() {
        performTest("A1BBB1B", 5, 1, t.steps.previousStep);
    }

    function previousStep_BeforeStep_MovesToStep_ReturnsTrue() {
        performTest("A1BBB1B", 3, 1, t.steps.previousStep);
    }

    function snapshotAndRestore_ResetsIteratorToRestoredPosition() {
        var snapshot;

        t.doc.appendChild(text("A1AB1B"));
        t.steps.setPosition(t.doc.firstChild, 0);

        t.steps.roundToClosestStep();
        t.firstStep = {
            container: t.steps.container(),
            offset: t.steps.offset()
        };

        snapshot = t.steps.snapshot();

        t.steps.nextStep();
        t.secondStep = {
            container: t.steps.container(),
            offset: t.steps.offset()
        };

        t.steps.restore(snapshot);
        t.finalStep = {
            container: t.steps.container(),
            offset: t.steps.offset()
        };

        r.shouldBe(t, "t.firstStep.container", "t.secondStep.container");
        r.shouldBe(t, "t.firstStep === t.secondStep.offset", "false");
        r.shouldBe(t, "t.firstStep", "t.finalStep");
        r.shouldBe(t, "t.steps.isStep()", "true");
    }

    this.tests = function () {
        return r.name([
            isStep_WhenAtStep_ReturnsTrue,
            isStep_WhenNotAtStep_ReturnsFalse,

            roundToClosestStep_OnStep_ReturnsTrue,
            roundToClosestStep_RoundsToPreviousStep_ByDefault,
            roundToClosestStep_WhenNoPrevious_RoundsToNextStep,
            roundToClosestStep_WhenNoAvailableStep_ReturnsFalse,

            roundToPreviousStep_OnStep_ReturnsTrue,
            roundToPreviousStep_RoundToPreviousStep_ReturnsTrue,
            roundToPreviousStep_WhenNoAvailableStep_ReturnsFalse,

            roundToNextStep_OnStep_ReturnsTrue,
            roundToNextStep_RoundToNextStep_ReturnsTrue,
            roundToNextStep_WhenNoAvailableStep_ReturnsFalse,

            nextStep_WhenNoAvailableStep_ReturnsFalse,
            nextStep_OnStep_MovesToStep_ReturnsTrue,
            nextStep_AfterStep_MovesToStep_ReturnsTrue,

            previousStep_WhenNoAvailableStep_ReturnsFalse,
            previousStep_OnStep_MovesToStep_ReturnsTrue,
            previousStep_BeforeStep_MovesToStep_ReturnsTrue,

            snapshotAndRestore_ResetsIteratorToRestoredPosition
        ]);
    };
    this.asyncTests = function () {
        return [];
    };
};
core.StepIteratorTests.name = "StepIteratorTests";
core.StepIteratorTests.prototype.description = function () {
    "use strict";
    return "Test the StepIterator class.";
};
