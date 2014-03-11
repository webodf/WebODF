/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
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
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global runtime, gui, odf, xmldom */


/**
 * @constructor
 * @implements {core.Destroyable}
 * @param {!function():!HTMLElement} getContainer Fetch the surrounding HTML container
 * @param {!gui.KeyboardHandler} keyDownHandler
 * @param {!gui.KeyboardHandler} keyUpHandler
 */
gui.HyperlinkClickHandler = function HyperlinkClickHandler(getContainer, keyDownHandler, keyUpHandler) {
    "use strict";
    var /**@const
         @type{!string}*/
        inactiveLinksCssClass = "webodf-inactiveLinks",
        modifier = gui.KeyboardHandler.Modifier,
        keyCode = gui.KeyboardHandler.KeyCode,
        xpath = xmldom.XPath,
        odfUtils = new odf.OdfUtils(),
        window = /**@type{!Window}*/(runtime.getWindow()),
        /**@type{!number}*/
        activeModifier = modifier.None,
        /**@type{!Array.<!{keyCode: !number, modifier: !number}>}*/
        activeKeyBindings = [];

    runtime.assert(window !== null, "Expected to be run in an environment which has a global window, like a browser.");

    /**
     * @param {?Node} node
     * @return {?Element}
     */
    function getHyperlinkElement(node) {
        while (node !== null) {
            if (odfUtils.isHyperlink(node)) {
                return /**@type{!Element}*/(node);
            }
            if (odfUtils.isParagraph(node)) {
                break;
            }
            node = node.parentNode;
        }
        return null;
    }

    /**
     * @param {!Event} e
     * @return {undefined}
     */
    this.handleClick = function (e) {
        var target = e.target || e.srcElement,
            pressedModifier,
            linkElement,
            /**@type{!string}*/
            url,
            rootNode,
            bookmarks;

        if (e.ctrlKey) {
            pressedModifier = modifier.Ctrl;
        } else if (e.metaKey) {
            pressedModifier = modifier.Meta;
        }

        if (activeModifier !== modifier.None && activeModifier !== pressedModifier) {
            return;
        }

        linkElement = getHyperlinkElement(/**@type{?Node}*/(target));
        if (!linkElement) {
            return;
        }

        url = odfUtils.getHyperlinkTarget(linkElement);
        if (url === "") {
            return;
        }

        if (url[0] === '#') { // bookmark
            url = url.substring(1);
            rootNode = getContainer();
            bookmarks = xpath.getODFElementsWithXPath(rootNode,
                "//text:bookmark-start[@text:name='" + url + "']",
                odf.Namespaces.lookupNamespaceURI);

            if (bookmarks.length === 0) {
                bookmarks = xpath.getODFElementsWithXPath(rootNode,
                    "//text:bookmark[@text:name='" + url + "']",
                    odf.Namespaces.lookupNamespaceURI);
            }

            if (bookmarks.length > 0) {
                bookmarks[0].scrollIntoView(true);
            }
        } else {
            // Ask the browser to open the link in a new window.
            window.open(url);
        }

        if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }
    };

    /**
     * Show pointer cursor when hover over hyperlink
     * @return {undefined}
     */
    function showPointerCursor() {
        var container = getContainer();
        runtime.assert(Boolean(container.classList), "Document container has no classList element");
        container.classList.remove(inactiveLinksCssClass);
    }

    /**
     * Show text cursor when hover over hyperlink
     * @return {undefined}
     */
    function showTextCursor() {
        var container = getContainer();
        runtime.assert(Boolean(container.classList), "Document container has no classList element");
        container.classList.add(inactiveLinksCssClass);
    }

    /**
     * Remove all currently subscribed keyboard shortcuts & window events
     * @return {undefined}
     */
    function cleanupEventBindings() {
        window.removeEventListener("focus", showTextCursor, false);
        activeKeyBindings.forEach(function(boundShortcut) {
            keyDownHandler.unbind(boundShortcut.keyCode, boundShortcut.modifier);
            keyUpHandler.unbind(boundShortcut.keyCode, boundShortcut.modifier);
        });
        activeKeyBindings.length = 0;
    }

    /**
     * @param {!number} modifierKey
     * @return {undefined}
     */
    function bindEvents(modifierKey) {
        cleanupEventBindings();

        if (modifierKey !== modifier.None) {
            // Cursor style needs to be reset when the window loses focus otherwise the cursor hand will remain
            // permanently on in some browsers due to the focus being switched and the keyup event never being received.
            // eventManager binds to the focus event on both eventTrap and window, but we only specifically want
            // the window focus event.
            window.addEventListener("focus", showTextCursor, false);

            switch (modifierKey) {
                case modifier.Ctrl:
                    activeKeyBindings.push({keyCode: keyCode.Ctrl, modifier: modifier.None});
                    break;
                case modifier.Meta:
                    activeKeyBindings.push({keyCode: keyCode.LeftMeta, modifier: modifier.None});
                    activeKeyBindings.push({keyCode: keyCode.RightMeta, modifier: modifier.None});
                    activeKeyBindings.push({keyCode: keyCode.MetaInMozilla, modifier: modifier.None});
                    break;
            }

            activeKeyBindings.forEach(function(boundShortcut) {
                keyDownHandler.bind(boundShortcut.keyCode, boundShortcut.modifier, showPointerCursor);
                keyUpHandler.bind(boundShortcut.keyCode, boundShortcut.modifier, showTextCursor);
            });
        }
    }

    /**
     * Sets the modifier key for activating the hyperlink.
     * @param {!number} value
     * @return {undefined}
     */
    this.setModifier = function (value) {
        if (activeModifier === value) {
            return;
        }
        runtime.assert(value === modifier.None || value === modifier.Ctrl || value === modifier.Meta,
            "Unsupported KeyboardHandler.Modifier value: " + value);

        activeModifier = value;
        if (activeModifier !== modifier.None) {
            showTextCursor();
        } else {
            showPointerCursor();
        }
        bindEvents(activeModifier);
    };

    /**
     * Destroy the object.
     * Do not access any member of this object after this call.
     * @param {function(!Object=):undefined} callback
     * @return {undefined}
     */
    this.destroy = function(callback) {
        showTextCursor();
        cleanupEventBindings();
        callback();
    };
};
