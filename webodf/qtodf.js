/**
 * This is a Qt based implementation of the first simple OdfKit api.
 * It requires the presence of a window.qtodf object.
 **/
Odf = function(){
	window.qtodf.nextcallbackid = 0;
    function OdfContainer(url) {
        // TODO: support single xml file serialization and different ODF
        // versions
        this.url = url;
    }
    OdfContainer.prototype.parseXml = function(filepath, xmldata) {
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
    OdfContainer.prototype.registerCallback = function(callbackfunction) {
      var callbackid = 'callback' + window.qtodf.nextcallbackid;
	  window.qtodf.nextcallbackid += 1;
	  window.qtodf[callbackid] = callbackfunction;
	  return callbackid;
	}
    /**
     * Open file and parse it. Return the Xml Node. Return the root node of the
     * file or null if this is not possible.
     * For 'content.xml', 'styles.xml', 'meta.xml', and 'settings.xml', the
     * elements 'document-content', 'document-styles', 'document-meta', or
     * 'document-settings' will be returned respectively.
     **/
    OdfContainer.prototype.getXmlNode = function(filepath, callback) {
      var callbackid = null;
	  if (callback) {
		  var self = this;
		  callbackid = this.registerCallback(function(xmldata) {
			  callback(self.parseXml(filepath, xmldata));
	      });
	  }
      var xmldata = window.qtodf.load(this.url, filepath, callbackid);
      if (callback) {
        return null;
      }
      return this.parseXml(filepath, xmldata);
    }
    return {
        /* export the public api */
        OdfContainer: OdfContainer
    };
}();
