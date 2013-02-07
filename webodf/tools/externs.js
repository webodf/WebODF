/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
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
 * @source: http://gitorious.org/webodf/webodf/
 */
/*global Packages, HTMLStyleElement, window, XMLHttpRequest, HTMLStyleElement, Document*/
/*jslint nomen: false */
/**
 * @constructor
 */
function NodeJSObject() {"use strict"; }
/**
 * @param {...} items
 * @return {string}
 */
NodeJSObject.prototype.resolve = function (items) {"use strict"; };
/**
 * @param {!string} path
 * @param {function(...)} callback
 * @return {undefined}
 */
NodeJSObject.prototype.stat = function (path, callback) {"use strict"; };
/**
 * @param {!string} path
 * @param {?string} encoding
 * @param {function(...)} callback
 * @return {?string}
 */
NodeJSObject.prototype.readFile = function (path, encoding, callback) {"use strict"; };
/**
 * @param {!string} path
 * @param {?string} encoding
 * @return {?string}
 */
NodeJSObject.prototype.readFileSync = function (path, encoding) {"use strict"; };
/**
 * @param {!string} path
 * @param {!string} flags
 * @param {!number} mode
 * @param {!function(string, !number):undefined} callback
 * @return {undefined}
 */
NodeJSObject.prototype.open = function (path, flags, mode, callback) {"use strict"; };
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
        callback) {"use strict"; };
/**
 * @param {!string} path
 * @param {!string} data
 * @param {!string} encoding
 * @param {!function(?string):undefined} callback
 * @return {undefined}
 */
NodeJSObject.prototype.writeFile = function (path, data, encoding, callback) {"use strict"; };
/**
 * @param {!string} path
 * @param {!function(?string):undefined} callback
 * @return {undefined}
 */
NodeJSObject.prototype.unlink = function (path, callback) {"use strict"; };
/**
 * @param {!number} fd
 * @param {function(!string)=} callback
 * @return {undefined}
 */
NodeJSObject.prototype.close = function (fd, callback) {"use strict"; };
/**
 * @constructor
 */
function XmlDom() {"use strict"; }
/**
 * @constructor
 * @extends DOMParser
 */
XmlDom.prototype.DOMParser = function () {"use strict"; };
/**
 * @constructor
 * @extends DOMImplementation
 */
XmlDom.prototype.DOMImplementation = function () {"use strict"; };
/**
 * @param {!string} className
 * @return {!NodeJSObject|!XmlDom}
 */
function require(className) {"use strict"; }
/**
 * @constructor
 */
function NodeJSConsole() {"use strict"; }
/**
 * @param {!string} msg
 * @return {undefined}
 */
NodeJSConsole.prototype.log = function (msg) {"use strict"; };
/**
 * @type {!NodeJSConsole}
 */
var console;
/**
 * @constructor
 */
function NodeJSProcess() {"use strict"; }
/**
 * @param {!number} exitCode
 * @return {undefined}
 */
NodeJSProcess.prototype.exit = function (exitCode) {"use strict"; };
/**
 * @type {!Array}
 */
NodeJSProcess.prototype.argv = [];
/**
 * @type {!Object}
 */
NodeJSProcess.prototype.stderr = {};

/**
 * @namespace
 */
var JSON;
/**
 * @namespace
 */
var now;
/**
 * @type {function(!Array):Object}
 */
now.deliverOp = function(spec) { "use strict"; };

/**
 * @type {function(!function(...), !function(!number)):Object}
 */
now.getAllKnownUserData = function(data_cb, done_cb) { "use strict"; };
/**
 * @type {function(!string, !function(!boolean)):Object}
 */
now.joinSession = function(sessionId, done_cb) { "use strict"; };


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
function Buffer(arg1, encoding) {"use strict"; }
/**
 * @param {!string} msg
 * @return {undefined}
 */
function print(msg) {"use strict"; }
/**
 * @param {!string} path
 * @param {!string=} encoding
 * @return {?string}
 */
function readFile(path, encoding) {"use strict"; }
/**
 * @param {!number} exitCode
 * @return {undefined}
 */
function quit(exitCode) {"use strict"; }
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
Packages.javax.xml.validation.Schema = function () {"use strict"; };
/**
 * @namespace
 */
Packages.javax.xml.parsers = {};
/**
 * @constructor
 */
Packages.javax.xml.parsers.DocumentBuilder = function () {"use strict"; };
/**
 * @param {!Object} entityresolver
 * @return {undefined}
 */
Packages.javax.xml.parsers.DocumentBuilder.prototype.setEntityResolver =
    function (entityresolver) {"use strict"; };
