/*
* @preserve
* OdfKit
* Copyright (c) 2010 Jos van den Oever 
* Licensed under the ... License:
*
* Project home: http://www.odfkit.org/
*/

function RemoteFile(url) {
  if (!url) {
    throw "Url must be provided.";
  }
  this.url = url;
  this.fragments = [];
  this.size = -1;
  this.valid = true;
}
RemoteFile.prototype.get = function(offset, size) {
  for (var f in this.fragments) {
    f = this.fragments[f];
    if (f.offset <= offset && offset + size <= f.offset + f.data.length) {
      return f.data.slice(offset-f.offset, size);
    }
  }
  return null;
}
RemoteFile.prototype.add = function(offset, data) {
  this.fragments.push({offset:offset, data:data});
}
RemoteFile.prototype.getOptimalRange = function(offset, size) {
  // TODO: calculate optimal range
  return {offset:offset, size:size};
}
function RemoteFileReader() {
  this.minimumRequestSize = 1024; // size for minimal range to ask for
  // object has a 
  this.req = new XMLHttpRequest();
  this.queue = [];
  this.currentJob = null;
  this.cache = {};
}
// return true if the RemoteFileReader is currently busy
RemoteFileReader.prototype.busy = function() {
  return this.currentJob != null;
}
// return the size for a file or -1 if the file size cannot be determined
// if a callback is supplied, the call is asynchroneous
RemoteFileReader.prototype.getFileSize = function(url, callback) {
   var f = null;
   if (callback) {
     var reader = this;
     f = function() {
       callback(reader.cache[url].size);
     };
   }
   this.getFileRange(url, 0, this.minimumRequestSize, f);
   if (callback) {
     return -1;
   }
   return this.cache[url].size;
}
// Read a range of data from a file. if the data cannot be read, null is
// is returned. If a callback is supplied, the call is asynchroneous
RemoteFileReader.prototype.getFileRange = function(url, offset, size, callback){
  // check if this data is available already
  var remotefile = this.cache[url];
  if (remotefile) {
    var data = remotefile.get(offset, size);
    if (data) {
      callback(data);
      return;
    }
  } else {
    remotefile = new RemoteFile(url);
    this.cache[url] = remotefile;
  }
  // add request at the front, perhaps back is better
  this.queue.unshift({remotefile:remotefile, offset:offset, size:size,
    callback:callback});
  if (!this.busy()) {
    return this.doNextRequest();
  }
  // TODO: if call is synchroneous, wait for the the current request to finish
  // and then do the synchroneous call
  return null;
}
RemoteFileReader.prototype.callback = function() {
  function cleanDataToArray(data) {
    var d = new Array(data.length);
    var length = data.length;
    for (var i=0; i<length; ++i) {
      d[i] = data.charCodeAt(i) & 0xff;
    }
    return d;
  }
  function cleanData(data) {
    return String.fromCharCode(cleanDataToArray(data));
  }

  if (this.req.readyState != 4) return null;
  var data = null;
  var job = this.currentJob;
  this.currentJob = null;
  if (this.req.status == 200) {
    // get the file size
    var totallen = this.getFileLengthFromResponseHeader();
    if (totallen >= 0) {
      // clean up data, can be slow for big requests, perhaps use worker thread
      data = cleanData(this.req.responseText);
      // store the full retrieved range in the remove file
      job.remotefile.add(job.offset, data);
      // get the requested range
      data = job.remotefile.get(job.offset, job.size);
      // store the file size
      job.remotefile.size = totallen;
    }
  } else {
    job.remotefile.valid = false;
  }
  if (job.callback) {
    job.callback(data);
  }
  return data;
}
RemoteFileReader.prototype.getFileLengthFromResponseHeader = function() {
    var range = this.req.getResponseHeader('Content-Range');
    var length = -1;
    if (range && range.lastIndexOf('/') != -1) {
      length = parseInt(range.substr(totallen.lastIndexOf('/')+1));
    }
    return (isNan(length)) ?-1 :length;
}
RemoteFileReader.prototype.doNextRequest = function() {
  this.currentJob = this.queue.shift();
  if (!this.currentJob) {
    return;
  }
  var job = this.currentJob;
  var range = job.remotefile.getOptimalRange(job.offset, job.size);
  var hascallback = job.callback != null;
  this.req.open('GET', job.remotefile.url, hascallback);
  this.req.overrideMimeType('text/plain; charset=x-user-defined');
  range = 'bytes=' + range.offset + '-' + (range.offset + range.size);
  this.req.setRequestHeader('Range', range);
  if (hascallback) {
    this.req.onreadystatechange = function(evt) {
      this.callback(job);
    };
  } else {
    this.req.onreadystatechange = null;
  }
  this.req.send(null);
  if (!hascallback) {
    return this.callback(job);
  }
  return null;
}
var remotefilereader = new RemoteFileReader();

function Zip(url, entriesReadCallback) {
  this.url = url;
  // determine the file size
  this.filesize = -1;
  var callback = null;
  if (entriesReadCallback) {
    var zip = this;
    callback = function(size) {
      zip.filesize = size;
      zip.readCentralDirectoryEnd(entriesReadCallback); 
    }
  }
  this.filesize = remotefilereader.getFileSize(url, callback);
  if (this.filesize == -1) {
    return;
  }
  this.readCentralDirectoryEnd();
}
Zip.prototype.readCentralDirectoryEnd = function(callback) {
}

/*
  get_file_range(url, 0, 1024, sizeKnownCallback);

  function get_file_range(url, offset, size, callback) {
    var req = new XMLHttpRequest();
    req.open('GET', url, callback);
    req.overrideMimeType('text/plain; charset=x-user-defined');
    var range = 'bytes='+offset+'-'+(offset+size);
    req.setRequestHeader('Range', range);
    if (callback) {
      req.onreadystatechange = function(evt) {
        if (req.readyState != 4) return;
      };
    }
    req.send(null);
    var data = req.responseText;
    if (size > data.length) {
      throw new Error('Got ' + data.length + ' bytes instead of ' + size + '.');
    } else if (size < data.length) {
      data = data.substr(0, size);
    }
    return data;
  }
*/
