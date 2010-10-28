/*global window XMLHttpRequest require console process __dirname setTimeout Packages print readFile*/
/**
 * Three implementations of a runtime for browser, node.js and rhino.
 */

/**
 * Abstraction of the runtime environment.
 * @interface
 */
function Runtime() {}
/**
 * @param {string} path
 * @param {string} encoding
 * @param {function(string=,string=):undefined} callback
 * @return undefined
 */
Runtime.prototype.readFile = function (path, encoding, callback) {};
/**
 * @param {string} path
 * @param {string} encoding
 * @return {string}
 */
Runtime.prototype.readFileSync = function (path, encoding) {};
/**
 * @param {string} path
 * @param {function((string|Document)):undefined} callback
 * @return undefined
 */
Runtime.prototype.loadXML = function (path, callback) {};
/**
 * @param {string} path
 * @param {function(boolean):undefined} callback
 * @return undefined
 */
Runtime.prototype.isFile = function (path, callback) {};
/**
 * @param {string} msg
 * @return undefined
 */
Runtime.prototype.log = function (msg) {};
/**
 * @param {function():undefined} callback
 * @param {number} milliseconds
 * @return undefined
 */
Runtime.prototype.setTimeout = function (callback, milliseconds) {};
/**
 * @return {Array.<string>}
 */
Runtime.prototype.libraryPaths = function () {};

/** @define {boolean} */
var IS_COMPILED_CODE = false;

/**
 * @constructor
 * @implements {Runtime}
 * @param {Element} logoutput
 */
function BrowserRuntime(logoutput) {
    function log(msg) {
        var node, doc;
        if (logoutput) {
            doc = logoutput.ownerDocument;
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
                    callback(undefined, xmlHttp.responseText);
                } else {
                    // report error
                    callback(xmlHttp.responseText);
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
    this.readFileSync = function (path, encoding) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open('GET', path, false);
        if (encoding) {
            xmlHttp.overrideMimeType("text/plain; charset=" + encoding);
        } else {
            xmlHttp.overrideMimeType("text/plain; charset=x-user-defined");
        }
        try {
            xmlHttp.send(null);
        } catch (e) {
        }
        return xmlHttp.responseText;
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
        throw "Not implemented.";
    };
    this.log = log;
    this.setTimeout = setTimeout;
    this.libraryPaths = function () {
        return ["../lib"];
    };
}

/**
 * @constructor
 * @implements {Runtime}
 */
function NodeJSRuntime() {
    var fs = require('fs');

    function isFile(path, callback) {
        fs.stat(path, function (err, stats) {
            callback(!err && stats.isFile());
        });
    }
    function loadXML(path, callback) {
        throw "Not implemented.";
    }

    this.readFile = fs.readFile;
    this.readFileSync = fs.readFileSync;
    this.loadXML = loadXML;
    this.isFile = isFile;
    this.log = console.log;
    this.setTimeout = setTimeout;
    this.libraryPaths = function () {
        return [__dirname];
    };
}

/**
 * @constructor
 * @implements {Runtime}
 */
function RhinoRuntime() {
    var dom,// = Packages.javax.xml.parsers.DocumentBuilderFactory.newInstance(),
        builder,
        entityresolver;
/*
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
*/

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
    function runtimeReadFileSync(path, encoding) {
        var file = new Packages.java.io.File(path);
        if (!file.isFile()) {
            return undefined;
        }
        return readFile(path, encoding);
    }
    function isFile(path, callback) {
        var file = new Packages.java.io.File(path);
        callback(file.isFile());
    }
    function setTimeout(path, callback) {
    }

    this.loadXML = loadXML;
    this.readFile = runtimeReadFile;
    this.readFileSync = readFile;
    this.isFile = isFile;
    this.log = print;
    this.setTimeout = setTimeout;
    this.libraryPaths = function () {
        return ["lib"];
    };
}

/**
 * @const
 * @type {Runtime}
 */
var runtime = (function () {
    if (typeof(window) !== "undefined") {
        return new BrowserRuntime(window.document.getElementById("logoutput"));
    } else if (typeof(require) !== "undefined") {
        return new NodeJSRuntime();
    }
    return new RhinoRuntime();
}());

(function () {
    var cache = {};
    function definePackage(packageNameComponents) {
        var topname = packageNameComponents[0],
            i, pkg;
        // ensure top level package exists
        //pkg = eval("if (typeof " + topname + " === 'undefined') {" +
        //        "eval('" + topname + " = {};');}; var a___ = " + topname);
        pkg = eval("if (typeof " + topname + " === 'undefined') {" +
                "eval('" + topname + " = {};');}" + topname);
        for (i = 1; i < packageNameComponents.length - 1; i += 1) {
            if (!(packageNameComponents[i] in pkg)) {
                pkg = pkg[packageNameComponents[i]] = {};
            }
        }
    }
    /**
     * @param {string} classpath
     * @returns {Object|undefined}
     */
    runtime.loadClass = function (classpath) {
        var impl,
            code,
            path,
            rt = runtime,
            dirs, i;
        if (classpath in cache) {
            return cache[classpath];
        }
        // check if the class in context already
        try {
            impl = eval(classpath);
        } catch (e) {
            path = classpath.replace(".", "/") + ".js";
            dirs = rt.libraryPaths();
            for (i = 0; i < dirs.length; i += 1) {
                try {
                    code = rt.readFileSync(dirs[i] + "/" + path, "utf8");
                    break;
                } catch (ex) {
                }
            }
            if (code === undefined) {
                throw "Cannot load class " + classpath;
            }
            definePackage(classpath.split("."));
            impl = eval(code);
        }
        cache[classpath] = impl;
        return impl;
    };
}());

(function (args) {
    function run(argv) {
        if (argv.length === 0) {
            return;
        }
        runtime.readFile(argv[0], "utf8", function (err, data) {
            if (err) {
                runtime.log(err);
            } else {
                eval(data);
                run(argv.slice(1));
            }
        });
    }
    // if rhino or node.js, run the scripts provided as arguments
    if (typeof(require) !== "undefined") {
        run(process.argv.slice(2));
    } else if (typeof(window) === "undefined") {
        run(args);
    }
}(typeof arguments !== "undefined" && arguments.slice && arguments.slice()));
