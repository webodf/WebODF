/*global exports*/
exports.createRuntime = function (window, XMLHttpRequest, logoutput) {
    var that = {};

    function log(msg) {
        var node, doc;
        if (logoutput) {
            doc = logoutput.ownerDocument;
            node = doc.createElement('span');
            node.appendChild(doc.createTextNode(msg + '\n'));
            logoutput.appendChild(node);
        }
    }
    function readFile(path, encoding, callback) {
        var xmlHttp = new XMLHttpRequest();
        function handleResult() {
            if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 0 && !xmlHttp.responseText) {
                    // for local files there is no difference between missing
                    // and empty files, so empty files are considered as errors
                    callback("File is empty.");
                } else if (xmlHttp.status === 200 || xmlHttp.status === 0) {
                    // report file
                    callback(undefined, xmlHttp.responseText);
                } else {
                    // report error
                    callback(xmlHttp.responseText);
                }
            }
        }

        xmlHttp.open('GET', path, true);
        if (encoding) {
            xmlHttp.overrideMimeType("text/plain; charset=" + encoding);
        } else {
            xmlHttp.overrideMimeType("text/plain; charset=x-user-defined");
        }
        xmlHttp.onreadystatechange = handleResult;
        try {
            xmlHttp.send(null);
        } catch (e) {
            callback(e.message);
        }
    }
    function loadXML(path, callback) {
        var xmlHttp = new XMLHttpRequest();
        function handleResult() {
            if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 0 && !xmlHttp.responseText) {
                    callback("File is empty.");
                } else if (xmlHttp.status === 200 || xmlHttp.status === 0) {
                    // report file
                    callback(xmlHttp.responseXML);
                } else {
                    // report error
                    callback(xmlHttp.responseText);
                }
            }
        }
        xmlHttp.open("GET", path, true);
        xmlHttp.overrideMimeType("text/xml");
        xmlHttp.onreadystatechange = handleResult;
        try {
            xmlHttp.send(null);
        } catch (e) {
            callback(e.message);
        }
    }
    function isFile() {
        log('isFile');
    }
    function setTimeout(msg) {
        log('setTimeout');
    }

    that.readFile = readFile;
    that.loadXML = loadXML;
    that.isFile = isFile;
    that.log = log;
    that.setTimeout = setTimeout;
    return that;
};
