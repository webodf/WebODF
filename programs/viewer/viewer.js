function isFullScreen() {
    // Note that the browser fullscreen (triggered by short keys) might
    // be considered different from content fullscreen when expecting a boolean
    return  document.mozFullScreen || document.webkitIsFullScreen;
}

function selectScaleOption(value) {
  var options = document.getElementById('scaleSelect').options;
  var predefinedValueFound = false;
  for (var i = 0; i < options.length; i++) {
    var option = options[i];
    if (option.value != value) {
      option.selected = false;
      continue;
    }
    option.selected = true;
    predefinedValueFound = true;
  }
  return predefinedValueFound;
}

// that should probably be provided by webodf
function nsResolver(prefix) {  
    var ns = {  
        'draw' : "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
        'presentation' : "urn:oasis:names:tc:opendocument:xmlns:presentation:1.0",
        'text' : "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
        'office' : "urn:oasis:names:tc:opendocument:xmlns:office:1.0"
    };  
    return ns[prefix] || alert('prefix ['+prefix+'] unknown.');
}

function getDocumentType(root) {
    if (root.getElementsByTagNameNS(nsResolver('office'), 'text').length > 0) return 'text';
    else if (root.getElementsByTagNameNS(nsResolver('office'), 'presentation').length > 0) return 'presentation';
    else return null;
}

var kCssUnits = 96.0 / 72.0;
var kScrollbarPadding = 40;
var kMinScale = 0.25;
var kMaxScale = 4.0;
var kDefaultScaleDelta = 1.1;
var kDefaultScale = 'auto';
var slide_mode;

var Viewer = {
    url: null,
    filename: null,
    odfCanvas: null,
    element: null,
    odfElement: null,
    initialized: false,
    root: null,
    documentType: null,
    pages: [],
    currentPage: null,

    initialize: function() {
        // If the URL has a fragment (#...), try to load the file it represents
        var location = String(document.location),
            pos = location.indexOf('#');
        location= location.substr(pos + 1);
        if(pos === -1 || location.length == 0) {
            console.log('Could not parse file path argument.');
            return;
        }

        this.element = document.getElementById('viewer');
        this.url = location;
        this.filename = this.url.replace(/^.*[\\\/]/, '');
        
        this.odfElement = document.getElementById('canvas');
        this.odfCanvas = new odf.OdfCanvas(this.odfElement);
        this.odfCanvas.load(location);
        document.title = this.filename;

        document.getElementById('documentName').innerHTML = document.title;

        if(! (document.cancelFullScreen || document.mozCancelFullScreen || document.webkitCancelFullScreen) )
            document.getElementById('fullscreen').style.visibility = 'hidden';

        var self = this;
        this.odfCanvas.addListener('statereadychange', function () {
            self.root = self.odfCanvas.odfContainer().rootElement;
            self.initialized = true;
            self.documentType = getDocumentType(self.root);
            
            if(self.documentType == 'presentation') {
                // no padding for presentations
                self.odfElement.parentNode.style.padding = 0;
                // get a list of pages
                self.pages = self.getPages();
                // start with the first page
                self.showPage(1);
            }

            self.parseScale(kDefaultScale);
            self.parseScale(kDefaultScale);
            self.parseScale(kDefaultScale);
        });
    },

    download: function() {
        var url = this.url.split('#')[0];
        url += '#webodf-viewer.action=download';
        window.open(url, '_parent');
    },

    toggleFullScreen: function() {
        var elem = this.element;
        if(!isFullScreen()) {
            if (elem.requestFullScreen) {
                  elem.requestFullScreen();
            } else if (elem.mozRequestFullScreen) {
                  elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullScreen) {
                  elem.webkitRequestFullScreen();
            }
        }
        else {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        }
    },
    
    zoomLevel: function() {
        return this.odfCanvas.getZoomLevel();
    },

    setScale: function (val, resetAutoSettings, noScroll) {
        if (val == this.zoomLevel() )
          return;

        this.odfCanvas.setZoomLevel(val);
        
        var event = document.createEvent('UIEvents');
        event.initUIEvent('scalechange', false, false, window, 0);
        event.scale = val;
        event.resetAutoSettings = resetAutoSettings;
        window.dispatchEvent(event);
    },

    parseScale: function (value, resetAutoSettings, noScroll) {
        var scale;
        if (value == 'custom')
            scale = parseFloat(document.getElementById('customScaleOption').textContent) / 100;
        else
            scale = parseFloat(value);

        if (scale) {
            this.setScale(scale, true, noScroll);
            return;
        }

        var width = this.odfElement.parentNode.clientWidth - kScrollbarPadding;
        var height = this.odfElement.parentNode.clientHeight - kScrollbarPadding;

        switch (value) {
            case 'page-actual':
                this.setScale(1, resetAutoSettings, noScroll);
                break;
            case 'page-width':
                this.odfCanvas.fitToWidth(width);
                break;
            case 'page-height':
                this.odfCanvas.fitToHeight(height);
                break;
            case 'page-fit':
                this.odfCanvas.fitToContainingElement(width, height);
                break;
            case 'auto':
                if(this.documentType == 'presentation')
                    this.odfCanvas.fitToContainingElement(width + kScrollbarPadding, height + kScrollbarPadding);
                else
                    this.odfCanvas.fitSmart(width);
                break;
        }

        selectScaleOption(value);
    },

    zoomOut: function() {
        // 10 % decrement
        var newScale = (this.zoomLevel() / kDefaultScaleDelta).toFixed(2);
        newScale = Math.max(kMinScale, newScale);
        this.parseScale(newScale, true);
    },

    zoomIn: function() {
        // 10 % increment
        var newScale = (this.zoomLevel() * kDefaultScaleDelta).toFixed(2);
        newScale = Math.min(kMaxScale, newScale);
        this.parseScale(newScale, true);
    },

    // return a list of tuples (pagename, pagenode)
    getPages: function() {
        var pageNodes = this.root.getElementsByTagNameNS(nsResolver('draw'), 'page');
        var pages  = [];
        for (i=0 ; i < pageNodes.length ; i += 1) {
            var tuple = [
                pageNodes[i].getAttribute('draw:name'),
                pageNodes[i]
            ];
            pages.push(tuple);
        }
        return pages;
    },

    showPage: function(n) {
        if(n <= 0 || n > this.pages.length)
            return;
        
        this.odfCanvas.showPage(n);
        this.currentPage = n;
    },

    showNextPage: function() {
        this.showPage(this.currentPage + 1);
    },

    showPreviousPage: function() {
        this.showPage(this.currentPage - 1);
    }
};

