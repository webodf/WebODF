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
/*global runtime XMLHttpRequest document core XPathResult XMLSerializer DOMParser odf*/
runtime.loadClass("odf.OdfContainer");
runtime.loadClass("odf.Style2CSS");

var xhtmlns = "http://www.w3.org/1999/xhtml";

/**
 * A new styles.xml has been loaded. Update the live document with it.
 **/
function handleStyles(odfelement) {
    // update the css translation of the styles    
    var stylesxmlcss = document.getElementById('stylesxmlcss'),
            style2css = new odf.Style2CSS();
    stylesxmlcss = /**@type{HTMLStyleElement}*/(stylesxmlcss);
    style2css.style2css(stylesxmlcss.sheet, odfelement.styles,
                odfelement.automaticStyles);
}
var officens  = "urn:oasis:names:tc:opendocument:xmlns:office:1.0";
var drawns    = "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0";
var fons      = "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0";
var svgns     = "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0";
var textns    = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";
var xlinkns   = "http://www.w3.org/1999/xlink";
var presentation = false;
var activeSlide = 1;
var slidecssindex = 0;
function setFramePosition(id, frame, stylesheet) {
    frame.setAttribute('styleid', id);
    var rule,
        anchor = frame.getAttributeNS(textns, 'anchor-type'),
        x = frame.getAttributeNS(svgns, 'x'),
        y = frame.getAttributeNS(svgns, 'y'),
        width = frame.getAttributeNS(svgns, 'width'),
        height = frame.getAttributeNS(svgns, 'height'),
        minheight = frame.getAttributeNS(fons, 'min-height'),
        minwidth = frame.getAttributeNS(fons, 'min-width'); 
    if (anchor === "as-char") {
        rule = 'display: inline-block;';
    } else if (anchor || x || y) {
        rule = 'position: absolute;';
    } else if (width || height || minheight || minwidth) {
        rule = 'display: block;';
    }
    if (x) {
        rule += 'left: ' + x + ';';
    }
    if (y) {
        rule += 'top: ' + y + ';';
    }
    if (width) {
        rule += 'width: ' + width + ';';
    }
    if (height) {
        rule += 'height: ' + height + ';';
    }
    if (minheight) {
        rule += 'min-height: ' + minheight + ';';
    }
    if (minwidth) {
        rule += 'min-width: ' + minwidth + ';';
    }
    if (rule) {
        rule = 'draw|' + frame.localName + '[styleid="' + id + '"] {' + rule +
            '}';
        stylesheet.insertRule(rule, stylesheet.cssRules.length);
    }
}
function setImage(id, container, image, stylesheet) {
    image.setAttribute('styleid', id);
    var url = image.getAttributeNS(xlinkns, 'href'),
        part;
    function callback(url) {
        var rule = "background-image: url(" + url + ");";
        rule = 'draw|image[styleid="' + id + '"] {' + rule + '}';
        stylesheet.insertRule(rule, stylesheet.cssRules.length);
    }
    try {
        if (container.getPartUrl) {
            url = container.getPartUrl(url);
            callback(url);
        } else {
            part = container.getPart(url);
            part.onchange = function (part) {
                callback(part.url);
            };
            part.load();
        }
    } catch (e) {
        alert('slight problem');
    }
}
function modifyImages(container, odfbody, stylesheet) {
    var namespaces = {
            draw: drawns,
            fo: fons,
            svg: svgns
        },
        doc = odfbody.ownerDocument,
        drawiter,
        node,
        frames,
        i,
        images;
    function namespaceResolver(prefix) {
        return namespaces[prefix];
    }
    frames = [];
    node = odfbody.firstChild;
    while (node && node !== odfbody) {
        if (node.namespaceURI === drawns) {
            frames[frames.length] = node;
        }
        if (node.firstChild) {
            node = node.firstChild;
        } else {
            while (node !== odfbody && !node.nextSibling) {
                node = node.parentNode;
            }
            if (node.nextSibling) {
                node = node.nextSibling;
            }
        }
    }
    for (i = 0; i < frames.length; i += 1) {
        node = frames[i];
        setFramePosition('frame' + i, node, stylesheet);
    }
    images = odfbody.getElementsByTagNameNS(drawns, 'image');
    for (i = 0; i < images.length; i += 1) {
        setImage('image' + i, container, images.item(i), stylesheet);
    }
}
function clear(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}
/**
 * A new content.xml has been loaded. Update the live document with it.
 **/
