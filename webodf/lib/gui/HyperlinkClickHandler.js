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

/*global runtime, gui, odf, xmldom */

runtime.loadClass("odf.Namespaces");
runtime.loadClass("odf.OdfUtils");
runtime.loadClass("xmldom.XPath");

/**
 * @constructor
 * @param {!function():!Node} getRootNode
 */
gui.HyperlinkClickHandler = function HyperlinkClickHandler(getRootNode) {
    "use strict";
    var /**@const
         @type{!string}*/
        webodfns = "urn:webodf:names:helper",
        /**@const
         @type{!string}*/
        links = "links",
        /**@const
         @type{!string}*/
        inactive = "inactive",
        odfUtils = new odf.OdfUtils(),
        xpath = xmldom.XPath,
        editing = false;

    /**
     * @param {?EventTarget} node
     * @return {?Element}
     */
    function getHyperlinkElement(node) {
        while (node !== null) {
            if (odfUtils.isHyperlink(node)) {
                return node;
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
     */
    this.handleClick = function (e) {
        var target = e.target || e.srcElement,
            linkElement,
            url,
            rootNode,
            bookmarks;

        if (editing && !e.ctrlKey && !e.metaKey) {
            return;
        }

        linkElement = getHyperlinkElement(target);
        if (!linkElement) {
            return;
        }

        url = odfUtils.getHyperlinkTarget(linkElement);
        if (!url) {
            return;
        }

        if (url[0] === '#') { // bookmark
            url = url.substring(1);
            rootNode = /** @type {!Element} */(getRootNode());
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
            runtime.getWindow().open(url);
        }
    };

    /**
     * Show pointer cursor when hover over hyperlink
     */
    function showPointerCursor() {
        getRootNode().removeAttributeNS(webodfns, links, inactive);
    }
    this.showPointerCursor = showPointerCursor;

    /**
     * Show text cursor when hover over hyperlink
     */
    function showTextCursor() {
        getRootNode().setAttributeNS(webodfns, links, inactive);
    }
    this.showTextCursor = showTextCursor;

    /**
     * Sets to true when in edit mode; otherwise false
     * @param {!boolean} value
     */
    this.setEditing = function (value) {
        editing = value;
        if (editing) {
            showTextCursor();
        } else {
            showPointerCursor();
        }
    };
};