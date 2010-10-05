/*global XMLHttpRequest*/
/** asynchroneous function that lists all files **/
function listFiles(startdir, filepattern, fileCallback, doneCallback) {

    var todoList = [],
    doneList = [],
    dirpattern = /\/$/;

    function processWebDavResponse(xml) {
        if (!xml) {
            throw new Error('No proper XML response.');
        
        var refs = xml.getElementsByTagNameNS('DAV:', 'href'),
            directories = [],
            files = [],
            i, d, name;
        for (i in refs) {
            if (refs[i].firstChild) {
                name = refs[i].firstChild.nodeValue;
                if (dirpattern.test(name)) {
                    directories.push(name);
                } else if (filepattern.test(name)) {
                    files.push(name);
                }
            }
        }
        for (d in directories) {
            if (d) {
                d = directories[d];
                if (doneList.indexOf(d) === -1 && todoList.indexOf(d) === -1) {
                    todoList.push(d);
                }
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
            name, d;
        while ((matches = re.exec(text)) !== null) {
            name = matches[1];
            if (dirpattern.test(name)) {
                directories.push(base + name);
            } else if (filepattern.test(name)) {
                files.push(base + name);
            }
        }
        for (d in directories) {
            if (d) {
                d = directories[d];
                if (doneList.indexOf(d) === -1 && todoList.indexOf(d) === -1) {
                    todoList.push(d);
                }
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
//    getNextFileListWithWebDav();
    getNextFileListWithIndexHtml();
}

