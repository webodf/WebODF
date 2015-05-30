/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
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

/*global runtime, core, xmled, NodeFilter */

runtime.loadClass("core.Cursor");

/**
 * @constructor
 * @param {!Element} root
 * @return {?}
 **/
xmled.XmlCaret = function XmlCaret(root) {
    "use strict";
    /**
     * @param {!Node} node
     * @return {number}
     */
    function acceptAll(node) {
        return node ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
    var doc = root.ownerDocument,
        htmlns = doc.documentElement.namespaceURI,
        /**@type{!core.Cursor}*/
        cursor,
        //leafNode,
        /**@type{Element}*/
        activeElement,
        cursorns = "urn:webodf:names:cursor",
        /**@type{!Array.<!Element>}*/
        history = [],
        walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT,
                acceptAll, false),
        /**@const*/
        DEFAULT_CARET_TOP = "5%",
        shouldBlink = true,
        blinking = false,
        /**@type{!HTMLSpanElement}*/
        cursorSpan,
        /**@type{!Element}*/
        cursorNode,
        blinkTimeout;

    /**
     * @param {boolean} reset
     */
    function blink(reset) {
        if (!shouldBlink || !cursorNode.parentNode) {
            // stop blinking when removed from the document
            return;
        }

        if (!blinking || reset) {
            if (reset && blinkTimeout !== undefined) {
                runtime.clearTimeout(blinkTimeout);
            }

            blinking = true;
            // switch between transparent and color
            cursorSpan.style.opacity =
                (reset || cursorSpan.style.opacity === "0")
                ? "1"
                : "0";

            blinkTimeout = runtime.setTimeout(function () {
                blinking = false;
                blink(false);
            }, 500);
        }
    }

    /**
     * @param {Element} a
     * @param {Element} b
     * @return {Element}
     */
    function getCommonParent(a, b) {
        var pa = [], i, l;
        while (a && a !== root) {
            pa[pa.length] = a;
            a = a.parentElement;
        }
        l = pa.length;
        while (b) {
            for (i = 0; i < l; i += 1) {
                if (pa[i] === b) {
                    return b;
                }
            }
            b = b.parentElement;
        }
        return null;
    }

    function updateHistory() {
        if (history.indexOf(activeElement) !== -1) {
            return;
        }
        var e = activeElement;
        history = [];
        while (e && e !== root) {
            history.push(e);
            e = e.parentNode;
        }
        history.push(root);
    }

    /**
     * @param {Element} element
     */
    function makeActive(element) {
        if (activeElement) {
            activeElement.removeAttributeNS(cursorns, "active");
        }
        if (element) {
            element.setAttributeNS(cursorns, "active", "1");
        }
        var commonParent = getCommonParent(activeElement, element),
            e = activeElement;
        while (e && e !== commonParent) {
            e.removeAttributeNS(cursorns, "caret");
            e = e.parentElement;
        }
        e = element;
        while (e && e !== commonParent) {
            e.setAttributeNS(cursorns, "caret", "1");
            e = e.parentElement;
        }
        activeElement = element;
        updateHistory();
        blink(true);
    }

    /**
     * @param {!Element} element
     */
    this.handleClick = function (element) {
        var sel = runtime.getWindow().getSelection(),
            range;
        if (sel.rangeCount) {
            range = runtime.getWindow().getSelection().getRangeAt(0);
            cursor.setSelectedRange(/**@type{!Range}*/(range));
        }
        makeActive(element);
    };
    /**
     * @param {Element} e
     * @return {number}
     */
    function getDepth(e) {
        var depth = 0;
        while (e && e !== root) {
            depth += 1;
            e = e.parentElement;
        }
        return depth;
    }
    this.nextSibling = function () {
        if (!activeElement) {
            return;
        }
        var d;
        if (activeElement.nextElementSibling) {
            makeActive(activeElement.nextElementSibling);
        } else {
            d = getDepth(activeElement);
            walker.currentNode = activeElement;
            while (walker.nextNode()) {
                if (d === getDepth(walker.currentNode)) {
                    makeActive(walker.currentNode);
                    break;
                }
            }
        }
    };
    this.previousSibling = function () {
        if (!activeElement) {
            return;
        }
        var d;
        if (activeElement.previousElementSibling) {
            makeActive(activeElement.previousElementSibling);
        } else {
            d = getDepth(activeElement);
            walker.currentNode = activeElement;
            while (walker.previousNode()) {
                if (d === getDepth(walker.currentNode)) {
                    makeActive(walker.currentNode);
                    break;
                }
            }
        }
    };
    this.up = function () {
        if (!activeElement) {
            return;
        }
        if (activeElement !== root) {
            makeActive(activeElement.parentElement);
        }
    };
    this.down = function () {
        if (!activeElement) {
            return;
        }
        var i = history.indexOf(activeElement);
        if (i > 0) {
            makeActive(history[i - 1]);
            return;
        }
        i = activeElement.firstElementChild;
        if (i && i.namespaceURI !== cursorns) {
            makeActive(i);
        }
    };
    /**
     * @return {Element}
     */
    this.getActiveElement = function () {
        return activeElement;
    };
    /**
     * @return {!core.Cursor}
     */
    this.getCursor = function () {
        return cursor;
    };
    this.left = function () {
        var node = cursor.getNode(), p, t;
        node.parentNode.normalize();
        p = node.previousSibling;
        if (p && p.nodeType === 3) {
            t = /**@type{!Text}*/(p);
            t = t.splitText(t.length - 1);
            node.parentNode.insertBefore(t, node.nextSibling);
        }
    };
    this.right = function () {
        var node = cursor.getNode(), n, t,
            p = node.parentNode;
        p.normalize();
        n = node.nextSibling;
        if (n && n.nodeType === 3) {
            t = /**@type{!Text}*/(n).splitText(1);
            p.insertBefore(node, t);
        }
    };
    /**
     * @return {Text}
     */
    this.leftText = function () {
        var node = cursor.getNode(),
            p = node.parentNode,
            t;
        p.normalize();
        t = node.previousSibling;
        if (!t || t.nodeType !== 3) {
            t = doc.createTextNode("");
            p.insertBefore(t, node);
        }
        return /**@type{Text}*/(t);
    };
    /**
     * @return {Text}
     */
    this.rightText = function () {
        var node = cursor.getNode(),
            p = node.parentNode,
            t;
        p.normalize();
        t = node.nextSibling;
        if (!t || t.nodeType !== 3) {
            t = doc.createTextNode("");
            p.insertBefore(t, node.nextSibling);
        }
        return /**@type{Text}*/(t);
    };
    this.setFocus = function () {
        shouldBlink = true;
        blink(true);
    };
    this.removeFocus = function () {
        shouldBlink = false;
        blink(true);
    };
    function init() {
        if (!doc) {
            return;
        }
        cursor = new core.Cursor(doc, "me");
        cursorSpan = /**@type{!HTMLSpanElement}*/(doc.createElementNS(htmlns, "span"));
        cursorSpan.style.top = DEFAULT_CARET_TOP;
        cursorNode = cursor.getNode();
        cursorNode.appendChild(cursorSpan);
        blink(true);
    }
    init();
};
