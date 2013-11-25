/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
 *
 * As additional permission under GNU AGPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * As a special exception to the AGPL, any HTML file which merely makes function
 * calls to this code, and for that purpose includes it by reference shall be
 * deemed a separate work for copyright law purposes. In addition, the copyright
 * holders of this code give you permission to combine this code with free
 * software libraries that are released under the GNU LGPL. You may copy and
 * distribute such a system following the terms of the GNU AGPL for this code
 * and the LGPL for the libraries. If you modify this code, you may extend this
 * exception to your version of the code, but you are not obligated to do so.
 * If you do not wish to do so, delete this exception statement from your
 * version.
 *
 * This license applies to this entire compilation.
 * @licend
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
