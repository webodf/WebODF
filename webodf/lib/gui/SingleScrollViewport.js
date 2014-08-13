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

/*global gui*/

/**
 * Viewport controller for a single scroll pane capable of scrolling either
 * horizontally or vertically.
 *
 * @constructor
 * @implements {gui.Viewport}
 * @param {!HTMLElement} scrollPane
 */
gui.SingleScrollViewport = function(scrollPane) {
    "use strict";
    var VIEW_PADDING_PX = 5;

    /**
     * Pad the client rect with the supplied margin
     * @param {!core.SimpleClientRect} clientRect
     * @param {!core.SimpleClientRect} margin
     * @return {!core.SimpleClientRect}
     */
    function shrinkClientRectByMargin(clientRect, margin) {
        return {
            left:   clientRect.left + margin.left,
            top:    clientRect.top + margin.top,
            right:  clientRect.right - margin.right,
            bottom: clientRect.bottom - margin.bottom
        };
    }

    /**
     * @param {!core.SimpleClientRect} clientRect
     * @return {!number}
     */
    function height(clientRect) {
        return clientRect.bottom - clientRect.top;
    }

    /**
     * @param {!core.SimpleClientRect} clientRect
     * @return {!number}
     */
    function width(clientRect) {
        return clientRect.right - clientRect.left;
    }

    /**
     * @param {?core.SimpleClientRect} clientRect
     * @param {!boolean=} alignWithTop
     * @return {undefined}
     */
    this.scrollIntoView = function(clientRect, alignWithTop) {
        var verticalScrollbarHeight = scrollPane.offsetHeight - scrollPane.clientHeight,
            horizontalScrollbarWidth = scrollPane.offsetWidth - scrollPane.clientWidth,
            nonNullClientRect,
            scrollPaneRect = scrollPane.getBoundingClientRect(),
            /**@type{!core.SimpleClientRect}*/
            paneRect;

        if (!clientRect || !scrollPaneRect) {
            return;
        }

        nonNullClientRect = /**@type{!core.SimpleClientRect}*/(clientRect);

        // Visible area is slightly different from the BCR
        // See https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Determining_the_dimensions_of_elements
        paneRect = shrinkClientRectByMargin(/**@type{!core.SimpleClientRect}*/(scrollPaneRect), {
            top: VIEW_PADDING_PX,
            bottom: verticalScrollbarHeight + VIEW_PADDING_PX,
            left: VIEW_PADDING_PX,
            right: horizontalScrollbarWidth + VIEW_PADDING_PX
        });

        // Vertical adjustment
        if (alignWithTop || nonNullClientRect.top < paneRect.top) {
            // Scroll top down into view
            scrollPane.scrollTop -= paneRect.top - nonNullClientRect.top;
        } else if (nonNullClientRect.top > paneRect.bottom || nonNullClientRect.bottom > paneRect.bottom) {
            // Scroll top *up* into view, potentially including bottom if possible
            if (height(nonNullClientRect) <= height(paneRect)) {
                // Whole region fits vertically on-screen, so scroll bottom into view
                scrollPane.scrollTop += nonNullClientRect.bottom - paneRect.bottom;
            } else {
                // Only one end will fit on screen, so scroll the top as high as possible
                scrollPane.scrollTop += nonNullClientRect.top - paneRect.top;
            }
        }

        // Horizontal adjustment - Logic mirrors vertical adjustment
        if (nonNullClientRect.left < paneRect.left) {
            scrollPane.scrollLeft -= paneRect.left - nonNullClientRect.left;
        } else if (nonNullClientRect.right > paneRect.right) {
            if (width(nonNullClientRect) <= width(paneRect)) {
                scrollPane.scrollLeft += nonNullClientRect.right - paneRect.right;
            } else {
                scrollPane.scrollLeft -= paneRect.left - nonNullClientRect.left;
            }
        }
    };
};