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

/*global runtime, core*/


/**
 * Creates a helper class for navigating by steps. Instances of this class are intended to be VERY
 * short-lived, and makes no guarantees about proper behaviour if the DOM or supplied filter is
 * modified during the lifetime of the object.
 *
 * @constructor
 * @param {!core.PositionFilter} filter Filter to apply to the iterator positions
 * @param {!core.PositionIterator} iterator Substree to search for step within. Generally a paragraph or document root
 */
core.StepIterator = function StepIterator(filter, iterator) {
    "use strict";

    var /**@const*/
        FILTER_ACCEPT = core.PositionFilter.FilterResult.FILTER_ACCEPT,
        /**@const*/
        NEXT = core.StepDirection.NEXT,
        cachedContainer,
        cachedOffset,
        cachedFilterResult;

    function resetCache() {
        // TODO Speed up access of the container & offset pairs on the PositionIterator
        // These values are cached because container & offset lookups on the iterator
        // can be prohibitively slow. Ideally, the iterator itself will be eventually sped up
        cachedContainer = null;
        cachedOffset = undefined;
        cachedFilterResult = undefined;
    }

    /**
     * Returns true if the current iterator position is accepted by the supplied filter
     * @return {!boolean}
     */
    function isStep() {
        if (cachedFilterResult === undefined) {
            cachedFilterResult = filter.acceptPosition(iterator) === FILTER_ACCEPT;
        }
        return /**@type{!boolean}*/(cachedFilterResult);
    }
    this.isStep = isStep;

    /**
     * Sets the position of the underlying iterator
     * @param {!Node} newContainer
     * @param {!number} newOffset
     * @return {!boolean}
     */
    function setPosition(newContainer, newOffset) {
        resetCache();
        return iterator.setUnfilteredPosition(newContainer, newOffset);
    }
    this.setPosition = setPosition;

    /**
     * Return the container for the current position.
     * @return {!Element|!Text}
     */
     function container() {
        if (!cachedContainer) {
            cachedContainer = iterator.container();
        }
        return cachedContainer;
    }
    this.container = container;

    /**
     * Get the current unfiltered DOM offset of the underlying iterator
     * @return {!number}
     */
    function offset() {
        if (cachedOffset === undefined) {
            cachedOffset = iterator.unfilteredDomOffset();
        }
        return /**@type{!number}*/(cachedOffset);
    }
    this.offset = offset;

    /**
     * Move to the next step. Returns false if no step exists
     * @return {!boolean}
     */
    function nextStep() {
        resetCache(); // Necessary in case the are no more positions
        while (iterator.nextPosition()) {
            resetCache();
            if (isStep()) {
                return true;
            }
        }
        return false;
    }
    this.nextStep = nextStep;

    /**
     * Move to the previous step. Returns false if no step exists
     * @return {!boolean}
     */
    function previousStep() {
        resetCache(); // Necessary in case the are no more positions
        while (iterator.previousPosition()) {
            resetCache();
            if (isStep()) {
                return true;
            }
        }
        return false;
    }
    this.previousStep = previousStep;

    /**
     * Advance the iterator by one step in the specified direction.
     *
     * @param {!core.StepDirection} direction
     * @return {!boolean}
     */
    this.advanceStep = function(direction) {
        return direction === NEXT ? nextStep() : previousStep();
    };

    /**
     * If the current position is not on a valid step, this function will move the iterator
     * to the closest previous step. If there is no previous step, it will advance to the next
     * closest step.
     * @return {!boolean} Returns true if the iterator ends on a valid step
     */
    this.roundToClosestStep = function() {
        var currentContainer,
            currentOffset,
            isAtStep = isStep();
        if (!isAtStep) {
            currentContainer = container();
            currentOffset = offset();
            // Default rule is to always round a position DOWN to the closest step equal or prior
            // This produces the easiest behaviour to understand (e.g., put the cursor just AFTER the step it represents)
            isAtStep = previousStep();
            if (!isAtStep) {
                // Restore back to the prior position and see if there is a step available above
                setPosition(currentContainer, currentOffset);
                isAtStep = nextStep();
            }
        }
        return isAtStep;
    };

    /**
     * If the current position is not a valid step, move to the previous step.
     * If there is no previous step, returns false.
     * @return {!boolean} Returns true if the iterator ends on a valid step
     */
    this.roundToPreviousStep = function() {
        var isAtStep = isStep();
        if (!isAtStep) {
            isAtStep = previousStep();
        }
        return isAtStep;
    };

    /**
     * If the current position is not a valid step, move to the next step.
     * If there is no next step, returns false.
     * @return {!boolean} Returns true if the iterator ends on a valid step
     */
    this.roundToNextStep = function() {
        var isAtStep = isStep();
        if (!isAtStep) {
            isAtStep = nextStep();
        }
        return isAtStep;
    };

    /**
     * Return the node to the left of the current iterator position.
     * See PositionIterator.leftNode
     * @return {?Node}
     */
    this.leftNode = function() {
        return iterator.leftNode();
    };

    /**
     * Store a snapshot of the current step iterator position. Intended to be used
     * in conjunction with restore to be able to save & restore a particular position.
     *
     * Note, the returned type should be treated as an opaque token, as the data structure
     * is allowed to change at any moment.
     *
     * @return {!core.StepIterator.StepSnapshot}
     */
    this.snapshot = function() {
        return new core.StepIterator.StepSnapshot(container(), offset());
    };

    /**
     * Restore the step iterator back to a specific position. The input to this is
     * expected to be the direct result of a snapshot call.
     *
     * @param {!core.StepIterator.StepSnapshot} snapshot
     * @return {undefined}
     */
    this.restore = function(snapshot) {
        setPosition(snapshot.container, snapshot.offset);
    };
};


/**
 * StepIterator snapshot token that is used to save and restore the current position of StepIterator
 *
 * All properties and methods on this class are intended to be private to StepIterator, and should not be used outside
 * of the StepIterator file. The contents stored may be changed at any time and should not be relied upon by
 * external consumers.
 *
 * @constructor
 * @param {!Text|!Element} container
 * @param {!number} offset
 */
core.StepIterator.StepSnapshot = function (container, offset) {
    "use strict";

    /**
     * @private
     * @type {!Text|!Element}
     */
    this.container = container;

    /**
     * @private
     * @type {!number}
     */
    this.offset = offset;
};
