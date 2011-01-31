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

    function crc32(str) {
        // Calculate the crc32 polynomial of a string  
        // 
        // version: 1009.2513
        // discuss at: http:\/\/phpjs.org\/functions\/crc32
        // +   original by: Webtoolkit.info (http:\/\/www.webtoolkit.info\/)
        // +   improved by: T0bsn
        // -    depends on: utf8_encode
        // *     example 1: crc32('Kevin van Zonneveld');
        // *     returns 1: 1249991249
        var table = [0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3, 0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91, 0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE, 0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7, 0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5, 0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B, 0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F, 0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924, 0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D, 0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433, 0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01, 0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457, 0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65, 0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2, 0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB, 0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9, 0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F, 0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683, 0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8, 0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1, 0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7, 0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5, 0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B, 0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79, 0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236, 0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F, 0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D, 0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713, 0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777, 0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C, 0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45, 0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB, 0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9, 0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF, 0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D],
            crc = 0, i, iTop,
            x = 0,
            y = 0;
    
        crc = crc ^ (-1);
        for (i = 0, iTop = str.length; i < iTop; i += 1) {
            y = (crc ^ str.charCodeAt(i)) & 0xFF;
            x = table[y];
            crc = (crc >>> 8) ^ x;
        }
        return crc ^ (-1);
    }

    /**
     * @param {!number} dostime
     * @return {!Date}
     */
    function dosTime2Date(dostime) {
        var year = ((dostime >> 25) & 0x7f) + 1980,
            month = ((dostime >> 21) & 0x0f) - 1,
            mday = (dostime >> 16) & 0x1f,
            hour = (dostime >> 11) & 0x0f,
            min = (dostime >> 5) & 0x3f,
            sec = (dostime & 0x1f) << 1,
            d = new Date(year, month, mday, hour, min, sec);
        return d;
    }
    /**
     * @param {!Date} date
     * @return {!number}
     */
    function date2DosTime(date) {
        var y = date.getFullYear();
        return y < 1980 ? 0 :
            ((y - 1980) << 25) | ((date.getMonth() + 1) << 21) |
            (date.getDate() << 16) | (date.getHours() << 11) |
            (date.getMinutes() << 5) | (date.getSeconds() >> 1);
    }
    /**
     * @constructor
     * @param {!string} url
     * @param {!core.ByteArray} stream
     */
    function ZipEntry(url, stream) {
        var sig = stream.readUInt32LE(),
            namelen, extralen, commentlen,
            compressionMethod,
            compressedSize,
            uncompressedSize,
            offset, crc,
            entry = this;

        function handleEntryData(data, callback) {
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
            if (compressionMethod) {
                data = stream.data.substr(stream.pos, compressedSize);
                if (compressedSize !== data.length) {
                    callback("The amount of compressed bytes read was " +
                        data.length + " instead of " + compressedSize +
                        " for " + entry.filename + " in " + url + ".");
                    return;
                }
                data = inflate(data);
            } else {
                data = stream.data.substr(stream.pos, uncompressedSize);
            }
            if (uncompressedSize !== data.length) {
                callback("The amount of bytes read was " + data.length +
                        " instead of " + uncompressedSize + " for " +
                        entry.filename + " in " + url + ".");
                return;
            }
/*
 * This check is disabled for performance reasons
            if (crc !== crc32(data)) {
                runtime.log("Warning: CRC32 for " + entry.filename +
                    " is wrong.");
            }
*/
            entry.data = data;
            callback(null, data);
        }
        /**
         * @param {!function(?string, ?string)} callback with err and data
         * @return {undefined}
         */
        function load(callback) {
            // if data has already been downloaded, use that
            if (entry.data !== undefined) {
                callback(null, entry.data);
                return;
            }
            // the 256 at the end is security for when local extra field is
            // larger
            var size = compressedSize + 34 + namelen + extralen + 256;
            runtime.read(url, offset, size, function (err, data) {
                if (err) {
                    callback(err, data);
                } else {
                    handleEntryData(data, callback);
                }
            });
        }
        this.load = load;
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
        compressionMethod = stream.readUInt16LE();
        this.date = dosTime2Date(stream.readUInt32LE());
        crc = stream.readUInt32LE();
        compressedSize = stream.readUInt32LE();
        uncompressedSize = stream.readUInt32LE();
        namelen = stream.readUInt16LE();
        extralen = stream.readUInt16LE();
        commentlen = stream.readUInt16LE();
        stream.pos += 8;
        offset = stream.readUInt32LE();
        this.filename = stream.data.substr(stream.pos, namelen);
        stream.pos += namelen + extralen + commentlen;
    }
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
            callback('Central directory signature is wrong: ' + sig, zip);
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
            if (e.filename === filename) {
                entry = e;
                break;
            }
        }
        if (entry) {
            if (entry.data) {
                callback(null, entry.data);
            } else {
                entry.load(callback);
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
     * @param {!Date} date
     * @return {undefined}
     */
    function save(filename, data, compressed, date) {
        var e = { filename: filename, data: data, compressed: compressed,
                  date: date },
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
            String.fromCharCode((value>>8) & 0xff) +
            String.fromCharCode((value>>16) & 0xff) +
            String.fromCharCode((value>>24) & 0xff);
    }
    function uint16LE(value) {
        return String.fromCharCode(value & 0xff) +
            String.fromCharCode((value>>8) & 0xff);
    }
    /**
     * @param {!ZipEntry} entry
     * @return {!string}
     */
    function writeEntry(entry) {
        // each entry is currently stored uncompressed
        var data = "PK\x03\x04\x0a\x00\x00\x00\x00\x00";
        data += uint32LE(date2DosTime(entry.date));
        data += uint32LE(crc32(entry.data));
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
        data += uint32LE(date2DosTime(entry.date));
        data += uint32LE(crc32(entry.data));
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
        var data = "", i, e, codoffset, codsize,
            offsets = [0];
        // write entries
        for (i = 0; i < entries.length; i += 1) {
            data += writeEntry(entries[i]);
            offsets.push(data.length);
        }
        // write central directory
        codoffset = data.length;
        for (i = 0; i < entries.length; i += 1) {
            e = entries[i];
            data += writeCODEntry(e, offsets[i]);
        }
        codsize = data.length - codoffset;
        data += "PK\x05\x06\x00\x00\x00\x00";
        data += uint16LE(entries.length);
        data += uint16LE(entries.length);
        data += uint32LE(codsize);
        data += uint32LE(codoffset);
        data += "\x00\x00";
        runtime.writeFile(url, data, "binary", callback);
    }

    this.load = load;
    this.save = save;
    this.write = write;
    this.getEntries = function () {
        return entries.slice();
    };

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
