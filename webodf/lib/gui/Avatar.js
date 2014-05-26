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

/*global gui*/

/**
 * The avatar is a passive element that can be displayed above an element.
 * It will always keep a relative distance to that element, so automatically
 * move around with the parent element.
 * @constructor
 * @implements {core.Destroyable}
 * @param {!Element} parentElement
 * @param {boolean} avatarInitiallyVisible Sets the initial visibility of the avatar
 */
gui.Avatar = function Avatar(parentElement, avatarInitiallyVisible) {
    "use strict";
    var self = this,
        /**@type{!HTMLDivElement}*/
        handle,
        /**@type{!HTMLImageElement}*/
        image,
        pendingImageUrl,
        displayShown = "block",
        displayHidden = "none";

    /**
     * @param {!string} color
     */
    this.setColor = function (color) {
        image.style.borderColor = color;
    };
    /**
     * @param {!string} url
     */
    this.setImageUrl = function (url) {
        if (self.isVisible()) {
            image.src = url;
        } else {
            // Delay loading of the associated image until the avatar is displayed
            pendingImageUrl = url;
        }
    };
    /**
     * @return {boolean}
     */
    this.isVisible = function () {
        return (handle.style.display === displayShown);
    };
    /**
     * @return {undefined}
     */
    this.show = function () {
        if (pendingImageUrl) {
            image.src = pendingImageUrl;
            pendingImageUrl = undefined;
        }
        handle.style.display = displayShown;
    };
    /**
     * @return {undefined}
     */
    this.hide = function () {
        handle.style.display = displayHidden;
    };
    /**
     * @param {boolean} isFocussed
     * @return {undefined}
     */
    this.markAsFocussed = function (isFocussed) {
        if (isFocussed) {
            handle.classList.add("active");
        } else {
            handle.classList.remove("active");
        }
    };

    /**
     * @param {!function(!Error=)} callback, passing an error object in case of error
     * @return {undefined}
     */
    this.destroy = function (callback) {
        parentElement.removeChild(handle);
        callback();
    };

    function init() {
        var document = /**@type{!Document}*/(parentElement.ownerDocument);

        handle = /**@type{!HTMLDivElement}*/(document.createElement("div"));
        image = /**@type{!HTMLImageElement}*/(document.createElement("img"));
        handle.appendChild(image);
        handle.style.display = avatarInitiallyVisible ? displayShown : displayHidden;
        handle.className = "handle";
        parentElement.appendChild(handle);
    }

    init();
};
