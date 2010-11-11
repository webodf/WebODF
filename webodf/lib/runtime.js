/*jslint nomen: false, evil: true*/
/*global window XMLHttpRequest require console process __dirname setTimeout Packages print readFile quit Buffer*/

/**
 * Three implementations of a runtime for browser, node.js and rhino.
 */

/**
 * Abstraction of the runtime environment.
 * @interface
 */
function Runtime() {}
/**
 * @param {!string} path
 * @param {!number} offset
 * @param {!number} length
 * @param {!function(string=,string=):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.read = function (path, offset, length, callback) {};
/**
 * @param {!string} path
 * @param {!string} encoding
 * @param {!function(string=,string=):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.readFile = function (path, encoding, callback) {};
/**
 * @param {!string} path
 * @param {!string} encoding
 * @return {!string}
 */
Runtime.prototype.readFileSync = function (path, encoding) {};
/**
 * @param {!string} path
 * @param {!function((string|Document)):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.loadXML = function (path, callback) {};
/**
 * @param {!string} path
 * @param {!function(boolean):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.isFile = function (path, callback) {};
/**
 * @param {!string} path
 * @param {!function(number):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.getFileSize = function (path, callback) {};
/**
 * @param {!string} msgOrCategory
 * @param {!string=} msg
 * @return {undefined}
 */
Runtime.prototype.log = function (msgOrCategory, msg) {};
/**
 * @param {!function():undefined} callback
 * @param {!number} milliseconds
 * @return {undefined}
 */
Runtime.prototype.setTimeout = function (callback, milliseconds) {};
/**
 * @return {!Array.<string>}
 */
Runtime.prototype.libraryPaths = function () {};
/**
 * @return {string}
 */
Runtime.prototype.type = function () {};
/**
 * @return {?DOMImplementation}
 */
Runtime.prototype.getDOMImplementation = function () {};
/**
 * @return {?Window}
 */
Runtime.prototype.getWindow = function () {};

/** @define {boolean} */
var IS_COMPILED_CODE = false;

/**
 * @constructor
 * @implements {Runtime}
 * @param {Element} logoutput
 */
function BrowserRuntime(logoutput) {
    function log(msgOrCategory, msg) {
        var node, doc, category;
        if (msg) {
            category = msgOrCategory;
        } else {
            msg = msgOrCategory;
        }
        if (logoutput) {
            doc = logoutput.ownerDocument;
            if (category) {
                node = doc.createElement("span");
                node.className = category;
                node.appendChild(doc.createTextNode(category));
                logoutput.appendChild(node);
                logoutput.appendChild(doc.createTextNode(" "));
            }
            node = doc.createElement("span");
            node.appendChild(doc.createTextNode(msg));
            logoutput.appendChild(node);
            logoutput.appendChild(doc.createElement("br"));
        }
    }
    this.readFile = function (path, encoding, callback) {
        var xmlHttp = new XMLHttpRequest();
        function handleResult() {
            if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 0 && !xmlHttp.responseText) {
                    // for local files there is no difference between missing
                    // and empty files, so empty files are considered as errors
                    callback("File is empty.");
                } else if (xmlHttp.status === 200 || xmlHttp.status === 0) {
                    // report file
                    callback(null, xmlHttp.responseText);
                } else {
                    // report error
                    callback(xmlHttp.responseText || xmlHttp.statusText);
                }
            }
        }
        xmlHttp.open('GET', path, true);
        xmlHttp.onreadystatechange = handleResult;
        if (encoding) {
            xmlHttp.overrideMimeType("text/plain; charset=" + encoding);
        } else {
            xmlHttp.overrideMimeType("text/plain; charset=x-user-defined");
        }
        try {
            xmlHttp.send(null);
        } catch (e) {
            callback(e.message);
        }
    };
    this.read = function (path, offset, length, callback) {
        this.readFile(path, null, function (err, data) {
            if (err) {
                callback(err);
            } else {
                callback(null, data.substring(offset, length + offset));
            }
        });
    };
    this.readFileSync = function (path, encoding) {
        var xmlHttp = new XMLHttpRequest(),
            result;
        xmlHttp.open('GET', path, false);
        if (encoding) {
            xmlHttp.overrideMimeType("text/plain; charset=" + encoding);
        } else {
            xmlHttp.overrideMimeType("text/plain; charset=x-user-defined");
        }
        try {
            xmlHttp.send(null);
            if (xmlHttp.status === 200) {
                result = xmlHttp.responseText;
            }
        } catch (e) {
        }
        return result;
    };
    this.loadXML = function (path, callback) {
        var xmlHttp = new XMLHttpRequest();
        function handleResult() {
            if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 0 && !xmlHttp.responseText) {
                    callback("File is empty.");
                } else if (xmlHttp.status === 200 || xmlHttp.status === 0) {
                    // report file
                    callback(xmlHttp.responseXML);
                } else {
                    // report error
                    callback(xmlHttp.responseText);
                }
            }
        }
        xmlHttp.open("GET", path, true);
        xmlHttp.overrideMimeType("text/xml");
        xmlHttp.onreadystatechange = handleResult;
        try {
            xmlHttp.send(null);
        } catch (e) {
            callback(e.message);
        }
    };
    this.isFile = function (path, callback) {
        this.readFile(path, null, function (err, data) {
            if (err) {
                callback(false);
            } else {
                callback(true);
            }
        });
    };
    this.getFileSize = function (path, callback) {
        this.readFile(path, null, function (err, data) {
            if (err) {
                callback(-1);
            } else {
                callback(data.length);
            }
        });
    };
    this.log = log;
    this.setTimeout = function (f, msec) {
        setTimeout(f, msec);
    };
    this.libraryPaths = function () {
        return ["../lib", ".", "lib"]; // TODO: find a good solution
                                       // probably let html app specify it
    };
    this.type = function () {
        return "BrowserRuntime";
    };
    this.getDOMImplementation = function () {
        return window.document.implementation;
    };
    this.exit = function (exitCode) {
    };
    this.getWindow = function () {
        return window;
    };
}

