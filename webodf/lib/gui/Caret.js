/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
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
/*global core, gui, ops, runtime*/

runtime.loadClass("gui.Avatar");
runtime.loadClass("ops.OdtCursor");

/**
 * Class that represents a caret in a document.
 * The caret is implemented by the left border of a span positioned absolutely
 * to the cursor element, with a width of 0 px and a height of 1em (CSS rules).
 * Blinking is done by switching the color of the border from transparent to
 * the user color and back.
 * @constructor
 * @param {!ops.OdtCursor} cursor
 */
gui.Caret = function Caret(cursor) {
    "use strict";
    function clearNode(node) {
        while (node.firstChild !== null) {
            node.removeNode(node.firstChild);
        }
    }
    var self = this,
        span,
        avatar,
        cursorNode,
        focussed = false,
        blinking = false,
        color = "";

    function blink() {
        if (!focussed || !cursorNode.parentNode) {
            // stop blinking when removed from the document
            return;
        }

        if (!blinking) {
            blinking = true;
            // switch between transparent and color
            span.style.borderColor =
                (span.style.borderColor === "transparent")
                    ? color
                    : "transparent";

            runtime.setTimeout(function () {
                blinking = false;
                blink();
            }, 500);
        }
    }

    /**
     * Turns the passed size into a number of pixels.
     * If size is a string, it must be either empty or be a number plus the suffix "px".
     * @param {!(string|number)} size
     * @return {!number}
     */
    function pixelCount(size) {
        var match;

        if ((typeof size === "string")) {
            if (size === "") {
                return 0;
            }
            match = /^(\d+)(\.\d+)?px$/.exec(size);
            runtime.assert((match !== null),
                           "size [" + size + "] does not have unit px.");
            return parseFloat(match[1]);
        }
        return size;
    }

    /**
     * Returns the first element in the parent element chain which has the
     * style attribute "display" set to "block".
     * @param {!Element} element
     * @return {?Element}
     */
    function getOffsetBaseElement(element) {
        var anchorElement = element,
            nodeStyle,
            /**@type{Window|null}*/window = runtime.getWindow();

        runtime.assert(window !== null,
                       "Expected to be run in an environment which has a global window, like a browser.");

        do {
            anchorElement = anchorElement.parentElement;
            if (! anchorElement) {
                break;
            }
            nodeStyle = window.getComputedStyle(anchorElement, null);
        } while (nodeStyle.display !== "block");

        return anchorElement;
    }

    /**
     * Calculates offset to container element from sum of all margins, paddings
     * and border widths of the elements in the chain from element to the
     * container element
     * @param {?Element} element
     * @param {?Element} containerElement
     * @return {!{x:!number,y:!number}}
     */
    function getRelativeOffsetTopLeftBySpacing(element, containerElement) {
        var x = 0,
            y = 0,
            elementStyle,
            /**@type{Window|null}*/window = runtime.getWindow();

        runtime.assert(window !== null,
                       "Expected to be run in an environment which has a global window, like a browser.");

        while (element && (element !== containerElement)) {
            elementStyle = window.getComputedStyle(element, null);
            // add offsets between elements
            x += pixelCount(elementStyle.marginLeft) +
                 pixelCount(elementStyle.borderLeftWidth) +
                 pixelCount(elementStyle.paddingLeft);
            y += pixelCount(elementStyle.marginTop) +
                 pixelCount(elementStyle.borderTopWidth) +
                 pixelCount(elementStyle.paddingTop);
            // prepare next parent round
            element = element.parentElement;
        }

        return {x: x, y: y};
    }

    /**
     * Calculates the relative x,y offset of the given element to the given container element
     * without any scrolling
     * @param {?Element} element
     * @param {?Element} containerElement
     * @return {!{x:!number,y:!number}}
     */
    function getRelativeOffsetTopLeft(element, containerElement) {
        var reachedContainerElement,
            offsetParent,
            e,
            x = 0,
            y = 0,
            resultBySpacing;

        // sanity check
        if (!element || !containerElement) {
            return {x: 0, y: 0};
        }

        // go through all offsetParents
        reachedContainerElement = false;
        do {
            // TODO: offsetParent seems to fail in Firefox for non-HTML elements
            // needs more investigations and then a work-around
            offsetParent = element.offsetParent;
            // now check if containerElement is in-between chain from current element to offset parent ,
            // by looping through the chain until the node before the offset parent
            e = element.parentNode;
            while (e !== offsetParent) {
                // is in-between?
                if (e === containerElement) {
                    // add the offset between the last offset parent by all spacings
                    resultBySpacing = getRelativeOffsetTopLeftBySpacing(element, containerElement);
                    x += resultBySpacing.x;
                    y += resultBySpacing.y;
                    reachedContainerElement = true;
                    break;
                }
                e = e.parentNode;
            }

            if (reachedContainerElement) {
                break;
            }

            // add offset between this element and the offset parent element
            x += pixelCount(element.offsetLeft);
            y += pixelCount(element.offsetTop);

            // prepare next offsetParent round
            element = offsetParent;
        } while (element && (element !== containerElement));

        return {x: x, y: y};
    }

    /**
     * Calculates the position rect of the given element in the given container element
     * without any scrolling
     * @param {!Element} caretElement
     * @param {?Element} containerElement
     * @return {!{left:!number,top:!number,right:!number,bottom:!number}}
     */
    function getRelativeCaretOffsetRect(caretElement, containerElement, margin) {
        var caretOffsetTopLeft,
            offsetBaseNode;
        // the caretElement left-top offset is relative to the closest parent
        // element with display:block.
        // (that is text:p/text:h, but e.g. not text:span which has display:inline)
        offsetBaseNode = getOffsetBaseElement(caretElement);
        caretOffsetTopLeft = getRelativeOffsetTopLeft(offsetBaseNode, containerElement);
        // add to this the offset of the caret element to the offsetBaseNode
        caretOffsetTopLeft.x += caretElement.offsetLeft;
        caretOffsetTopLeft.y += caretElement.offsetTop;

        return {
            left:   caretOffsetTopLeft.x - margin,
            top:    caretOffsetTopLeft.y - margin,
            right:  caretOffsetTopLeft.x + caretElement.scrollWidth - 1 + margin,
            bottom: caretOffsetTopLeft.y + caretElement.scrollHeight - 1 + margin
        };
    }

    this.setFocus = function () {
        focussed = true;
        avatar.markAsFocussed(true);
        blink();
    };
    this.removeFocus = function () {
        focussed = false;
        avatar.markAsFocussed(false);
        // reset
        span.style.borderColor = color;
    };
    this.setAvatarImageUrl = function (url) {
        avatar.setImageUrl(url);
    };
    this.setColor = function (newColor) {
        if (color === newColor) {
            return;
        }

        color = newColor;
        if (span.style.borderColor !== "transparent") {
            span.style.borderColor = color;
        }
        avatar.setColor(color);
    };
    this.getCursor = function () {
        return cursor;
    };
    /**
     * @return {!Element}
     */
    this.getFocusElement = function () {
        return span;
    };
    this.toggleHandleVisibility = function () {
        if (avatar.isVisible()) {
            avatar.hide();
        } else {
            avatar.show();
        }
    };
    this.showHandle = function () {
        avatar.show();
    };
    this.hideHandle = function () {
        avatar.hide();
    };

    /**
     * Scrolls the view on the canvas in such a way that the caret is
     * completely visible, with a small margin around.
     * The view on the canvas is only scrolled as much as needed.
     * If the caret is already visible nothing will happen.
     */
    this.ensureVisible = function () {
        var canvasElement = cursor.getOdtDocument().getOdfCanvas().getElement(),
            canvasContainerElement = canvasElement.parentNode,
            caretOffsetRect,
            // margin around the caret when calculating the visibility,
            // to have the caret not stick directly to the containing border
            // size in pixels
            caretMargin = 5;

        // The visible part of the canvas is set by changing the
        // scrollLeft/scrollTop properties of the containing element
        // accordingly. Both are 0 if the canvas top-left corner is exactly
        // in the top-left corner of the container.
        // To find out the proper values for them. these other values are needed:
        // * position of the caret inside the canvas
        // * size of the caret
        // * size of the canvas

        caretOffsetRect = getRelativeCaretOffsetRect(span,
                                                     canvasContainerElement,
                                                     caretMargin);

        // check vertically
        // not below upper side of visible part of the canvas?
        if ((caretOffsetRect.top) < canvasContainerElement.scrollTop) {
            canvasContainerElement.scrollTop = caretOffsetRect.top;
        // not above lower side of visible part of the canvas?
        } else if (caretOffsetRect.bottom >
                   (canvasContainerElement.scrollTop + canvasContainerElement.clientHeight - 1)) {
            canvasContainerElement.scrollTop =
                caretOffsetRect.bottom - canvasContainerElement.clientHeight + 1;
        }

        // check horizontally
        // not before left side of visible part of the canvas?
        if (caretOffsetRect.left < canvasContainerElement.scrollLeft) {
            canvasContainerElement.scrollLeft = caretOffsetRect.left;
        // not behind right side of visible part of the canvas?
        } else if (caretOffsetRect.right >
                    (canvasContainerElement.scrollLeft + canvasContainerElement.clientWidth - 1)) {
            canvasContainerElement.scrollLeft =
                caretOffsetRect.right - canvasContainerElement.clientWidth + 1;
        }
    };

    function init() {
        var dom = cursor.getOdtDocument().getDOM(),
            htmlns = dom.documentElement.namespaceURI;

        span = dom.createElementNS(htmlns, "span");

        cursorNode = cursor.getNode();
        cursorNode.appendChild(span);
        avatar = new gui.Avatar(cursorNode);
    }
    init();
};
