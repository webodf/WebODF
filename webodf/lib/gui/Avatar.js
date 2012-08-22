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
 * @source: http://gitorious.org/odfkit/webodf/
 */
/*global runtime, core, gui*/
runtime.loadClass("gui.Caret");

/**
 * The avatar is at the same time visualization of the caret and receiver of
 * input events.
 * The avatar does not change it's position of its own accord. The position is
 * changed by the session to which the avatar forwards the keystrokes that it
 * receives.
 * @constructor
 * @param {!string} memberid
 * @param {!Element} rootNode
 * @param {!function(!number):undefined} caretMover
 */
gui.Avatar = function Avatar(memberid, rootNode, caretMover) {
    "use strict";
    var self = this,
        caret,
        image;
    /**
     * @param {!number} charCode
     * @return {!boolean}
     */
    function keyHandler(charCode) {
        var handled = false;
        if (charCode === 37) { // left
            caretMover(-1);
            handled = true;
        } else if (charCode === 39) { // right
            caretMover(1);
            handled = true;
        }
        return handled;
    }
    this.removeFromSession = function () {
    };
    this.getMemberId = function () {
        return memberid;
    };
    this.setImageUrl = function (url) {
        image.src = url;
    };
    this.getColor = function () {
        return caret.getColor();
    };
    this.setColor = function (color) {
        caret.setColor(color);
    };
    this.getCaret = function () {
        return caret;
    };
    function init() {
        var pointWalker = new core.SimplePointWalker(rootNode),
            handle;
        caret = new gui.Caret(rootNode, pointWalker, keyHandler);
        handle = caret.getHandleElement();
        image = handle.ownerDocument.createElementNS(handle.namespaceURI, "img");
        handle.appendChild(image);
    }
    init();
};
