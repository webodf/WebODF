/*global runtime core*/
/*jslint bitwise: false*/
/*
* @preserve
* OdfKit
* Copyright (c) 2010 Jos van den Oever 
* Licensed under the ... License:
*
* Project home: http://www.odfkit.org/
*/

runtime.loadClass("core.RawInflate");
runtime.loadClass("core.ByteArray");

/**
 * @constructor
 * @param {!string} url path to zip file, should be readable by the runtime
 * @param {?function(?string, !core.Zip):undefined} entriesReadCallback callback
 *        indicating the zip
 *        has loaded this list of entries, the arguments are a string that
 *        indicates error if present and the created object
 */
core.Zip = function Zip(url, entriesReadCallback) {
    var entries, filesize, nEntries,
        inflate = new core.RawInflate().inflate,
        zip = this;
 
    /**
     * @constructor
     * @param {!string} url
     * @param {!core.ByteArray} stream
     */
    function ZipEntry(url, stream) {
        var sig = stream.readUInt32LE(),
            namelen, extralen, commentlen;
        /**
         * @type {?string}
         */
        this.error = null;
        if (sig !== 0x02014b50) {
            this.error =
                "Central directory entry has wrong signature at position " +
                (stream.pos - 4) + ' for file "' + url + '": ' +
                stream.data.length;
            return;
        }
        // stream should be positioned at the start of the CDS entry for the
        // file
        stream.pos += 6;
        this.compressionMethod = stream.readUInt16LE();
        stream.pos += 8;
        this.compressedSize = stream.readUInt32LE();
        this.uncompressedSize = stream.readUInt32LE();
        namelen = stream.readUInt16LE();
        extralen = stream.readUInt16LE();
        commentlen = stream.readUInt16LE();
        stream.pos += 8;
        this.offset = stream.readUInt32LE();
        this.filename = stream.data.substr(stream.pos, namelen);
        stream.pos += namelen + extralen + commentlen;
    }
    /**
     * @param {!string} url
     * @param {!number} offset
     * @param {!number} size
     * @param {!function(?string, ?string)} callback with err and data
     * @return {undefined}
     */
    ZipEntry.prototype.load = function (url, offset, size, callback) {
        // if data has already been downloaded, use that
        if (this.data) {
            callback(null, this.data);
        }
    
        var entry = this;
        runtime.read(url, offset, size, function (err, data) {
            if (err) {
                callback(err, data);
            } else {
                entry.handleEntryData(data, callback);
            }
        });
    };
    ZipEntry.prototype.handleEntryData = function (data, callback) {
        var stream = new core.ByteArray(data),
            sig = stream.readUInt32LE(),
            filenamelen, extralen;
        if (sig !== 0x04034b50) {
            callback('File entry signature is wrong.' + sig + ' ' +
                    data.length, null);
            return;
        }
        stream.pos += 22;
        filenamelen = stream.readUInt16LE();
        extralen = stream.readUInt16LE();
        stream.pos += filenamelen + extralen;
        if (this.compressionMethod) {
            this.data = stream.data.substr(stream.pos, this.compressedSize);
            this.data = inflate(this.data);
        } else {
            this.data = stream.data.substr(stream.pos, this.uncompressedSize);
        }
        if (this.uncompressedSize !== this.data.length) {
            callback("The amount of bytes read was " + this.data.length +
                    " instead of " + this.uncompressedSize);
            return;
        }
        callback(null, this.data);
    };
    /**
     * @param {!string} data
     * @param {!function(?string, !core.Zip)} callback
     * @return {undefined}
     */
    function handleCentralDirectory(data, callback) {
        // parse the central directory
        var stream = new core.ByteArray(data), i, e;
        entries = [];
        for (i = 0; i < nEntries; i += 1) {
            e = new ZipEntry(url, stream);
            if (e.error) {
                callback(e.error, zip);
                return;
            }
            entries[entries.length] = e;
        }
        // report that entries are listed and no error occured
        callback(null, zip);
    }
    /**
     * @param {!string} data
     * @param {!function(?string, !core.Zip)} callback
     * @return {undefined}
     */
    function handleCentralDirectoryEnd(data, callback) {
        if (data.length !== 22) {
            callback("Central directory length should be 22.", zip);
            return;
        }
        var stream = new core.ByteArray(data), sig, disk, cddisk, diskNEntries,
            cdsSize, cdsOffset;
        sig = stream.readUInt32LE();
        if (sig !== 0x06054b50) {
            callback('Central directory signature is wrong.', zip);
            return;
        }
        disk = stream.readUInt16LE();
        if (disk !== 0) {
            callback('Zip files with non-zero disk numbers are not supported.',
                    zip);
            return;
        }
        cddisk = stream.readUInt16LE();
        if (cddisk !== 0) {
            callback('Zip files with non-zero disk numbers are not supported.',
                    zip);
            return;
        }
        diskNEntries = stream.readUInt16LE();
        nEntries = stream.readUInt16LE();
        if (diskNEntries !== nEntries) {
            callback('Number of entries is inconsistent.', zip);
            return;
        }
        cdsSize = stream.readUInt32LE();
        cdsOffset = stream.readUInt16LE();
        cdsOffset = filesize - 22 - cdsSize;
    
        // for some reason cdsOffset is not always equal to offset calculated
        // from the central directory size. The latter is reliable.
        runtime.read(url, cdsOffset, filesize - cdsOffset,
                function (err, data) {
            handleCentralDirectory(data, callback);
        });
    }
    /**
     * @param {!string} filename
     * @param {!function(?string, ?string)} callback receiving err and data
     * @return {undefined}
     */
    function load(filename, callback) {
        var entry = null,
            end = filesize,
            e, i;
        for (i = 0; i < entries.length; i += 1) {
            e = entries[i];
            if (entry) {
                end = e.offset;
                break;
            }
            if (e.filename === filename) {
                entry = e;
            }
        }
        if (entry) {
            if (entry.data) {
                callback(null, entry.data);
            } else {
                entry.load(url, entry.offset, end - entry.offset, callback);
            }
        } else {
            callback(filename + " not found.", null);
        }
    }
    /**
     * Add or replace an entry to the zip file.
     * This data is not stored to disk yet, and therefore, no callback is
     * necessary.
     * @param {!string} filename
     * @param {!string} data
     * @param {!boolean} compressed
     * @return {undefined}
     */
    function save(filename, data, compressed) {
        var e = { filename: filename, data: data, compressed: compressed },
            i, olde;
        for (i = 0; i < entries.length; i += 1) {
            olde = entries[i];
            if (olde.filename === filename) {
                entries[i] = e;
                return;
            }
        }
        entries.push(e);
    }
    function uint32LE(value) {
        return String.fromCharCode(value & 0xff) +
            String.fromCharCode((value<<8) & 0xff) +
            String.fromCharCode((value<<16) & 0xff) +
            String.fromCharCode((value<<24) & 0xff);
    }
    function uint16LE(value) {
        return String.fromCharCode(value & 0xff) +
            String.fromCharCode((value<<8) & 0xff);
    }
    /**
     * @param {!ZipEntry} entry
     * @return {!string}
     */
    function writeEntry(entry) {
        // each entry is currently stored uncompressed
        var data = "PK\x03\x04\x0a\x00\x00\x00\x00\x00";
        // mtime = mdate = 0 for now
        data += "\x00\x00\x00\x00";
        // crc = 0 for now
        data += "^\xc62\x0c";
        //data += "\x00\x00\x00\x00";
        data += uint32LE(entry.data.length); // compressedSize
        data += uint32LE(entry.data.length); // uncompressedSize
        data += uint16LE(entry.filename.length); // namelen
        data += uint16LE(0); // extralen
        data += entry.filename;
        data += entry.data;
        return data;
    }
    /**
     * @param {!ZipEntry} entry
     * @param {!number} offset
     * @return {!string}
     */
    function writeCODEntry(entry, offset) {
        // each entry is currently stored uncompressed
        var data = "PK\x01\x02\x1e\x03\x0a\x00\x00\x00\x00\x00";
        // mtime = mdate = 0 for now
        data += "\x00\x00\x00\x00";
        // crc = 0 for now
        data += "^\xc62\x0c";
        //data += "\x00\x00\x00\x00";
        data += uint32LE(entry.data.length); // compressedSize
        data += uint32LE(entry.data.length); // uncompressedSize
        data += uint16LE(entry.filename.length); // namelen
        // extralen, commalen, diskno, file attributes
        data += "\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00";
        data += uint32LE(offset);
        data += entry.filename;
        return data;
    }
    /**
     * Write the zipfile to the given path.
     * @param {!function(?string):undefined} callback receiving possible err
     * @return {undefined}
     */
    function write(callback) {
        var data = "", i, e, codoffset, offset = 0, codsize;
        // write entries
        for (i = 0; i < entries.length; i += 1) {
            data += writeEntry(entries[i]);
        }
        // write central directory
        codoffset = data.length;
        for (i = 0; i < entries.length; i += 1) {
            e = entries[i];
            data += writeCODEntry(e, offset);
            offset += e.filename.length + e.data.length + 34;
        }
        codsize = data.length - codoffset;
        data += "PK\x05\x06\x00\x00\x00\x00";
        data += uint16LE(entries.length);
        data += uint16LE(entries.length);
        data += uint32LE(codsize);
        data += uint32LE(codoffset);
        data += "\x00\x00";
        runtime.writeFile(url, data, null, callback);
    }

    this.load = load;
    this.save = save;
    this.write = write;

    // determine the file size
    filesize = -1;
    // if no callback is defined, this is a new file
    if (entriesReadCallback === null) {
        entries = [];
        return;
    }
    runtime.getFileSize(url, function (size) {
        filesize = size;
        if (filesize < 0) {
            entriesReadCallback("File '" + url + "' cannot be read.", zip);
        } else {
            runtime.read(url, filesize - 22, 22, function (err, data) {
                // todo: refactor entire zip class
                if (err || entriesReadCallback === null) {
                    entriesReadCallback(err, zip);
                } else {
                    handleCentralDirectoryEnd(data, entriesReadCallback);
                }
            });
        }
    });
};
