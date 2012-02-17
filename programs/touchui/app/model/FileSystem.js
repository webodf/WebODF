/*global Ext, console, app, window, LocalFileSystem*/
Ext.define("WebODFApp.model.FileSystemProxy", (function () {
    "use strict";
    var self = this,
        scanner;
    function Scanner(proxy) {
        var todo = [],
            done = false,
            fileSystems,
            files,
            dirs = {},
            lastUpdate = 0,
            lastUpdateTime = new Date();
            
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
                entry.file(function (file) {
                    files.push(Ext.create('WebODFApp.model.FileSystem', {
                        id: files.length,
                        fileName: entry.name,
                        fullPath: entry.fullPath,
                        size: file.size
                    }));
                    callback(files.length - 1);
                }, fail);
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
                    done = todo.length === 0 || files.length > 200,
                    store = Ext.getStore('FileStore');
                if (done || lastUpdate === 0 || (files.length - lastUpdate > 0
                        && now - lastUpdateTime > files.length * 100)) {
                    store.load();
                    lastUpdate = files.length;
                    lastUpdateTime = now;
                }
                if (!done) {
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
            this.files = files = [];
            addFileSystems();
        };
        this.load = load;
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
        },
    
        create: function (operation, callback, scope) {
            finishOperation(this, operation, callback, scope);
        },
    
        read: function (operation, callback, scope) {
            scanner.scan();
            var me = this,
                records = scanner.files;
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
        },

        getId: function (url, callback) {
            var i, files = scanner.files;
            for (i = 0; i < files.length; i += 1) {
                if (files[i].fullPath === url) {
                    return callback(i);
                }
            }
            window.resolveLocalFileSystemURI(url,
                function (fileentry) {
                    scanner.load(fileentry, function (id) {
                        Ext.getStore('FileStore').load();
                        callback(id);
                    });
                },
                function (evt) {
                    callback(-1);
                });
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
