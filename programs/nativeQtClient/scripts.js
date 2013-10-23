/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>

 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
 *
 * As additional permission under GNU AGPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * As a special exception to the AGPL, any HTML file which merely makes function
 * calls to this code, and for that purpose includes it by reference shall be
 * deemed a separate work for copyright law purposes. In addition, the copyright
 * holders of this code give you permission to combine this code with free
 * software libraries that are released under the GNU LGPL. You may copy and
 * distribute such a system following the terms of the GNU AGPL for this code
 * and the LGPL for the libraries. If you modify this code, you may extend this
 * exception to your version of the code, but you are not obligated to do so.
 * If you do not wish to do so, delete this exception statement from your
 * version.
 *
 * This license applies to this entire compilation.
 * @licend
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */
/*global alert, app, window, runtime*/
var LocalFileSystem = {
    PERSISTENT: 0,
    TEMPORARY: 1
};
function FileEntry(name, fullPath) {
    "use strict";
    this.isFile = true;
    this.isDirectory = false;
    this.name = name;
    this.fullPath = fullPath;
    this.file = function (onsuccess, onerror) {
        function File(fullPath) {
            this.name = name;
            this.fullPath = fullPath;
            this.type = "";
            this.size = -1;
            this.lastModifiedDate = -1;
        }
        var file = new File(fullPath);
        try {
            onsuccess(file);
        } catch (e) {
            alert("Error on determining file properties: " + e);
            onerror(e);
        }
    };
}
function FileReader() {
    "use strict";
    var fr = this;
    this.readAsArrayBuffer = function (file) {
        var path = file.fullPath.substr(7),
            data = runtime.readFileSync(path, 'binary');
        data = runtime.byteArrayFromString(data, "binary");
        window.setTimeout(function () {
            fr.onloadend({target: {result: data}});
        }, 1);
    };
}
var DirectoryReader;
function DirectoryEntry(name, fullPath) {
    "use strict";
    this.isFile = false;
    this.isDirectory = true;
    this.name = name;
    this.fullPath = fullPath;
    this.createReader = function () {
        var reader = new DirectoryReader(fullPath);
        return reader;
    };
}
function DirectoryReader(fullPath) {
    "use strict";
    this.readEntries = function (onsuccess, onerror) {
        window.setTimeout(function () {
            var entries = [];
            entries[entries.length] = new FileEntry("welcome.odt",
                    "welcome.odt");
            entries[entries.length] = new FileEntry("Traktatenblad.odt",
                    "Traktatenblad.odt");
            try {
                onsuccess(entries);
            } catch (e) {
                onerror(e);
            }
        }, 1);
    };
}
window.resolveLocalFileSystemURI = function (path, onsuccess, onerror) {
    "use strict";
    var p = path.lastIndexOf("/"),
        name = (p === -1) ? path : path.substr(p + 1);
    onsuccess(new FileEntry(name, path));
};
window.requestFileSystem = function (filesystem, id, onsuccess, onerror) {
    "use strict";
    var dirs = [], shared, subfolder, path;
    try {
        if (filesystem === LocalFileSystem.PERSISTENT) {
            path = "";
            onsuccess({
                name: "root",
                root: new DirectoryEntry("root", path)
            });
        } else {
            onerror("not defined");
        }
    } catch (e) {
        onerror(e);
    }
};
var device = {};
