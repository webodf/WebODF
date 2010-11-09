/*global DOMParser document core runtime odf*/
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
    function getDirectChild(node, ns, name) {
        node = (node) ? node.firstChild : null;
        while (node) {
            if (node.localName === name && node.namespaceURI === ns) {
                return node;
            }
            node = node.nextSibling;
        }
    }
    function getNodePosition(child) {
        var childpos = 0, i;
        for (i in nodeorder) {
            if (child.namespaceURI === officens &&
                    child.localName === nodeorder[i]) {
                return i;
            }
        }
        return -1;
    }
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
     * @constructor
     */
    function ODFElement() {
    }
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
        function createDocument() {
        }
        // public functions
        this.load = function () {
            zip.load(name, function (err, data) {
                privatedata = data;
                createUrl();
                createDocument();
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
        function importRootNode(xmldoc) {
            var doc = self.rootElement.ownerDocument;
            return doc.importNode(xmldoc.documentElement, true);
        }
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
            } else {
                root.automaticStyles = automaticStyles;
                setChild(root.automaticStyles, automaticStyles);
            }
        }
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
        function parseXml(filepath, xmldata) {
            if (!xmldata || xmldata.length === 0) {
                self.error = "Cannot read " + filepath + ".";
                return null;
            }
            var parser = new DOMParser();
            return parser.parseFromString(xmldata, 'text/xml');
        }
        function getXmlNode(filepath, callback) {
            zip.load(filepath, function (err, xmldata) {
                callback(parseXml(filepath, xmldata));
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
        function loadComponents() {
            // always load content.xml, meta.xml, styles.xml and settings.xml
            getXmlNode('styles.xml', function (xmldoc) {
                handleStylesXml(xmldoc);
                if (self.state === OdfContainer.INVALID) {
                    return;
                }
                getXmlNode('content.xml', function (xmldoc) {
                    handleContentXml(xmldoc);
                    if (self.state === OdfContainer.INVALID) {
                        return;
                    }
                    getXmlNode('meta.xml', function (xmldoc) {
                        handleMetaXml(xmldoc);
                        if (self.state === OdfContainer.INVALID) {
                            return;
                        }
                        getXmlNode('settings.xml', function (xmldoc) {
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
         * Open file and parse it. Return the Xml Node. Return the root node of the
         * file or null if this is not possible.
         * For 'content.xml', 'styles.xml', 'meta.xml', and 'settings.xml', the
         * elements 'document-content', 'document-styles', 'document-meta', or
         * 'document-settings' will be returned respectively.
         **/
        this.getPart = function (partname) {
            return new OdfPart(partname, self, zip);
        };

        // initialize private variables
        zip = new core.Zip(url, function (err, zipobject) {
            zip = zipobject;
            if (err) {
                zip.error = err;
            } else {
                loadComponents();
            }
        });

        // initialize public variables
        this.state = OdfContainer.LOADING;
        this.rootElement = createElement(ODFDocumentElement);
        this.parts = new OdfPartList(this);
    }
    OdfContainer.EMPTY = 0;
    OdfContainer.LOADING = 1;
    OdfContainer.DONE = 2;
    OdfContainer.INVALID = 3;
    OdfContainer.SAVING = 4;
    OdfContainer.MODIFIED = 5;
    OdfContainer.getContainer = function (url) {
        return new OdfContainer(url);
    };
    return OdfContainer;
}());
