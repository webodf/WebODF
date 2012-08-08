/**
 * Copyright (C) 2011 KO GmbH <jos.van.den.oever@kogmbh.com>
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
/*global gui, runtime*/
/**
 * Class that represents a caret in a document. In text nodes, a native caret is
 * used via the HTML attribute contentEditable. Outside of text nodes, an empty
 * element representing the caret is used.
 * @constructor
 * @param {!Element} rootNode
 * @param {!function(!number):!boolean=} keyHandler
 */
gui.Caret = function Caret(rootNode, keyHandler) {
    "use strict";
    function listenEvent(eventTarget, eventType, eventHandler) {
        if (eventTarget.addEventListener) {
            eventTarget.addEventListener(eventType, eventHandler, false);
        } else if (eventTarget.attachEvent) {
            eventType = "on" + eventType;
            eventTarget.attachEvent(eventType, eventHandler);
        } else {
            eventTarget["on" + eventType] = eventHandler;
        }
    }
    function cancelEvent(event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    }
    var document = rootNode.ownerDocument,
        htmlns = document.documentElement.namespaceURI,
        span = document.createElementNS(htmlns, "span"),
        cursorns = 'urn:webodf:names:cursor',
        cursorNode;
    cursorNode = document.createElementNS(cursorns, 'cursor');
    cursorNode.setAttribute("color", "white");
    span.setAttribute("contenteditable", true);
    cursorNode.appendChild(span);
    function blink() {
        if (!cursorNode.parentNode) {
            // stop blinking when removed from the document
            return;
        }
        if (cursorNode.getAttribute("color") === "white") {
            cursorNode.setAttribute("color", "black");
        } else {
            cursorNode.setAttribute("color", "white");
        }
        span.focus();
        runtime.setTimeout(blink, 1000);
    }
    this.focus = function () {
    };
    this.move = function (number) {
    };
    function handleKeyDown(e) {
        if (keyHandler) {
            keyHandler(e.keyCode);
        }
        cancelEvent(e);
    }
    function handleKeyPress(e) {
    }
    function initElement(element) {
        listenEvent(element, "keydown", handleKeyDown);
        listenEvent(element, "keypress", handleKeyPress);
    }
    function init() {
        initElement(cursorNode);
        // for now, just put it at the start of the rootNode 
        rootNode.insertBefore(cursorNode, rootNode.firstChild);
        blink();
    }
    init();
};
