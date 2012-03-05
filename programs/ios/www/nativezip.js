/*global PhoneGap, core*/

var ZipPlugin = {
    loadAsString: function (zippath, entrypath, success, fail) {
        "use strict";
        return PhoneGap.exec(success, fail, "ZipClass", "loadAsString", [zippath, entrypath]);
    },
    loadAsDataURL: function (zippath, entrypath, mimetype, success, fail) {
        "use strict";
        return PhoneGap.exec(success, fail, "ZipClass", "loadAsDataURL", [zippath, entrypath, mimetype]);
    }
};
core.Zip = function (url, entriesReadCallback) {
    "use strict";
    // remove 'odf:' prefix
    url = url.substr(4);
    var zip = this;
    this.load = function (filename, callback) {
        //alert(filename);
        callback(null, "");
    };
    this.loadAsString = function (filename, callback) {
        alert("loadAsString");
    };
    this.loadAsDOM = function (filename, callback) {
        var xhr = new XMLHttpRequest();
        function handleResult() {
            var data;
            if (xhr.readyState === 4) {
                if (xhr.status === 0 && !xhr.responseXML) {
                    // empty files are considered as errors
                    callback("File " + path + " is not valid XML.");
                } else if (xhr.status === 200 || xhr.status === 0) {
                    try {
                        callback(null, xhr.responseXML);
                    } catch (e) {
                        console.log(e);
                    }
                } else {
                    // report error
                    callback(xhr.responseText || xhr.statusText);
                }
            }
        }
        xhr.open('GET', "http://zipserver" + url + "?" + filename, true);
        xhr.onreadystatechange = handleResult;
        xhr.send(null);
    };
    this.loadAsDataURL = function (filename, mimetype, callback) {
        ZipPlugin.loadAsDataURL(url, filename, mimetype,
            function (content) {
                callback(null, content);
            },
            function (err) { callback(err, null); }
            );
    };
    this.getEntries = function () {
        alert("getEntries");
    };
    this.loadContentXmlAsFragments = function (filename, handler) {
        // the javascript implementation simply reads the file
        zip.loadAsString(filename, function (err, data) {
            if (err) {
                return handler.rootElementReady(err);
            }
            handler.rootElementReady(null, data, true);
        });
    };
    this.save = function () {
        alert("save");
    };
    this.write = function () {
        alert("write");
    };
    entriesReadCallback(null, this);
};
