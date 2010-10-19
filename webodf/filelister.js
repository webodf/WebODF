/*global XMLHttpRequest*/
/** asynchroneous function that lists all files **/
function listFiles(startdir, filepattern, fileCallback, doneCallback) {

    var todoList = [],
    doneList = [],
    dirpattern = /\/$/;

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
            i, d, href;
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
                processWebDavResponse(req.responseXML);
            }
            getNextFileListWithWebDav();
        };
        req.setRequestHeader('Depth', '1');
        req.send(null);

        doneList.push(url);
    }

    function processIndexHtmlResponse(base, text) {
        // use regex because index.html is usually not valid xml
        var re = /href="([^\/\?"][^"]*)"/ig,
            matches,
            files = [],
            directories = [],
            name, d, i;
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

    todoList.push(startdir);
    getNextFileListWithWebDav();
//    getNextFileListWithIndexHtml();
}

