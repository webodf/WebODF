/*global Element, window, Navigator*/
/*jslint nomen: false, emptyblock: true, unparam: true */
/**
 * @type {!DOMTokenList}
 */
Element.prototype.classList;
/**
 * @type{!Object.<!string,*>}
 */
var odf = {};
/**
 * @constructor
 * @param {!string|!odf.OdfContainer.DocumentType} urlOrType
 * @param {?function(!odf.OdfContainer)=} onstatereadychange
 * @return {?}
 */
odf.OdfContainer = function OdfContainer(urlOrType, onstatereadychange) {"use strict"; };
/**
 * @type {!number}
 */
odf.OdfContainer.prototype.state;
/**
 * @enum {number}
 */
odf.OdfContainer.DocumentType = {
    TEXT:         1,
    PRESENTATION: 2,
    SPREADSHEET:  3
};
/**
 * @constructor
 * @param {!HTMLElement} element Put and ODF Canvas inside this element.
 */
odf.OdfCanvas = function OdfCanvas(element) {"use strict"; };
/**
 * @param {!string} url
 * @return {undefined}
 */
odf.OdfCanvas.prototype.load = function (url) {"use strict"; };
/**
 * @param {!number} zoom
 * @return {undefined}
 */
odf.OdfCanvas.prototype.setZoomLevel = function (zoom) {"use strict"; };
/**
 * @return {!number}
 */
odf.OdfCanvas.prototype.getZoomLevel = function () {"use strict"; };
/**
 * @param {!number} width
 * @return {undefined}
 */
odf.OdfCanvas.prototype.fitToWidth = function (width) {"use strict"; };
/**
 * @param {!number} height
 * @return {undefined}
 */
odf.OdfCanvas.prototype.fitToHeight = function (height) {"use strict"; };
/**
 * @param {!number} width
 * @param {!number} height
 * @return {undefined}
 */
odf.OdfCanvas.prototype.fitToContainingElement = function (width, height) {"use strict"; };
/**
 * @param {!string} eventName
 * @param {!function(*)} handler
 * @return {undefined}
 */
odf.OdfCanvas.prototype.addListener = function (eventName, handler) {"use strict"; };
/**
 * @return {!odf.OdfContainer}
 */
odf.OdfCanvas.prototype.odfContainer = function () {"use strict"; };
/**
 * Set a odfcontainer manually.
 * @param {!odf.OdfContainer} container
 * @param {boolean=} suppressEvent Default value is false
 * @return {undefined}
 */
odf.OdfCanvas.prototype.setOdfContainer = function (container, suppressEvent) {"use strict"; };
/**
 * @return {undefined}
 */
odf.OdfCanvas.prototype.showNextPage = function () {"use strict"; };
/**
 * @return {undefined}
 */
odf.OdfCanvas.prototype.showPreviousPage = function () {"use strict"; };
/**
 * @param {!number} n  number of the page
 * @return {undefined}
 */
odf.OdfCanvas.prototype.showPage = function (n) {"use strict"; };
/**
 * @param {!function(!string):undefined} callback
 * @return {undefined}
 */
window.startUrl = function (callback) {"use strict"; };
/**
 * @type {!{platformId:!string}}
 */
window.cordova;
/**
 * Abstraction of the runtime environment.
 * @class
 * @interface
 */
function Runtime() {"use strict"; }
/**
 * Read part of a binary file.
 * @param {!string} path
 * @param {!number} offset
 * @param {!number} length
 * @param {!function(?string,?Uint8Array):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.read = function (path, offset, length, callback) {"use strict"; };
/**
 * @param {!string} path
 * @param {!function(number):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.getFileSize = function (path, callback) {"use strict"; };
/**
 * @const
 * @type {!Runtime}
 */
var runtime;
/**
 * @constructor
 */
function DOMRequest() {"use strict"; }
/**
 * @type {!boolean}
 */
DOMRequest.prototype.done;
/**
 * @type {!function():undefined}
 */
DOMRequest.prototype.onsuccess;
/**
 * @type {!function():undefined}
 */
DOMRequest.prototype.onerror;
/**
 * @type {*}
 */
DOMRequest.prototype.result;
/**
 * @type {!{name:!string, message:!string}}
 */
DOMRequest.prototype.error;
/**
 * @return {undefined}
 */
DOMRequest.prototype.continue = function () {"use strict"; };
/**
 * @constructor
 */
function DeviceStorage() {"use strict"; }
/**
 * @param {!string} name
 * @return {!DOMRequest}
 */
DeviceStorage.prototype.get = function (name) {"use strict"; };
/**
 * @return {!DOMRequest}
 */
DeviceStorage.prototype.enumerate = function () {"use strict"; };
/**
 * @param {!string} name
 * @return {!DeviceStorage}
 */
Navigator.prototype.getDeviceStorage = function (name) {"use strict"; };
