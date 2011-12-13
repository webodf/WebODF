/*global Ext, console, app, window, LocalFileSystem*/
Ext.data.FileSystemProxy = Ext.extend(Ext.data.Proxy, (function () {
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
                        if (entry.isDirectory && !dirs.hasOwnProperty(entry.fullPath)) {
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
                    files.push(new proxy.model({
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
                    done = todo.length === 0 || files.length > 200;
                if (done || lastUpdate === 0 || (files.length - lastUpdate > 0 && now - lastUpdateTime > files.length * 100)) {
                    app.stores.filesystem.load();
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
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, addFileSystem, errorCallback);
            window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, addFileSystem,
                function () {});
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
    return {
        constructor: function(config) {
            Ext.data.FileSystemProxy.superclass.constructor.call(this, config);
            scanner = new Scanner(this);
        },
    
        create : function(operation, callback, scope) {
        },
    
        read : function(operation, callback, scope) {
            scanner.scan();
            var thisProxy = this,
                records = scanner.files;

            // return model instances in a resultset
            operation.resultSet = new Ext.data.ResultSet({
                records : records
            });
    
            // announce success
            operation.setSuccessful();
            operation.setCompleted();
    
            // finish with callback
            if (typeof callback === "function") {
                callback.call(scope || thisProxy, operation);
            }
        },
    
        update : function(operation, callback, scope) {
        },
    
        destroy : function(operation, callback, scope) {
        },

        getId : function(url, callback) {
            var i, files = scanner.files;
            for (i = 0; i < files.length; i += 1) {
                if (files[i].fullPath === url) {
                    return callback(i);
                }
            }
            window.resolveLocalFileSystemURI(url,
                function (fileentry) {
                    scanner.load(fileentry, function (id) {
                        app.stores.filesystem.load();
                        callback(id);
                    });
                },
                function (evt) {
                    callback(-1);
                });
        }
    };
}()));

Ext.data.ProxyMgr.registerType("filestorage", Ext.data.FileSystemProxy);

app.models.FileSystem = Ext.regModel("app.models.FileSystem", {
    idProperty: 'id',
    fields : [ {
        name : "id",
        type : "int"
    }, {
        name : "fullPath",
        type : "string"
    }, {
        name : "fileName",
        type : "string"
    }, {
        name : "size",
        type : "int"
    } ],
    proxy : {
        type : "filestorage"
    }
});

app.stores.filesystem = new Ext.data.Store({
    model: "app.models.FileSystem",
    // set sorting and grouping to be alphabetically but to ignore case
    sorters: function (a, b) {
        "use strict";
        a = a.get('fileName').toUpperCase();
        b = b.get('fileName').toUpperCase();
        if (a > b) {
            return 1;
        }
        if (a < b) {
            return -1;
        }
        return 0;
    },
    getGroupString: function(record) {
        "use strict";
        return record.get('fileName')[0].toUpperCase();
    }
});
