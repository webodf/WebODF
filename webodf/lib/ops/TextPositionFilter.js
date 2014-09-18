/**
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
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

/*global Node, runtime, core, odf, ops*/

/**
 * @constructor
 * @implements {core.PositionFilter}
 */
ops.TextPositionFilter = function TextPositionFilter() {
    "use strict";
    var odfUtils = odf.OdfUtils,
        ELEMENT_NODE = Node.ELEMENT_NODE,
        TEXT_NODE = Node.TEXT_NODE,
        /**@const*/FILTER_ACCEPT = core.PositionFilter.FilterResult.FILTER_ACCEPT,
        /**@const*/FILTER_REJECT = core.PositionFilter.FilterResult.FILTER_REJECT;

    /**
     * Find the previous sibling of the specified node that passes the node filter.
     * @param {?Node} node
     * @param {!function(?Node):!number} nodeFilter
     * @return {?Node}
     */
    function previousSibling(node, nodeFilter) {
        while (node && nodeFilter(node) !== FILTER_ACCEPT) {
            node = node.previousSibling;
        }
        return node;
    }

    /**
     * @param {!Node} container
     * @param {?Node} leftNode
     * @param {?Node} rightNode
     * @param {!function(?Node):!number} nodeFilter
     * @return {!core.PositionFilter.FilterResult}
     */
    function checkLeftRight(container, leftNode, rightNode, nodeFilter) {
        var r, firstPos, rightOfChar;
        // accept if there is a character immediately to the left
        if (leftNode) {
            if (odfUtils.isInlineRoot(leftNode) && odfUtils.isGroupingElement(rightNode)) {
                // Move first position after inline root inside trailing grouping element (part 1)
                // Disallow positions to the right of an inline root (like an annotation) and
                // to the left of a grouping element (like an annotation highlight span)
                return FILTER_REJECT;
            }
            r = odfUtils.lookLeftForCharacter(leftNode);
            if (r === 1) {// non-whitespace character or a character element
                return FILTER_ACCEPT;
            }
            if (r === 2 && (odfUtils.scanRightForAnyCharacter(rightNode)
                || odfUtils.scanRightForAnyCharacter(odfUtils.nextNode(container)))) {
                // significant whitespace is ok, if not in trailing whitesp
                return FILTER_ACCEPT;
            }
        } else {
            if (odfUtils.isGroupingElement(container) && odfUtils.isInlineRoot(previousSibling(container.previousSibling, nodeFilter))) {
                // Move first position after inline root inside trailing grouping element (part 2)
                // Allow the first position inside the first grouping element trailing an annotation
                return FILTER_ACCEPT;
            }
        }
        // at this point, we know that the position is not directly to the
        // right of a significant character or element. so the position is
        // only acceptable if it is the first in an empty p or h or if it
        // is to the left of the first significant character or element.

        // accept if this is the first position in p or h and there is no
        // character in the p or h
        firstPos = leftNode === null && odfUtils.isParagraph(container);
        rightOfChar = odfUtils.lookRightForCharacter(rightNode);
        if (firstPos) {
            if (rightOfChar) {
                return FILTER_ACCEPT;
            }
            // position is first position in empty paragraph
            return odfUtils.scanRightForAnyCharacter(rightNode) ? FILTER_REJECT : FILTER_ACCEPT;
        }
        // if not directly to the right of a character, reject
        if (!rightOfChar) {
            return FILTER_REJECT;
        }
        // accept if there is no character to the left
        leftNode = leftNode || odfUtils.previousNode(container);
        return odfUtils.scanLeftForAnyCharacter(leftNode) ? FILTER_REJECT : FILTER_ACCEPT;
    }

    /**
     * @param {!core.PositionIterator} iterator
     * @return {!core.PositionFilter.FilterResult}
     */
    this.acceptPosition = function (iterator) {
        var container = iterator.container(),
            nodeType = container.nodeType,
            /**@type{number}*/
            offset,
            /**@type{string}*/
            text,
            /**@type{string}*/
            leftChar,
            /**@type{string}*/
            rightChar,
            leftNode,
            rightNode,
            r;

        if (nodeType !== ELEMENT_NODE && nodeType !== TEXT_NODE) {
            return FILTER_REJECT;
        }
        if (nodeType === TEXT_NODE) {
            // In a PositionIterator, the offset in a text node is never
            // equal to the length of the text node.
            offset = iterator.unfilteredDomOffset();
            text = container.data;
            runtime.assert(offset !== text.length, "Unexpected offset.");
            if (offset > 0) {
                // The cursor may be placed to the right of a non-whitespace
                // character.
                leftChar = /**@type{string}*/(text[offset - 1]);
                if (!odfUtils.isODFWhitespace(leftChar)) {
                    return FILTER_ACCEPT;
                }
                // A whitespace to the left is ok, if
                // * there is a non-whitespace character to the right and
                //   that is the first non-whitespace character or character
                //   element or
                // * there is not another whitespace character in front of
                //   it.
                if (offset > 1) {
                    leftChar = /**@type{string}*/(text[offset - 2]);
                    if (!odfUtils.isODFWhitespace(leftChar)) {
                        r = FILTER_ACCEPT;
                    } else if (!odfUtils.isODFWhitespace(text.substr(0, offset))) {
                        // check if this can be leading paragraph space
                        return FILTER_REJECT;
                    }
                } else {
                    // check if there is a non-whitespace character or
                    // character element (other than text:s) in a preceding node
                    leftNode = odfUtils.previousNode(container);
                    if (odfUtils.scanLeftForNonSpace(leftNode)) {
                        r = FILTER_ACCEPT;
                    }
                }
                if (r === FILTER_ACCEPT) {
                    return odfUtils.isTrailingWhitespace(
                            /**@type{!Text}*/(container), offset)
                        ? FILTER_REJECT : FILTER_ACCEPT;
                }
                rightChar = /**@type{string}*/(text[offset]);
                if (odfUtils.isODFWhitespace(rightChar)) {
                    return FILTER_REJECT;
                }
                return odfUtils.scanLeftForAnyCharacter(odfUtils.previousNode(container))
                    ? FILTER_REJECT : FILTER_ACCEPT;
            }
            leftNode = iterator.leftNode();
            rightNode = container;
            container = /**@type{!Node}*/(container.parentNode);
            r = checkLeftRight(container, leftNode, rightNode, iterator.getNodeFilter());
        } else if (!odfUtils.isGroupingElement(container)) {
            r = FILTER_REJECT;
        } else {
            leftNode = iterator.leftNode();
            rightNode = iterator.rightNode();
            r = checkLeftRight(container, leftNode, rightNode, iterator.getNodeFilter());
        }
        return r;
    };
};
