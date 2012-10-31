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

runtime.loadClass("gui.SelectionMover");

/**
 * Class that represents a caret in a document. In text nodes, a native caret is
 * used via the HTML attribute contentEditable. Outside of text nodes, an empty
 * element representing the caret is used.
 * @constructor
 * @param {!gui.SelectionMover} selectionMover
 * @param {!function(!number):!boolean=} keyHandler
 */
gui.Caret = function Caret(selectionMover, keyHandler) {
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
    function clearNode(node) {
        while (node.firstChild !== null) {
            node.removeNode(node.firstChild);
        }
    }
    var rootNode = selectionMover.getRootNode(),
        document = /**@type{!Document}*/(rootNode.ownerDocument),
        htmlns = document.documentElement.namespaceURI,
        span = document.createElementNS(htmlns, "span"),
        handle = document.createElementNS(htmlns, "div"),
        cursorNode,
        focussed = false,
        caretLineVisible,
        blinking = false;

    function blink() {
        if (!focussed || !cursorNode.parentNode) {
            // stop blinking when removed from the document
            return;
        }
        if (caretLineVisible) {
            span.style.outlineWidth = "0px";
        } else {
            span.style.outlineWidth = "1px";
        }
        caretLineVisible = !caretLineVisible;
        if (!blinking) {
            blinking = true;
            runtime.setTimeout(function () {
                blinking = false;
                blink();
            }, 1000);
        }
    }
    function updateHandlePosition() {
        if (handle.style) {
            handle.style.top = (span.offsetTop - handle.offsetHeight - 10) + "px";
            handle.style.left = (span.offsetLeft - handle.offsetWidth / 2) + "px";
        }
    }

    this.focus = function () {
        span.focus();
        updateHandlePosition();
    };
    this.updateHandlePosition = function () {
        updateHandlePosition();
    };
    this.move = function (number) {
        //runtime.log("moving " + number);
        var moved = 0;
        if (number > 0) {
            moved = selectionMover.movePointForward(number);
        } else if (number <= 0) {
            moved = -selectionMover.movePointBackward(-number);
        }
        updateHandlePosition();
        return moved;
    };
    this.setColor = function (color) {
        span.style.borderColor = color;
        handle.style.background = color;
    };
    this.getColor = function () {
        return span.style.borderColor;
    };
    this.getSelection = function () {
        return selectionMover.getSelection();
    };
    this.getHandleElement = function () {
        return handle;
    };
    this.toggleHandleVisibility = function () {
        if (handle.style.display === "block") {
            this.hideHandle();
        } else {
            this.showHandle();
        }
    };
    this.showHandle = function () {
        handle.style.display = "block";
        updateHandlePosition();
    };
    this.hideHandle = function () {
        handle.style.display = "none";
    };
    this.getStepCounter = function () {
        return selectionMover.getStepCounter();
    };
    function handleKeyDown(e) {
        if (keyHandler) {
            keyHandler(e.keyCode);
        }
        // still allow ctrl-r in ui, must be improved later
        if (!e.ctrlKey) {
            cancelEvent(e);
        }
    }
    function dummyHandler(e) {
        cancelEvent(e);
    }
    function init() {
        if (handle.style) {
            handle.style.width = '64px';
            handle.style.height = '70px';
        }

        span.setAttribute("contenteditable", true);
        span.onfocus = function () {
            focussed = true;
            handle.className = "active";
            blink();
        };
        span.onblur = function () {
            focussed = false;
            handle.className = "";
            span.style.borderLeftWidth = "1px";
        };
        cursorNode = selectionMover.getCursor().getNode();
        cursorNode.appendChild(span);
        cursorNode.appendChild(handle);
        listenEvent(span, "keydown", handleKeyDown);
        listenEvent(span, "keyup", dummyHandler);
        listenEvent(span, "copy", dummyHandler);
        listenEvent(span, "cut", dummyHandler);
        listenEvent(span, "paste", dummyHandler);
    }
    init();
};
