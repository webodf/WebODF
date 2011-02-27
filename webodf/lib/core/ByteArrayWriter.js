/*global runtime core*/
/*jslint bitwise: false */
/**
 * @constructor
 * @param {!string} encoding
 */
core.ByteArrayWriter = function ByteArrayWriter(encoding) {
    var self = this,
        data = new runtime.ByteArray(0);

    /**
     * @param {!core.ByteArrayWriter} writer
     * @return {undefined}
     */
    this.appendByteArrayWriter = function (writer) {
        data = runtime.concatByteArrays(data, writer.getByteArray());
    };
    /**
     * @param {!Runtime.ByteArray} array
     * @return {undefined}
     */
    this.appendByteArray = function (array) {
        data = runtime.concatByteArrays(data, array);
    };
    /**
     * @param {!Array.<!number>} array
     * @return {undefined}
     */
    this.appendArray = function (array) {
        data = runtime.concatByteArrays(data,
                runtime.byteArrayFromArray(array));
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
        data = runtime.concatByteArrays(data,
                runtime.byteArrayFromString(string, encoding));
    };
    /**
     * @return {!number}
     */
    this.getLength = function () {
        return data.length;
    };
    /**
     * @return {!Runtime.ByteArray}
     */
    this.getByteArray = function () {
        return data;
    };
};
