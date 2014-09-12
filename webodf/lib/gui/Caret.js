/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
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
 * @param {!gui.Viewport} viewport
 * @param {boolean} avatarInitiallyVisible Sets the initial visibility of the caret's avatar
 * @param {boolean} blinkOnRangeSelect Specify that the caret should blink if a non-collapsed range is selected
 */
gui.Caret = function Caret(cursor, viewport, avatarInitiallyVisible, blinkOnRangeSelect) {
    "use strict";
    var /**@const*/
        cursorns = 'urn:webodf:names:cursor',
        /**@const*/
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
        /**@type{!Element}*/
        caretSizer,
        /**@type{!Range}*/
        caretSizerRange,
        canvas = cursor.getDocument().getCanvas(),
        domUtils = core.DomUtils,
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
     * @return {?ClientRect}
     */
    function getCaretSizeFromCursor() {
        // The node itself has a slightly different BCR to a range created around it's contents.
        // Am not quite sure why, and the inspector gives no clues.
        caretSizerRange.selectNodeContents(caretSizer);
        return caretSizerRange.getBoundingClientRect();
    }

    /**
     * Get the client rectangle for the nearest selection point to the caret.
     * This works on the assumption that the next or previous sibling is likely to
     * be a text node that will provide an accurate rectangle for the caret's desired
     * position. The horizontal position of the caret is specified in the "right" property
     * as a caret generally appears to the right of the character or object is represents.
     *
     * @return {!{height: !number, top: !number, right: !number, width: !number}}
     */
    function getSelectionRect() {
        var node = cursor.getNode(),
            caretRectangle,
            nextRectangle,
            selectionRectangle,
            rootRect = /**@type{!ClientRect}*/(domUtils.getBoundingClientRect(canvas.getSizer())),
            useLeftEdge = false,
            width = 0;

        // Hide the caret sizer if it was previously active. This is only a fallback if an adjacent step can't be found.
        node.removeAttributeNS(cursorns, "caret-sizer-active");
        if (node.getClientRects().length > 0) {
            // If the cursor is visible, use that as the caret location.
            // The most common reason for the cursor to be visible is because the user is entering some text
            // via an IME, or no nearby rect was discovered and cursor was forced visible for caret rect calculations
            // (see below when the show-caret attribute is set).
            selectionRectangle = getCaretSizeFromCursor();
            // The space between the cursor BCR and the caretSizer is the width consumed by any visible composition text
            width = selectionRectangle.left - domUtils.getBoundingClientRect(node).left;
            useLeftEdge = true;
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
                // Handle the case where there are no nearby visible rects from which to determine the caret position.
                // Generally, making the cursor visible will cause word-wrapping and other undesirable features
                // if near an area the end of a wrapped line (e.g., #86).
                // However, as the previous checks have ascertained, there are no text nodes nearby, hence, making the
                // cursor visible won't change any wrapping.
                node.setAttributeNS(cursorns, "caret-sizer-active", "true");
                selectionRectangle = getCaretSizeFromCursor();
                useLeftEdge = true;
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
            right: useLeftEdge ? selectionRectangle.left : selectionRectangle.right,
            width: domUtils.adaptRangeDifferenceToZoomLevel(width, canvas.getZoomLevel())
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
            cursorStyle;

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
        caretOverlay.style.left = (selectionRect.right - selectionRect.width) + "px";
        caretOverlay.style.width = selectionRect.width ? (selectionRect.width + "px") : "";

        // Update the overlay element
        if (overlayElement) {
            cursorStyle = runtime.getWindow().getComputedStyle(cursor.getNode(), null);
            if (cursorStyle.font) {
                overlayElement.style.font = cursorStyle.font;
            } else {
                // On IE, window.getComputedStyle(element).font returns "".
                // Therefore we need to individually set the font properties.
                overlayElement.style.fontStyle = cursorStyle.fontStyle;
                overlayElement.style.fontVariant = cursorStyle.fontVariant;
                overlayElement.style.fontWeight = cursorStyle.fontWeight;
                overlayElement.style.fontSize = cursorStyle.fontSize;
                overlayElement.style.lineHeight = cursorStyle.lineHeight;
                overlayElement.style.fontFamily = cursorStyle.fontFamily;
            }
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
        }

        if (shouldUpdateCaretSize || shouldCheckCaretVisibility) {
            // Update the caret size if explicitly requested, or if the caret is about to be scrolled into view.
            updateOverlayHeightAndPosition();
        }

        if (state.isShown && shouldCheckCaretVisibility) {
            // The caret can only scroll into view if it hasn't been explicitly hidden via the hide() function.
            viewport.scrollIntoView(caretElement.getBoundingClientRect());
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
     * Hide the caret from view. All requests to scroll into view will be
     * ignored while the caret is hidden.
     * 
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
     *
     * If the caret has been hidden via the hide() function, no scrolling will
     * occur when this function is called.
     *
     * @return {undefined}
     */
    this.ensureVisible = function() {
        shouldCheckCaretVisibility = true;
        redrawTask.trigger();
    };

    /**
     * Get the bounding client rectangle of the visual caret.
     * @return {?ClientRect}
     */
    this.getBoundingClientRect = function() {
        return domUtils.getBoundingClientRect(caretOverlay);
    };

    /**
     * @param {!function(!Object=)} callback
     * @return {undefined}
     */
    function destroy(callback) {
        caretOverlay.parentNode.removeChild(caretOverlay);
        caretSizer.parentNode.removeChild(caretSizer);
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

        caretSizerRange = /**@type{!Range}*/(dom.createRange());

        caretSizer = dom.createElement("span");
        caretSizer.className = "webodf-caretSizer";
        caretSizer.textContent = "|";
        cursor.getNode().appendChild(caretSizer);

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
