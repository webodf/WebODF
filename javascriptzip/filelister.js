
/** asynchroneous function that lists all files **/
function listFiles(startdir, filepattern, fileCallback, doneCallback) {

  var todoList = [];

  var doneList = [];

  var dirpattern = /\/$/;

  function getNextFileListWithWebDav() {
    var url = todoList.shift();
    if (!url) {
      if (doneCallback) {
        doneCallback();
      }
      return;
    }

    var req = new XMLHttpRequest();
    req.open('PROPFIND', url, true);
    req.onreadystatechange = function(evt) {
      if (req.readyState != 4) return;
      if (req.status >= 200 && req.status < 300) {
        processWebDavResponse(req.responseXML);
      }
      getNextFileListWithWebDav();
    }
    req.setRequestHeader('Depth', '1');
    req.send(null);

    doneList.push(url);
  }

  function getNextFileListWithIndexHtml() {
    var url = todoList.shift();
    if (!url) {
      if (doneCallback) {
        doneCallback();
      }
      return;
    }

    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onreadystatechange = function(evt) {
      if (req.readyState != 4) return;
      if (req.status >= 200 && req.status < 300) {
        processIndexHtmlResponse(url, req.responseText);
      }
      getNextFileListWithIndexHtml();
    }
    req.send(null);

    doneList.push(url);
  }

  function processWebDavResponse(xml) {
    if (!xml) {
      throw new Error('No proper XML response.');
    }
    var refs = xml.getElementsByTagNameNS('DAV:', 'href');
    var directories = [];
    var files = [];
    for (var i in refs) {
      if (refs[i].firstChild) {
        var name = refs[i].firstChild.nodeValue;
        if (dirpattern.test(name)) {
          directories.push(name);
        } else if (filepattern.test(name)) {
          files.push(name);
        }
      }
    }
    for (var d in directories) {
      d = directories[d];
      if (doneList.indexOf(d) == -1 && todoList.indexOf(d) == -1) {
        todoList.push(d);
      }
    }
    fileCallback(directories, files);
  }

  function processIndexHtmlResponse(base, text) {
    // use regex because index.html is usually not valid xml
    var re = /href="([^\/\?"][^"]*)"/ig;
    var matches;
    var files = [];
    var directories = [];
    while ((matches = re.exec(text)) != null) {
      var name = matches[1];
      if (dirpattern.test(name)) {
        directories.push(base + name);
      } else if (filepattern.test(name)) {
        files.push(base + name);
      }
    }
    for (var d in directories) {
      d = directories[d];
      if (doneList.indexOf(d) == -1 && todoList.indexOf(d) == -1) {
        todoList.push(d);
      }
    }
    fileCallback(directories, files);
  }

  todoList.push(startdir);
//  getNextFileListWithWebDav();
  getNextFileListWithIndexHtml();
}

