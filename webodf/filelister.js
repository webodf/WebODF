/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global XMLHttpRequest*/

/*jslint regexp: true*/

/** asynchroneous function that lists all files **/
function listFiles(startdir, filepattern, fileCallback, doneCallback) {
    "use strict";

    var todoList = [],
        doneList = [],
        dirpattern = /\/$/,
        hasWEBDAV = false;

    function getHref(responseElement) {
        var n = responseElement.firstChild;
        while (n && !(n.namespaceURI === 'DAV:' && n.localName === 'href')) {
            n = n.nextSibling;
        }
        return n && n.firstChild && n.firstChild.nodeValue;
    }

    function isDirectory(responseElement) {
        var n = responseElement.firstChild;
        while (n &&
                !(n.namespaceURI === 'DAV:' && n.localName === 'propstat')) {
            n = n.nextSibling;
        }
        n = n && n.firstChild;
        while (n &&
                !(n.namespaceURI === 'DAV:' && n.localName === 'prop')) {
            n = n.nextSibling;
        }
        n = n && n.firstChild;
        while (n && !(n.namespaceURI === 'DAV:' &&
                      n.localName === 'resourcetype')) {
            n = n.nextSibling;
        }
        n = n && n.firstChild;
        while (n &&
                !(n.namespaceURI === 'DAV:' && n.localName === 'collection')) {
            n = n.nextSibling;
        }
        return n;
    }

    function processWebDavResponse(xml) {
        if (!xml) {
            throw new Error('No proper XML response.');
        }

        var refs = xml.getElementsByTagNameNS('DAV:', 'response'),
            directories = [],
            files = [],
            i,
            d,
            href;
        if (refs.length === 0) {
            throw new Error('No proper XML response.');
        }
        for (i = 0; i < refs.length; i += 1) {
            href = getHref(refs[i]);
            if (isDirectory(refs[i])) {
                directories.push(href);
            } else if (filepattern.test(href)) {
                files.push(href);
            }
        }
        for (i = 0; i < directories.length; i += 1) {
            d = directories[i];
            if (doneList.indexOf(d) === -1 && todoList.indexOf(d) === -1) {
                todoList.push(d);
            }
        }
        fileCallback(directories, files);
    }

    function processIndexHtmlResponse(base, text) {
        // use regex because index.html is usually not valid xml
        var re = /href="([^\/\?"][^"]*)"/ig,
            matches,
            files = [],
            directories = [],
            name,
            d,
            i;
        while ((matches = re.exec(text)) !== null) {
            name = matches[1];
            if (dirpattern.test(name)) {
                directories.push(base + name);
            } else if (filepattern.test(name)) {
                files.push(base + name);
            }
        }
        for (i = 0; i < directories.length; i += 1) {
            d = directories[i];
            if (doneList.indexOf(d) === -1 && todoList.indexOf(d) === -1) {
                todoList.push(d);
            }
        }
        fileCallback(directories, files);
    }

    function getNextFileListWithIndexHtml() {
        var url = todoList.shift(),
            req;
        while (url && typeof url !== 'string') {
            url = todoList.shift();
        }
        if (!url) {
            if (doneCallback) {
                doneCallback();
            }
            return;
        }
        req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.onreadystatechange = function (evt) {
            if (req.readyState !== 4) {
                return;
            }
            if (req.status >= 200 && req.status < 300) {
                processIndexHtmlResponse(url, req.responseText);
            }
            getNextFileListWithIndexHtml();
        };
        req.send(null);

        doneList.push(url);
    }

    function getNextFileListWithWebDav() {
        var url = todoList.shift(),
            req;
        if (!url) {
            if (doneCallback) {
                doneCallback();
            }
            return;
        }

        req = new XMLHttpRequest();
        req.open('PROPFIND', url, true);
        req.onreadystatechange = function (evt) {
            if (req.readyState !== 4) {
                return;
            }
            if (req.status >= 200 && req.status < 300) {
                try {
                    processWebDavResponse(req.responseXML);
                    hasWEBDAV = true;
                } catch (e) {
                }
            }
            if (hasWEBDAV) {
                getNextFileListWithWebDav();
            } else {
                todoList.push(url);
                doneList = [];
                getNextFileListWithIndexHtml();
            }
        };
        req.setRequestHeader('Depth', '1');
        req.send(null);

        doneList.push(url);
    }

    todoList.push(startdir);
    getNextFileListWithWebDav();
}
