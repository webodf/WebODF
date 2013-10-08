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

runtime.loadClass("xmled.ValidationModel");

/**
 * This class manages a loaded ODF document that is shown in an element.
 * It takes care of giving visual feedback on loading, ensures that the
 * stylesheets are loaded.
 * @constructor
 * @param {!Element} element Put and ODF Canvas inside this element.
 * @param {!xmled.ValidationModel} validationModel
 * @param {!string} styleurl
 * @return {?}
 **/
xmled.XmlCanvas = function XmlCanvas(element, validationModel, styleurl) {
    "use strict";
    var self = this,
        doc = element.ownerDocument,
        styleElement,
        state = xmled.XmlCanvas.State.LOADING,
        error,
        root;
    validationModel.getState();
/*
    function enrich(element) {
        var ns = "urn:webodf:names:custom";
        element.setAttributeNS(ns, "localname", element.localName);
        element.setAttribute("localname", element.localName);
        element = element.firstChild;
        while (element) {
            if (element.nodeType === 1) {
                enrich(element);
            }
            element = element.nextSibling;
        }
    }
*/
    /**
     * @return {!xmled.XmlCanvas.State}
     */
    this.getState = function () {
        return state;
    };
    /**
     * @return {?string}
     */
    this.getError = function () {
        return error;
    };
    /**
     * @param {!function(!Object=)} callback, passing an error object in case of
     *                              error
     * @return {undefined}
     */
    this.destroy = function (callback) {
        styleElement.parentNode.removeChild(styleElement);
        callback();
    };
    function init() {
        var head = doc.getElementsByTagName('head')[0],
            ns = element.namespaceURI;
        styleElement = doc.createElementNS(ns, 'link');
        styleElement.setAttribute("rel", "stylesheet");
        styleElement.setAttribute("type", "text/css");
        styleElement.setAttribute("media", "screen, print, handheld, projection");
        styleElement.setAttribute("href", styleurl);
        head.appendChild(styleElement);
    }
    /**
     * @param {!string} url
     * @return {undefined}
     */
    this.load = function (url) {
        self.destroy(function () {
            init();
            runtime.loadXML(url, function (err, dom) {
                if (err) {
                    error = err;
                    state = xmled.XmlCanvas.State.ERROR;
                    return;
                }
                runtime.log(err);
                root = /**@type{!Element}*/(doc.importNode(dom.documentElement, true));
                //enrich(e);
                element.appendChild(root);
            });
        });
    };
    /**
     * @param {function(?string):undefined} callback
     * @return {undefined}
     */
    this.save = function (callback) {
        runtime.log("saving");
        callback(null);
    };
    /**
     * @return {?Element}
     */
    this.getDocumentRoot = function () {
        return root;
    };
    init();
};/**
 * @enum {number}
 */
xmled.XmlCanvas.State = {
    LOADING: 1,
    ERROR:   2,
    READY:   3
};
(function () {
    "use strict";
    return xmled.XmlCanvas;
}());
