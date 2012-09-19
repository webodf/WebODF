function isFullScreen() {
    // Note that the browser fullscreen (triggered by short keys) might
    // be considered different from content fullscreen when expecting a boolean
    return  document.mozFullScreen || document.webkitIsFullScreen;
}

var Viewer = {
    url: null,
    filename: null,
    odfCanvas: null,
    element: null,

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
        window.title = this.filename;

        if(! (document.cancelFullScreen || document.mozCancelFullScreen || document.webkitCancelFullScreen) )
            document.getElementById('fullscreen').style.visibility = 'hidden';
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
};
