/**
 * This is a pure javascript implementation of the first simple OdfKit api.
 **/
Odf = function(){
  function OdfContainer(url) {
    var self = this;

    // NOTE each instance of OdfContainer has a copy of the private functions
    // it would be better to have a class OdfContainerPrivate where the
    // private functions can be defined via OdfContainerPrivate.prototype
    // without exposing them

    // declare public variables
    this.onstatereadychange = null;
    this.onchange = null;
    this.INVALID = 0;
    this.READY = 1;
    this.LOADING = 2;
    this.LISTINGLOADED = 3;
    this.SAVING = 4;
    this.MODIFIED = 5;
    this.state = null;
    this.rootElement = null;
    this.parts = null;

    // declare private variables
    var zip = null;

    // private functions
    var updateNodes = function(data) {
    };
    var loadComponents = function() {
      // always load content.xml, meta.xml, styles.xml and settings.xml
      zip.load('content.xml', updateNodes);
      zip.load('styles.xml', updateNodes);
      zip.load('meta.xml', updateNodes);
      zip.load('settings.xml', updateNodes);
    };
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
      if (self.onchange) {
        self.onchange(self);
      }
      if (self.onstatereadychange) {
        self.onstatereadychange(self);
      }
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
    this.getXmlNode = function(filepath, callback) {
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
    this.state = this.INVALID;
    this.rootElement = createElement(ODFDocumentElement);
    this.parts = new OdfPartList(this);
  }
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
  return {
    /* export the public api */
    OdfContainer: OdfContainer,
    getContainer: function(url) {return new OdfContainer(url); }
  };
}();

