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


var kCssUnits = 96.0 / 72.0;
var kScrollbarPadding = 40;
var kMinScale = 0.25;
var kMaxScale = 4.0;
var kDefaultScaleDelta = 1.1;
var kDefaultScale = 'auto';

var Viewer = {
    url: null,
    filename: null,
    odfCanvas: null,
    element: null,
    initialized: false,

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
        
        var odfElement = document.getElementById('canvas');
        this.odfCanvas = new odf.OdfCanvas(odfElement);
        this.odfCanvas.load(location);
        document.title = this.filename;

        if(! (document.cancelFullScreen || document.mozCancelFullScreen || document.webkitCancelFullScreen) )
            document.getElementById('fullscreen').style.visibility = 'hidden';

        var self = this;
        this.odfCanvas.addListener('statereadychange', function () {
            self.parseScale(kDefaultScale);
            self.initialized = true;
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
        if ('custom' == value)
            scale = parseFloat(document.getElementById('customScaleOption').textContent) / 100;
        else
            scale = parseFloat(value);

        if (scale) {
            this.setScale(scale, true, noScroll);
            return;
        }

        switch (value) {
            case 'page-actual':
                this.setScale(1, resetAutoSettings, noScroll);
                break;
            case 'page-width':
                this.odfCanvas.fitToWidth(document.body.clientWidth - kScrollbarPadding);
                break;
            case 'auto':
                this.odfCanvas.fitSmart(document.body.clientWidth - kScrollbarPadding);
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

    document.getElementById('scaleSelect').addEventListener('change',
    function() {
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
};
