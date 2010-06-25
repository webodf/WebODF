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
    if (f.offset == offset && f.data.length == size) {
      return f.data;
    }
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
      if (callback) {
        callback(data);
        return null;
      } else {
        return data;
      }
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
    return String.fromCharCode.apply(String, cleanDataToArray(data));
  }

  if (this.req.readyState != 4) return null;
  var data = null;
  var job = this.currentJob;
  this.currentJob = null;
  if (this.req.status == 206 || this.req.status == 200) {
    var sum = 0;
    for (var i in this.req.responseText) {
      sum += this.req.responseText.charCodeAt(i) & 0xff;
    }
    // get the file size
    var totallen = this.getFileLengthFromResponseHeader();
    if (totallen >= 0) {
      // clean up data, can be slow for big requests, perhaps use worker thread
      data = this.req.responseText;
      if (data.length < 200000) {
        data = cleanData(data);
      }
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
  if (this.queue.length && !this.busy()) {
    this.doNextRequest();
  }
  return data;
}
RemoteFileReader.prototype.getFileLengthFromResponseHeader = function() {
    var range = this.req.getResponseHeader('Content-Range');
    var length = -1;
    if (range && range.lastIndexOf('/') != -1) {
      length = parseInt(range.substr(range.lastIndexOf('/')+1));
    }
    return (isNaN(length)) ?-1 :length;
}
var httpreqcount = 0;
RemoteFileReader.prototype.doNextRequest = function() {
  this.currentJob = this.queue.shift();
  if (!this.currentJob) {
    return;
  }
  var job = this.currentJob;
  var range = job.remotefile.getOptimalRange(job.offset, job.size);
  var hascallback = job.callback != null;
  document.title = ++httpreqcount;
  this.req.open('GET', job.remotefile.url, hascallback);
  if (navigator.userAgent.indexOf("MSIE") == -1) {
    this.req.overrideMimeType('text/plain; charset=x-user-defined');
  }
  range = 'bytes=' + range.offset + '-' + (range.offset + range.size - 1);
  this.req.setRequestHeader('Range', range);
  if (hascallback) {
    var reader = this;
    this.req.onreadystatechange = function(evt) {
      reader.callback(job);
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

ZipEntry = function(url, stream) {
  var sig = stream.readUInt32LE();
  if (sig != 0x02014b50) {
    throw new Error('Central directory entry has wrong signature at position '
      + (stream.pos - 4) + ' for file "' + url + '": '+stream.data.length);
  }
  // stream should be positioned at the start of the CDS entry for the file
  stream.pos += 6;
  this.compressionMethod = stream.readUInt16LE();
  stream.pos += 8;
  this.compressedSize = stream.readUInt32LE();
  this.uncompressedSize = stream.readUInt32LE();
  var namelen = stream.readUInt16();
  var extralen = stream.readUInt16();
  var commentlen = stream.readUInt16();
  stream.pos += 8;
  this.offset = stream.readUInt32LE();
  this.filename = stream.data.substr(stream.pos, namelen);
  stream.pos += namelen + extralen + commentlen;
}
ZipEntry.prototype.load = function(url, offset, size, callback) {
  // if data has already been downloaded, use that
  if (this.data) {
    if (callback) {
      callback(this.data);
      return;
    } else {
      return this.data;
    }
  }

  var f = null;
  if (callback) {
    var entry = this;
    f = function(data) {
      entry.handleEntryData(data, callback);
    };
  }
  var data = remotefilereader.getFileRange(url, offset, size, f);
  if (callback) {
    return null;
  }
  return this.handleEntryData(data);
}
ZipEntry.prototype.handleEntryData = function(data, callback) {
  var stream = new a3d.ByteArray(data);
  var sig = stream.readUInt32LE();
  if (sig != 0x04034b50) {
    throw new Error('File entry signature is wrong.' + sig + ' ' + data.length);
  }
  stream.pos += 22;
  var filenamelen = stream.readUInt16LE();
  var extralen = stream.readUInt16LE();
  stream.pos += filenamelen + extralen;
  var datasize = (this.compressionMethod)
      ? this.compressedSize : this.uncompressedSize;
  if (this.compressionMethod) {
    this.data = stream.data.substr(stream.pos, this.compressedSize);
    this.data = RawDeflate.inflate(this.data);
    // assume the input data is utf8 for now if it starts with '<'
    // this can be done better, perhaps even with special encoding respecting
    // deflate functions
    if (this.data.length > 0 && this.data.length < 200000
            && this.data[0] == '<') {
      this.data = window.Base64.convertUTF8StringToUTF16String(this.data);
    }
  } else {
    this.data = stream.data.substr(stream.pos, this.uncompressedSize);
  }
  if (callback) {
    callback(this.data);
    return null;
  }
  return this.data;
}
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
  if (this.filesize <= 0) {
    throw "File '" + this.url + "' must be non-zero size, but has size " + this.filesize + '.';
  }
  var f = null;
  if (callback) {
    var zip = this;
    f = function(data) {
      zip.handleCentralDirectoryEnd(data, callback);
    };
  }
  var end = remotefilereader.getFileRange(this.url, this.filesize-22, 22, f);
  if (callback) {
    return;
  }
  this.handleCentralDirectoryEnd(end);
}
Zip.prototype.handleCentralDirectoryEnd = function(data, callback) {
  if (data.length != 22) {
    throw "Central directory length should be 22.";
  }
  var stream = new a3d.ByteArray(data);
  var sig = stream.readUInt32LE();
  if (sig != 0x06054b50) {
    throw new Error('Central directory signature is wrong.');
  }
  var disk = stream.readUInt16LE();
  if (disk != 0) {
    throw new Error('Zip files with non-zero disk numbers are not supported.');
  }
  var cddisk = stream.readUInt16LE();
  if (cddisk != 0) {
    throw new Error('Zip files with non-zero disk numbers are not supported.');
  }
  var diskNEntries = stream.readUInt16LE();
  this.nEntries = stream.readUInt16LE();
  if (diskNEntries != this.nEntries) {
    throw new Error('Number of entries is inconsistent.');
  }
  var cdsSize = stream.readUInt32LE();
  var cdsOffset = stream.readUInt16LE();
  this.cdsOffset = this.filesize - 22 - cdsSize;

  // for some reason cdsOffset is not always equal to offset calculated from the
  // central directory size. The latter is reliable.
  var f = null;
  if (callback) {
    var zip = this;
    f = function(data) {
      zip.handleCentralDirectory(data, callback);
    };
  }
  var cd = remotefilereader.getFileRange(this.url, this.cdsOffset,
      this.filesize - this.cdsOffset, f);
  if (callback) {
    return;
  }
  this.handleCentralDirectory(cd);
}
Zip.prototype.handleCentralDirectory = function(data, callback) {
  // parse the central directory
  var stream = new a3d.ByteArray(data);
  this.entries = [];
  for (var i=0; i<this.nEntries; ++i) {
    this.entries[this.entries.length] = new ZipEntry(this.url, stream);
  }
  if (callback) {
    callback(this);
  }
}
Zip.prototype.load = function(filename, callback) {
  var entry = null;
  var end = this.filesize;
  for (var i in this.entries) {
    i = this.entries[i];
    if (entry) {
      end = i.offset;
      break;
    }
    if (i.filename == filename) {
      entry = i;
    }
  }
  if (entry) {
    return entry.load(this.url, entry.offset, end-entry.offset, callback);
  }
  if (callback) {
    callback(null);
  }
  return null;
}
