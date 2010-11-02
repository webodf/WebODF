/**
 * es3
 */
/**
 * @constructor
 * @param {*=} opt_value
 * @nosideeffects
 */
function Object(opt_value) {}
/**
 * @param {*} propertyName Implicitly cast to a string.
 * @return {boolean}
 * @nosideeffects
 */
Object.prototype.hasOwnProperty = function (propertyName) {};
/**
 * @constructor
 * @param {...*} var_args
 * @return {!Array}
 * @nosideeffects
 */
function Array(var_args) {}
/**
 * @param {...*} var_args
 * @return {!Array}
 * @this {Object}
 * @nosideeffects
 */
Array.prototype.concat = function (var_args) {};
/**
 * @param {*=} opt_begin Zero-based index at which to begin extraction.  A
 *     non-number type will be auto-cast by the browser to a number.
 * @param {*=} opt_end Zero-based index at which to end extraction.  slice
 *     extracts up to but not including end.
 * @return {!Array}
 * @this {Object}
 * @nosideeffects
 */
Array.prototype.slice = function (opt_begin, opt_end) {};
/**
 * @param {...*} var_args
 * @return {number} The new length of the array.
 * @this {Object}
 */
Array.prototype.push = function (var_args) {};
/**
 * @constructor
 * @param {*=} opt_str
 * @return {string}
 * @nosideeffects
 */
function String(opt_str) {}
/**
 * @param {*=} opt_separator
 * @param {number=} opt_limit
 * @return {!Array.<string>}
 * @nosideeffects
 */
String.prototype.split = function (opt_separator, opt_limit) {};
/**
 * @param {*} num
 * @return {boolean}
 * @nosideeffects
 */
function isNaN(num) {}

/**
 * @constructor
 */
function DOMImplementation() {}

/**
 * @constructor
 */
function NodeJSObject() {}
/**
 * @param {string} path
 * @param {string} encoding
 * @param {Function} callback
 * @return {undefined}
 */
NodeJSObject.prototype.readFile = function (path, encoding, callback) {};
/**
 * @param {string} path
 * @param {string} encoding
 * @return {undefined}
 */
NodeJSObject.prototype.readFileSync = function (path, encoding) {};
/**
 * @param {string} path
 * @return {NodeJSObject}
 */
function require(path) {}
/**
 * @type {Object.<string, function(...)>}
 */
function console() {}
/**
 * @param {string} msg
 */
console.prototype.log = function (msg) {};
var process = {
    argv: []
};
/**
 * @type {string}
 */
var __dirname;
var JSON = {
    stringify: function (object) {}
};
/**
 * @param {string} path
 * @param {string} encoding
 */
function readFile(path, encoding) {}
/**
 * @param {string} msg
 */
function print(msg) {}
/**
 * @param {string} msg
 */
function alert(msg) {}
var Math = {};
var XMLHttpRequest;
var undefined;
function setTimeout(callback, time) {}
var Packages = {
    javax: {
        xml: {
            parsers: {
            }
        }
    },
    org: {
        xml: {
            sax: {
                EntityResolver: function () {},
                InputSource: function (reader) {}
            }
        }
    },
    java: {
        io: {
            File: function (path) {},
            FileReader: function (path) {}
        }
    }
};
/**
 * @constructor
 */
Packages.javax.xml.parsers.DocumentBuilder = function () {};
Packages.javax.xml.parsers.DocumentBuilder.prototype.setEntityResolver = 
function () {};
/**
 * @return {DOMImplementation}
 */
Packages.javax.xml.parsers.DocumentBuilder.prototype.getDOMImplementation = function () {};
/**
 * @constructor
 */
Packages.javax.xml.parsers.DocumentBuilderFactory = function () {};
/**
 * @return {Packages.javax.xml.parsers.DocumentBuilderFactory}
 */
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype.newInstance = function () {};
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype.setValidating = function (value) {};
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype.setNamespaceAware = function (value) {};
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype.setExpandEntityReferences = function (value) {};
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype.setSchema = function (value) {};
/**
 * @return {Packages.javax.xml.parsers.DocumentBuilder}
 */
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype.newDocumentBuilder = function () {};
var window = {};
var eval = function(code) {}
var arguments;
/**
 * @constructor
 */
function Node() {}
/**
 * @constructor
 * @extends {Node}
 */
function Document() {}
/**
 * @constructor
 * @extends {Node}
 */
function Element() {}
/**
 * @constructor
 */
function Selection() {}
/*
 * @type {Document}
 */
var document = {};
