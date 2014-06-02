/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global runtime, core, Uint8Array, ArrayBuffer*/
/*jslint bitwise: true */

/**
 * @constructor
 * @param {!string} encoding
 */
core.ByteArrayWriter = function ByteArrayWriter(encoding) {
    "use strict";
    var self = this,
        /**@type{!number}*/
        length = 0,
        /**@type{!number}*/
        bufferSize = 1024,
        /**@type{!Uint8Array}*/
        data = new Uint8Array(new ArrayBuffer(bufferSize));

    /**
     * @param {!number} extraLength
     * @return {undefined}
     */
    function expand(extraLength) {
        var newData;
        if (extraLength > bufferSize - length) {
            bufferSize = Math.max(2 * bufferSize, length + extraLength);
            newData = new Uint8Array(new ArrayBuffer(bufferSize));
            newData.set(data);
            data = newData;
        }
    }
    /**
     * @param {!core.ByteArrayWriter} writer
     * @return {undefined}
     */
    this.appendByteArrayWriter = function (writer) {
        self.appendByteArray(writer.getByteArray());
    };
    /**
     * @param {!Uint8Array} array
     * @return {undefined}
     */
    this.appendByteArray = function (array) {
        var l = array.length;
        expand(l);
        data.set(array, length);
        length += l;
    };
    /**
     * @param {!Array.<!number>} array
     * @return {undefined}
     */
    this.appendArray = function (array) {
        var l = array.length;
        expand(l);
        data.set(array, length);
        length += l;
    };
    /**
     * @param {!number} value
     * @return {undefined}
     */
    this.appendUInt16LE = function (value) {
        self.appendArray([value & 0xff, (value >> 8) & 0xff]);
    };
    /**
     * @param {!number} value
     * @return {undefined}
     */
    this.appendUInt32LE = function (value) {
        self.appendArray([value & 0xff, (value >> 8) & 0xff,
                (value >> 16) & 0xff, (value >> 24) & 0xff]);
    };
    /**
     * @param {!string} string
     * @return {undefined}
     */
    this.appendString = function (string) {
        self.appendByteArray(runtime.byteArrayFromString(string, encoding));
    };
    /**
     * @return {!number}
     */
    this.getLength = function () {
        return length;
    };
    /**
     * @return {!Uint8Array}
     */
    this.getByteArray = function () {
        var a = new Uint8Array(new ArrayBuffer(length));
        a.set(data.subarray(0, length));
        return a;
    };
};
