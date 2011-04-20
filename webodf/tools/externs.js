/*global Packages HTMLStyleElement window XMLHttpRequest HTMLStyleElement Document*/
/*jslint nomen: false */
/**
 * @constructor
 */
function NodeJSObject() {}
/**
 * @param {!string} path
 * @param {function(...)} callback
 * @return {undefined}
 */
NodeJSObject.prototype.stat = function (path, callback) {};
/**
 * @param {!string} path
 * @param {?string} encoding
 * @param {function(...)} callback
 * @return {?string}
 */
NodeJSObject.prototype.readFile = function (path, encoding, callback) {};
/**
 * @param {!string} path
 * @param {?string} encoding
 * @return {?string}
 */
NodeJSObject.prototype.readFileSync = function (path, encoding) {};
/**
 * @param {!string} path
 * @param {!string} flags
 * @param {!number} mode
 * @param {!function(string, !number):undefined} callback
 * @return {undefined}
 */
NodeJSObject.prototype.open = function (path, flags, mode, callback) {};
/**
 * @param {!number} fd
 * @param {!Buffer} buffer
 * @param {!number} offset
 * @param {!number} length
 * @param {!number} position
 * @param {function(string, !number)} callback
 * @return {undefined}
 */
NodeJSObject.prototype.read = function (fd, buffer, offset, length, position,
        callback) {};
/**
 * @param {!string} path
 * @param {!string} data
 * @param {!string} encoding
 * @param {!function(?string):undefined} callback
 * @return {undefined}
 */
NodeJSObject.prototype.writeFile = function (path, data, encoding, callback) {};
/**
 * @param {!string} path
 * @param {!function(?string):undefined} callback
 * @return {undefined}
 */
NodeJSObject.prototype.unlink = function (path, callback) {};
/**
 * @param {!number} fd
 * @param {function(!string)} callback
 * @return {undefined}
 */
NodeJSObject.prototype.close = function (fd, callback) {};
/**
 * @param {!string} className
 * @return {!NodeJSObject}
 */
function require(className) {}
/**
 * @constructor
 */
function NodeJSConsole() {}
/**
 * @type {!NodeJSConsole}
 */
var console;
/**
 * @constructor
 */
function NodeJSProcess() {}
/**
 * @param {!number} exitCode
 * @return {undefined}
 */
NodeJSProcess.prototype.exit = function (exitCode) {};
/**
 * @type {!Array}
 */
NodeJSProcess.prototype.argv = [];
/**
 * @type {!Object}
 */
NodeJSProcess.prototype.stderr = {};
/**
 * @type {!NodeJSProcess}
 */
var process;
/**
 * @type {!string}
 */
var __dirname;
/**
 * @constructor
 * @param {!number|!Array.<!number>|!string} arg1
 * @param {!string=} encoding
 */
function Buffer(arg1, encoding) {}
/**
 * @param {!string} msg
 * @return {undefined}
 */
function print(msg) {}
/**
 * @param {!string} path
 * @param {!string=} encoding
 * @return {?string}
 */
function readFile(path, encoding) {}
/**
 * @param {!number} exitCode
 * @return {undefined}
 */
function quit(exitCode) {}
/**
 * @namespace
 */
Packages.javax = {};
/**
 * @namespace
 */
Packages.javax.xml = {};
/**
 * @namespace
 */
Packages.javax.xml.validation = {};
/**
 * @constructor
 */
Packages.javax.xml.validation.Schema = function () {};
/**
 * @namespace
 */
Packages.javax.xml.parsers = {};
/**
 * @constructor
 */
Packages.javax.xml.parsers.DocumentBuilder = function () {};
/**
 * @param {!Object} entityresolver
 * @return {undefined}
 */
Packages.javax.xml.parsers.DocumentBuilder.prototype.setEntityResolver =
    function (entityresolver) {};
/**
 * @param {!Packages.org.xml.sax.InputSource} source 
 * @return {Document}
 */
Packages.javax.xml.parsers.DocumentBuilder.prototype.parse =
    function (source) {};
/**
 * @return {DOMImplementation}
 */
Packages.javax.xml.parsers.DocumentBuilder.prototype.getDOMImplementation =
    function () {};
/**
 * @constructor
 */
Packages.javax.xml.parsers.DocumentBuilderFactory = function () {};
/**
 * @return {!Packages.javax.xml.parsers.DocumentBuilderFactory}
 */
Packages.javax.xml.parsers.DocumentBuilderFactory.newInstance = function () {};
/**
 * @param {!boolean} value
 */
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype.setValidating =
    function (value) {};
/**
 * @param {!boolean} value
 */
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype.setNamespaceAware =
    function (value) {};
/**
 * @param {!boolean} value
 */
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype
    .setExpandEntityReferences = function (value) {};
/**
 * @param {?Packages.javax.xml.validation.Schema} schema
 */
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype.setSchema =
    function (schema) {};
/**
 * @return {!Packages.javax.xml.parsers.DocumentBuilder}
 */
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype.newDocumentBuilder =
    function () {};
/**
 * @namespace
 */
Packages.org = {};
/**
 * @namespace
 */
Packages.org.xml.sax = {};
/**
 * @param {!Object} definition
 * @return {!Object}
 */
Packages.org.xml.sax.EntityResolver = function (definition) {};
/**
 * @namespace
 */
Packages.java.io = {};
/**
 * @constructor
 * @param {!string} path
 */
Packages.java.io.FileReader = function (path) {};
/**
 * @constructor
 * @param {!string} path
 */
Packages.java.io.FileOutputStream = function (path) {};
/**
 * @param {!number} b
 * @return {undefined}
 */
Packages.java.io.FileOutputStream.prototype.write = function (b) {};
/**
 * @return {undefined}
 */
Packages.java.io.FileOutputStream.prototype.close = function () {};
/**
 * @constructor
 * @param {!Packages.java.io.FileReader} reader
 */
Packages.org.xml.sax.InputSource = function (reader) {};
/**
 * @type {!StyleSheet}
 */
HTMLStyleElement.prototype.sheet;
XMLHttpRequest.prototype.sendAsBinary = function (data) {};
window.nativeio = {};
/**
 * @interface
 */
function TreeWalker() {}
/**
 * @const@type{!Node}
 */
TreeWalker.prototype.root;
/**
 * @const@type{number}
 */
TreeWalker.prototype.whatToShow;
/**
 * @const@type{NodeFilter}
 */
TreeWalker.prototype.filter;
/**
 * @const@type{boolean}
 */
TreeWalker.prototype.expandEntityReferences;
/**
 * @type{Node}
 */
TreeWalker.prototype.currentNode;
/**
 * @return {Node}
 */
TreeWalker.prototype.parentNode = function () {};
/**
 * @return {Node}
 */
TreeWalker.prototype.firstChild = function () {};
/**
 * @return {Node}
 */
TreeWalker.prototype.lastChild = function () {};
/**
 * @return {Node}
 */
TreeWalker.prototype.previousSibling = function () {};
/**
 * @return {Node}
 */
TreeWalker.prototype.nextSibling = function () {};
/**
 * @return {Node}
 */
TreeWalker.prototype.previousNode = function () {};
/**
 * @return {Node}
 */
TreeWalker.prototype.nextNode = function () {};
/**
 * @param {!Node} root
 * @param {!number} whatToShow
 * @param {NodeFilter=} filter
 * @param {boolean=} entityReferenceExpansion
 * @return {!TreeWalker}
 */
Document.prototype.createTreeWalker = function (root, whatToShow, filter, entityReferenceExpansion) {};
