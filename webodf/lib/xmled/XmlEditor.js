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

runtime.loadClass("xmled.XmlCanvas");
runtime.loadClass("xmled.CrumbBar");
runtime.loadClass("xmled.AttributeEditor");

/**
 * This class manages a loaded ODF document that is shown in an element.
 * It takes care of giving visual feedback on loading, ensures that the
 * stylesheets are loaded.
 * @constructor
 * @param {!Element} element element to put the editor in
 * @param {!string} grammarurl
 * @param {!string} styleurl
 * @return {?}
 **/
xmled.XmlEditor = function XmlEditor(element, grammarurl, styleurl) {
    "use strict";
    var doc = element.ownerDocument,
        htmlns = element.namespaceURI,
        canvasElement = doc.createElementNS(htmlns, "div"),
        crumbElement = doc.createElementNS(htmlns, "div"),
        attributeEditorElement = doc.createElementNS(htmlns, "div"),
        contextInfoElement = doc.createElementNS(htmlns, "div"),
        validationModel = new xmled.ValidationModel(grammarurl),
        attributeEditor = new xmled.AttributeEditor(attributeEditorElement),
        canvas,
        crumbBar;
    /**
     * @return {undefined}
     */
    function init() {
        element.appendChild(crumbElement);
        element.appendChild(contextInfoElement);
        element.appendChild(canvasElement);
        element.appendChild(attributeEditorElement);
        element.style.verticalAlign = 'top';
        //element.style.width = '66em';
        element.style.whiteSpace = 'nowrap';
        crumbElement.style.height = "3em";
        crumbElement.style.whiteSpace = 'normal';
        canvasElement.style.display = "inline-block";
        canvasElement.style.width = "40em";
        canvasElement.style.height = "400px";
        canvasElement.style.overflow = "auto";
        canvasElement.style.whiteSpace = 'normal';
        canvasElement.setAttribute('id', 'xmlcanvas');
        canvasElement.style.boxShadow = '0px 0px 20px #aaa';
        canvasElement.style.background = 'white';
        contextInfoElement.style.display = "inline-block";
        contextInfoElement.style.width = "12em";
        contextInfoElement.style.verticalAlign = 'top';
        contextInfoElement.style.padding = '0.2em';
        contextInfoElement.style.whiteSpace = 'normal';
        contextInfoElement.style.fontFamily = 'sans';
        contextInfoElement.style.fontSize = 'smaller';
        attributeEditorElement.style.fontSize = 'smaller';
        attributeEditorElement.style.display = "inline-block";
//        attributeEditorElement.style.width = "12em";
        attributeEditorElement.style.verticalAlign = 'top';
        attributeEditorElement.style.padding = '0.2em';
        attributeEditorElement.style.height = "400px";
        attributeEditorElement.style.overflow = "auto";
        attributeEditorElement.style.whiteSpace = 'normal';
        attributeEditorElement.style.fontFamily = 'sans';
        attributeEditorElement.style.fontSize = 'smaller';
        canvas = new xmled.XmlCanvas(canvasElement, validationModel, styleurl);
        var root = canvas.getDocumentRoot();
        crumbBar = new xmled.CrumbBar(crumbElement, root);

        canvasElement.onmouseup = function (evt) {
            crumbBar.setElement(evt.target);
            var info = validationModel.getElementInfo(evt.target),
                defs = validationModel.getAttributeDefinitions(evt.target);
            contextInfoElement.innerHTML = info;
            attributeEditor.setAttributeDefinitions(defs, evt.target);
        };
    }
    /**
     * @param {!string} url
     * @return {undefined}
     */
    this.load = function (url) {
        canvas.load(url);
    };
    /**
     * @param {function(?string):undefined} callback
     * @return {undefined}
     */
    this.save = function (callback) {
        callback(null);
    };
    init();
};
/**
 * @enum {number}
 */
xmled.XmlEditor.State = {
    EMPTY:   0,
    LOADING: 1,
    ERROR:   2,
    READY:   3
};
(function () {
    "use strict";
    return xmled.XmlEditor;
}());
