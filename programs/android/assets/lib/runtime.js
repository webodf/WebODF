/**
 * Copyright (C) 2011 KO GmbH <jos.van.den.oever@kogmbh.com>
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
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
 * @source: http://gitorious.org/odfkit/webodf/
 */
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
 * @param {!string} encoding text encoding or 'binary'
 * @param {!function(string=,string=):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.readFile = function (path, encoding, callback) {};
/**
 * @param {!string} path
 * @param {!string} encoding text encoding or 'binary'
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
 * @param {!string} data
 * @param {!string} encoding text encoding or "binary"
 * @param {!function(?string):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.writeFile = function (path, data, encoding, callback) {};
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
 * @param {!string} path
 * @param {!function(?string):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.deleteFile = function (path, callback) {};
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
    var cache = {},
        nativeio = window.nativeio || {};
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
        } else if (console) {
            console.log(msg);
        }
    }
    // tentative function to fix problems with sending binary data
    function cleanDataString(s) {
        var str = "", i, l = s.length;
        for (i = 0; i < l; i += 1) {
            str += String.fromCharCode(s.charCodeAt(i) & 0xff);
        }
        return str;
    }
    function readFile(path, encoding, callback) {
        var xhr = new XMLHttpRequest();
        function handleResult() {
            var data;
            if (xhr.readyState === 4) {
                if (xhr.status === 0 && !xhr.responseText) {
                    // for local files there is no difference between missing
                    // and empty files, so empty files are considered as errors
                    callback("File is empty.");
                } else if (xhr.status === 200 || xhr.status === 0) {
                    // report file
                    if (encoding === "binary") {
                        data = cleanDataString(xhr.responseText);
                        cache[path] = data;
                    } else {
                        data = xhr.responseText;
                    }
                    callback(null, data);
                } else {
                    // report error
                    callback(xhr.responseText || xhr.statusText);
                }
            }
        }
        xhr.open('GET', path, true);
        xhr.onreadystatechange = handleResult;
        if (encoding !== "binary") {
            xhr.overrideMimeType("text/plain; charset=" + encoding);
        } else {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
        }
        try {
            xhr.send(null);
        } catch (e) {
            callback(e.message);
        }
    }
    function read(path, offset, length, callback) {
        if (path in cache) {
            callback(null, cache[path].substring(offset, length + offset));
            return;
        }
        this.readFile(path, "binary", function (err, data) {
            if (err) {
                callback(err);
            } else {
                callback(null, data.substring(offset, length + offset));
            }
        });
        //xhr.setRequestHeader('Range', 'bytes=' + offset + '-' +
        //       (offset + length - 1));
    }
    function readFileSync(path, encoding) {
        var xhr = new XMLHttpRequest(),
            result;
        xhr.open('GET', path, false);
        if (encoding !== "binary") {
            xhr.overrideMimeType("text/plain; charset=" + encoding);
        } else {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
        }
        try {
            xhr.send(null);
            if (xhr.status === 200 || xhr.status === 0) {
                result = xhr.responseText;
            }
        } catch (e) {
        }
        return result;
    }
    function writeFile(path, data, encoding, callback) {
        var xhr = new XMLHttpRequest();
        function handleResult() {
            if (xhr.readyState === 4) {
                if (xhr.status === 0 && !xhr.responseText) {
                    // for local files there is no difference between missing
                    // and empty files, so empty files are considered as errors
                    callback("File is empty.");
                } else if ((xhr.status >= 200 && xhr.status < 300) ||
                           xhr.status === 0) {
                    // report success
                    callback(null);
                } else {
                    // report error
                    callback("Status " + xhr.status + ": " +
                            xhr.responseText || xhr.statusText);
                }
            }
        }
        xhr.open('PUT', path, true);
        xhr.onreadystatechange = handleResult;
        if (encoding !== "binary") {
            xhr.overrideMimeType("text/plain; charset=" + encoding);
        }
        try {
            if (encoding === "binary" && xhr.sendAsBinary) {
                data = cleanDataString(data);
                xhr.sendAsBinary(data);
            } else {
                xhr.send(data);
            }
        } catch (e) {
            callback(e.message);
        }
    }
    function deleteFile(path, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('DELETE', path, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status < 200 && xhr.status >= 300) {
                    callback(xhr.responseText);
                } else {
                    callback(null);
                }
            }
        };
        xhr.send(null);
    }
    function loadXML(path, callback) {
        var xhr = new XMLHttpRequest();
        function handleResult() {
            if (xhr.readyState === 4) {
                if (xhr.status === 0 && !xhr.responseText) {
                    callback("File is empty.");
                } else if (xhr.status === 200 || xhr.status === 0) {
                    // report file
                    callback(xhr.responseXML);
                } else {
                    // report error
                    callback(xhr.responseText);
                }
            }
        }
        xhr.open("GET", path, true);
        xhr.overrideMimeType("text/xml");
        xhr.onreadystatechange = handleResult;
        try {
            xhr.send(null);
        } catch (e) {
            callback(e.message);
        }
    }
    function isFile(path, callback) {
        this.getFileSize(path, function (size) {
            callback(size !== -1);
        });
    }
    function getFileSize(path, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("HEAD", path, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) {
                return;
            }
            var cl = xhr.getResponseHeader("Content-Length");
            if (cl) {
                callback(parseInt(cl, 10));
            } else { 
                callback(-1);
            }
        };
        xhr.send(null);
    }
    function wrap(nativeFunction, nargs) {
        if (!nativeFunction) {
            return null;
        }
        return function () {
            // clear cache
            cache = {};
            // assume the last argument is a callback function
            var callback = arguments[nargs],
                args = Array.prototype.slice.call(arguments, 0, nargs),
                callbackname = "callback" + String(Math.random()).substring(2);
            window[callbackname] = function () {
                delete window[callbackname];
                callback.apply(this, arguments);
            };
            args.push(callbackname);
            nativeFunction.apply(this, args);
        };
    }
    this.readFile = readFile;
    this.read = read;//wrap(nativeio.read, 3) || read;
    this.readFileSync = readFileSync;
    this.writeFile = wrap(nativeio.writeFile, 3) || writeFile;
    this.deleteFile = wrap(nativeio.deleteFile, 1) || deleteFile;
    this.loadXML = loadXML;
    this.isFile = isFile;
    this.getFileSize = wrap(nativeio.getFileSize, 1) || getFileSize;
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
        if (nativeio.exit) {
            nativeio.exit(exitCode);
        }
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
    this.readFile = function (path, encoding, callback) {
        if (encoding !== "binary") {
            fs.readFile(path, encoding, callback);
        } else {
            // we have to encode the returned buffer to a string
            // it would be nice if we would have a blob or buffer object
            fs.readFile(path, null, function (err, data) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, data.toString("binary"));
            });
        }
    };
    this.writeFile = function (path, data, encoding, callback) {
        fs.writeFile(path, data, encoding, function (err) {
            callback(err || null);
        });
    };
    this.deleteFile = fs.unlink;
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
            if (encoding === "binary") {
                encoding = "latin1"; // read binary, seems hacky but works
            }
            data = readFile(path, encoding);
            callback(null, data);
        }
    }
    /**
     * @param {!string} path
     * @param {!string} encoding
     * @return {?string}
     */
    function runtimeReadFileSync(path, encoding) {
        var file = new Packages.java.io.File(path), data, i;
        if (!file.isFile()) {
            return null;
        }
        if (encoding === "binary") {
            encoding = "latin1"; // read binary, seems hacky but works
        }
        return readFile(path, encoding);
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
    this.writeFile = function (path, data, encoding, callback) {
        if (encoding !== "binary") {
            throw "Non-binary encoding not implemented.";
        }
        var out = new Packages.java.io.FileOutputStream(path),
            i, l = data.length;
        for (i = 0; i < l; i += 1) {
            out.write(data.charCodeAt(i));
        }
        out.close();
        callback(null);
    };
    this.deleteFile = function (path, callback) {
        var file = new Packages.java.io.File(path);
        if (file['delete']()) {
            callback(null);
        } else {
            callback("Could not delete " + path);
        }
    };
    this.read = function (path, offset, length, callback) {
        // TODO: adapt to read only a part instead of the whole file
        if (currentDirectory) {
            path = currentDirectory + "/" + path;
        }
        var data = runtimeReadFileSync(path, "binary");
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
        runtime.readFile(script, "utf8", function (err, code) {
            var path = "",
                paths = runtime.libraryPaths();
            if (script.indexOf("/") !== -1) {
                path = script.substring(0, script.indexOf("/"));
            }
            runtime.setCurrentDirectory(path);
            function run() {
                var script, path, paths, args, argv, result; // hide variables
                // execute script and make arguments available via argv
                result = eval(code);
                if (result) {
                    runtime.exit(result);
                }
                return;
            }
            if (err) {
                runtime.log(err);
            } else {
                // run the script with arguments bound to arguments parameter
                run.apply(null, argv);
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
