/**
 * This is a Qt based implementation of the first simple OdfKit api.
 * It requires the presence of a window.qtodf object.
 **/
Odf = function(){
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
      return parser.parseFromString(xmldata, 'text/xml');
    }
    /**
     * Open file and parse it. Return the Xml Node. Return the root node of the
     * file or null if this is not possible.
     * For 'content.xml', 'styles.xml', 'meta.xml', and 'settings.xml', the
     * elements 'document-content', 'document-styles', 'document-meta', or
     * 'document-settings' will be returned respectively.
     **/
    OdfContainer.prototype.getXmlNode = function(filepath, callback) {
      // TODO figure out how to do callback
      var c = null;
      if (callback) {
        var this_ = this;
        c = function(xmldata) {
          callback(this_.parseXml(filepath, xmldata));
        }
      }
      var xmldata = window.qtodf.load(this.url, filepath, c);
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
