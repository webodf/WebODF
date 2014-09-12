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

/*global Node, NodeFilter, core, runtime, odf*/

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
 * @param {!odf.WordBoundaryFilter.IncludeWhitespace} includeWhitespace Specify the type of whitespace to include within
 *  the word boundary. TRAILING causes the accepted position to be after the whitespace trailing a word, while LEADING
 *  causes the accepted position to be just after the word boundary (but before the trailing whitespace).
 */
odf.WordBoundaryFilter = function WordBoundaryFilter(odtDocument, includeWhitespace) {
    "use strict";
    var TEXT_NODE = Node.TEXT_NODE,
        ELEMENT_NODE = Node.ELEMENT_NODE,
        odfUtils = odf.OdfUtils,
        // Sourced from http://apps.timwhitlock.info/js/regex, including all punctuation components
        punctuation = /[!-#%-*,-\/:-;?-@\[-\]_{}¡«·»¿;·՚-՟։-֊־׀׃׆׳-״؉-؊،-؍؛؞-؟٪-٭۔܀-܍߷-߹।-॥॰෴๏๚-๛༄-༒༺-༽྅࿐-࿔၊-၏჻፡-፨᙭-᙮᚛-᚜᛫-᛭᜵-᜶។-៖៘-៚᠀-᠊᥄-᥅᧞-᧟᨞-᨟᭚-᭠᰻-᰿᱾-᱿\u2000-\u206e⁽-⁾₍-₎〈-〉❨-❵⟅-⟆⟦-⟯⦃-⦘⧘-⧛⧼-⧽⳹-⳼⳾-⳿⸀-\u2e7e\u3000-\u303f゠・꘍-꘏꙳꙾꡴-꡷꣎-꣏꤮-꤯꥟꩜-꩟﴾-﴿︐-︙︰-﹒﹔-﹡﹣﹨﹪-﹫！-＃％-＊，-／：-；？-＠［-］＿｛｝｟-･]|\ud800[\udd00-\udd01\udf9f\udfd0]|\ud802[\udd1f\udd3f\ude50-\ude58]|\ud809[\udc00-\udc7e]/,
        spacing = /\s/,
        /**@const*/
        FILTER_ACCEPT = core.PositionFilter.FilterResult.FILTER_ACCEPT,
        /**@const*/
        FILTER_REJECT = core.PositionFilter.FilterResult.FILTER_REJECT,
        /**@const*/
        TRAILING = odf.WordBoundaryFilter.IncludeWhitespace.TRAILING,
        /**@const*/
        LEADING = odf.WordBoundaryFilter.IncludeWhitespace.LEADING,
        /**
         * @enum {number}
         */
        NeighborType = {
            NO_NEIGHBOUR:       0,
            SPACE_CHAR:         1,
            PUNCTUATION_CHAR:   2,
            WORD_CHAR:          3,
            OTHER:              4
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
            return NeighborType.NO_NEIGHBOUR;
        }
        if (odfUtils.isCharacterElement(node)) {
            return NeighborType.SPACE_CHAR;
        }
        if (node.nodeType === TEXT_NODE || odfUtils.isTextSpan(node) || odfUtils.isHyperlink(node)) {
            neighboringChar = node.textContent.charAt(getOffset());

            if (spacing.test(neighboringChar)) {
                return NeighborType.SPACE_CHAR;
            }
            if (punctuation.test(neighboringChar)) {
                return NeighborType.PUNCTUATION_CHAR;
            }
            return NeighborType.WORD_CHAR;
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
        if ((leftNeighborType === NeighborType.WORD_CHAR    && rightNeighborType === NeighborType.WORD_CHAR) ||
            (leftNeighborType === NeighborType.PUNCTUATION_CHAR && rightNeighborType === NeighborType.PUNCTUATION_CHAR) ||
            (includeWhitespace === TRAILING &&
                leftNeighborType !== NeighborType.NO_NEIGHBOUR && rightNeighborType === NeighborType.SPACE_CHAR) ||
            (includeWhitespace === LEADING &&
                leftNeighborType === NeighborType.SPACE_CHAR && rightNeighborType !== NeighborType.NO_NEIGHBOUR)) {
            return FILTER_REJECT;
        }
        return FILTER_ACCEPT;
    };
};

/**
 * Type of whitespace to include within the word boundary
 * @enum {!number}
 */
odf.WordBoundaryFilter.IncludeWhitespace = {
    /**@const*/None: 0,
    /**@const*/TRAILING: 1,
    /**@const*/LEADING: 2
};
