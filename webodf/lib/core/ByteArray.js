/*global core*/
/*jslint plusplus: false, bitwise: false */
/**
 * @constructor
 * @param {!string} data
 */
core.ByteArray = function ByteArray(data) {
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
        return ((data.charCodeAt(--pos) & 0xFF) << 24) |
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
