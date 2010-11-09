/*global XMLHttpRequest document navigator a3d RawDeflate runtime core*/
/*jslint bitwise: false*/
/*
* @preserve
* OdfKit
* Copyright (c) 2010 Jos van den Oever 
* Licensed under the ... License:
*
* Project home: http://www.odfkit.org/
*/

runtime.loadClass("core.Base64");

/**
 * @constructor
 */
function Zip(url, entriesReadCallback) {
    var httpreqcount = 0,
        remotefilereader,
        entries, filesize, nEntries, callback,
        base64 = new core.Base64();
    
    /**
     * @constructor
     * @param {!string} url
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
    /**
     * @param {!number} offset
     * @param {!number} size
     * return {?string}
     */
    RemoteFile.prototype.get = function (offset, size) {
        for (var f in this.fragments) {
            if (this.fragments.hasOwnProperty(f)) {
                f = this.fragments[f];
                if (f.offset === offset && f.data.length === size) {
                    return f.data;
                }
                if (f.offset <= offset &&
                        offset + size <= f.offset + f.data.length) {
                    return f.data.slice(offset - f.offset, size);
                }
            }
        }
        return null;
    };
    /**
     * @param {!number} offset
     * @param {!string} data
     * @return {undefined}
     */
    RemoteFile.prototype.add = function (offset, data) {
        this.fragments.push({offset: offset, data: data});
    };
    /**
     * @param {!number} offset
     * @param {!number} size
     * @return {!Object}
     */
    RemoteFile.prototype.getOptimalRange = function (offset, size) {
        // TODO: calculate optimal range
        return {offset: offset, size: size};
    };
    /**
     * @constructor
     */
    function RemoteFileReader() {
        this.minimumRequestSize = 1024; // size for minimal range to ask for
        // object has a 
        this.req = new XMLHttpRequest();
        this.queue = [];
        this.currentJob = null;
        this.cache = {};
    }
    /**
     * return true if the RemoteFileReader is currently busy
     * @return {!boolean}
     */
    RemoteFileReader.prototype.busy = function () {
        return this.currentJob !== null;
    };
    /**
     * return the size for a file or -1 if the file size cannot be determined
     * if a callback is supplied, the call is asynchroneous
     * @param {!string} url
     * @param {?function(!number)} callback
     * @return {!number}
     */
    RemoteFileReader.prototype.getFileSize = function (url, callback) {
        var f = null,
            reader = this;
        if (callback) {
            f = function () {
                callback(reader.cache[url].size);
            };
        }
        this.getFileRange(url, 0, this.minimumRequestSize, f);
        if (callback) {
            return -1;
        }
        return this.cache[url].size;
    };
    /**
     * Read a range of data from a file. if the data cannot be read, null is
     * is returned. If a callback is supplied, the call is asynchroneous
     * @param {!string} url
     * @param {!number} offset
     * @param {!number} size
     * @param {?function(?string)} callback
     * @return {?string}
     */
    RemoteFileReader.prototype.getFileRange = function (url, offset, size, callback) {
        // check if this data is available already
        var remotefile = this.cache[url],
            data;
        if (remotefile) {
            data = remotefile.get(offset, size);
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
        this.queue.unshift({remotefile: remotefile, offset: offset, size: size,
            callback: callback});
        if (!this.busy()) {
            return this.doNextRequest();
        }
        // TODO: if call is synchroneous, wait for the the current request to finish
        // and then do the synchroneous call
        return null;
    };
    /**
     * @return {?string}
     */
    RemoteFileReader.prototype.callback = function () {
        /**
         * @param {!string} data
         * @return {?Array}
         */
        function cleanDataToArray(data) {
            if (data === null) {
                return null;
            }
            var length = data.length,
                d = new Array(length),
                i;
            for (i = 0; i < length; i += 1) {
                d[i] = data.charCodeAt(i) & 0xff;
            }
            return d;
        }
        /**
         * @param {!string} data
         * @return {!string}
         */
        function cleanData(data) {
            try {
                data = String.fromCharCode.apply(String, cleanDataToArray(data));
            } catch (e) {
                // ignore and return dirty data
            }
            return data;
        }
    
        if (this.req.readyState !== 4) {
            return null;
        }
        var data = null,
            job = this.currentJob,
            totallen;
        this.currentJob = null;
        if (this.req.status === 206 || this.req.status === 200) {
            // get the file size
            totallen = this.getFileLengthFromResponseHeader();
            if (totallen >= 0) {
                // clean up data, can be slow for big requests, perhaps use worker thread
                data = this.req.responseText;
                data = cleanData(data);
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
    };
    /**
     * @return {!number}
     */
    RemoteFileReader.prototype.getFileLengthFromResponseHeader = function () {
        var range = this.req.getResponseHeader('Content-Range'),
            length = -1;
        if (range && range.lastIndexOf('/') !== -1) {
            length = parseInt(range.substr(range.lastIndexOf('/') + 1), 10);
        }
        return (isNaN(length)) ? -1 : length;
    };
    /**
     * @return {?string}
     */
    RemoteFileReader.prototype.doNextRequest = function () {
        this.currentJob = this.queue.shift();
        if (!this.currentJob) {
            return null;
        }
        var job = this.currentJob,
            hascallback = job.callback !== null,
        // check if the data has been retrieved in the meantime
            data = job.remotefile.get(job.offset, job.size),
            range,
            reader;
        if (data && hascallback) {
            this.callback(); // job);
        }
        if (!data) {
            range = job.remotefile.getOptimalRange(job.offset, job.size);
            httpreqcount += 1;
            document.title = httpreqcount;
            this.req.open('GET', job.remotefile.url, hascallback);
            if (navigator.userAgent.indexOf("MSIE") === -1) {
                this.req.overrideMimeType('text/plain; charset=x-user-defined');
            }
            range = 'bytes=' + range.offset + '-' + (range.offset + range.size - 1);
            this.req.setRequestHeader('Range', range);
            if (hascallback) {
                reader = this;
                this.req.onreadystatechange = function (evt) {
                    reader.callback(job);
                };
            } else {
                this.req.onreadystatechange = null;
            }
            this.req.send(null);
        }
        if (!hascallback) {
            return this.callback(); //job);
        }
        return null;
    };
    
    /**
     * @constructor
     * @param {!string} url
     * @param {!a3d.ByteArray} stream
     */
    function ZipEntry(url, stream) {
        var sig = stream.readUInt32LE(),
            namelen, extralen, commentlen;
        if (sig !== 0x02014b50) {
            throw new Error(
                'Central directory entry has wrong signature at position ' +
                (stream.pos - 4) + ' for file "' + url + '": ' +
                stream.data.length);
        }
        // stream should be positioned at the start of the CDS entry for the file
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
     * @param {?function(!string)} callback
     * @return {?string}
     */
    ZipEntry.prototype.load = function (url, offset, size, callback) {
        // if data has already been downloaded, use that
        if (this.data) {
            if (callback) {
                callback(this.data);
                return null;
            } else {
                return this.data;
            }
        }
    
        var f = null,
            entry = this,
            data;
        if (callback) {
            f = function (data) {
                entry.handleEntryData(data, callback);
            };
        }
        data = remotefilereader.getFileRange(url, offset, size, f);
        if (callback) {
            return null;
        }
        return this.handleEntryData(data, null);
    };
    ZipEntry.prototype.handleEntryData = function (data, callback) {
        var stream = new a3d.ByteArray(data),
            sig = stream.readUInt32LE(),
            filenamelen, extralen, datasize;
        if (sig !== 0x04034b50) {
            throw new Error('File entry signature is wrong.' + sig + ' ' + data.length);
        }
        stream.pos += 22;
        filenamelen = stream.readUInt16LE();
        extralen = stream.readUInt16LE();
        stream.pos += filenamelen + extralen;
        datasize = (this.compressionMethod) ? this.compressedSize
                : this.uncompressedSize;
        if (this.compressionMethod) {
            this.data = stream.data.substr(stream.pos, this.compressedSize);
            this.data = RawDeflate.inflate(this.data);
            // assume the input data is utf8 for now if it starts with '<'
            // this can be done better, perhaps even with special encoding respecting
            // deflate functions
            if (this.data.length > 0 && this.data.length < 200000 &&
                    this.data[0] === '<') {
                this.data = base64.convertUTF8StringToUTF16String(this.data);
            }
        } else {
            this.data = stream.data.substr(stream.pos, this.uncompressedSize);
        }
        if (callback) {
            callback(this.data);
            return null;
        }
        return this.data;
    };
    /**
     * @param {!string} data
     * @param {?function()} callback
     * @return {undefined}
     */
    function handleCentralDirectory(data, callback) {
        // parse the central directory
        var stream = new a3d.ByteArray(data), i;
        entries = [];
        for (i = 0; i < nEntries; i += 1) {
            entries[entries.length] = new ZipEntry(url, stream);
        }
        if (callback) {
            callback();
        }
    }
    /**
     * @param {!string} data
     * @param {?function()} callback
     * @return {undefined}
     */
    function handleCentralDirectoryEnd(data, callback) {
        if (data.length !== 22) {
            throw "Central directory length should be 22.";
        }
        var stream = new a3d.ByteArray(data), sig, disk, cddisk, diskNEntries,
            cdsSize, cdsOffset, f, zip, cd;
        sig = stream.readUInt32LE();
        if (sig !== 0x06054b50) {
            throw new Error('Central directory signature is wrong.');
        }
        disk = stream.readUInt16LE();
        if (disk !== 0) {
            throw new Error('Zip files with non-zero disk numbers are not supported.');
        }
        cddisk = stream.readUInt16LE();
        if (cddisk !== 0) {
            throw new Error('Zip files with non-zero disk numbers are not supported.');
        }
        diskNEntries = stream.readUInt16LE();
        nEntries = stream.readUInt16LE();
        if (diskNEntries !== nEntries) {
            throw new Error('Number of entries is inconsistent.');
        }
        cdsSize = stream.readUInt32LE();
        cdsOffset = stream.readUInt16LE();
        cdsOffset = filesize - 22 - cdsSize;
    
        // for some reason cdsOffset is not always equal to offset calculated from the
        // central directory size. The latter is reliable.
        f = null;
        if (callback) {
            f = function (data) {
                handleCentralDirectory(data, callback);
            };
        }
        cd = remotefilereader.getFileRange(url, cdsOffset,
                filesize - cdsOffset, f);
        if (callback) {
            return;
        }
        handleCentralDirectory(cd, null);
    }
    /**
     * @param {?function()} callback
     * @return {undefined}
     */
    function readCentralDirectoryEnd(callback) {
        if (filesize <= 0) {
            throw "File '" + url + "' must be non-zero size, but has size " +
                    filesize + '.';
        }
        var f = null,
            end;
        if (callback) {
            f = function (data) {
                handleCentralDirectoryEnd(data, callback);
            };
        }
        end = remotefilereader.getFileRange(url, filesize - 22, 22, f);
        if (callback) {
            return;
        }
        handleCentralDirectoryEnd(end, null);
    }
    /**
     * @param {!string} filename
     * @param {?function(?string)} callback
     * @return {?string}
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
            return entry.load(url, entry.offset, end - entry.offset, callback);
        }
        if (callback) {
            callback(null);
        }
        return null;
    }

    remotefilereader = new RemoteFileReader();
    this.load = load;

    // determine the file size
    filesize = -1;
    callback = null;
    if (entriesReadCallback) {
        callback = function (size) {
            filesize = size;
            readCentralDirectoryEnd(entriesReadCallback);
        };
    }
    filesize = remotefilereader.getFileSize(url, callback);
    if (callback || filesize === -1) {
        return;
    }
    readCentralDirectoryEnd(null);
}