/**
 * @param {!Packages.org.xml.sax.InputSource} source 
 * @return {Document}
 */
Packages.javax.xml.parsers.DocumentBuilder.prototype.parse =
    function (source) {"use strict"; };
/**
 * @return {DOMImplementation}
 */
Packages.javax.xml.parsers.DocumentBuilder.prototype.getDOMImplementation =
    function () {"use strict"; };
/**
 * @constructor
 */
Packages.javax.xml.parsers.DocumentBuilderFactory = function () {"use strict"; };
/**
 * @return {!Packages.javax.xml.parsers.DocumentBuilderFactory}
 */
Packages.javax.xml.parsers.DocumentBuilderFactory.newInstance = function () {"use strict"; };
/**
 * @param {!boolean} value
 */
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype.setValidating =
    function (value) {"use strict"; };
/**
 * @param {!boolean} value
 */
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype.setNamespaceAware =
    function (value) {"use strict"; };
/**
 * @param {!boolean} value
 */
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype
    .setExpandEntityReferences = function (value) {"use strict"; };
/**
 * @param {?Packages.javax.xml.validation.Schema} schema
 */
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype.setSchema =
    function (schema) {"use strict"; };
/**
 * @return {!Packages.javax.xml.parsers.DocumentBuilder}
 */
Packages.javax.xml.parsers.DocumentBuilderFactory.prototype.newDocumentBuilder =
    function () {"use strict"; };
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
Packages.org.xml.sax.EntityResolver = function (definition) {"use strict"; };
/**
 * @namespace
 */
Packages.java.io = {};
/**
 * @constructor
 * @param {!string} path
 */
Packages.java.io.FileReader = function (path) {"use strict"; };
/**
 * @constructor
 * @param {!string} path
 */
Packages.java.io.FileOutputStream = function (path) {"use strict"; };
/**
 * @param {!number} b
 * @return {undefined}
 */
Packages.java.io.FileOutputStream.prototype.write = function (b) {"use strict"; };
/**
 * @return {undefined}
 */
Packages.java.io.FileOutputStream.prototype.close = function () {"use strict"; };
/**
 * @constructor
 * @param {!Packages.java.io.FileReader} reader
 */
Packages.org.xml.sax.InputSource = function (reader) {"use strict"; };
/**
 * @type {!StyleSheet}
 */
HTMLStyleElement.prototype.sheet;
XMLHttpRequest.prototype.sendAsBinary = function (data) {"use strict"; };
/**
 * @const@type{!string}
 */
XMLHttpRequest.prototype.responseBody;
window.nativeio = {};
var VBArray = {};
VBArray.prototype.toArray = function () {"use strict"; };
/**
 * @interface
 */
function TreeWalker() {"use strict"; }
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
TreeWalker.prototype.parentNode = function () {"use strict"; };
/**
 * @return {Node}
 */
TreeWalker.prototype.firstChild = function () {"use strict"; };
/**
 * @return {Node}
 */
TreeWalker.prototype.lastChild = function () {"use strict"; };
/**
 * @return {Node}
 */
TreeWalker.prototype.previousSibling = function () {"use strict"; };
/**
 * @return {Node}
 */
TreeWalker.prototype.nextSibling = function () {"use strict"; };
/**
 * @return {Node}
 */
TreeWalker.prototype.previousNode = function () {"use strict"; };
/**
 * @return {Node}
 */
TreeWalker.prototype.nextNode = function () {"use strict"; };
/**
 * @interface
 */
function NodeIterator() {"use strict"; }
/**
 * @return {Node}
 */
NodeIterator.prototype.previousNode = function () {"use strict"; };
/**
 * @return {Node}
 */
NodeIterator.prototype.nextNode = function () {"use strict"; };
/**
 * @return {undefined}
 */
NodeIterator.prototype.detach = function () {"use strict"; };
/**
 * @param {!Node} root
 * @param {!number} whatToShow
 * @param {function(!Node):boolean=} filter
 * @param {boolean=} entityReferenceExpansion
 * @return {!TreeWalker}
 */
Document.prototype.createTreeWalker = function (root, whatToShow, filter, entityReferenceExpansion) {"use strict"; };
/**
 * @param {!Node} root
 * @param {!number} whatToShow
 * @param {function(!Node):boolean=} filter
 * @param {boolean=} entityReferenceExpansion
 * @return {!NodeIterator}
 */
Document.prototype.createNodeIterator = function (root, whatToShow, filter, entityReferenceExpansion) {"use strict"; };
