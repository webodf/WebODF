/**
 * This is a pure javascript implementation of the first simple OdfKit api.
 **/
Odf = function(){
    function OdfContainer(url) {
      // TODO: support single xml file serialization and different ODF
      // versions
      this.url = url;
      var this_ = this;
      var callback = function(zip) {
        if (this_.onchange) {
          this_.onchange(this_);
        }
        if (this_.onstatereadychange) {
          this_.onstatereadychange(this_);
        }
      };
      this.zip = new Zip(url, callback);
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
      var c = null;
      if (callback) {
        var this_ = this;
        c = function(xmldata) {
          callback(this_.parseXml(filepath, xmldata));
        };
      }
      var xmldata = this.zip.load(filepath, c);
      if (callback) {
        return null;
      }
      return this.parseXml(filepath, xmldata);
    }
    OdfContainer.prototype.load = function(filepath) {
      var this_ = this;
      var callback = function(data) {
        if (this_.onchange) {
          this_.onchange(this_);
        }
        if (this_.onstatereadychange) {
          this_.onstatereadychange(this_);
        }
      };
      this.zip.load(filepath, callback);
    }
    OdfContainer.prototype.getPart = function(partname) {
      return new OdfPart(partname, this.zip);
    }
    // private constructor
    function OdfPart(name, zip) {
      this.name = name;
	  this.zip = zip;
    }
    OdfPart.prototype.load = function() {
      var this_ = this;
      var callback = function(data) {
        this_.data = data;
        if (this_.onchange) {
          this_.onchange(this_);
        }
        if (this_.onstatereadychange) {
          this_.onstatereadychange(this_);
        }
      };
      this.zip.load(this.name, callback);
	}
    OdfPart.prototype.getUrl = function() {
      if (this.data) {
          return 'data:;base64,' + Base64.toBase64(this.data);
      }
      return null;
    }
    return {
        /* export the public api */
        OdfContainer: OdfContainer,
        getContainer: function(url) {return new OdfContainer(url); }
    };
}();