window.onload = function() {
    Viewer.initialize();
    
    document.getElementById('fullscreen').addEventListener('click', function() {
        Viewer.toggleFullScreen();
    });

    document.getElementById('download').addEventListener('click', function() {
        Viewer.download();
    });

    document.getElementById('zoomOut').addEventListener('click', function() {
        Viewer.zoomOut();
    });

    document.getElementById('zoomIn').addEventListener('click', function() {
        Viewer.zoomIn();
    });

    document.getElementById('scaleSelect').addEventListener('change', function() {
        Viewer.parseScale(this.value);
    });

    window.addEventListener('scalechange', function scalechange(evt) {
        var customScaleOption = document.getElementById('customScaleOption');
        customScaleOption.selected = false;

        var predefinedValueFound = selectScaleOption('' + evt.scale);
        if (!predefinedValueFound) {
            customScaleOption.textContent = Math.round(evt.scale * 10000) / 100 + '%';
            customScaleOption.selected = true;
        }
    }, true);

    window.addEventListener('resize', function webViewerResize(evt) {
        if (Viewer.initialized &&
          (document.getElementById('pageWidthOption').selected ||
          document.getElementById('pageAutoOption').selected))
          Viewer.parseScale(document.getElementById('scaleSelect').value);
    });

    window.addEventListener('keydown', function(evt) {
        var code = evt.keyCode;
        if (evt.charCode && code == 0)
            code = evt.charCode;
        switch(code) {
            case 38: // up
            case 37: // left
                Viewer.showPreviousPage();
                break;
            case 40: // down
            case 39: // right
                Viewer.showNextPage();
                break;
        }
    });
};
