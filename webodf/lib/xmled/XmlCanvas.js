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

/*global runtime, xmled */

runtime.loadClass("xmled.ValidationModel");
runtime.loadClass("xmled.XmlCaret");

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
        /**@type{!Element}*/
        styleElement,
        state = xmled.XmlCanvas.State.LOADING,
        error,
        root,
        caret;
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
        if (!doc) {
            throw "No document!";
        }
        var head = /**@type{!HTMLHeadElement}*/(doc.getElementsByTagName('head')[0]),
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
     * @param {!function():undefined} callback
     * @return {undefined}
     */
    this.load = function (url, callback) {
        self.destroy(function () {
            init();
            runtime.loadXML(url, function (err, dom) {
                if (err) {
                    runtime.log(err);
                    error = err;
                    state = xmled.XmlCanvas.State.ERROR;
                    return;
                }
                root = /**@type{!Element}*/(doc.importNode(dom.documentElement, true));
                //enrich(e);
                element.appendChild(root);
                caret = new xmled.XmlCaret(root);
                callback();
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
     * @return {!Element}
     */
    this.getDocumentRoot = function () {
        return root;
    };
    /**
     * @return {!xmled.XmlCaret}
     */
    this.getCaret = function () {
        return caret;
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
