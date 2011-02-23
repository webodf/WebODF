/*global runtime odf*/
runtime.loadClass("odf.OdfContainer");
runtime.loadClass("odf.Style2CSS");
/**
 * This class manages a loaded ODF document that is shown in an element.
 * It takes care of giving visual feedback on loading, ensures that the
 * stylesheets are loaded.
 **/
odf.OdfCanvas = (function () {
    var drawns  = "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
        fons    = "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
        svgns   = "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
        textns  = "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
        xlinkns = "http://www.w3.org/1999/xlink";
    function clear(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
    /**
     * A new styles.xml has been loaded. Update the live document with it.
     **/
    function handleStyles(odfelement) {
        // update the css translation of the styles    
        var document = odfelement.ownerDocument,
            rawstylesxmlcss = document.getElementById('stylesxmlcss'),
                style2css = new odf.Style2CSS(),
                stylesxmlcss;
        stylesxmlcss = /**@type{HTMLStyleElement}*/(rawstylesxmlcss);
        style2css.style2css(stylesxmlcss.sheet, odfelement.styles,
                    odfelement.automaticStyles);
    }
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
            rule = 'draw|' + frame.localName + '[styleid="' + id + '"] {' +
                rule + '}';
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
            runtime.log('slight problem');
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
    /**
     * A new content.xml has been loaded. Update the live document with it.
     **/
    function handleContent(container, odfnode) {
        var document = odfnode.ownerDocument,
            positioncss = /**@type{HTMLStyleElement}*/(
                document.getElementById('positioncss')),
            css = positioncss.sheet;
        modifyImages(container, odfnode.body, css);
//        slidecssindex = css.insertRule(
//                'office|presentation draw|page:nth-child(1n) { display:block; }',
//                css.cssRules.length);    
    
        // only append the content at the end
        clear(document.body);
        document.body.appendChild(odfnode);
    }

    /**
     * @constructor
     * @param {!Element} element Put and ODF Canvas inside this element.
     */
    function OdfCanvas(element) {
        var self = this,
            odfcontainer;
        function refreshOdf(container) {
            if (odfcontainer !== container) {
                return;
            }
 
            // synchronize the object a window.odfcontainer with the view
            function callback() {
                clear(element);
                var odfnode = container.rootElement;
                element.ownerDocument.importNode(odfnode, true);
                handleStyles(odfnode);
                // do content last, because otherwise the document is constantly
                // updated whenever the css changes
                handleContent(container, odfnode);
            }
        
            if (odfcontainer.state === odf.OdfContainer.DONE) {
                callback();
            } else { //if (state === OdfContainer.LOADING) {
                odfcontainer.onchange = callback;
            }
        }

        this.odfContainer = function () {
            return odfcontainer;
        };

        /**
         * @param {!string} url
         * @return {undefined}
         */
        this.load = function (url) {
            element.innerHTML = 'loading ' + url;
            // open the odf container
            odfcontainer = new odf.OdfContainer(url);
            odfcontainer.onstatereadychange = refreshOdf;
        };
    }
    return OdfCanvas;
}());
