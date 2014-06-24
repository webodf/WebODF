/*global alert, document, window, FileScanner, OdfViewer*/

var /**@type{!OdfViewer|undefined}*/
    viewer;

/**
 * @return {!OdfViewer}
 */
function createViewer() {
    "use strict";
    return new OdfViewer(document);
}
/**
 * Create the viewer when the HTML has loaded.
 * @return {undefined}
 */
function onload() {
    "use strict";
    viewer = viewer || createViewer();
}
var onloadname = "onload";
window[onloadname] = onload;

function deviceready() {
    "use strict";
    var startUrl = window.startUrl;
    if (startUrl === undefined) {
        // not running in a device
        // error in app, device probably not ready!
        alert("Plugin starturl not initialized properly!");
        return;
    }
    onload();
    viewer.scanFileSystem();
    startUrl(function (url) {
        if (url !== null) {
            viewer.openUrl(url);
            return;
        }
    });
}

document.addEventListener("deviceready", deviceready, false);
