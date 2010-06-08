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
  // stream should be positioned at the start of the CDS entry for the file
  stream.pos += 10;
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
jsodfkit.ZipEntry.prototype.load = function(stream) {
  stream.pos = this.offset + 26;
  var namelen = stream.readUInt16();
  var extralen = stream.readUInt16();
  stream.pos += namelen + extralen;
  if (this.compressionMethod) {
    var data = stream.data.substr(stream.pos, this.compressedSize);
    return RawDeflate.inflate(data);
  }
  return stream.data.substr(stream.pos, this.uncompressedSize);
}

jsodfkit.Zip = function(uri) {
  this.uri = uri;
  // TODO: ideally read the file entries on demand
  this.data = load_binary_resource(uri);
  this.stream = new a3d.ByteArray(this.data);
  // read central directory record
  // assume comment is size 0 for now
  var commentSize = 0;
  this.stream.pos = this.stream.length - 12 - commentSize;
  var nEntries = this.stream.readUInt16LE();
  var cdsSize = this.stream.readUInt32LE();
  var cdsOffset = this.stream.readUInt16LE();
  this.stream.pos = cdsOffset;
  this.entries = new Array();
  for (var i=0; i<nEntries; ++i) {
    this.entries[this.entries.length] = new jsodfkit.ZipEntry(this.stream);
  }
}

jsodfkit.Zip.prototype.load = function(entry) {
  for (var i in this.entries) {
    i = this.entries[i];
    if (i.filename == filename) {
      return i.load(this.stream);
    }
  }
  return null;
}

function load_binary_resource(url) {  
  // this only works in firefox and webkit ports like rekonq and arora, konqueror and opera do not load binary data
  var req = new XMLHttpRequest();  
  req.open('GET', url, false);  
  req.overrideMimeType('text/plain; charset=x-user-defined');  
  req.send(null);
  if (req.status != 200) {
    alert(req.status + " " + req.statusText);
    return '';
  }
  return req.responseText;  
}

