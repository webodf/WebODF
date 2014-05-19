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
/*global core, gui, odf, ops, runtime, Node*/


/**
 * Class that represents a caret in a document.
 * The caret is implemented by the left border of a span positioned absolutely
 * to the cursor element, with a width of 0 px and a height of 1em (CSS rules).
 * Blinking is done by switching the color of the border from transparent to
 * the member color and back.
 * @constructor
 * @implements {core.Destroyable}
 * @param {!ops.OdtCursor} cursor
 * @param {boolean} avatarInitiallyVisible Sets the initial visibility of the caret's avatar
 * @param {boolean} blinkOnRangeSelect Specify that the caret should blink if a non-collapsed range is selected
 */
gui.Caret = function Caret(cursor, avatarInitiallyVisible, blinkOnRangeSelect) {
    "use strict";
    var /**@const*/
        MIN_OVERLAY_HEIGHT_PX = 8, /** 8px = 6pt font size */
        /**@const*/
        BLINK_PERIOD_MS = 500,
        /**@type{!HTMLElement}*/
        caretOverlay,
        /**@type{!HTMLElement}*/
        caretElement,
        /**@type{!gui.Avatar}*/
        avatar,
        /**@type{?Element}*/
        overlayElement,
        canvas = cursor.getDocument().getCanvas(),
        odfUtils = new odf.OdfUtils(),
        domUtils = new core.DomUtils(),
        guiStepUtils = new gui.GuiStepUtils(),
        /**@type{!core.StepIterator}*/
        stepIterator,
        /**@type{!core.ScheduledTask}*/
        redrawTask,
        /**@type{!core.ScheduledTask}*/
        blinkTask,
        /**@type{boolean}*/
        shouldResetBlink = false,
        /**@type{boolean}*/
        shouldCheckCaretVisibility = false,
        /**@type{boolean}*/
        shouldUpdateCaretSize = false,
        /**@type{!{isFocused:boolean,isShown:boolean,visibility:string}}*/
        state = {
            isFocused: false,
            isShown: true,
            visibility: "hidden"
        },
        /**@type{!{isFocused:boolean,isShown:boolean,visibility:string}}*/
        lastState = {
            isFocused: !state.isFocused,
            isShown: !state.isShown,
            visibility: "hidden"
        };

    /**
     * @return {undefined}
     */
    function blinkCaret() {
        // switch between transparent and color
        caretElement.style.opacity = caretElement.style.opacity === "0" ? "1" : "0";
        blinkTask.trigger(); // Trigger next blink to occur in BLINK_PERIOD_MS
    }

    /**
     * Calculates the bounding client rect of the caret element,
     * expanded with a specific margin
     * @param {!Element} caretElement
     * @param {!{left:!number,top:!number,right:!number,bottom:!number}} margin
     * @return {!{left:!number,top:!number,right:!number,bottom:!number}}
     */
    function getCaretClientRectWithMargin(caretElement, margin) {
        var caretRect = caretElement.getBoundingClientRect();

        return {
            left:   caretRect.left - margin.left,
            top:    caretRect.top - margin.top,
            right:  caretRect.right + margin.right,
            bottom: caretRect.bottom + margin.bottom
        };
    }

    /**
     * Get the client rectangle for the nearest selection point to the caret.
     * This works on the assumption that the next or previous sibling is likely to
     * be a text node that will provide an accurate rectangle for the caret's desired
     * position. The horizontal position of the caret is specified in the "right" property
     * as a caret generally appears to the right of the character or object is represents.
     *
     * @return {!{height: !number, top: !number, right: !number}}
     */
    function getSelectionRect() {
        var node = cursor.getNode(),
            caretRectangle,
            nextRectangle,
            selectionRectangle,
            paragraph,
            rootRect = /**@type{!ClientRect}*/(domUtils.getBoundingClientRect(canvas.getSizer())),
            useLeftEdge = false;

        if (node.getClientRects().length > 0) {
            // If the cursor node itself is visible, use that as the caret location.
            // The most common reason for the cursor to be visible is because the user is entering some text
            // via an IME
            selectionRectangle = domUtils.getBoundingClientRect(node);
        } else {
            // Need to resync the stepIterator prior to every use as it isn't automatically kept up-to-date
            // with the cursor's actual document position
            stepIterator.setPosition(node, 0);
            selectionRectangle = guiStepUtils.getContentRect(stepIterator);
            if (!selectionRectangle && stepIterator.nextStep()) {
                // Under some circumstances (either no associated content, or whitespace wrapping) the client rect of the
                // next sibling will actually be a more accurate visual representation of the caret's position.
                nextRectangle = guiStepUtils.getContentRect(stepIterator);
                if (nextRectangle) {
                    selectionRectangle = nextRectangle;
                    useLeftEdge = true;
                }
            }

            if (!selectionRectangle) {
                // Handle the case where a cursor ends up inside an empty paragraph. There are no nearby text elements
                // to get a rect from, so use the paragraph BCR instead, as it's better than nothing
                paragraph = odfUtils.getParagraphElement(node);
                if (paragraph) {
                    selectionRectangle = domUtils.getBoundingClientRect(paragraph);
                    useLeftEdge = true;
                }
            }

            if (!selectionRectangle) {
                // Finally, if there is still no selection rectangle, crawl up the DOM hierarchy the cursor node is in
                // and try and find something visible to use. Less ideal than actually having a visible rect... better than
                // crashing or hiding the caret entirely though :)

                runtime.log("WARN: No suitable client rectangle found for visual caret for " + cursor.getMemberId());
                // TODO are the better fallbacks than this?
                while (node) {
                    if (/**@type{!Element}*/(node).getClientRects().length > 0) {
                        selectionRectangle = domUtils.getBoundingClientRect(node);
                        useLeftEdge = true;
                        break;
                    }
                    node = node.parentNode;
                }
            }
        }

        selectionRectangle = domUtils.translateRect(/**@type{!ClientRect}*/(selectionRectangle), rootRect, canvas.getZoomLevel());
        caretRectangle = {
            top: selectionRectangle.top,
            height: selectionRectangle.height,
            right: useLeftEdge ? selectionRectangle.left : selectionRectangle.right
        };
        return caretRectangle;
    }

    /**
     * Tweak the height and top offset of the caret to display closely inline in
     * the text block.
     * This uses ranges to account for line-height and text offsets.
     *
     * This adjustment is necessary as various combinations of fonts and line
     * sizes otherwise cause the caret to appear above or below the natural line
     * of the text.
     * Fonts known to cause this problem:
     * - STIXGeneral (MacOS, Chrome & Safari)
     * @return {undefined}
     */
    function updateOverlayHeightAndPosition() {
        var selectionRect = getSelectionRect(),
            caretStyle;

        if (selectionRect.height < MIN_OVERLAY_HEIGHT_PX) {
            // ClientRect's are read-only, so a whole new object is necessary to modify these values
            selectionRect = {
                top: selectionRect.top - ((MIN_OVERLAY_HEIGHT_PX - selectionRect.height) / 2),
                height: MIN_OVERLAY_HEIGHT_PX,
                right: selectionRect.right
            };
        }
        caretOverlay.style.height = selectionRect.height + "px";
        caretOverlay.style.top = selectionRect.top + "px";
        caretOverlay.style.left = selectionRect.right + "px";

        // Update the overlay element
        if (overlayElement) {
            caretStyle = runtime.getWindow().getComputedStyle(caretElement, null);
            if (caretStyle.font) {
                overlayElement.style.font = caretStyle.font;
            } else {
                // On IE, window.getComputedStyle(element).font returns "".
                // Therefore we need to individually set the font properties.
                overlayElement.style.fontStyle = caretStyle.fontStyle;
                overlayElement.style.fontVariant = caretStyle.fontVariant;
                overlayElement.style.fontWeight = caretStyle.fontWeight;
                overlayElement.style.fontSize = caretStyle.fontSize;
                overlayElement.style.lineHeight = caretStyle.lineHeight;
                overlayElement.style.fontFamily = caretStyle.fontFamily;
            }
        }
    }

    /**
     * Checks whether the caret is currently in view. If the caret is not on screen,
     * this will scroll the caret into view.
     * @return {undefined}
     */
    function ensureVisible() {
        var canvasElement = cursor.getDocument().getCanvas().getElement(),
            canvasContainerElement = /**@type{!HTMLElement}*/(canvasElement.parentNode),
            caretRect,
            canvasContainerRect,
        // margin around the caret when calculating the visibility,
        // to have the caret not stick directly to the containing border
        // size in pixels, and also to avoid it hiding below scrollbars.
        // The scrollbar width is in most cases the offsetWidth - clientWidth.
        // We assume a 5px distance from the boundary is A Good Thing.
            horizontalMargin = canvasContainerElement.offsetWidth - canvasContainerElement.clientWidth + 5,
            verticalMargin = canvasContainerElement.offsetHeight - canvasContainerElement.clientHeight + 5;

        // The visible part of the canvas is set by changing the
        // scrollLeft/scrollTop properties of the containing element
        // accordingly. Both are 0 if the canvas top-left corner is exactly
        // in the top-left corner of the container.
        // To find out the proper values for them. these other values are needed:
        // * position of the caret inside the canvas
        // * size of the caret
        // * size of the canvas

        caretRect = getCaretClientRectWithMargin(caretElement, {
            top: verticalMargin,
            left: horizontalMargin,
            bottom: verticalMargin,
            right: horizontalMargin
        });
        canvasContainerRect = canvasContainerElement.getBoundingClientRect();

        // Vertical adjustment
        if (caretRect.top < canvasContainerRect.top) {
            canvasContainerElement.scrollTop -= canvasContainerRect.top - caretRect.top;
        } else if (caretRect.bottom > canvasContainerRect.bottom) {
            canvasContainerElement.scrollTop += caretRect.bottom - canvasContainerRect.bottom;
        }

        // Horizontal adjustment
        if (caretRect.left < canvasContainerRect.left) {
            canvasContainerElement.scrollLeft -= canvasContainerRect.left - caretRect.left;
        } else if (caretRect.right > canvasContainerRect.right) {
            canvasContainerElement.scrollLeft += caretRect.right - canvasContainerRect.right;
        }
    }

    /**
     * Returns true if the requested property is different between the last state
     * and the current state
     * @param {!string} property
     * @return {!boolean}
     */
    function hasStateChanged(property) {
        return lastState[property] !== state[property];
    }

    /**
     * Update all properties in the last state to match the current state
     * @return {undefined}
     */
    function saveState() {
        Object.keys(state).forEach(function (key) {
            lastState[key] = state[key];
        });
    }

    /**
     * Synchronize the requested caret state & visible state
     * @return {undefined}
     */
    function updateCaret() {
        if (state.isShown === false || cursor.getSelectionType() !== ops.OdtCursor.RangeSelection
                || (!blinkOnRangeSelect && !cursor.getSelectedRange().collapsed)) {
            // Hide the caret entirely if:
            // - the caret is deliberately hidden (e.g., the parent window has lost focus)
            // - the selection is not a range selection (e.g., an image has been selected)
            // - the blinkOnRangeSelect is false and the cursor has a non-collapsed range
            state.visibility = "hidden";
            caretElement.style.visibility = "hidden";
            blinkTask.cancel();
        } else {
            // For all other cases, the caret is expected to be visible and either static (isFocused = false), or blinking
            state.visibility = "visible";
            caretElement.style.visibility = "visible";

            if (state.isFocused === false) {
                caretElement.style.opacity = "1";
                blinkTask.cancel();
            } else {
                if (shouldResetBlink || hasStateChanged("visibility")) {
                    // If the caret has just become visible, reset the opacity so it is immediately shown
                    caretElement.style.opacity = "1";
                    // Cancel any existing blink instructions to ensure the opacity is not toggled for BLINK_PERIOD_MS
                    // It will immediately be rescheduled below so blinking resumes
                    blinkTask.cancel();
                }
                // Set the caret blinking. If the caret was already visible and already blinking,
                // this call will have no effect.
                blinkTask.trigger();
            }

            if (shouldUpdateCaretSize || shouldCheckCaretVisibility || hasStateChanged("visibility")) {
                // Ensure the caret height and position are correct if the caret has just become visible,
                // or is just about to be scrolled into view. This is necessary because client rectangles
                // are not reported when an element is hidden, so the caret size is likely to be out of date
                // when it is drawn
                updateOverlayHeightAndPosition();
            }

            if (shouldCheckCaretVisibility) {
                ensureVisible();
            }
        }

        if (hasStateChanged("isFocused")) {
            // Currently, setting the focus state on the avatar whilst the caret is hidden is harmless
            avatar.markAsFocussed(state.isFocused);
        }
        saveState();

        // Always reset all requested updates after a render. All requests should be ignored while the caret
        // is hidden, and should not be queued up for later. This prevents unexpected behaviours when re-showing
        // the caret (e.g., suddenly scrolling the caret into view at an undesirable time later just because
        // it becomes visible).
        shouldResetBlink = false;
        shouldCheckCaretVisibility = false;
        shouldUpdateCaretSize = false;
    }

    /**
     * Recalculate the caret size and position (but don't scroll into view)
     * @return {undefined}
     */
    this.handleUpdate = function() {
        shouldUpdateCaretSize = true;
        if (state.visibility !== "hidden") {
            // There are significant performance costs with calculating the caret size, so still
            // want to avoid computing this until all ops have been performed.
            // However, if the caret size is wildly incorrect for it's new position after an update
            // (e.g., caret moving from beside an image to beside text), the caret will be user visible
            // before the render occurs, and results in a large caret momentarily flashing before shrinking
            // to an appropriate size.
            // To prevent this flicker, we hide the caret until it is redrawn, as an absent caret is far less
            // noticeable than an oversized one.
            state.visibility = "hidden";
            caretElement.style.visibility = "hidden";
        }
        redrawTask.trigger();
    };

    /**
     * @return {undefined}
     */
    this.refreshCursorBlinking = function(){
        shouldResetBlink = true;
        redrawTask.trigger();
    };

    /**
     * @return {undefined}
     */
    this.setFocus = function () {
        state.isFocused = true;
        redrawTask.trigger();
    };
    /**
     * @return {undefined}
     */
    this.removeFocus = function () {
        state.isFocused = false;
        redrawTask.trigger();
    };
    /**
     * @return {undefined}
     */
    this.show = function () {
        state.isShown = true;
        redrawTask.trigger();
    };
    /**
     * @return {undefined}
     */
    this.hide = function () {
        state.isShown = false;
        redrawTask.trigger();
    };
    /**
     * @param {string} url
     * @return {undefined}
     */
    this.setAvatarImageUrl = function (url) {
        avatar.setImageUrl(url);
    };
    /**
     * @param {string} newColor
     * @return {undefined}
     */
    this.setColor = function (newColor) {
        caretElement.style.borderColor = newColor;
        avatar.setColor(newColor);
    };
    /**
     * @return {!ops.OdtCursor}}
     */
    this.getCursor = function () {
        return cursor;
    };
    /**
     * @return {!Element}
     */
    this.getFocusElement = function () {
        return caretElement;
    };
    /**
     * @return {undefined}
     */
    this.toggleHandleVisibility = function () {
        if (avatar.isVisible()) {
            avatar.hide();
        } else {
            avatar.show();
        }
    };
    /**
     * @return {undefined}
     */
    this.showHandle = function () {
        avatar.show();
    };
    /**
     * @return {undefined}
     */
    this.hideHandle = function () {
        avatar.hide();
    };

    /**
     * @param {!Element} element
     * @return {undefined}
     */
    this.setOverlayElement  = function (element) {
        overlayElement = element;
        caretOverlay.appendChild(element);
        shouldUpdateCaretSize = true;
        redrawTask.trigger();
    };

    /**
     * Scrolls the view on the canvas in such a way that the caret is
     * completely visible, with a small margin around.
     * The view on the canvas is only scrolled as much as needed.
     * If the caret is already visible nothing will happen.
     * @return {undefined}
     */
    this.ensureVisible = function() {
        shouldCheckCaretVisibility = true;
        redrawTask.trigger();
    };

    /**
     * @param {!function(!Object=)} callback
     * @return {undefined}
     */
    function destroy(callback) {
        canvas.getSizer().removeChild(caretOverlay);
        callback();
    }

    /**
     * @param {!function(!Error=)} callback Callback to call when the destroy is complete, passing an error object in case of error
     * @return {undefined}
     */
    this.destroy = function (callback) {
        var cleanup = [redrawTask.destroy, blinkTask.destroy, avatar.destroy, destroy];
        core.Async.destroyAll(cleanup, callback);
    };

    function init() {
        var odtDocument = /**@type{!ops.OdtDocument}*/(cursor.getDocument()),
            positionFilters = [odtDocument.createRootFilter(cursor.getMemberId()), odtDocument.getPositionFilter()],
            dom = odtDocument.getDOMDocument(),
            editinfons = "urn:webodf:names:editinfo";

        caretOverlay = /**@type{!HTMLElement}*/(dom.createElement("div"));
        caretOverlay.setAttributeNS(editinfons, "editinfo:memberid", cursor.getMemberId());
        caretOverlay.className = "webodf-caretOverlay";

        caretElement = /**@type{!HTMLElement}*/(dom.createElement("div"));
        caretElement.className = "caret";
        caretOverlay.appendChild(caretElement);

        avatar = new gui.Avatar(caretOverlay, avatarInitiallyVisible);

        canvas.getSizer().appendChild(caretOverlay);

        stepIterator = odtDocument.createStepIterator(cursor.getNode(), 0, positionFilters, odtDocument.getRootNode());

        redrawTask = core.Task.createRedrawTask(updateCaret);
        blinkTask = core.Task.createTimeoutTask(blinkCaret, BLINK_PERIOD_MS);
        redrawTask.triggerImmediate();
    }
    init();
};
