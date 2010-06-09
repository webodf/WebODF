/**
* @preserve
* OdfKit
* Copyright (c) 2010 Jos van den Oever 
* Licensed under the ... License:
*
* Project home: http://www.odfkit.org/
*/

if (typeof(jsodfkit) == 'undefined') {
	/** @namespace */ jsodfkit = {};
}
jsodfkit.ZipEntry = function(stream) {
  var sig = stream.readUInt32LE();
  if (sig != 0x02014b50) {
    throw new Error('Central directory entry has wrong signature at position '
      + (stream.pos - 4) + '.' + sig);
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
  this.offset = stream.readUInt32LE() + 30 + namelen + extralen;
  this.filename = stream.data.substr(stream.pos, namelen);
  stream.pos += namelen + extralen + commentlen;
}
jsodfkit.ZipEntry.prototype.load = function(uri) {
  if (this.data) return this.data;
  var datasize = (this.compressionMethod) ? this.compressedSize : this.uncompressedSize;
  this.data = get_file_range(uri, this.offset, datasize);
  var stream = new a3d.ByteArray(this.data);
  if (this.compressionMethod) {
    this.data = stream.data.substr(stream.pos, this.compressedSize);
    this.data = RawDeflate.inflate(this.data);
  } else {
    this.data = stream.data.substr(stream.pos, this.uncompressedSize);
  }
  return this.data;
}

jsodfkit.Zip = function(uri) {
  this.uri = uri;

  var size = get_file_size(uri);

  // assume comment is size 0 for now
  var end_of_central_directory = get_file_range(uri, size-22, 22);

  var stream = new a3d.ByteArray(end_of_central_directory);
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
  var nEntries = stream.readUInt16LE();
  if (diskNEntries != nEntries) {
    throw new Error('Number of entries is inconsistent.');
  }
  var cdsSize = stream.readUInt32LE();
  var cdsOffset = stream.readUInt16LE();
  var offset = size - 22 - cdsSize;
  // for some reason cdsOffset is not always equal to offset calculated from the
  // central directory size. The latter is reliable.

  // read the central directory
  var central_directory = get_file_range(uri, offset, size-offset);
  stream = new a3d.ByteArray(central_directory);
  this.entries = new Array();
  for (var i=0; i<nEntries; ++i) {
    this.entries[this.entries.length] = new jsodfkit.ZipEntry(stream);
  }
}

jsodfkit.Zip.prototype.load = function(entry) {
  for (var i in this.entries) {
    i = this.entries[i];
    if (i.filename == filename) {
      return i.load(this.uri);
    }
  }
  return null;
}

function save_file(url, data) {
  var req = new XMLHttpRequest();
  req.open('PUT', url, false);
  req.setRequestHeader("Content-Length", data.length);
  req.overrideMimeType('text/plain; charset=x-user-defined');  
  var z = "";
  for (var i in req) {
    z += i + ' ';
  }
  alert(z);
  var cleanstring = "";
  for (var i in data) {
    cleanstring += String.fromCharCode(data[i] & 0xff);// & 0xff;
  }
  if (req.sendAsBinary) {
    req.sendAsBinary(data);
  } else {
    req.send(data);//cleanstring);
  }
  alert(cleanstring + ' ' + data);
  alert(req.status + ' ' + url);
}

function get_file_size(url) {
  var req = new XMLHttpRequest();
  req.open('HEAD', url, false);
  req.send(null);
  return req.getResponseHeader("Content-Length");
}

function get_file_range(url, offset, size) {
  var req = new XMLHttpRequest();
  req.open('GET', url, false);
  req.overrideMimeType('text/plain; charset=x-user-defined');  
  var range = 'bytes='+offset+'-'+(offset+size);
  req.setRequestHeader('Range', range);
  req.send(null);
  var data = req.responseText;
  if (size > data.length) {
    throw new Error('Got ' + data.length + ' bytes instead of ' + size + '.');
  } else if (size < data.length) {
    data = data.substr(0, size);
  }
  //save_file("yoyo", data);
  return data;
}
