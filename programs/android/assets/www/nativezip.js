/*global runtime, core, DOMParser*/

core.Zip = function (url, entriesReadCallback) {
    "use strict";
console.log("core.Zip");
    // remove 'odf:' prefix
    url = url.substr(4);
    var zip = this,
        window = runtime.getWindow();
    this.load = function (filename, callback) {
        alert("load");
    };
    this.loadAsString = function (filename, callback) {
console.log("this.loadAsString");
        var callbackname = 'callback' + String(Math.random()).substring(2);
        window[callbackname] = function (err, string) {
            window[callbackname] = undefined;
            callback(err, string);
        };
        window.zipreader.loadAsString(url, filename, callbackname);
    };
    this.loadAsDataURL = function (filename, mimetype, callback) {
console.log("this.loadAsDataURL");
        var callbackname = 'callback' + String(Math.random()).substring(2);
        window[callbackname] = function (err, dataurl) {
            window[callbackname] = undefined;
            callback(err, dataurl);
        };
        window.zipreader.loadAsDataURL(url, filename, mimetype, callbackname);
    };
    this.loadAsDOM = function (filename, callback) {
        zip.loadAsString(filename, function (err, xmldata) {
            if (err) {
                callback(err, null);
                return;
            }
            var parser = new DOMParser();
            xmldata = parser.parseFromString(xmldata, "text/xml");
            callback(null, xmldata);
        });
    };
    this.getEntries = function () {
        alert("getEntries");
    };
    this.loadContentXmlAsFragments = function (filename, handler) {
        alert("loadContentXmlAsFragments");
    };
    this.save = function () {
        alert("save");
    };
    this.write = function () {
        alert("write");
    };
    entriesReadCallback(null, zip);
console.log("did core.Zip");
};
