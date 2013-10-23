/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>

 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
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
 * @source: https://github.com/kogmbh/WebODF/
 */
/*global runtime, core, XMLHttpRequest*/

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
            var xml;
            runtime.log("loading " + filename + " status " + xhr.status + " readyState " + xhr.readyState);
            if (xhr.readyState === 4) {
                xml = xhr.responseXML;
                runtime.log("done accessing responseXML " + xml + " " + (xhr.responseText && xhr.responseText.length)
                    + " " + xhr.statusText);
                runtime.log("statusText " + xhr.statusText);
                if (xhr.status === 0 && !xml) {
                    // empty files are considered as errors
                    callback("File " + filename + " is not valid XML.");
                } else if (xhr.status === 200 || xhr.status === 0) {
                    try {
                        callback(null, xml);
                    } catch (e) {
                        runtime.log(e);
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
        callback(null, "http://zipserver" + url + "?" + filename);
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
