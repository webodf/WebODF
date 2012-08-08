function init() {
    runtime.loadClass('odf.OdfCanvas');
    // If the URL has a fragment (#...), try to load the file it represents
    var location = String(document.location),
        pos = location.indexOf('#'),
        odfElement = document.getElementById("canvas");
    document.odfCanvas = new odf.OdfCanvas(odfElement);
    
    if(pos === -1 || !window) {
        return
    }

    location = location.substr(pos + 1);
    document.odfCanvas.load(location);
}

window.setTimeout(init, 1);
