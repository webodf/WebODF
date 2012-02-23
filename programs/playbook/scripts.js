/*global blackberry, alert, document, window, app*/
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
        var file = new File(fullPath),
            properties;
        try {
            properties = blackberry.io.file.getFileProperties(fullPath);
            file.type = properties.mimeType;
            file.size = properties.size;
            file.lastModifiedDate = properties.dateModified;
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
    this.readAsDataURL = function (file) {
        var path = file.fullPath.substr(7);
        window.setTimeout(function () {
            try {
                var data = blackberry.custom.filereader.readAsDataURL(path);
                fr.onloadend({target: {result: data}});
            } catch (e) {
                alert("Error on reading file: " + e + " " + file.fullPath);
            }
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
            var entries = [],
                dirs = blackberry.io.dir.listDirectories(fullPath),
                files = blackberry.io.dir.listFiles(fullPath),
                i;
            try {
                for (i = 0; i < dirs.length; i += 1) {
                    entries[entries.length] = new DirectoryEntry(dirs[i],
                                             fullPath + "/" + dirs[i]);
                }
                for (i = 0; i < files.length; i += 1) {
                    entries[entries.length] = new FileEntry(files[i],
                                             fullPath + "/" + files[i]);
                }
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
    var dirs = [], shared, subfolder;
    try {
        if (filesystem === LocalFileSystem.PERSISTENT) {
            shared = blackberry.io.dir.appDirs.shared;
            for (subfolder in shared) {
                if (shared.hasOwnProperty(subfolder)) {
                    dirs[dirs.length] = subfolder;
                }
            }
            onsuccess({
                name: "root",
                root: new DirectoryEntry("root", shared.documents.path
                    //+ "/kofficetests/odf/odt"
                      )
            });
        } else {
            onerror("not defined");
        }
    } catch (e) {
        onerror(e);
    }
};
var device = {};
