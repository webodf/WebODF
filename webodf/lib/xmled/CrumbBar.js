/**
 * @license
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

/*global runtime, xmled */

/**
 * @constructor
 * @param {!Element} htmlelement in which to draw the crumbs 
 * @param {?Element} root root element of document
 * @param {!xmled.ValidationModel} validationModel
 * @return {?}
 **/
xmled.CrumbBar = function CrumbBar(htmlelement, root, validationModel) {
    "use strict";
    var doc = htmlelement.ownerDocument,
        htmlns = htmlelement.namespaceURI,
        cursorns = "urn:webodf:names:cursor";
    function clean() {
        while (htmlelement.firstChild) {
            htmlelement.removeChild(htmlelement.firstChild);
        }
    }
    function createArrow() {
        var span = doc.createElementNS(htmlns, "span");
        span.appendChild(doc.createTextNode(" ▸ "));
        span.style.color = "#FF8A00";
        span.style.padding = "2px";
        span.style.fontFamily = "sans";
        return span;
    }

    function createMenuItem(menu, text) {
        var item = doc.createElementNS(htmlns, "div");
        item.appendChild(doc.createTextNode(text));
        item.style.position = "relative";
        item.className = 'hoveropaque';
        menu.appendChild(item);
//        item.setAttribute("tabindex", "1");
    }

    function createMenu(element) {
        var menu = doc.createElementNS(htmlns, "div"),
            allowed = validationModel.getAllowedElements(element),
            i;
        for (i = 0; i < allowed.length; i += 1) {
            createMenuItem(menu, "Insert " + allowed[i]);
        }
        menu.style.display = "none";
        menu.style.position = "absolute";
        menu.style.background = "black";
        menu.style.color = "white";
        menu.style.whiteSpace = "nowrap";
        menu.style.padding = "5px";
        menu.style.minWidth = "100%";
        menu.style.top = "100%";
//        menu.style.height = "100%";
//        menu.setAttribute("tabindex", "1");
        return menu;
    }

    function hideMenus(e) {
        e = e.firstElementChild;
        while (e) {
            if (e.style.display === "block") {
                e.style.display = "none";
            }
            hideMenus(e);
            e = e.nextElementSibling;
        }
    }
 
    function createCrumb(element) {
        var span = createArrow(),
            crumb = doc.createElementNS(htmlns, "span"),
            menu = createMenu(element);
        span.appendChild(crumb);
        //crumb.setAttribute("tabindex", "1");
        crumb.appendChild(doc.createTextNode(element.localName));
        crumb.style.color = "#FFFFFF";
        crumb.style.cursor = "pointer";
        crumb.style.position = "relative";
        crumb.onmouseover = function () {
            element.setAttributeNS(cursorns, "hover", "1");
        };
        crumb.onmouseout = function () {
            element.removeAttributeNS(cursorns, "hover");
        };
        crumb.appendChild(menu);
        crumb.onclick = function (evt) {
            var d = menu.style.display;
            hideMenus(crumb.parentNode.parentNode);
            menu.style.display = d === "none" ? "block" : "none";
        };
        return span;
    }
    this.setDocumentRoot = function (newRoot) {
        root = newRoot;
    };
    /**
     * @param {!Element} element in which to draw the crumbs
     */
    this.setElement = function (element) {
        clean();
        if (!root || !root.contains(element)) {
            return;
        }
        var e = element,
            empty = true;
        while (e && e !== root.parentNode) {
            htmlelement.insertBefore(createCrumb(e), htmlelement.firstChild);
            empty = false;
            e = e.parentNode;
        }
        if (empty) {
            htmlelement.appendChild(createArrow());
        }
    };
    htmlelement.appendChild(createArrow());
};
