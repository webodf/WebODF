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
/*global Ext, console, app, window, LocalFileSystem, JSON, FileReader, runtime*/
Ext.define("WebODFApp.model.FileSystemProxy", (function () {
    "use strict";
    var self = this,
        scanner;
    function Scanner(proxy) {
        var todo = [],
            done = false,
            fileSystems,
            files,
            cachedList = [],
            dirs = {},
            lastUpdate = 0,
            lastUpdateTime = new Date();

        function getFileId(fullPath) {
            var i;
            if (!files) {
                return -1;
            }
            for (i = 0; i < files.length; i += 1) {
                if (files[i].get('fullPath') === fullPath) {
                    return i;
                }
            }
            return -1;
        }
        this.getFileId = getFileId;
        function addFileEntry(entry, callback) {
            function fail() {
                callback(-1);
            }
            var id = getFileId(entry.fullPath);
            if (id !== -1) {
                return callback(id);
            }
            entry.file(function (file) {
                var id = files.length;
                files.push(Ext.create('WebODFApp.model.FileSystem', {
                    id: id,
                    fileName: entry.name,
                    fullPath: entry.fullPath,
                    size: file.size
                }));
                callback(id);
            }, fail);
        }
        function parseCachedFileList(pos, callback) {
            if (pos === cachedList.length) {
                return callback();
            }
            window.resolveLocalFileSystemURI(cachedList[pos], function (entry) {
                addFileEntry(entry, function () {
                    parseCachedFileList(pos + 1, callback);
                });
            }, function () {
                parseCachedFileList(pos + 1, callback);
            });
        }
        function readCachedFileList(callback) {
            window.resolveLocalFileSystemURI("cachedODFList.json",
                function (fileentry) {
                    var reader = new FileReader();
                    reader.onloadend = function (evt) {
                        cachedList = [];
                        try {
                            cachedList = JSON.parse(evt.target.result);
                        } catch (e) {
                            alert(e);
                        }
                        parseCachedFileList(0, callback);
                    };
                    reader.readAsText(fileentry);
                }, function () {
                    callback();
                });
        }
        function writeCachedFileList() {
            var i,
                l = files.length;
            cachedList.length = files.length;
            for (i = 0; i < l; i += 1) {
                cachedList[i] = files[i].get('fullPath');
            }
            window.resolveLocalFileSystemURI("cachedODFList.json",
                function (fileentry) {
                    fileentry.createWriter(function (writer) {
                        writer.write(JSON.stringify(cachedList));
                    }, function (e) {
                        runtime.log(JSON.stringify(e));
                    });
                }, function (e) {
                    runtime.log(JSON.stringify(e));
                });
        }
        function filter(name) {
            var suffix = name.substr(name.length - 4);
            return suffix === ".odt" || suffix === ".odp" || suffix === ".ods";
        }
        function errorCallback(err) {
            console.log("FILE READ ERROR " + err + " " + todo.length);
            done = true;
        }
        function load(entry, callback) {
            function fail() {
                callback(-1);
            }
            if (entry.isDirectory) {
                entry.createReader().readEntries(function (entries) {
                    var i = 0;
                    for (i = 0; i < entries.length; i += 1) {
                        entry = entries[i];
                        if (entry.isDirectory
                                && !dirs.hasOwnProperty(entry.fullPath)) {
                            todo.push(entry);
                            dirs[entry.fullPath] = entry;
                        } else if (filter(entry.name)) {
                            todo.push(entry);
                        }
                    }
                    callback(-1);
                }, fail);
            } else if (entry.isFile) {
                addFileEntry(entry, callback);
            } else {
                fail();
            }
        }
        function addFileSystem(fileSystem) {
            var dir = fileSystems[fileSystem.name] = {};
            todo.push(fileSystem.root);
            function callback() {
                var now = new Date(),
                    // a limit is needed, otherwise the # of files too large to
                    // be handled by sencha touch
                    done = todo.length === 0 || files.length > 2000,
                    store = Ext.getStore('FileStore');
                if (done || lastUpdate === 0 || (files.length - lastUpdate > 0
                        && now - lastUpdateTime > files.length * 100)) {
                    store.load();
                    lastUpdate = files.length;
                    lastUpdateTime = now;
                }
                if (done) {
                    writeCachedFileList();
                } else {
                    load(todo.shift(), callback);
                }
            }
            load(todo.shift(), callback);
        }
        function addFileSystems() {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
                    addFileSystem, errorCallback);
            window.requestFileSystem(LocalFileSystem.TEMPORARY, 0,
                    addFileSystem, function () {});
        }
        this.scan = function () {
            if (fileSystems !== undefined) {
                return;
            }
            fileSystems = {};
            readCachedFileList(function () {
                addFileSystems();
            });
        };
        this.load = load;
        this.files = files = [];
    }
    function finishOperation(proxy, operation, callback, scope) {
        if (operation) {
            var i = 0,
                recs = operation.getRecords(),
                len = recs.length;

            for (i; i < len; i += 1) {
                recs[i].commit();
            }
            operation.setSuccessful();

            Ext.callback(callback, scope || proxy, [operation]);
        }
    }
    return {
        extend: "Ext.data.proxy.Proxy",
        xtype: 'filesystemproxy',
        constructor: function (config) {
            this.initConfig(config);
            scanner = new Scanner(this);
            this.startScanningDirectories = function () {
                scanner.scan();
            };
            this.getRecord = function (url, callback) {
                var id = scanner.getFileId(url);
                if (id !== -1) {
                    return callback(scanner.files[id]);
                }
                window.resolveLocalFileSystemURI(url,
                    function (fileentry) {
                        scanner.load(fileentry, function (id) {
                            Ext.getStore('FileStore').load();
                            callback(scanner.files[id]);
                        });
                    },
                    function (evt) {
                        callback(null);
                    });
            };
        },

        create: function (operation, callback, scope) {
            finishOperation(this, operation, callback, scope);
        },

        read: function (operation, callback, scope) {
            var me = this,
                records = scanner.files;
            if (!records) {
                return;
            }
            // return model instances in a resultset
            operation.setResultSet(new Ext.data.ResultSet({
                //total: records.length,
                count: records.length,
                records: records,
                success: true
            }));

            // announce success
            operation.setSuccessful();
            operation.setCompleted();

            // finish with callback
            Ext.callback(callback, scope || me, [operation]);
        },

        update: function (operation, callback, scope) {
            finishOperation(this, operation, callback, scope);
        },

        destroy: function (operation, callback, scope) {
            finishOperation(this, operation, callback, scope);
        }
    };
}()));

Ext.define("WebODFApp.model.FileSystem", {
    extend: 'Ext.data.Model',
    config: {
        idProperty: 'id',
        fields: [ {
            name: "id",
            type: "auto"
        }, {
            name: "fullPath",
            type: "string"
        }, {
            name: "fileName",
            type: "string"
        }, {
            name: "size",
            type: "int"
        } ]
    }
});
