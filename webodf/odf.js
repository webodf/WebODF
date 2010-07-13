/**
 * This is a pure javascript implementation of the first simple OdfKit api.
 **/
Odf = function(){
  var officens = "urn:oasis:names:tc:opendocument:xmlns:office:1.0";
  function OdfContainer(url) {
    var self = this;

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

    // declare private variables
    var zip = null;    

    // private functions
    var importRootNode = function(xmldoc) {
      var doc = self.rootElement.ownerDocument;
      return doc.importNode(xmldoc.documentElement, true);
    };
    var handleStylesXml = function(xmldoc) {
      var node = importRootNode(xmldoc);
      if (!node || node.localName != 'document-styles'
          || node.namespaceURI != officens) {
        self.state = OdfContainer.INVALID;
        return;
      }
      var root = self.rootElement;
      root.styles = getDirectChild(node, officens, 'styles');
      setChild(root, root.styles);
      root.automaticStyles = getDirectChild(node, officens, 'automatic-styles');
      setChild(root, root.automaticStyles);
      root.masterStyles = getDirectChild(node, officens, 'master-styles');
      setChild(root, root.masterStyles);
    };
    var handleContentXml = function(xmldoc) {
      var node = importRootNode(xmldoc);
      if (!node || node.localName != 'document-content'
          || node.namespaceURI != officens) {
        self.state = OdfContainer.INVALID;
        return;
      }
      var root = self.rootElement;
      root.body = getDirectChild(node, officens, 'body');
      setChild(root, root.body);
      var automaticStyles = getDirectChild(node, officens, 'automatic-styles');
      if (root.automaticStyles && automaticStyles) {
        var c = automaticStyles.firstChild;
        while (c) {
          root.automaticStyles.appendChild(c);
          c = automaticStyles.firstChild; // works because node c moved
        }
      } else {
        root.automaticStyles = automaticStyles;
        setChild(root.automaticStyles, automaticStyles);
      }
    };
    var handleMetaXml = function(xmldoc) {
      var node = importRootNode(xmldoc);
      if (!node || node.localName != 'document-meta'
          || node.namespaceURI != officens) {
        return;
      }
      var root = self.rootElement;
      root.meta = getDirectChild(node, officens, 'meta');
      setChild(root, root.meta);
    };
    var handleSettingsXml = function(xmldoc) {
      var node = importRootNode(xmldoc);
      if (!node || node.localName != 'document-settings'
          || node.namespaceURI != officens) {
        return;
      }
      var root = self.rootElement;
      root.settings = getDirectChild(node, officens, 'settings');
      setChild(root, root.settings);
    };
    var loadComponents = function() {
      // always load content.xml, meta.xml, styles.xml and settings.xml
      getXmlNode('styles.xml', function(xmldoc) {
        handleStylesXml(xmldoc);
        if (self.state == OdfContainer.INVALID) {
          return;
        }
        getXmlNode('content.xml', function(xmldoc) {
          handleContentXml(xmldoc);
          if (self.state == OdfContainer.INVALID) {
            return;
          }
          getXmlNode('meta.xml', function(xmldoc) {
            handleMetaXml(xmldoc);
            if (self.state == OdfContainer.INVALID) {
              return;
            }
            getXmlNode('settings.xml', function(xmldoc) {
              handleSettingsXml(xmldoc);
              if (self.state != OdfContainer.INVALID) {
                setState(OdfContainer.DONE);
              }
            });            
          });          
        });
      });
    };
    var setState = function(state) {
      self.state = state;
      if (self.onchange) {
        self.onchange(self);
      }
      if (self.onstatereadychange) {
        self.onstatereadychange(self);
      }
    }
    var createElement = function(type) {
      var interface = new type();
      var original = document.createElementNS(
        interface.namespaceURI, interface.localName);
      for (var method in interface) {
        original[method] = interface[method];
      }
      return original;
    };
    // TODO: support single xml file serialization and different ODF
    // versions
    var callback = function(zip) {
      loadComponents();
    };
    var parseXml = function(filepath, xmldata) {
      if (!xmldata || xmldata.length == 0) {
        self.error = "Cannot read " + filepath + ".";
        return null;
      }
      var parser = new DOMParser();
      return parser.parseFromString(xmldata, 'text/xml');
    };
    var load = function(filepath, callback) {
      var c = null;
      if (callback) {
        c = function(data) {
          if (self.onchange) {
            self.onchange(self);
          }
          if (self.onstatereadychange) {
            self.onstatereadychange(self);
          }
        };
      }
      return zip.load(filepath, c);
    }
    // public functions
    /**
     * Open file and parse it. Return the Xml Node. Return the root node of the
     * file or null if this is not possible.
     * For 'content.xml', 'styles.xml', 'meta.xml', and 'settings.xml', the
     * elements 'document-content', 'document-styles', 'document-meta', or
     * 'document-settings' will be returned respectively.
     **/
    var getXmlNode = function(filepath, callback) {
      var c = null;
      if (callback) {
        c = function(xmldata) {
          callback(parseXml(filepath, xmldata));
        };
      }
      var xmldata = zip.load(filepath, c);
      if (callback) {
        return null;
      }
      return parseXml(filepath, xmldata);
    };
    this.getPart = function(partname) {
      return new OdfPart(partname, self, zip);
    };

    // initialize private variables
    zip = new Zip(url, callback);

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
  // private constructor
  function OdfPart(name, container, zip) {
    var self = this;

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

    // declare private variables
    var privatedata = null;

    // private functions
    var createUrl = function() {
      self.url = null;
      if (!privatedata) {
        return;
      }
      self.url = 'data:;base64,';
      // to avoid exceptions, base64 encoding is done in chunks
      var chunksize = 90000; // must be multiple of 3 and less than 100000
      var i = 0;
      while (i < privatedata.length) {
        self.url += Base64.toBase64(privatedata.substr(i, chunksize));
        i += chunksize;
      }
    };
    var createDocument = function() {
    };
    // public functions
    this.load = function() {
      var callback = function(data) {
        privatedata = data;
        createUrl();
        createDocument();
        if (self.onchange) {
          self.onchange(self);
        }
        if (self.onstatereadychange) {
          self.onstatereadychange(self);
        }
      };
      zip.load(name, callback);
    };
    this.abort = function() {
      // TODO
    };
  }
  OdfPart.prototype.load = function() {
  }
  OdfPart.prototype.getUrl = function() {
    if (this.data) {
      return 'data:;base64,' + Base64.toBase64(this.data);
    }
    return null;
  }
  function OdfPartList(odfcontainer) {
    var self = this;
    // declare public variables
    this.length = 0;
    this.item = function(index) {
  
    };
  }
  function ODFElement() {
  }
  ODFDocumentElement.prototype = new ODFElement();
  ODFDocumentElement.prototype.constructor = ODFDocumentElement;
  function ODFDocumentElement(odfcontainer) {
    this.OdfContainer = odfcontainer;
  }
  function getDirectChild(node, ns, name) {
    node = (node) ?node.firstChild :null;
    while (node) {
      if (node.localName == name && node.namespaceURI == ns) {
        return node;
      }
      node = node.nextSibling;
    }
  }
  var nodeorder = ['meta', 'settings', 'scripts', 'font-face-decls', 'styles',
      'automatic-styles', 'master-styles', 'body'];
  function getNodePosition(child) {
    var childpos = 0;
    for (var i in nodeorder) {
      if (child.namespaceURI == officens && child.localName == nodeorder[i]) {
        return i;
      }
    }
    return -1;
  }
  function setChild(node, child) {
    if (!child) return;
    var childpos = getNodePosition(child);
    if (childpos == -1) return;
    var pos = 0;
    var c = node.firstChild;
    while (c) {
      var pos = getNodePosition(c);
      if (pos != -1 && pos > childpos) {
        break;
      }
      c = c.nextSibling;
    }
    node.insertBefore(child, c);
  }
  return {
    /* export the public api */
    OdfContainer: OdfContainer,
    getContainer: function(url) {return new OdfContainer(url); }
  };
}();