/**
 * @constructor
 * @implements {Runtime}
 */
function NodeJSRuntime() {
    var fs = require('fs'),
        currentDirectory = "";

    function isFile(path, callback) {
        if (currentDirectory) {
            path = currentDirectory + "/" + path;
        }
        fs.stat(path, function (err, stats) {
            callback(!err && stats.isFile());
        });
    }
    function loadXML(path, callback) {
        throw "Not implemented.";
    }

    this.readFile = fs.readFile;
    this.read = function (path, offset, length, callback) {
        if (currentDirectory) {
            path = currentDirectory + "/" + path;
        }
        fs.open(path, "r+", 666, function (err, fd) {
            if (err) {
                callback(err);
                return;
            }
            var buffer = new Buffer(length);
            fs.read(fd, buffer, 0, length, offset, function (err, bytesRead) {
                fs.close(fd);
                callback(err, buffer.toString("binary", 0, bytesRead));
            });
        });
    };
    this.readFileSync = fs.readFileSync;
    this.loadXML = loadXML;
    this.isFile = isFile;
    this.getFileSize = function (path, callback) {
        if (currentDirectory) {
            path = currentDirectory + "/" + path;
        }
        fs.stat(path, function (err, stats) {
            if (err) {
                callback(-1);
            } else {
                callback(stats.size);
            }
        });
    };
    this.log = console.log;
    this.setTimeout = setTimeout;
    this.libraryPaths = function () {
        return [__dirname];
    };
    this.setCurrentDirectory = function (dir) {
        currentDirectory = dir;
    };
    this.currentDirectory = function () {
        return currentDirectory;
    };
    this.type = function () {
        return "NodeJSRuntime";
    };
    this.getDOMImplementation = function () {
        return;
    };
    this.exit = process.exit;
    this.getWindow = function () {
        return null;
    };
}

/**
 * @constructor
 * @implements {Runtime}
 */
function RhinoRuntime() {
    var dom = Packages.javax.xml.parsers.DocumentBuilderFactory.newInstance(),
        builder,
        entityresolver,
        currentDirectory = "";
    dom.setValidating(false);
    dom.setNamespaceAware(true);
    dom.setExpandEntityReferences(false);
    dom.setSchema(null);
    entityresolver = Packages.org.xml.sax.EntityResolver({
        resolveEntity: function (publicId, systemId) {
            var file, open = function (path) {
                var reader = new Packages.java.io.FileReader(path),
                    source = new Packages.org.xml.sax.InputSource(reader);
                return source;
            };
            file = /[^\/]*$/.exec(systemId);
            return open(file);
        }
    });
    //dom.setEntityResolver(entityresolver);
    builder = dom.newDocumentBuilder();
    builder.setEntityResolver(entityresolver);

    function loadXML(path, callback) {
        var file = new Packages.java.io.File(path),
            document;
        try {
            document = builder.parse(file);
        } catch (err) {
            print(err);
        }
        callback(document);
    }
    function runtimeReadFile(path, encoding, callback) {
        var file = new Packages.java.io.File(path),
            data;
        if (!file.isFile()) {
            callback(path + " is not a file.");
        } else {
            data = readFile(path, encoding);
            callback(null, data);
        }
    }
    /**
     * @param {!string} path
     * @param {?string} encoding
     * @return {?string}
     */
    function runtimeReadFileSync(path, encoding) {
        var file = new Packages.java.io.File(path), data, i;
        if (!file.isFile()) {
            return null;
        }
        if (encoding) {
            return readFile(path, encoding);
        }
        return readFile(path, "latin1"); // read binary, seems hacky but works
    }
    function isFile(path, callback) {
        if (currentDirectory) {
            path = currentDirectory + "/" + path;
        }
        var file = new Packages.java.io.File(path);
        callback(file.isFile());
    }

    this.loadXML = loadXML;
    this.readFile = runtimeReadFile;
    this.read = function (path, offset, length, callback) {
        // TODO: adapt to read only a part instead of the whole file
        if (currentDirectory) {
            path = currentDirectory + "/" + path;
        }
        var data = runtimeReadFileSync(path, null);
        if (data) {
            callback(null, data.substring(offset, offset + length));
        } else {
            callback("Cannot read " + path);
        }
    };
    this.readFileSync = readFile;
    this.isFile = isFile; 
    this.getFileSize = function (path, callback) {
        if (currentDirectory) {
            path = currentDirectory + "/" + path;
        }
        var file = new Packages.java.io.File(path);
        callback(file.length());
    };
    this.log = print;
    this.setTimeout = function (f, msec) {
        f();
    };
    this.libraryPaths = function () {
        return ["lib"];
    };
    this.setCurrentDirectory = function (dir) {
        currentDirectory = dir;
    };
    this.currentDirectory = function () {
        return currentDirectory;
    };
    this.type = function () {
        return "RhinoRuntime";
    };
    this.getDOMImplementation = function () {
        return builder.getDOMImplementation();
    };
    this.exit = quit;
    this.getWindow = function () {
        return null;
    };
}

