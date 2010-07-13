/**
 * This is a Qt based implementation of the first simple OdfKit api.
 * It requires the presence of a window.qtodf object.
 **/
Odf = function(){
  window.qtodf.nextcallbackid = 0;
  var officens = "urn:oasis:names:tc:opendocument:xmlns:office:1.0";
  function OdfContainer(url) {
    var self = this;
    // declare public variables
    this.onstatereadychange = null;
    this.onchange = null;
    this.state = null;
    this.rootElement = null;
    this.parts = null;
    
    // declare private variables

    // private functions
    // TODO: support single xml file serialization and different ODF
    // versions
    this.url = url;
    var parseXml = function(filepath, xmldata) {
      if (!xmldata || xmldata.length == 0) {
        this.error = "Cannot read " + filepath + ".";
        return null;
      }
      var parser = new DOMParser();
      var node = parser.parseFromString(xmldata, 'text/xml');
      return node;
    }
    /**
     * This function puts a callback object on the global object and returns an
     * id. This id is used by the native code to retrieve the callback and call
     * it.
     **/
    var registerCallback = function(callbackfunction) {
      var callbackid = 'callback' + window.qtodf.nextcallbackid;
      window.qtodf.nextcallbackid += 1;
      window.qtodf[callbackid] = callbackfunction;
      return callbackid;
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
          type.namespaceURI, type.localName);
      for (var method in interface) {
        original[method] = interface[method];
      }
      return original;
    };
    var importRootNode = function(xmldoc) {
      if (!xmldoc) return null;
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
    // public functions
    /**
     * Open file and parse it. Return the Xml Node. Return the root node of the
     * file or null if this is not possible.
     * For 'content.xml', 'styles.xml', 'meta.xml', and 'settings.xml', the
     * elements 'document-content', 'document-styles', 'document-meta', or
     * 'document-settings' will be returned respectively.
     **/
    var getXmlNode = function(filepath, callback) {
      var callbackid = null;
      if (callback) {
        callbackid = registerCallback(function(xmldata) {
          callback(parseXml(filepath, xmldata));
        });
      }
      var xmldata = window.qtodf.load(self.url, filepath, callbackid);
      if (callback) {
        return null;
      }
      return parseXml(filepath, xmldata);
    }
    this.getPart = function(partName) {
      return new OdfPart(partName, self);
    }
    this.delPart = function(partName) {
    }
    this.addPart = function(partName) {
    }
    this.load = function(url) {
    }
    this.setFromBlob = function(url) {
    }
    this.save = function(url) {
    }
    // initialize private variables
    this.state = OdfContainer.LOADING;
    this.rootElement = createElement(ODFDocumentElement);
    this.parts = new OdfPartList(this);
    loadComponents();
  }
  OdfContainer.EMPTY = 0;
  OdfContainer.LOADING = 1;
  OdfContainer.DONE = 2;
  OdfContainer.INVALID = 3;
  OdfContainer.SAVING = 4;
  OdfContainer.MODIFIED = 5;
  OdfContainer.prototype.getPartUrl = function(partname) {
    return encodeURI('odfkit:' + partname);
  }
  // private constructor
  function OdfPart(name, container) {
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
      window.qtodf.load(self.url, filepath, callbackid);
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
  ODFDocumentElement.namespaceURI = officens;
  ODFDocumentElement.localName = 'document';
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
    OdfContainer: OdfContainer
  };
}();
