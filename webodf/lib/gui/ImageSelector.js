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

/*global runtime, gui, odf */

/**
 * @class
 * @constructor
 * @param {!odf.OdfCanvas} odfCanvas
 */
gui.ImageSelector = function ImageSelector(odfCanvas) {
    "use strict";
    var /**@const
           @type {!string}*/
        svgns = odf.Namespaces.svgns,
        /**@const
           @type {!string}*/
        imageSelectorId = "imageSelector",
        /**@const
           @type {!number}*/
        selectorBorderWidth = 1, // in px
        /**@const
           @type {!Array.<!string>}*/
        squareClassNames = [
            "topLeft", "topRight", "bottomRight", "bottomLeft", "topMiddle", "rightMiddle", "bottomMiddle", "leftMiddle"
        ],
        document = odfCanvas.getElement().ownerDocument,
        hasSelection = false;

    /**
     * @return {!Element}
     */
    function createSelectorElement() {
        var sizerElement = odfCanvas.getSizer(),
            selectorElement = /**@type{!HTMLElement}*/(document.createElement("div"));

        selectorElement.id = "imageSelector";
        selectorElement.style.borderWidth = selectorBorderWidth + "px";
        sizerElement.appendChild(selectorElement);

        /**
         * @param {string} className
         */
        function createDiv(className) {
            var squareElement = document.createElement("div");
            squareElement.className = className;
            selectorElement.appendChild(squareElement);
        }
        squareClassNames.forEach(createDiv);

        return selectorElement;
    }

    /**
     * @param {!Element} element
     * @param {!Element} referenceElement
     * @return {{left: !number, top: !number}}
     */
    function getPosition(element, referenceElement) {
        var rect = element.getBoundingClientRect(),
            refRect = referenceElement.getBoundingClientRect(),
            zoomLevel = odfCanvas.getZoomLevel();

        return {
            left: (rect.left - refRect.left) / zoomLevel - selectorBorderWidth,
            top: (rect.top - refRect.top) / zoomLevel - selectorBorderWidth
        };
    }

    /**
     * @param {!Element} frameElement
     * @return {undefined}
     */
    this.select = function (frameElement) {
        var selectorElement = document.getElementById(imageSelectorId),
            position;

        // selector element could be removed by the undo process so re-create it if needed
        if (!selectorElement) {
            selectorElement = createSelectorElement();
        }

        hasSelection = true;
        position = getPosition(frameElement, /** @type {!Element}*/(selectorElement.parentNode));
        selectorElement.style.display = "block";
        selectorElement.style.left = position.left + "px";
        selectorElement.style.top = position.top + "px";
        selectorElement.style.width = frameElement.getAttributeNS(svgns, "width");
        selectorElement.style.height = frameElement.getAttributeNS(svgns, "height");
    };

    /**
     * Clears the image selection.
     * @return {undefined}
     */
    this.clearSelection = function () {
        var selectorElement;
        if (hasSelection) {
            selectorElement = document.getElementById(imageSelectorId);
            if (selectorElement) {
                selectorElement.style.display = "none";
            }
        }
        hasSelection = false;
    };

    /**
     * Check if the given node is the selector element or one of its child elements.
     * @param {?Node} node
     * @return {!boolean}
     */
    this.isSelectorElement = function (node) {
        var selectorElement = document.getElementById(imageSelectorId);
        if (!selectorElement) {
            return false;
        }
        return node === selectorElement || node.parentNode === selectorElement;
    };
};
