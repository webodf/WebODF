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
/*global window, console, navigator*/

/**
 * @constructor
 * @param {!string} url
 */
function FileScannerFileEntry(url) {
    "use strict";
    /**@const@type{!string}*/
    this.url = url;
}
/**
 * @constructor
 * @param {?FileScannerEntry} parent
 */
function FileScannerEntry(parent) {
    "use strict";
    /**@const@type{!Object.<!string,!FileScannerEntry>}*/
    this.list = {};
    /**@const@type{!Object.<!string,!FileScannerFileEntry>}*/
    this.file = {};
    /**@const@type{?FileScannerEntry}*/
    this.parent = parent;
    /**@type{!number}*/
    this.files = 0;
}
/**
 * @constructor
 * @param {!DirectoryEntry} dir
 * @param {!FileScannerEntry} entry
 */
function FileScannerTodo(dir, entry) {
    "use strict";
    /**@const@type{!DirectoryEntry}*/
    this.dir = dir;
    /**@const@type{!FileScannerEntry}*/
    this.entry = entry;
}

/**
 * @param {!string} str
 * @param {!string} suffix
 * @return {!boolean}
 */
function endsWith(str, suffix) {
    "use strict";
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
/**
 * @param {!string} name
 * @param {!Array.<!string>} extensions
 * @return {!boolean}
 */
function filter(name, extensions) {
    "use strict";
    var ok = false, i;
    for (i = 0; !ok && i < extensions.length; i += 1) {
        ok = endsWith(name, extensions[i]);
    }
    return ok;
}

/**
 * @param {!Array.<!string>} extensions
 * @param {!function(!FileScannerEntry):undefined} callback
 * @return {undefined}
 */
function scanFirefoxOS(extensions, callback) {
    "use strict";
    var root = new FileScannerEntry(null),
        name,
        sdcard,
        /**@type{!DOMRequest}*/
        cursor;
    sdcard = navigator.getDeviceStorage("sdcard");
    cursor = sdcard.enumerate();
    cursor.onsuccess = function () {
        var file;
        if (cursor.done) {
            console.log("scanning done");
            callback(root);
        } else {
            if (cursor.result) {
                file = /**@type{!File}*/(cursor.result);
                name = file.name;
                if (filter(name, extensions)) {
                    root.file[name] = new FileScannerFileEntry(name);
                    console.log(name);
                }
            }
            cursor.continue();
        }
    };
    cursor.onerror = function () {
        console.log("error scanning for files: " + cursor.error.name + " " + cursor.error.message);
        callback(root);
    };
}

/**
 * Class that scans the filesystem for files with a particular extension.
 * Pass an array with extension like [".odt", ".ods"]
 * @constructor
 * @param {!Array.<!string>} extensions
 * @param {!function():undefined} onDone
 */
function FileScanner(extensions, onDone) {
    "use strict";
    var /**@type{!Array.<!FileScannerTodo>}*/
        todo = [],
        /**@type{!boolean}*/
        paused = false,
        /**@type{!Array.<!string>}*/
        errors = [],
        /**@type{!FileScannerEntry}*/
        root,
        scan;
    /**
     * @param {!DirectoryEntry} entry
     * @param {?FileScannerEntry} parent
     * @return {!FileScannerTodo}
     */
    function makeDir(entry, parent) {
        var e = new FileScannerEntry(parent);
        return new FileScannerTodo(entry, e);
    }
    /**
     * @param {!string} e
     * @return {undefined}
     */
    function err(e) {
        console.log(e);
        errors.push(e);
    }
    /**
     * @param{!FileScannerEntry} p
     * @return {undefined}
     */
    function increaseFileCounter(p) {
        p.files += 1;
        if (p.parent !== null) {
            increaseFileCounter(p.parent);
        }
    }
    /**
     * @param {!FileEntry} fileEntry
     * @param {!FileScannerEntry} dir
     * @return {undefined}
     */
    function addFile(fileEntry, dir) {
        /**
         * @param {!File} file
         * @return {undefined}
         */
        function ok(file) {
            var localURL = "localURL";
            dir.file[fileEntry.name] = new FileScannerFileEntry(file[localURL]);
            // mark that the dir and the ancestors contain files
            increaseFileCounter(dir);
        }
        fileEntry.file(ok, function (e) {
            err(e.message);
        });
    }
    /**
     * @return {undefined}
     */
    function doScan() {
        if (todo.length === 0) {
            return onDone();
        }
        if (paused) {
            return;
        }
        var t = todo.pop(),
            dir = t.dir;
        /**
         * @param {!Array.<!Entry>} entries
         * @return {undefined}
         */
        function ok(entries) {
            var i = 0, e, o;
            for (i = 0; i < entries.length; i += 1) {
                e = entries[i];
                if (e.isDirectory) {
                    o = makeDir(/**@type{!DirectoryEntry}*/(e), t.entry);
                    t.entry.list[e.name] = o.entry;
                    todo.push(o);
                } else if (e.isFile && filter(e.name, extensions)) {
                    addFile(/**@type{!FileEntry}*/(e), t.entry);
                }
            }
            scan();
        }
        dir.createReader().readEntries(ok, function (e) {
            err(e.message);
        });
    }
    /**
     * @return {undefined}
     */
    scan = function scan() {
        // allow UI to update, wait at least 1 ms
        //window.setTimeout(doScan, 0);
        doScan();
    };
    /**
     * @return {undefined}
     */
    this.pause = function () {
        paused = true;
    };
    /**
     * @return {undefined}
     */
    this.resume = function () {
        paused = false;
        scan();
    };
    /**
     * @return {!boolean}
     */
    function done() {
        return todo.length === 0;
    }
    this.done = done;
    /**
     * Get the root of the file system.
     * @return {!FileScannerEntry|undefined}
     */
    this.root = function () {
        return root;
    };
    /**
     * @return {undefined}
     */
    function init() {
        if (window.cordova.platformId === "firefoxos") {
            scanFirefoxOS(extensions, function (ffroot) {
                root = ffroot;
                onDone();
            });
        } else {
            window.requestFileSystem(window.PERSISTENT, 0,
                function (fileSystem) {
                    var t = makeDir(fileSystem.root, null);
                    todo.push(t);
                    root = t.entry;
                    scan();
                }, function (e) {
                    err(e.message);
                    onDone();
                });
        }
    }
    init();
}
