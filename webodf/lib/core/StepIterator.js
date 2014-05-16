/**
 * @license
 * Copyright (C) 2014 KO GmbH <copyright@kogmbh.com>
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
     * If the current position is not on a valid step, this function will move the iterator
     * to the closest previous step. If there is no previous step, it will advance to the next
     * closest step.
     * @return {!boolean} Returns true if the iterator ends on a valid step
     */
    this.roundToClosestStep = function() {
        var currentContainer = container(),
            currentOffset = offset(),
            isAtStep = isStep();
        if (!isAtStep) {
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
};