/**
 * @const
 * @type {Runtime}
 */
var runtime = (function () {
    if (typeof(window) !== "undefined") {
        return new BrowserRuntime(window.document.getElementById("logoutput"));
    } else {
        if (typeof(require) !== "undefined") {
            return new NodeJSRuntime();
        } else {
            return new RhinoRuntime();
        }
    }
}());

(function () {
    var cache = {};
    function definePackage(packageNameComponents) {
        var topname = packageNameComponents[0],
            i, pkg;
        // ensure top level package exists
        pkg = eval("if (typeof " + topname + " === 'undefined') {" +
                "eval('" + topname + " = {};');}" + topname);
        for (i = 1; i < packageNameComponents.length - 1; i += 1) {
            if (!(packageNameComponents[i] in pkg)) {
                pkg = pkg[packageNameComponents[i]] = {};
            }
        }
        return pkg;
    }
    /**
     * @param {string} classpath
     * @returns {undefined}
     */
    runtime.loadClass = function (classpath) {
        if (IS_COMPILED_CODE) {
            return;
        }
        if (classpath in cache) {
            return;
        }
        var names = classpath.split("."),
            impl;
        try {
            impl = eval(classpath);
            if (impl) {
                cache[classpath] = true;
                return;
            }
        } catch (e) {
        }
        function load(classpath) {
            var code, path, dirs, i;
            path = classpath.replace(".", "/") + ".js";
            dirs = runtime.libraryPaths();
            if (runtime.currentDirectory) {
                dirs.push(runtime.currentDirectory());
            }
            for (i = 0; i < dirs.length; i += 1) {
                try {
                    code = runtime.readFileSync(dirs[i] + "/" + path, "utf8");
                    if (code && code.length) {
                        break;
                    }
                } catch (ex) {
                }
            }
            if (code === undefined) {
                throw "Cannot load class " + classpath;
            }
            definePackage(names);
            try {
                code = eval(classpath + " = eval(code);");
            } catch (e) {
                runtime.log("Error loading " + classpath + " " + e);
                throw e;
            }
            return code;
        }
        // check if the class in context already
        impl = load(classpath);
        if (!impl || impl.name !== names[names.length - 1]) {
            runtime.log("Loaded code is not for " + names[names.length - 1]);
            throw "Loaded code is not for " + names[names.length - 1];
        }
        cache[classpath] = true;
    };
}());
(function (args) {
    args = Array.prototype.slice.call(args);
    function run(argv) {
        if (!argv.length) {
            return;
        }
        var script = argv[0];
        runtime.readFile(script, "utf8", function (err, data) {
            var path = "",
                paths = runtime.libraryPaths(),
                exitCode;
            if (script.indexOf("/") !== -1) {
                path = script.substring(0, script.indexOf("/"));
            }
            runtime.setCurrentDirectory(path);
            if (err) {
                runtime.log(err);
            } else {
                exitCode = eval(data);
                if (exitCode) {
                    runtime.exit(exitCode);
                } else {
                    run(argv.slice(1));
                }
            }
        });
    }
    // if rhino or node.js, run the scripts provided as arguments
    if (runtime.type() === "NodeJSRuntime") {
        run(process.argv.slice(2));
    } else if (runtime.type() === "RhinoRuntime") {
        run(args);
    }
}(typeof arguments !== "undefined" && arguments));
