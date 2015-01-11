/**
 * Copyright (C) 2014-2015 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */
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
document.addEventListener("load", onload, false);
