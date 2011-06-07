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
/*global runtime core xmldom odf DOMParser document XPathResult */
runtime.loadClass("core.Base64");
runtime.loadClass("core.Zip");
runtime.loadClass("xmldom.LSSerializer");
runtime.loadClass("odf.StyleInfo");
runtime.loadClass("odf.Style2CSS");
/**
 * The OdfContainer class manages the various parts that constitues an ODF
 * document.
 * @constructor
 * @param {!string} url
 * @param {!Function|null} onstatereadychange
 **/
odf.OdfContainer = (function () {
    var styleInfo = new odf.StyleInfo(),
        style2CSS = new odf.Style2CSS(),
        namespaces = style2CSS.namespaces,
        officens = "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
        nodeorder = ['meta', 'settings', 'scripts', 'font-face-decls', 'styles',
            'automatic-styles', 'master-styles', 'body'],
        base64 = new core.Base64();
    /**
     * @param {?Node} node
     * @param {!string} ns
     * @param {!string} name
     * @return {?Node}
     */
    function getDirectChild(node, ns, name) {
        node = (node) ? node.firstChild : null;
        while (node) {
            if (node.localName === name && node.namespaceURI === ns) {
                return node;
            }
            node = node.nextSibling;
        }
        return null;
    }
    /**
     * Return the position the node should get according to the ODF flat format.
     * @param {!Node} child
     * @return {!number}
     */
    function getNodePosition(child) {
        var childpos = 0, i, l = nodeorder.length;
        for (i = 0; i < l; i += 1) {
            if (child.namespaceURI === officens &&
                    child.localName === nodeorder[i]) {
                return i;
            }
        }
        return -1;
    }
    /**
     * @param {!Document} doc
     * @param {!Element} node
     * @param {!string} xpath
     * @return {Element}
     */
    function getODFElementWithXPath(doc, node, xpath) {
        return doc.evaluate(xpath, node, style2CSS.namespaceResolver,
                XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
    }
    /**
     * @param {!Document} doc
     * @param {!Element} node
     * @param {!string} xpath
     * @return {!XPathResult}
     */
    function getODFNodesWithXPath(doc, node, xpath) {
        return doc.evaluate(xpath, node, style2CSS.namespaceResolver,
                XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
    }
    /**
     * Class that filters runtime specific nodes from the DOM.
     * @constructor
     * @implements {xmldom.LSSerializerFilter}
     * @param {!Element} odfroot
     * @param {!Element=} usedStylesElement
     */
    function OdfNodeFilter(odfroot, usedStylesElement) {
        var automaticStyles = odfroot.automaticStyles,
            usedKeysList;
        if (usedStylesElement) {
            usedKeysList = new styleInfo.UsedKeysList(usedStylesElement);
        }
        /**
         * @param {!Node} node
         * @return {!number}
         */
        this.acceptNode = function (node) {
            var styleName, styleFamily;
            if (node.namespaceURI === "http://www.w3.org/1999/xhtml") {
                return 3; // FILTER_SKIP
            } else if (usedKeysList && node.parentNode === automaticStyles &&
                    node.nodeType === 1) {
                if (usedKeysList.uses(node)) {
                    return 1; // FILTER_ACCEPT
                }
                return 2; // FILTER_REJECT
            }
            return 1; // FILTER_ACCEPT
        };
    }
    /**
     * Put the element at the right position in the parent.
     * The right order is given by the value returned from getNodePosition.
     * @param {!Node} node
     * @param {?Node} child
     * @return {undefined}
     */
    function setChild(node, child) {
        if (!child) {
            return;
        }
        var childpos = getNodePosition(child),
            pos,
            c = node.firstChild;
        if (childpos === -1) {
            return;
        }
        while (c) {
            pos = getNodePosition(c);
            if (pos !== -1 && pos > childpos) {
                break;
            }
            c = c.nextSibling;
        }
        node.insertBefore(child, c);
    }
    /**
     * A DOM element that is part of and ODF part of a DOM.
     * @constructor
     * @extends {Element}
     */
    function ODFElement() {
    }
    /**
     * The root element of an ODF document.
     * @constructor
     * @extends {ODFElement}
     */
    function ODFDocumentElement(odfcontainer) {
        this.OdfContainer = odfcontainer;
    }
    ODFDocumentElement.prototype = new ODFElement();
    ODFDocumentElement.prototype.constructor = ODFDocumentElement;
    ODFDocumentElement.namespaceURI = officens;
    ODFDocumentElement.localName = 'document';
    // private constructor
    /**
     * @constructor
     * @param {!string} name
     * @param {!odf.OdfContainer} container
     * @param {!core.Zip} zip
     */
    function OdfPart(name, container, zip) {
        var self = this,
            privatedata;

        // declare public variables
        this.size = 0;
        this.type = null;
        this.name = name;
        this.container = container;
        this.url = null;
        this.document = null;
        this.onreadystatechange = null;
        this.onchange = null;
        this.EMPTY = 0;
        this.LOADING = 1;
        this.DONE = 2;
        this.state = this.EMPTY;

        // private functions
        function createUrl() {
            self.url = null;
            if (!privatedata) {
                return;
            }
            var /**@const@type{!Runtime.ByteArray}*/p = privatedata,
                chunksize = 45000, // must be multiple of 3 and less than 50000
                i = 0;
            if (p[1] === 0x50 && p[2] === 0x4E && p[3] === 0x47) {
                self.url = 'data:image/png;base64,';
            } else {
                self.url = 'data:;base64,';
            }
            // to avoid exceptions, base64 encoding is done in chunks
            // it would make sense to move this to base64.toBase64
            while (i < privatedata.length) {
                self.url += base64.convertUTF8ArrayToBase64(
                       p.slice(i, i + chunksize));
                i += chunksize;
            }
        }
        // public functions
        this.load = function () {
            zip.load(name, function (err, data) {
                privatedata = data;
                createUrl();
                if (self.onchange) {
                    self.onchange(self);
                }
                if (self.onstatereadychange) {
                    self.onstatereadychange(self);
                }
            });
        };
        this.abort = function () {
            // TODO
        };
    }
    OdfPart.prototype.load = function () {
    };
    OdfPart.prototype.getUrl = function () {
        if (this.data) {
            return 'data:;base64,' + base64.toBase64(this.data);
        }
        return null;
    };
    /**
     * @constructor
     * @param {!odf.OdfContainer} odfcontainer
     */
    function OdfPartList(odfcontainer) {
        var self = this;
        // declare public variables
        this.length = 0;
        this.item = function (index) {
        };
    }
    /**
     * @constructor
     * @param {!string} url
     * @param {!Function|null} onstatereadychange
     */
    odf.OdfContainer = function OdfContainer(url, onstatereadychange) {
        var self = this,
            zip = null;

        // NOTE each instance of OdfContainer has a copy of the private functions
        // it would be better to have a class OdfContainerPrivate where the
        // private functions can be defined via OdfContainerPrivate.prototype
        // without exposing them

        // declare public variables
        this.onstatereadychange = onstatereadychange;
        this.onchange = null;
        this.state = null;
        this.rootElement = null;
        this.parts = null;

        /**
         * @param {!Element} element
         * @return {undefined}
         */
        function removeProcessingInstructions(element) {
            var n = element.firstChild, next, e;
            while (n) {
                next = n.nextSibling;
                if (n.nodeType === 1) { // ELEMENT
                    e = /**@type{!Element}*/(n);
                    removeProcessingInstructions(e);
                } else if (n.nodeType === 7) { // PROCESSING_INSTRUCTION_NODE
                    element.removeChild(n);
                }
                n = next;
            }
        }

        // private functions
        /**
         * Import the document elementnode into the DOM of OdfContainer.
         * Any processing instructions are removed, since importing them
         * gives an exception.
         * @param {!Document} xmldoc
         * @return {!Node}
         */
        function importRootNode(xmldoc) {
            var doc = self.rootElement.ownerDocument,
                node;
            // remove all processing instructions
            // TODO: replace cursor processing instruction with an element
            removeProcessingInstructions(xmldoc.documentElement);
            try {
                node = doc.importNode(xmldoc.documentElement, true);
            } catch (e) {
            }
            return node;
        }
        function setState(state) {
            self.state = state;
            if (self.onchange) {
                self.onchange(self);
            }
            if (self.onstatereadychange) {
                self.onstatereadychange(self);
            }
        }
        /**
         * @param {!Document} xmldoc
         * @return {undefined}
         */
        function handleStylesXml(xmldoc) {
            var node = importRootNode(xmldoc),
                root = self.rootElement;
            if (!node || node.localName !== 'document-styles' ||
                    node.namespaceURI !== officens) {
                setState(OdfContainer.INVALID);
                return;
            }
            root.fontFaceDecls = getDirectChild(node, officens, 'font-face-decls');
            setChild(root, root.fontFaceDecls);
            root.styles = getDirectChild(node, officens, 'styles');
            setChild(root, root.styles);
            root.automaticStyles = getDirectChild(node, officens,
                    'automatic-styles');
            setChild(root, root.automaticStyles);
            root.masterStyles = getDirectChild(node, officens, 'master-styles');
            setChild(root, root.masterStyles);
            //removeUnusedAutomaticStyles(root.automaticStyles,
            //        root.masterStyles);
        }
        /**
         * @param {!Document} xmldoc
         * @return {undefined}
         */
        function handleContentXml(xmldoc) {
            var node = importRootNode(xmldoc),
                root,
                automaticStyles, fontFaceDecls,
                c;
            if (!node || node.localName !== 'document-content' ||
                    node.namespaceURI !== officens) {
                setState(OdfContainer.INVALID);
                return;
            }
            root = self.rootElement;
            fontFaceDecls = getDirectChild(node, officens, 'font-face-decls');
            if (root.fontFaceDecls && fontFaceDecls) {
                c = fontFaceDecls.firstChild;
                while (c) {
                    root.fontFaceDecls.appendChild(c);
                    c = fontFaceDecls.firstChild;
                }
            } else if (fontFaceDecls) {
                root.fontFaceDecls = fontFaceDecls;
                setChild(root, fontFaceDecls);
            }
            automaticStyles = getDirectChild(node, officens, 'automatic-styles');
            if (root.automaticStyles && automaticStyles) {
                c = automaticStyles.firstChild;
                while (c) {
                    root.automaticStyles.appendChild(c);
                    c = automaticStyles.firstChild; // works because node c moved
                }
            } else if (automaticStyles) {
                root.automaticStyles = automaticStyles;
                setChild(root, automaticStyles);
            }
            root.body = getDirectChild(node, officens, 'body');
            setChild(root, root.body);
        }
        /**
         * @param {!Document} xmldoc
         * @return {undefined}
         */
        function handleMetaXml(xmldoc) {
            var node = importRootNode(xmldoc),
                root;
            if (!node || node.localName !== 'document-meta' ||
                    node.namespaceURI !== officens) {
                return;
            }
            root = self.rootElement;
            root.meta = getDirectChild(node, officens, 'meta');
            setChild(root, root.meta);
        }
        /**
         * @param {!Document} xmldoc
         * @return {undefined}
         */
        function handleSettingsXml(xmldoc) {
            var node = importRootNode(xmldoc),
                root;
            if (!node || node.localName !== 'document-settings' ||
                    node.namespaceURI !== officens) {
                return;
            }
            root = self.rootElement;
            root.settings = getDirectChild(node, officens, 'settings');
            setChild(root, root.settings);
        }
        /**
         * @param {!string} filepath
         * @param {!function(?string,?Document)} callback
         * @return {undefined}
         */
        function getXmlNode(filepath, callback) {
            zip.load(filepath, function (err, xmldata) {
                if (err) {
                    callback(err, null);
                    return;
                }
                // assume the xml input data is utf8
                // this can be done better
                var str = runtime.byteArrayToString(xmldata, "utf8"),
                    parser = new DOMParser();
                str = parser.parseFromString(str, "text/xml");
                callback(null, str);
            });
        }
        /**
         * @return {undefined}
         */
        function loadComponents() {
            // always load content.xml, meta.xml, styles.xml and settings.xml
            getXmlNode('styles.xml', function (err, xmldoc) {
                handleStylesXml(xmldoc);
                if (self.state === OdfContainer.INVALID) {
                    return;
                }
                getXmlNode('content.xml', function (err, xmldoc) {
                    handleContentXml(xmldoc);
                    if (self.state === OdfContainer.INVALID) {
                        return;
                    }
                    getXmlNode('meta.xml', function (err, xmldoc) {
                        handleMetaXml(xmldoc);
                        if (self.state === OdfContainer.INVALID) {
                            return;
                        }
                        getXmlNode('settings.xml', function (err, xmldoc) {
                            if (xmldoc) {
                                handleSettingsXml(xmldoc);
                            }
                            if (self.state !== OdfContainer.INVALID) {
                                setState(OdfContainer.DONE);
                            }
                        });                        
                    });                    
                });
            });
        }
        function documentElement(name, map) {
            var s = "", i;
            for (i in map) {
                if (map.hasOwnProperty(i)) {
                    s += " xmlns:" + i + "=\"" + map[i] + "\"";
                }
            }
            return "<?xml version=\"1.0\" encoding=\"UTF-8\"?><office:" + name + " " +
                    s + " office:version=\"1.2\">";
        }
        /**
         * @return {!string}
         */
        function serializeMetaXml() {
            var nsmap = style2CSS.namespaces,
                serializer = new xmldom.LSSerializer(),
                /**@type{!string}*/ s = documentElement("document-meta", nsmap);
            serializer.filter = new OdfNodeFilter(self.rootElement);
            s += serializer.writeToString(self.rootElement.meta, nsmap);
            s += "</office:document-meta>";
            return s;
        }
        /**
         * @return {!string}
         */
        function serializeSettingsXml() {
            var nsmap = style2CSS.namespaces,
                serializer = new xmldom.LSSerializer(),
                /**@type{!string}*/ s = documentElement("document-settings", nsmap);
            serializer.filter = new OdfNodeFilter(self.rootElement);
            s += serializer.writeToString(self.rootElement.settings, nsmap);
            s += "</office:document-settings>";
            return s;
        }
        /**
         * @return {!string}
         */
        function serializeStylesXml() {
            var nsmap = style2CSS.namespaces,
                serializer = new xmldom.LSSerializer(),
                /**@type{!string}*/ s = documentElement("document-styles", nsmap);
            serializer.filter = new OdfNodeFilter(self.rootElement,
                    self.rootElement.masterStyles);
            s += serializer.writeToString(self.rootElement.fontFaceDecls, nsmap);
            s += serializer.writeToString(self.rootElement.styles, nsmap);
            s += serializer.writeToString(self.rootElement.automaticStyles, nsmap);
            s += serializer.writeToString(self.rootElement.masterStyles, nsmap);
            s += "</office:document-styles>";
            return s;
        }
        /**
         * @return {!string}
         */
        function serializeContentXml() {
            var nsmap = style2CSS.namespaces,
                serializer = new xmldom.LSSerializer(),
                /**@type{!string}*/ s = documentElement("document-content", nsmap);
            serializer.filter = new OdfNodeFilter(self.rootElement,
                    self.rootElement.body);
            // Until there is code to  determine if a font is referenced only
            // from all font declaratios will be stored in styles.xml
            s += serializer.writeToString(self.rootElement.automaticStyles, nsmap);
            s += serializer.writeToString(self.rootElement.body, nsmap);
            s += "</office:document-content>";
            return s;
        }
        function createElement(Type) {
            var original = document.createElementNS(
                    Type.namespaceURI, Type.localName),
                method,
                iface = new Type();
            for (method in iface) {
                if (iface.hasOwnProperty(method)) {
                    original[method] = iface[method];
                }
            }
            return original;
        }
        // public functions
        /**
         * Open file and parse it. Return the XML Node. Return the root node of
         * the file or null if this is not possible.
         * For 'content.xml', 'styles.xml', 'meta.xml', and 'settings.xml', the
         * elements 'document-content', 'document-styles', 'document-meta', or
         * 'document-settings' will be returned respectively.
         * @param {!string} partname
         * @return {!OdfPart}
         **/
        this.getPart = function (partname) {
            return new OdfPart(partname, self, zip);
        };
        /**
         * @param {function(?string):undefined} callback
         * @return {undefined}
         */
        this.save = function (callback) {
            // the assumption so far is that all ODF parts are serialized
            // already, but meta, settings, styles and content should be
            // refreshed
            // update the zip entries with the data from the live ODF DOM
            var data;
            data = runtime.byteArrayFromString(serializeSettingsXml(), "utf8");
            zip.save("settings.xml", data, true, new Date());
            data = runtime.byteArrayFromString(serializeMetaXml(), "utf8");
            zip.save("meta.xml", data, true, new Date());
            data = runtime.byteArrayFromString(serializeStylesXml(), "utf8");
            zip.save("styles.xml", data, true, new Date());
            data = runtime.byteArrayFromString(serializeContentXml(), "utf8");
            zip.save("content.xml", data, true, new Date());
            zip.write(function (err) {
                callback(err);
            });
        };

        // initialize public variables
        this.state = OdfContainer.LOADING;
        this.rootElement = createElement(ODFDocumentElement);
        this.parts = new OdfPartList(this);

        // initialize private variables
        zip = new core.Zip(url, function (err, zipobject) {
            zip = zipobject;
            if (err) {
                zip.error = err;
                setState(OdfContainer.INVALID);
            } else {
                loadComponents();
            }
        });
    };
    odf.OdfContainer.EMPTY = 0;
    odf.OdfContainer.LOADING = 1;
    odf.OdfContainer.DONE = 2;
    odf.OdfContainer.INVALID = 3;
    odf.OdfContainer.SAVING = 4;
    odf.OdfContainer.MODIFIED = 5;
    /**
     * @param {!string} url
     * @return {!odf.OdfContainer}
     */
    odf.OdfContainer.getContainer = function (url) {
        return new odf.OdfContainer(url, null);
    };
    return odf.OdfContainer;
}());
