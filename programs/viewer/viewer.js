window.onload = function() {
    // If the URL has a fragment (#...), try to load the file it represents
    var location = String(document.location),
        pos = location.indexOf('#');
    location = location.substr(pos + 1);
    if(pos === -1 || location.length == 0) {
        console.log('Could not parse file path argument.');
        return;
    }
    
    var odfElement = document.getElementById('canvas'),
        odfCanvas = new odf.OdfCanvas(odfElement);

    odfCanvas.load(location);
};
