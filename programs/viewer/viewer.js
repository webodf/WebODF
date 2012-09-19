var Viewer = {
    url: null,
    filename: null,
    odfCanvas: null,

    initialize: function() {
        // If the URL has a fragment (#...), try to load the file it represents
        var location = String(document.location),
            pos = location.indexOf('#');
        location= location.substr(pos + 1);
        if(pos === -1 || location.length == 0) {
            console.log('Could not parse file path argument.');
            return;
        }
        
        this.url = location;
        this.filename = this.url.replace(/^.*[\\\/]/, '');
        
        var odfElement = document.getElementById('canvas');
        this.odfCanvas = new odf.OdfCanvas(odfElement);
        this.odfCanvas.load(location);
        window.title = this.filename;
    },

    download: function() {
        var url = this.url.split('#')[0];
        url += '#webodf-viewer.action=download';
        window.open(url, '_parent');
    }
};

window.onload = function() {
    Viewer.initialize();

    document.getElementById('download').addEventListener('click', function() {
        Viewer.download();
    });
};


