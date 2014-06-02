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

/*global core*/
/*jslint plusplus: true, bitwise: true */

/**
 * @constructor
 * @param {!Uint8Array} data
 */
core.ByteArray = function ByteArray(data) {
    "use strict";
    /**
     * @type {!number}
     */
    this.pos = 0;
    /**
     * @type {!Uint8Array}
     */
    this.data = data;
    /**
     * @return {number}
     */
    this.readUInt32LE = function () {
        this.pos += 4;
        var d = this.data,
            pos = this.pos;
        return (d[--pos] << 24) |
            (d[--pos] << 16) |
            (d[--pos] <<  8) |
            d[--pos];
    };
    /**
     * @return {number}
     */
    this.readUInt16LE = function () {
        this.pos += 2;
        var d = this.data,
            pos = this.pos;
        return (d[--pos] << 8) | d[--pos];
    };
};
