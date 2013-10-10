/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
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
 * @source: http://gitorious.org/webodf/webodf/
 */
/*global Node, NodeFilter, gui, odf, ops, runtime*/

runtime.loadClass("odf.OdfUtils");

/**
 * A GUI class that attaches to a cursor and renders it's selection
 * as an arrangement of 3 divs - a top rect and bottom rect for the
 * rectangles that may not be of the full width as the selection, and
 * a 'filler' rect that is of full width and covers everything in between.
 * @constructor
 */
gui.SelectionView = function SelectionView(cursor) {
    "use strict";

        var root = cursor.getOdtDocument().getRootNode().parentNode.parentNode,
        doc = cursor.getOdtDocument().getDOM(),
        overlayTop = doc.createElement('div'),
        overlayMiddle = doc.createElement('div'),
        overlayBottom = doc.createElement('div'),
        odfUtils = new odf.OdfUtils(),
        isVisible = true;

    /**
     * Takes a rect with the fields `left, top, width, height`
     * as numbers and uses these dimensions as pixels for the div
     * @param {!Element} div
     * @param {!{left: !number, top: !number, width: !number, height: !number}} rect
     * @return {undefined}
     */
    function setRect(div, rect) {
        div.style.left = rect.left + 'px';
        div.style.top = rect.top + 'px';
        div.style.width = rect.width+ 'px';
        div.style.height = rect.height+ 'px';
    }

    /**
     * Shows or hides the selection overlays for this view
     * @param {boolean} choice
     * @return {undefined}
     */
    function showOverlays(choice) {
        var display;

        isVisible = choice;
        display = (choice === true) ? "block" : "none";

        overlayTop.style.display = overlayMiddle.style.display = overlayBottom.style.display = display;
    }

    /**
     * Takes a rect that is relative to the main viewport, and translates
     * it to be relative to the 'root' rect of the document.
     * Also takes the zoom level into account.
     * @param {!ClientRect|!{top: !number, left: !number, bottom: !number, right: !number, width: !number, height: !number}} rect
     * @return {!{top: !number, left: !number, bottom: !number, right: !number, width: !number, height: !number}}
     */
    function translateRect(rect) {
        var rootRect = root.getBoundingClientRect(),
            zoomLevel = odtDocument.getOdfCanvas().getZoomLevel(),
            resultRect = {};

        resultRect.top = (rect.top - rootRect.top) / zoomLevel;
        resultRect.left = (rect.left  - rootRect.left) / zoomLevel;
        resultRect.bottom = (rect.bottom - rootRect.top) / zoomLevel;
        resultRect.right = (rect.right - rootRect.left) / zoomLevel;
        resultRect.width = rect.width / zoomLevel;
        resultRect.height = rect.height / zoomLevel;

        return resultRect;
    }

    /**
     * Returns the 'extreme' ranges for a range.
     * This returns 3 ranges, where the firstRange is attached to the first
     * position in the first text node in the original range,
     * the lastRange is attached to the last text node's last position,
     * and the fillerRange starts at the start of firstRange and ends at the end of
     * lastRange.
     * @param {!Range} range
     * @return {null|!{firstRange: !Range, lastRange: !Range, fillerRange: !Range}}
     */
    function getExtremeRanges(range) {
        var textNodes = odfUtils.getTextNodes(range, true),
            firstRange = doc.createRange(),
            lastRange = doc.createRange(),
            fillerRange = doc.createRange(),
            firstTextNode,
            firstTextOffset,
            lastTextNode,
            lastTextOffset;

        if (!textNodes.length) {
            return null;
        }

        if (range.startContainer.nodeType === Node.TEXT_NODE) {
            firstTextNode = range.startContainer;
            firstTextOffset = range.startOffset;
        } else {
            firstTextNode = textNodes[0];
            firstTextOffset = 0;
        }

        if (range.endContainer.nodeType === Node.TEXT_NODE) {
            lastTextNode = range.endContainer;
            lastTextOffset = range.endOffset;
        } else {
            lastTextNode = textNodes[textNodes.length - 1];
            lastTextOffset = lastTextNode.length;
        }

        // Webkit/blink bug: collapsed ranges at the ends of textnodes
        // have no clientrects. Therefore we must encapsulate the
        // last character of that textNode for the firstRange or lastRange and use
        // it's right edge when computing the rect.
        if (firstTextOffset > 0 && firstTextOffset === firstTextNode.length) {
            firstRange.setStart(firstTextNode, firstTextOffset - 1);
            firstRange.setEnd(firstTextNode, firstTextOffset);
        } else {
            firstRange.setStart(firstTextNode, firstTextOffset);
        }
        if (lastTextOffset > 0 && lastTextOffset === lastTextNode.length) {
            lastRange.setStart(lastTextNode, lastTextOffset - 1);
            lastRange.setEnd(lastTextNode, lastTextOffset);
        } else {
            lastRange.setStart(lastTextNode, lastTextOffset);
        }

        fillerRange.setStart(firstTextNode, firstTextOffset);
        fillerRange.setEnd(lastTextNode, lastTextOffset);

        return {
            firstRange: firstRange,
            lastRange: lastRange,
            fillerRange: fillerRange
        };
    }

    /**
     * Returns the bounding rectangle of two given rectangles
     * @param {!ClientRect|!{top: !number, left: !number, bottom: !number, right: !number, width: !number, height: !number}} rect1
     * @param {!ClientRect|!{top: !number, left: !number, bottom: !number, right: !number, width: !number, height: !number}} rect2
     * @return {!{top: !number, left: !number, bottom: !number, right: !number, width: !number, height: !number}}
     */
    function getBoundingRect(rect1, rect2) {
        var resultRect = {};
        resultRect.top = Math.min(rect1.top, rect2.top);
        resultRect.left = Math.min(rect1.left, rect2.left);
        resultRect.right = Math.max(rect1.right, rect2.right);
        resultRect.bottom = Math.max(rect1.bottom, rect2.bottom);
        resultRect.width = resultRect.right - resultRect.left;
        resultRect.height = resultRect.bottom - resultRect.top;
        return resultRect;
    }

    /**
     * Chrome's implementation of getBoundingClientRect is buggy in that it sometimes
     * includes the ClientRect of a partially covered parent in the bounding rect.
     * Therefore, instead of simply using getBoundingClientRect on the fillerRange,
     * we have to carefully compute our own filler rect.
     * This is done by climbing up the ancestries of both the startContainer and endContainer,
     * to just one level below the commonAncestorContainer. Then, we iterate between the
     * 'firstNode' and 'lastNode' and compute the bounding rect of all the siblings in between.
     * The resulting rect will have the correct width, but the height will be equal or greater than
     * what a correct getBoundingClientRect would give us. This is not a problem though, because
     * we only require the width of this filler rect; the top and bottom of the firstRect and lastRect
     * are enough for the rest.
     * This function also improves upon getBoundingClientRect in another way:
     * it computes the bounding rects of the paragraph nodes between the two ends, instead of the
     * bounding rect of the *range*. This means that unlike gBCR, the bounding rect will not cover absolutely
     * positioned children such as annotation nodes.
     * @param {!Range} fillerRange
     * @return {ClientRect|{top: number, left: number, bottom: number, right: number, width: number, height: number}}
     */
    function getFillerRect(fillerRange) {
        var containerNode = fillerRange.commonAncestorContainer,
            firstNode = fillerRange.startContainer,
            lastNode = fillerRange.endContainer,
            currentSibling,
            grownRect = null,
            currentRect,
            range = doc.createRange();

        if (firstNode === containerNode || lastNode === containerNode) {
            range = fillerRange.cloneRange();
            grownRect = range.getBoundingClientRect();
            range.detach();
            return grownRect;
        }

        while (firstNode.parentNode !== containerNode) {
            firstNode = firstNode.parentNode;
        }
        while (lastNode.parentNode !== containerNode) {
            lastNode = lastNode.parentNode;
        }

        currentSibling = firstNode;
        while (currentSibling !== lastNode.nextSibling) {
            // If the sibling for which we want the bounding rect is a paragraph,
            // then we desire to have it's full width at our access. Therefore,
            // directly use gBCR (works fine for just paragraphs).
            if (odfUtils.isParagraph(currentSibling)) {
                currentRect = currentSibling.getBoundingClientRect();
            } else {
                range.selectNode(currentSibling);
                currentRect = range.getBoundingClientRect();
            }
            if (currentRect.width > 0 && currentRect.height > 0) {
                if (!grownRect) {
                    grownRect = currentRect; 
                } else {
                    grownRect = getBoundingRect(grownRect, currentRect); 
                }
            }
            currentSibling = currentSibling.nextSibling;
        }
        range.detach();
        return grownRect;
    }

    /**
     * Gets the clientRect of a range within a textNode, and
     * collapses the rect to the left or right edge, and returns it
     * @param {!Range} range
     * @param {boolean} useRightEdge
     */
    function getCollapsedRectOfTextRange(range, useRightEdge) {
        var clientRect = range.getClientRects()[0],
            collapsedRect = {};

        collapsedRect.width = 0;
        collapsedRect.top = clientRect.top;
        collapsedRect.bottom = clientRect.bottom;
        collapsedRect.height = clientRect.height;
        collapsedRect.left = collapsedRect.right = useRightEdge ? clientRect.right : clientRect.left;
        return collapsedRect;
    }

    /**
     * Repositions overlays over the given selected range of the cursor
     * @param {!Range} selectedRange
     * @return {undefined}
     */
    function repositionOverlays(selectedRange) {
        var range = /**@type{!Range}*/(selectedRange.cloneRange()),
            extremes = getExtremeRanges(range),
            firstRange,
            lastRange,
            fillerRange,
            firstRect,
            fillerRect,
            lastRect;

        // If the range is collapsed (no selection) or no extremes were found, do not show
        // any virtual selections.
        if (range.collapsed || !extremes) {
            showOverlays(false);
        } else {
            showOverlays(true);

            firstRange = extremes.firstRange;
            lastRange = extremes.lastRange;
            fillerRange = extremes.fillerRange;

            firstRect= translateRect(getCollapsedRectOfTextRange(firstRange, true));
            lastRect = translateRect(getCollapsedRectOfTextRange(lastRange, true));
            fillerRect = getFillerRect(fillerRange);

            if (!fillerRect) {
                fillerRect = getBoundingRect(firstRect, lastRect);
            } else {
                fillerRect = translateRect(fillerRect);
            }

            setRect(overlayTop, {
                left: firstRect.left,
                top: firstRect.top,
                width: Math.max(0, fillerRect.width - (firstRect.left - fillerRect.left)),
                height: firstRect.height
            });
            // If the first and last rect are on the same line, they coincide. Therefore
            // show only the first rect.
            if (lastRect.top === firstRect.top || lastRect.bottom === firstRect.bottom) {
                overlayMiddle.style.display = overlayBottom.style.display = 'none';
            } else {
                setRect(overlayBottom, {
                    left: fillerRect.left,
                    top: lastRect.top,
                    width: Math.max(0, lastRect.right - fillerRect.left),
                    height: lastRect.height
                });
                setRect(overlayMiddle, {
                    left: fillerRect.left,
                    top: firstRect.top + firstRect.height,
                    width: Math.max(0, parseFloat(overlayTop.style.left) + parseFloat(overlayTop.style.width) - parseFloat(overlayBottom.style.left)),
                    height: Math.max(0, lastRect.top - firstRect.bottom)
                });
            }

            firstRange.detach();
            lastRange.detach();
            fillerRange.detach();
        }
        range.detach();
    }

    /**
     * Rerender the selection overlays
     * @return {undefined}
     */
    this.rerender = function () {
        repositionOverlays(cursor.getSelectedRange());
    };

    /**
     * Show selection overlays
     * @return {undefined}
     */
    this.show = function () {
        showOverlays(true);
        repositionOverlays(cursor.getSelectedRange());
    };
    /**
     * Hide selection overlays
     * @return {undefined}
     */
    this.hide = function () {
        showOverlays(false);
    };
    /**
     * Returns if the selection view is visible or hidden
     */
    this.visible = function() {
        return isVisible;
    };
    /**
     * @param movedCursor {!gui.ShadowCursor|ops.OdtCursor}
     * @return {undefined}
     */
    function handleCursorMove(movedCursor) {
        if (movedCursor === cursor) {
            repositionOverlays(cursor.getSelectedRange());
        }
    }
    /**
     * Clear all overlays from the DOM
     */
    this.destroy = function (callback) {
        root.removeChild(overlayTop);
        root.removeChild(overlayMiddle);
        root.appendChild(overlayBottom);
        cursor.getOdtDocument().unsubscribe(ops.OdtDocument.signalCursorMoved, handleCursorMove);

        callback();
    };

    function init() {
        var editinfons = 'urn:webodf:names:editinfo',
            memberid = cursor.getMemberId();

        root.appendChild(overlayTop);
        root.appendChild(overlayMiddle);
        root.appendChild(overlayBottom);

        overlayTop.setAttributeNS(editinfons, 'editinfo:memberid', memberid);
        overlayMiddle.setAttributeNS(editinfons, 'editinfo:memberid', memberid);
        overlayBottom.setAttributeNS(editinfons, 'editinfo:memberid', memberid);

        overlayTop.className = overlayMiddle.className = overlayBottom.className = "selectionOverlay";

        cursor.getOdtDocument().subscribe(ops.OdtDocument.signalCursorMoved, handleCursorMove);
    }

    init();
};