function handleContent(container, odfnode) {

    var positioncss = /**@type{HTMLStyleElement}*/(document.getElementById('positioncss')),
        css = positioncss.sheet;
    modifyImages(container, odfnode.body, css);
    slidecssindex = css.insertRule(
            'office|presentation draw|page:nth-child(1n) { display:block; }',
            css.cssRules.length);    

    // only append the content at the end
    clear(document.body);
    document.body.appendChild(odfnode);
}
function refreshOdf() {
    var OdfContainer = odf.OdfContainer,
        container = runtime.getWindow().odfcontainer,
        state = container.state;
        
    // synchronize the object a window.odfcontainer with the view
    function callback() {
        clear(document.body);
        var odfnode = container.rootElement;
        document.importNode(odfnode, true);
        handleStyles(odfnode);
        // do content last, because otherwise the document is constantly updated
        // whenever the css changes
        handleContent(container, odfnode);
    }
        
    if (state === OdfContainer.DONE) {
        callback();
    } else { //if (state === OdfContainer.LOADING) {
        container.onchange = callback;
    }
}

function init() {
    // if the url has a fragment (#...), try to load the file it represents
    var location = String(document.location),
        pos = location.indexOf('#'),
        window = runtime.getWindow();
    if (pos === -1 || !window) {
        return;
    }
    location = location.substr(pos + 1);
    // open the odf container
    window.odfcontainer = odf.OdfContainer.getContainer(location);
    window.odfcontainer.onstatereadychange = refreshOdf;
}

function getDirectChild(ns, name, node) {
    node = (node) ? node.firstChild : null;
    while (node) {
        if (node.localName === name && node.namespaceURI === ns) {
            return node;
        }
        node = node.nextSibling;
    }
}

/** temporary function to make a presentation when 'f' is pressed **/
(function () {
    // this code is only useful for applications with a window
    if (!runtime.getWindow()) {
        return;
    }

    var maxSlideRule = "{display: block;border: 0px;}";
    function setSlideStyle(slide, style) {
        var positioncss = /**@type{HTMLStyleElement}*/(document.getElementById('positioncss')),
            css = positioncss.sheet,
            r = css.cssRules,
            div;
        css.deleteRule(slidecssindex);
        slidecssindex = css.insertRule('office|presentation draw|page:nth-child(' +
            slide + ')' + style, css.cssRules.length);
        div = document.getElementById('contentxml');
        if (slide !== 'n') {
            div.className = 'fullscreen';
        } else {
            div.className = null;
        }
    }
    function nextSlide() {
        activeSlide += 1;
        if (activeSlide < 1) {
            activeSlide = 1;
        }
        setSlideStyle(activeSlide, maxSlideRule);
    }
    function makePresentation() {
        presentation = true;
        activeSlide -= 1;
        nextSlide();
        var ppi = 98, // larger than 96 to avoid scaling problems
            pagewidth = 11.02, // inches of hardcoded value
            pageheight = 8.27, // inches of hardcoded value
            window = runtime.getWindow(),
            zoomlevelw = window.innerWidth / ppi / pagewidth,
            zoomlevelh = window.innerHeight / ppi / pageheight,
            zoomlevel = (zoomlevelw > zoomlevelh) ? zoomlevelh : zoomlevelw;
        document.body.style.zoom = zoomlevel;
        document.body.style.MozTransform = 'scale(' + zoomlevel + ')';
    }
    function unmakePresentation() {
        presentation = false;
        setSlideStyle('n', "{display: block;}");
        var zoomlevel = 1.0;
        document.body.style.zoom = zoomlevel;
        document.body.style.MozTransform = 'scale(' + zoomlevel + ')';
    }
    function previousSlide() {
        activeSlide -= 2;
        nextSlide();
    }
    runtime.getWindow().onkeyup = function (e) {
        if (e.keyCode === 70) { // f
            if (presentation) {
                unmakePresentation();
            } else {
                makePresentation();
            }
            return;
        }
        if (!presentation) {
            return;
        }
        if (e.keyCode === 8) { // backspace
            previousSlide();
        } else {
            nextSlide();
        }
    };
    function fixOdf() {
        var x = new XMLSerializer(), parser, dom;
        x = x.serializeToString(document.body.firstChild);
        parser = new DOMParser();
        dom = parser.parseFromString(x, "text/xml");
        dom = document.importNode(dom.documentElement, true);
        document.body.removeChild(document.body.firstChild);
        document.body.appendChild(dom);
    }
}());
