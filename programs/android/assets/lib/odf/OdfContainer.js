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
/*global runtime odf core*/
runtime.loadClass("core.Base64");
runtime.loadClass("core.Zip");
/**
 * This is a pure javascript implementation of the first simple OdfKit api.
 **/
odf.OdfContainer = (function () {
    var officens = "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
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
    }
    /**
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
     * @param {!OdfContainer} container
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
            self.url = 'data:;base64,';
            // to avoid exceptions, base64 encoding is done in chunks
            var chunksize = 90000, // must be multiple of 3 and less than 100000
                i = 0;
            while (i < privatedata.length) {
                self.url += base64.toBase64(privatedata.substr(i, chunksize));
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
     * @param {!OdfContainer} odfcontainer
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
     */
    function OdfContainer(url) {
        var self = this,
            zip = null;

        // NOTE each instance of OdfContainer has a copy of the private functions
        // it would be better to have a class OdfContainerPrivate where the
        // private functions can be defined via OdfContainerPrivate.prototype
        // without exposing them

        // declare public variables
        this.onstatereadychange = null;
        this.onchange = null;
        this.state = null;
        this.rootElement = null;
        this.parts = null;

        // private functions
        /**
         * @param {!Document} xmldoc
         * @return {!Node}
         */
        function importRootNode(xmldoc) {
            var doc = self.rootElement.ownerDocument;
            return doc.importNode(xmldoc.documentElement, true);
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
                self.state = OdfContainer.INVALID;
                return;
            }
            root.styles = getDirectChild(node, officens, 'styles');
            setChild(root, root.styles);
            root.automaticStyles = getDirectChild(node, officens, 'automatic-styles');
            setChild(root, root.automaticStyles);
            root.masterStyles = getDirectChild(node, officens, 'master-styles');
            setChild(root, root.masterStyles);
        }
        /**
         * @param {!Document} xmldoc
         * @return {undefined}
         */
        function handleContentXml(xmldoc) {
            var node = importRootNode(xmldoc),
                root,
                automaticStyles,
                c;
            if (!node || node.localName !== 'document-content' ||
                    node.namespaceURI !== officens) {
                self.state = OdfContainer.INVALID;
                return;
            }
            root = self.rootElement;
            root.body = getDirectChild(node, officens, 'body');
            setChild(root, root.body);
            automaticStyles = getDirectChild(node, officens, 'automatic-styles');
            if (root.automaticStyles && automaticStyles) {
                c = automaticStyles.firstChild;
                while (c) {
                    root.automaticStyles.appendChild(c);
                    c = automaticStyles.firstChild; // works because node c moved
                }
            } else if (automaticStyles) {
                root.automaticStyles = automaticStyles;
                setChild(root.automaticStyles, automaticStyles);
            }
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
                base64.convertUTF8StringToUTF16String(xmldata,
                        function (str, done) {
                    if (done) {
                        var parser = new DOMParser();
                        str = parser.parseFromString(str, "text/xml");
                        callback(null, str);
                    }
                    return true;
                });
            });
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
                            handleSettingsXml(xmldoc);
                            if (self.state !== OdfContainer.INVALID) {
                                setState(OdfContainer.DONE);
                            }
                        });                        
                    });                    
                });
            });
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
        // TODO: support single xml file serialization and different ODF
        // versions
        /**
         * @param {!string} filepath
         * @param {function(?string, ?string):undefined} callback
         * @return {undefined}
         */
        function load(filepath, callback) {
            zip.load(filepath, function (err, data) {
                if (self.onchange) {
                    self.onchange(self);
                }
                if (self.onstatereadychange) {
                    self.onstatereadychange(self);
                }
            });
        }
        // public functions
        /**
         * Open file and parse it. Return the Xml Node. Return the root node of
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

        // initialize public variables
        this.state = OdfContainer.LOADING;
        this.rootElement = createElement(ODFDocumentElement);
        this.parts = new OdfPartList(this);

        // initialize private variables
        zip = new core.Zip(url, function (err, zipobject) {
            zip = zipobject;
            if (err) {
                zip.error = err;
            } else {
                loadComponents();
            }
        });
    }
    OdfContainer.EMPTY = 0;
    OdfContainer.LOADING = 1;
    OdfContainer.DONE = 2;
    OdfContainer.INVALID = 3;
    OdfContainer.SAVING = 4;
    OdfContainer.MODIFIED = 5;
    /**
     * @param {!string} url
     * @return {!OdfContainer}
     */
    OdfContainer.getContainer = function (url) {
        return new OdfContainer(url);
    };
    return OdfContainer;
}());
