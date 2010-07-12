/**
 * This is a Qt based implementation of the first simple OdfKit api.
 * It requires the presence of a window.qtodf object.
 **/
Odf = function(){
  window.qtodf.nextcallbackid = 0;
  function OdfContainer(url) {
    var self = this;
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
    // public functions
    /**
     * Open file and parse it. Return the Xml Node. Return the root node of the
     * file or null if this is not possible.
     * For 'content.xml', 'styles.xml', 'meta.xml', and 'settings.xml', the
     * elements 'document-content', 'document-styles', 'document-meta', or
     * 'document-settings' will be returned respectively.
     **/
    this.getXmlNode = function(filepath, callback) {
      var callbackid = null;
      if (callback) {
        callbackid = registerCallback(function(xmldata) {
          callback(parseXml(filepath, xmldata));
        });
      }
      var xmldata = window.qtodf.load(this.url, filepath, callbackid);
      if (callback) {
        return null;
      }
      return parseXml(filepath, xmldata);
    }
  }
  OdfContainer.prototype.getPartUrl = function(partname) {
    return encodeURI('odfkit:' + partname);
  }
  return {
    /* export the public api */
    OdfContainer: OdfContainer
  };
}();
