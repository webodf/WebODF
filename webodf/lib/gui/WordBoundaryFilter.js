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

/*global Node, NodeFilter, core, runtime, gui, odf*/

/**
 * A filter that allows a position if it is in front of a word, picture etc.
 *
 * Word boundaries are detected by the presence of punctuation as defined in the unicode standard.
 * The included UTF categories are:
 * - Pc (connector punctuation)
 * - Pd (dash punctuation)
 * - Pe (close punctuation)
 * - Pf (final punctuation)
 * - Pi (initial punctuation)
 * - Po (other punctuation)
 * - Ps (Open punctuation)
 *
 * In addition, the following ranges are also included as boundaries:
 * - 2000-206F (general punctuation)
 * - 2E00-2E7F (supplemental punctuation)
 * - 3000-303F (CJK symbols and punctuation)
 * - 12400-1247F (cuneiform numbers and punctuation)
 *
 * Some libraries and sites exist for assisting in creation of the regex. The one
 * used for this particular expression was http://apps.timwhitlock.info/js/regex
 * which is based on the cset javascript library
 * (http://inimino.org/~inimino/blog/javascript_cset).
 *
 *
 * @constructor
 * @implements {core.PositionFilter}
 * @param {!ops.OdtDocument} odtDocument
 * @param {!gui.WordBoundaryFilter.IncludeWhitespace} includeWhitespace Specify the type of whitespace to include within
 *  the word boundary. TRAILING causes the accepted position to be after the whitespace trailing a word, while LEADING
 *  causes the accepted position to be just after the word boundary (but before the trailing whitespace).
 */
gui.WordBoundaryFilter = function WordBoundaryFilter(odtDocument, includeWhitespace) {
    "use strict";
    var TEXT_NODE = Node.TEXT_NODE,
        ELEMENT_NODE = Node.ELEMENT_NODE,
        odfUtils = new odf.OdfUtils(),
        alphaNumeric = /[A-Za-z0-9]/,
        spacing = /\s/,
        /**@const*/
        FILTER_ACCEPT = core.PositionFilter.FilterResult.FILTER_ACCEPT,
        /**@const*/
        FILTER_REJECT = core.PositionFilter.FilterResult.FILTER_REJECT,
        /**@const*/
        TRAILING = gui.WordBoundaryFilter.IncludeWhitespace.TRAILING,
        /**@const*/
        LEADING = gui.WordBoundaryFilter.IncludeWhitespace.LEADING,
        /**
         * @enum {number}
         */
        NeighborType = {
            EDGE:         0,
            SPACING:      1,
            PUNCTUATION:  2,
            WORDCHAR:     3,
            OTHER:        4
        };

    /**
     * Returns the first filtered sibling ecountered while travelling up the dom from node until
     * before the documentRoot - or null if none is found.
     * @param {?Node} node
     * @param {!number} direction look for a left sibling when negative - for a right sibling otherwise
     * @param {!function(?Node):!number} nodeFilter
     * @return {?Node}
     */
    function findHigherNeighborNode(node, direction, nodeFilter) {
        var neighboringNode = null,
            rootNode = odtDocument.getRootNode(),
            unfilteredCandidate;

        while (node !== rootNode && node !== null && neighboringNode === null) {
            unfilteredCandidate = (direction < 0) ? node.previousSibling : node.nextSibling;
            if (nodeFilter(unfilteredCandidate) === NodeFilter.FILTER_ACCEPT) {
                neighboringNode = unfilteredCandidate;
            }
            node = node.parentNode;
        }

        return neighboringNode;
    }

    /**
     * @param {?Node} node
     * @param {!function():!number} getOffset returns the offset inside the node
     * @return {!NeighborType}
     */
    function typeOfNeighbor(node, getOffset) {
        var neighboringChar;

        if (node === null) {
            return NeighborType.EDGE;
        }
        if (odfUtils.isCharacterElement(node)) {
            return NeighborType.SPACING;
        }
        if (node.nodeType === TEXT_NODE || odfUtils.isTextSpan(node) || odfUtils.isHyperlink(node)) {
            neighboringChar = node.textContent.charAt(getOffset());

            if (spacing.test(neighboringChar)) {
                return NeighborType.SPACING;
            }
            if (!alphaNumeric.test(neighboringChar)) {
                return NeighborType.PUNCTUATION;
            }
            return NeighborType.WORDCHAR;
        }
        return NeighborType.OTHER;
    }

    /**
     * @param {!core.PositionIterator} iterator
     * @return {!core.PositionFilter.FilterResult}
     */
    this.acceptPosition = function (iterator) {
        var container = iterator.container(),
            /**@type{Node}*/
            leftNode = iterator.leftNode(),
            rightNode = iterator.rightNode(),
            // For performance reasons, do not calculate the offset inside the dom until it is necessary
            getRightCharOffset = iterator.unfilteredDomOffset,
            getLeftCharOffset = function() {return iterator.unfilteredDomOffset() - 1;},
            leftNeighborType,
            rightNeighborType;

        // If this could be the end of an element node, look for the neighboring node higher in the dom
        if (container.nodeType === ELEMENT_NODE) {
            if (rightNode === null) {
                rightNode = findHigherNeighborNode(container, 1, iterator.getNodeFilter());
            }
            if (leftNode === null) {
                leftNode = findHigherNeighborNode(container, -1, iterator.getNodeFilter());
            }
        }

        // If we dont stay inside the container node, the getOffset function needs to be modified so as to
        // return the offset of the characters just at the beginning/end of the respective neighboring node.
        if (container !== rightNode) {
            getRightCharOffset = function() {return 0;};
        }
        if (container !== leftNode && leftNode !== null) {
            getLeftCharOffset = function() {return leftNode.textContent.length - 1;};
        }

        leftNeighborType = typeOfNeighbor(leftNode, getLeftCharOffset);
        rightNeighborType = typeOfNeighbor(rightNode, getRightCharOffset);

        // Reject if: is between two usual characters (inside word) OR
        //            is between two punctuation marks OR
        //            (if including trailing space) is before a spacing and not behind the edge (word ending)
        //            (if excluding trailing space) is before an edge (word start) and not behind the spacing
        if ((leftNeighborType === NeighborType.WORDCHAR    && rightNeighborType === NeighborType.WORDCHAR) ||
            (leftNeighborType === NeighborType.PUNCTUATION && rightNeighborType === NeighborType.PUNCTUATION) ||
            (includeWhitespace === TRAILING && leftNeighborType !== NeighborType.EDGE && rightNeighborType === NeighborType.SPACING) ||
            (includeWhitespace === LEADING && leftNeighborType === NeighborType.SPACING && rightNeighborType !== NeighborType.EDGE)) {
            return FILTER_REJECT;
        }
        return FILTER_ACCEPT;
    };
};

/**
 * Type of whitespace to include within the word boundary
 * @enum {!number}
 */
gui.WordBoundaryFilter.IncludeWhitespace = {
    /**@const*/None: 0,
    /**@const*/TRAILING: 1,
    /**@const*/LEADING: 2
};

(function() {
    "use strict";
    return gui.WordBoundaryFilter;
}());
