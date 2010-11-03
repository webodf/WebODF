/*jslint plusplus: false, bitwise: false */
var a3d = {};
/**
 * @constructor
 * @param {!string} data
 */
a3d.ByteArray = function (data) {
    /**
     * @type {!number}
     */
    this.pos = 0;
    /**
     * @type {!string}
     */
    this.data = data;
    /**
     * @return {number}
     */
    this.readUInt32LE = function () {
        var data = this.data,
            pos = (this.pos += 4);
        return  ((data.charCodeAt(--pos) & 0xFF) << 24) |
                ((data.charCodeAt(--pos) & 0xFF) << 16) |
                ((data.charCodeAt(--pos) & 0xFF) <<  8) |
                 (data.charCodeAt(--pos) & 0xFF);
    };
    /**
     * @return {number}
     */
    this.readUInt16LE = function () {
        var data = this.data,
            pos = (this.pos += 2);
        return ((data.charCodeAt(--pos) & 0xFF) << 8) |
                (data.charCodeAt(--pos) & 0xFF);
    };
};
