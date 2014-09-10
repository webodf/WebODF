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

/*global core, runtime, ArrayBuffer, Uint8Array*/
/*jslint bitwise: true, regexp: true, plusplus: true*/

/*
 * $Id: base64.js,v 0.9 2009/03/01 20:51:18 dankogai Exp dankogai $
 */
/**
 * @return {function(new:core.Base64):?}
 */
function makeBase64() {
    "use strict";
    /**
     * @param {!string} bin
     * @return {!Object.<!string,!number>}
     */
    function makeB64tab(bin) {
        var /**@type{!Object.<!string,!number>}*/
            t = {},
            i, l;
        for (i = 0, l = bin.length; i < l; i += 1) {
            t[bin.charAt(i)] = i;
        }
        return t;
    }
    var /**@const@type{!string}*/
        b64chars
        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
        /**@const@type{!Object.<!string,!number>}*/
        b64tab = makeB64tab(b64chars),
        /**@type{!function(!string):!string}*/
        convertUTF16StringToBase64,
        /**@type{!function(!string):!string}*/
        convertBase64ToUTF16String,
        /**@type{?Window}*/
        window = runtime.getWindow(),
        /**@type{!function(!string):!string}*/
        btoa,
        /**@type{!function(!string):!string}*/
        atob;

    /**
     * @param {!string} s
     * @return {!Uint8Array}
     */
    function stringToArray(s) {
        var i,
            l = s.length,
            a = new Uint8Array(new ArrayBuffer(l));
        for (i = 0; i < l; i += 1) {
            a[i] = s.charCodeAt(i) & 0xff;
        }
        return a;
    }

    /**
     * @param {!Uint8Array} bin
     * @return {!string}
     */
    function convertUTF8ArrayToBase64(bin) {
        var /**@type{!number}*/
            n,
            /**@type{!string}*/
            b64 = "",
            i,
            l = bin.length - 2;
        for (i = 0; i < l; i += 3) {
            n = (bin[i] << 16) | (bin[i + 1] << 8) | bin[i + 2];
            b64 += /**@type{!string}*/(b64chars[n >>> 18]);
            b64 += /**@type{!string}*/(b64chars[(n >>> 12) & 63]);
            b64 += /**@type{!string}*/(b64chars[(n >>>  6) & 63]);
            b64 += /**@type{!string}*/(b64chars[n          & 63]);
        }
        if (i === l + 1) { // 1 byte left
            n = bin[i] << 4;
            b64 += /**@type{!string}*/(b64chars[n >>> 6]);
            b64 += /**@type{!string}*/(b64chars[n & 63]);
            b64 += "==";
        } else if (i === l) { // 2 bytes left
            n = (bin[i] << 10) | (bin[i + 1] << 2);
            b64 += /**@type{!string}*/(b64chars[n >>> 12]);
            b64 += /**@type{!string}*/(b64chars[(n >>> 6) & 63]);
            b64 += /**@type{!string}*/(b64chars[n & 63]);
            b64 += "=";
        }
        return b64;
    }
    /**
     * @param {!string} b64
     * @return {!Uint8Array}
     */
    function convertBase64ToUTF8Array(b64) {
        b64 = b64.replace(/[^A-Za-z0-9+\/]+/g, '');
        var l = b64.length,
            bin = new Uint8Array(new ArrayBuffer(3 * l)),
            padlen = b64.length % 4,
            o = 0,
            i,
            n,
            a = [0, 0, 2, 1];
        for (i = 0; i < l; i += 4) {
            n = ((b64tab[b64.charAt(i)]     || 0) << 18) |
                ((b64tab[b64.charAt(i + 1)] || 0) << 12) |
                ((b64tab[b64.charAt(i + 2)] || 0) <<  6) |
                ((b64tab[b64.charAt(i + 3)] || 0));
            bin[o]     =  n >> 16;
            bin[o + 1] = (n >> 8) & 0xff;
            bin[o + 2] =  n       & 0xff;
            o += 3;
        }
        l = 3 * l - a[padlen];
        return bin.subarray(0, l);
    }
    /**
     * @param {!Uint8Array} uni
     * @return {!Uint8Array}
     */
    function convertUTF16ArrayToUTF8Array(uni) {
        var i, n,
            l = uni.length,
            o = 0,
            bin = new Uint8Array(new ArrayBuffer(3 * l));
        for (i = 0; i < l; i += 1) {
            n = /**@type{!number}*/(uni[i]);
            if (n < 0x80) {
                bin[o++] = n;
            } else if (n < 0x800) {
                bin[o++] = 0xc0 | (n >>>  6);
                bin[o++] = 0x80 | (n & 0x3f);
            } else {
                bin[o++] = 0xe0 | ((n >>> 12) & 0x0f);
                bin[o++] = 0x80 | ((n >>>  6) & 0x3f);
                bin[o++] = 0x80 |  (n         & 0x3f);
            }
        }
        return bin.subarray(0, o);
    }
    /**
     * @param {!Uint8Array} bin
     * @return {!Uint8Array}
     */
    function convertUTF8ArrayToUTF16Array(bin) {
        var i, c0, c1, c2,
            l = bin.length,
            uni = new Uint8Array(new ArrayBuffer(l)),
            o = 0;
        for (i = 0; i < l; i += 1) {
            c0 = /**@type{!number}*/(bin[i]);
            if (c0 < 0x80) {
                uni[o++] = c0;
            } else {
                i += 1;
                c1 = /**@type{!number}*/(bin[i]);
                if (c0 < 0xe0) {
                    uni[o++] = ((c0 & 0x1f) << 6) | (c1 & 0x3f);
                } else {
                    i += 1;
                    c2 = /**@type{!number}*/(bin[i]);
                    uni[o++] = ((c0 & 0x0f) << 12) | ((c1 & 0x3f) << 6) |
                            (c2 & 0x3f);
                }
            }
        }
        return uni.subarray(0, o);
    }
    /**
     * @param {!string} bin
     * @return {!string}
     */
    function convertUTF8StringToBase64(bin) {
        return convertUTF8ArrayToBase64(stringToArray(bin));
    }
    /**
     * @param {!string} b64
     * @return {!string}
     */
    function convertBase64ToUTF8String(b64) {
        return String.fromCharCode.apply(String, convertBase64ToUTF8Array(b64));
    }
    /**
     * @param {!string} bin
     * @return {!Uint8Array}
     */
    function convertUTF8StringToUTF16Array(bin) {
        return convertUTF8ArrayToUTF16Array(stringToArray(bin));
    }
    /**
     * @param {!Uint8Array} bin
     * @return {!string}
     */
    function convertUTF8ArrayToUTF16String(bin) {
        // this conversion is done in chunks to avoid a stack overflow in
        // apply()
        var b = convertUTF8ArrayToUTF16Array(bin),
            r = "",
            i = 0,
            chunksize = 45000;
        while (i < b.length) {
            r += String.fromCharCode.apply(String, b.subarray(i, i + chunksize));
            i += chunksize;
        }
        return r;
    }
    /**
     * @param {!Array.<number>|!string} bin
     * @param {!number} i
     * @param {!number} end
     * @return {!string}
     */
    function convertUTF8StringToUTF16String_internal(bin, i, end) {
        var c0, c1, c2, j,
            str = "";
        for (j = i; j < end; j += 1) {
            c0 = bin.charCodeAt(j) & 0xff;
            if (c0 < 0x80) {
                str += String.fromCharCode(c0);
            } else {
                j += 1;
                c1 = bin.charCodeAt(j) & 0xff;
                if (c0 < 0xe0) {
                    str += String.fromCharCode(((c0 & 0x1f) << 6) |
                        (c1 & 0x3f));
                } else {
                    j += 1;
                    c2 = bin.charCodeAt(j) & 0xff;
                    str += String.fromCharCode(((c0 & 0x0f) << 12) |
                            ((c1 & 0x3f) << 6) | (c2 & 0x3f));
                }
            }
        }
        return str;
    }

    /**
     * Convert a utf-8 array into a utf-16 string.
     * The input array is treated as a list of values between 0 and 255.
     * This function works with a callback and splits the work up in parts
     * between which it yields to the main thread.
     * After each part the progress is reported with the callback function that
     * also passes a booleant that indicates if the job has finished.
     * If the conversion should stop, the callback should return false.
     *
     * @param {!Array.<number>|!string} bin
     * @param {!function(!string, boolean):boolean} callback
     * @return {undefined}
     */
    function convertUTF8StringToUTF16String(bin, callback) {
        var /**@const@type{!number}*/
            partsize = 100000,
            /**@type{!string}*/
            str = "",
            /**@type{!number}*/
            pos = 0;
        if (bin.length < partsize) {
            callback(convertUTF8StringToUTF16String_internal(bin, 0,
                    bin.length), true);
            return;
        }
        // make a local copy if the input is a string, to avoid modification
        if (typeof bin !== "string") {
            bin = bin.slice();
        }
        function f() {
            var end = pos + partsize;
            if (end > bin.length) {
                end = bin.length;
            }
            str += convertUTF8StringToUTF16String_internal(bin, pos, end);
            pos = end;
            end = pos === bin.length;
            if (callback(str, end) && !end) {
                runtime.setTimeout(f, 0);
            }
        }
        f();
    }
    /**
     * @param {!string} uni
     * @return {!Uint8Array}
     */
    function convertUTF16StringToUTF8Array(uni) {
        return convertUTF16ArrayToUTF8Array(stringToArray(uni));
    }
    /**
     * @param {!Uint8Array} uni
     * @return {!string}
     */
    function convertUTF16ArrayToUTF8String(uni) {
        return String.fromCharCode.apply(String,
                 convertUTF16ArrayToUTF8Array(uni));
    }
    /**
     * @param {!string} uni
     * @return {!string}
     */
    function convertUTF16StringToUTF8String(uni) {
        return String.fromCharCode.apply(String,
                 convertUTF16ArrayToUTF8Array(stringToArray(uni)));
    }

    if (window && window.btoa) {
        /**
         * @param {!string} b
         * @return {!string}
         */
        btoa = window.btoa;
        /**
         * @param {!string} uni
         * @return {!string}
         */
        convertUTF16StringToBase64 = function (uni) {
            return btoa(convertUTF16StringToUTF8String(uni));
        };
    } else {
        btoa = convertUTF8StringToBase64;
        /**
         * @param {!string} uni
         * @return {!string}
         */
        convertUTF16StringToBase64 = function (uni) {
            return convertUTF8ArrayToBase64(convertUTF16StringToUTF8Array(uni));
        };
    }
    if (window && window.atob) {
        /**
         * @param {!string} a
         * @return {!string}
         */
        atob = window.atob;
        /**
         * @param {!string} b64
         * @return {!string}
         */
        convertBase64ToUTF16String = function (b64) {
            var /**@type{!string}*/
                b = atob(b64);
            return convertUTF8StringToUTF16String_internal(b, 0, b.length);
        };
    } else {
        atob = convertBase64ToUTF8String;
        /**
         * @param {!string} b64
         * @return {!string}
         */
        convertBase64ToUTF16String = function (b64) {
            return convertUTF8ArrayToUTF16String(convertBase64ToUTF8Array(b64));
        };
    }

    /**
     * @constructor
     * @struct
     */
    core.Base64 = function Base64() {
        this.convertUTF8ArrayToBase64 = convertUTF8ArrayToBase64;
        this.convertByteArrayToBase64 = convertUTF8ArrayToBase64;
        this.convertBase64ToUTF8Array = convertBase64ToUTF8Array;
        this.convertBase64ToByteArray = convertBase64ToUTF8Array;
        this.convertUTF16ArrayToUTF8Array = convertUTF16ArrayToUTF8Array;
        this.convertUTF16ArrayToByteArray = convertUTF16ArrayToUTF8Array;
        this.convertUTF8ArrayToUTF16Array = convertUTF8ArrayToUTF16Array;
        this.convertByteArrayToUTF16Array = convertUTF8ArrayToUTF16Array;
        this.convertUTF8StringToBase64 = convertUTF8StringToBase64;
        this.convertBase64ToUTF8String = convertBase64ToUTF8String;
        this.convertUTF8StringToUTF16Array = convertUTF8StringToUTF16Array;
        this.convertUTF8ArrayToUTF16String = convertUTF8ArrayToUTF16String;
        this.convertByteArrayToUTF16String = convertUTF8ArrayToUTF16String;
        this.convertUTF8StringToUTF16String = convertUTF8StringToUTF16String;
        this.convertUTF16StringToUTF8Array = convertUTF16StringToUTF8Array;
        this.convertUTF16StringToByteArray = convertUTF16StringToUTF8Array;
        this.convertUTF16ArrayToUTF8String = convertUTF16ArrayToUTF8String;
        this.convertUTF16StringToUTF8String = convertUTF16StringToUTF8String;
        this.convertUTF16StringToBase64 = convertUTF16StringToBase64;
        this.convertBase64ToUTF16String = convertBase64ToUTF16String;
        this.fromBase64 = convertBase64ToUTF8String;
        this.toBase64 = convertUTF8StringToBase64;
        this.atob = atob;
        this.btoa = btoa;
        this.utob = convertUTF16StringToUTF8String;
        this.btou = convertUTF8StringToUTF16String;
        this.encode = convertUTF16StringToBase64;
        /**
         * @param {!string} u
         * @return {!string}
         */
        this.encodeURI = function (u) {
            return convertUTF16StringToBase64(u).replace(/[+\/]/g,
                /**
                 * @param {!string} m0
                 * @return {!string}
                 */
                function (m0) {
                    return m0 === '+' ? '-' : '_';
                }).replace(/\\=+$/, '');
        };
        /**
         * @param {!string} a
         * @return {!string}
         */
        this.decode = function (a) {
            return convertBase64ToUTF16String(a.replace(/[\-_]/g,
                /**
                 * @param {!string} m0
                 * @return {!string}
                 */
                function (m0) {
                    return m0 === '-' ? '+' : '/';
                }));
        };
        return this;
    };
    return core.Base64;
}
/**
 * @constructor
 */
core.Base64 = makeBase64();
