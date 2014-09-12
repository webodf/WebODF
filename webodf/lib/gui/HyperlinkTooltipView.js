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

/*global runtime, gui, odf, core */

/**
 * @constructor
 * @implements {core.Destroyable}
 * @param {!odf.OdfCanvas} odfCanvas
 * @param {!function():!number} getActiveModifier Get the currently active hyperlink click handler modifier
 */
gui.HyperlinkTooltipView = function HyperlinkTooltipView(odfCanvas, getActiveModifier) {
    "use strict";
    var domUtils = core.DomUtils,
        odfUtils = odf.OdfUtils,
        /**@type{!Window}*/
        window = /**@type{!Window}*/(runtime.getWindow()),
        /**@type{!Element}*/
        linkSpan,
        /**@type{!Element}*/
        textSpan,
        /**@type{!HTMLElement}*/
        tooltipElement,
        /**
         * @const
         * @type {!number}
         */
        offsetXPx = 15,
        /**
         * @const
         * @type {!number}
         */
        offsetYPx = 10; // small adjustment to the final position so tooltip wouldn't sit right on top of caret

    runtime.assert(window !== null, "Expected to be run in an environment which has a global window, like a browser.");

    /**
     * @param {?Node} node
     * @return {?Element}
     */
    function getHyperlinkElement(node) {
        while (node) {
            if (odfUtils.isHyperlink(node)) {
                return /**@type{!Element}*/(node);
            }
            if (odfUtils.isParagraph(node) || odfUtils.isInlineRoot(node)) {
                break;
            }
            node = node.parentNode;
        }
        return null;
    }

    /**
     * @return {!string}
     */
    function getHint() {
        var modifierKey = getActiveModifier(),
            hint;
        switch (modifierKey) {
            case gui.KeyboardHandler.Modifier.Ctrl:
                hint = runtime.tr("Ctrl-click to follow link");
                break;
            case gui.KeyboardHandler.Modifier.Meta:
                hint = runtime.tr("⌘-click to follow link");
                break;
            default:
                hint = "";
                break;
        }
        return hint;
    }

    /**
     * Show the tooltip
     * @param {!Event} e
     * @return {undefined}
     */
    this.showTooltip = function (e) {
        var target = e.target || e.srcElement,
            sizerElement = /** @type{!Element}*/(odfCanvas.getSizer()),
            zoomLevel = odfCanvas.getZoomLevel(),
            referenceRect,
            linkElement,
            left, top, max;

        linkElement = getHyperlinkElement(/**@type{?Node}*/(target));
        if (!linkElement) {
            return;
        }

        if (!domUtils.containsNode(sizerElement, tooltipElement)) {
            // TODO Remove when a proper undo manager arrives
            // The undo manager can replace the root element, discarding the original.
            // The tooltip element is still valid, and simply needs to be re-attached
            // after this occurs.
            sizerElement.appendChild(tooltipElement);
        }

        textSpan.textContent = getHint();
        linkSpan.textContent = odfUtils.getHyperlinkTarget(linkElement);
        tooltipElement.style.display = "block";

        max = window.innerWidth - tooltipElement.offsetWidth - offsetXPx;
        left = e.clientX > max ? max : e.clientX + offsetXPx; // coordinates relative to the viewport
        max = window.innerHeight - tooltipElement.offsetHeight - offsetYPx;
        top = e.clientY > max ? max : e.clientY + offsetYPx; // coordinates relative to the viewport

        // converts the coordinates to relative to the sizer element
        referenceRect = sizerElement.getBoundingClientRect();
        left = (left - referenceRect.left) / zoomLevel;
        top = (top - referenceRect.top) / zoomLevel;

        tooltipElement.style.left = left + "px";
        tooltipElement.style.top = top + "px";
    };

    /**
     * Hide the tooltip
     * @return {undefined}
     */
    this.hideTooltip = function () {
        tooltipElement.style.display = "none";
    };

    /**
     * Destroy the object.
     * Do not access any member of this object after this call.
     * @param {function(!Error=):undefined} callback
     * @return {undefined}
     */
    this.destroy = function(callback) {
        if (tooltipElement.parentNode) {
            // The tool tip might not be present in the current DOM just after an undo is performed.
            // The tooltip is re-added to the DOM the first time it is asked to be shown after an undo.
            tooltipElement.parentNode.removeChild(tooltipElement);
        }
        callback();
    };

    /**
     * @return {undefined}
     */
    function init() {
        var document = odfCanvas.getElement().ownerDocument;
        linkSpan = document.createElement("span");
        textSpan = document.createElement("span");
        linkSpan.className = "webodf-hyperlinkTooltipLink";
        textSpan.className = "webodf-hyperlinkTooltipText";

        tooltipElement = /**@type{!HTMLElement}*/(document.createElement("div"));
        tooltipElement.className = "webodf-hyperlinkTooltip";
        tooltipElement.appendChild(linkSpan);
        tooltipElement.appendChild(textSpan);
        odfCanvas.getElement().appendChild(tooltipElement);
    }

    init();
};
