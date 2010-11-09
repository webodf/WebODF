/*global runtime core*/
/*
* @preserve
* OdfKit
* Copyright (c) 2010 Jos van den Oever 
* Licensed under the ... License:
*
* Project home: http://www.odfkit.org/
*/

runtime.loadClass("core.Base64");
runtime.loadClass("core.RawInflate");
runtime.loadClass("core.ByteArray");

/**
 * @constructor
 * @param {!string} url path to zip file, should be readable by the runtime
 * @param {!function(?string, !core.Zip)} entriesReadCallback callback
 *        indicating the zip
 *        has loaded this list of entries, the arguments are a string that
 *        indicates error if present and the created object
 */
core.Zip = function Zip(url, entriesReadCallback) {
    var entries, filesize, nEntries,
        base64 = new core.Base64(),
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
            filenamelen, extralen, datasize;
        if (sig !== 0x04034b50) {
            callback('File entry signature is wrong.' + sig + ' ' +
                    data.length, null);
            return;
        }
        stream.pos += 22;
        filenamelen = stream.readUInt16LE();
        extralen = stream.readUInt16LE();
        stream.pos += filenamelen + extralen;
        datasize = (this.compressionMethod) ? this.compressedSize
                : this.uncompressedSize;
        if (this.compressionMethod) {
            this.data = stream.data.substr(stream.pos, this.compressedSize);
            this.data = inflate(this.data);
            // assume the input data is utf8 for now if it starts with '<'
            // this can be done better, perhaps even with special encoding
            // respecting deflate functions
            if (this.data.length > 0 && this.data.length < 200000 &&
                    this.data[0] === '<') {
                this.data = base64.convertUTF8StringToUTF16String(this.data);
            }
        } else {
            this.data = stream.data.substr(stream.pos, this.uncompressedSize);
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
            i;
        for (i in entries) {
            if (entries.hasOwnProperty(i)) {
                i = entries[i];
                if (entry) {
                    end = i.offset;
                    break;
                }
                if (i.filename === filename) {
                    entry = i;
                }
            }
        }
        if (entry) {
            entry.load(url, entry.offset, end - entry.offset, callback);
        }
    }

    this.load = load;

    // determine the file size
    filesize = -1;
    runtime.getFileSize(url, function (size) {
        filesize = size;
        if (filesize <= 0) {
            entriesReadCallback("File '" + url +
                    "' must be non-zero size, but has size " + filesize + '.',
                    zip);
        } else {
            runtime.read(url, filesize - 22, 22, function (err, data) {
                handleCentralDirectoryEnd(data, entriesReadCallback);
            });
        }
    });
};
