/*global core*/
/*jslint plusplus: false, bitwise: false */
/**
 * @constructor
 * @param {!Runtime.ByteArray} data
 */
core.ByteArray = function ByteArray(data) {
    /**
     * @type {!number}
     */
    this.pos = 0;
    /**
     * @type {!Runtime.ByteArray}
     */
    this.data = data;
    /**
     * @return {number}
     */
    this.readUInt32LE = function () {
        var data = this.data,
            pos = (this.pos += 4);
        return (data[--pos] << 24) |
               (data[--pos] << 16) |
               (data[--pos] <<  8) |
                data[--pos];
    };
    /**
     * @return {number}
     */
    this.readUInt16LE = function () {
        var data = this.data,
            pos = (this.pos += 2);
        return (data[--pos] << 8) | data[--pos];
    };
};
