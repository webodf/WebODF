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
/*global core, gui, runtime*/

runtime.loadClass("core.Cursor");
runtime.loadClass("gui.Avatar");

/**
 * Class that represents a caret in a document. In text nodes, a native caret is
 * used via the HTML attribute contentEditable. Outside of text nodes, an empty
 * element representing the caret is used.
 * @constructor
 * @param {!core.Cursor} cursor
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
        caretLineVisible,
        blinking = false,
        color = "";

    function blink() {
        if (!focussed || !cursorNode.parentNode) {
            // stop blinking when removed from the document
            return;
        }
        caretLineVisible = !caretLineVisible;
        span.style.borderLeftWidth = (caretLineVisible ? "1px" : "0px");

        if (!blinking) {
            blinking = true;
            runtime.setTimeout(function () {
                blinking = false;
                blink();
            }, 500);
        }
    }

    this.setFocus = function () {
        span.focus();
    };
    this.setAvatarImageUrl = function (url) {
        avatar.setImageUrl(url);
    };
    this.setColor = function (color) {
        span.style.borderColor = color;
        avatar.setColor(color);
    };
    /**
     * @return {!string}
     */
    this.getColor = function () {
        return color;
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
    function init() {
        var dom = cursor.getOdfDocument().getDOM(),
            htmlns = dom.documentElement.namespaceURI;

        span = dom.createElementNS(htmlns, "span");
        span.setAttribute("tabindex", 0); // enable span to have focus

        span.onfocus = function () {
            focussed = true;
            avatar.markAsFocussed(true);
            blink();
        };
        span.onblur = function () {
            focussed = false;
            avatar.markAsFocussed(false);
            // restore from blinking
            span.style.borderLeftWidth = "1px";
        };

        cursorNode = cursor.getNode();
        cursorNode.appendChild(span);
        avatar = new gui.Avatar(cursorNode);
    }
    init();
};
