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
/*global gui*/

/**
 * The avatar is a passive element that can be displayed above an element.
 * It will always keep a relative distance to that element, so automatically
 * move around with the parent element.
 * @constructor
 * @param {!Element} parentElement
 */
gui.Avatar = function Avatar(parentElement) {
    "use strict";
    var handle,
        image,
        displayShown = "block",
        displayHidden = "none";

    this.setColor = function (color) {
        handle.style.background = color;
    };
    this.setImageUrl = function (url) {
        image.src = url;
    };
    this.isVisible = function () {
        return (handle.style.display === displayShown);
    };
    this.show = function () {
        handle.style.display = displayShown;
    };
    this.hide = function () {
        handle.style.display = displayHidden;
    };
    this.markAsFocussed = function (isFocussed) {
        handle.className = (isFocussed ? "active" : "");
    };

    function init() {
        var document = /**@type{!Document}*/(parentElement.ownerDocument),
            htmlns = document.documentElement.namespaceURI;

        handle = document.createElementNS(htmlns, "div");
        image = document.createElementNS(htmlns, "img");
        image.width = 64;
        image.height = 64;
        handle.appendChild(image);
        handle.style.width = '64px';
        handle.style.height = '70px';
        handle.style.position = "absolute";
        handle.style.top = '-80px';
        handle.style.left = '-34px'; // TODO: see to automatically calculate this, depending on the style
        handle.style.display = displayShown;
        parentElement.appendChild(handle);
    }

    init();
};
