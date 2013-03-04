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
 * @source: http://gitorious.org/webodf/webodf/
 */
/*global core, runtime*/
/**
 * @constructor
 * @param {!Document} domDocument
 */
core.Selection = function Selection(domDocument) {
    "use strict";
    var self = this,
        ranges = [];
    /**
     * @param {!number} i
     * @return {Range}
     */
    this.getRangeAt = function (i) {
        return ranges[i];
    };
    /**
     * @param {!Range} range
     * @return {undefined}
     */
    this.addRange = function (range) {
        if (ranges.length === 0) {
            self.focusNode = range.startContainer;
            self.focusOffset = range.startOffset;
        }
        ranges.push(range);
        self.rangeCount += 1;
    };
    /**
     * @return {undefined}
     */
    this.removeAllRanges = function () {
        ranges = [];
        self.rangeCount = 0;
        self.focusNode = null;
        self.focusOffset = 0;
    };
    /**
     * @param {!Node} node
     * @param {!number} offset
     * @return {undefined}
     */
    this.collapse = function (node, offset) {
        runtime.assert(offset >= 0, "invalid offset " + offset
            + " in Selection.collapse");
        ranges.length = self.rangeCount = 1;
        var range = ranges[0];
        if (!range) {
            ranges[0] = range = domDocument.createRange();
        }
        range.setStart(node, offset);
        range.collapse(true);
        self.focusNode = node;
        self.focusOffset = offset;
    };
    /**
     * @param {!Node} node
     * @param {!number} offset
     * @return {undefined}
     */
    this.extend = function (node, offset) {
    };
    /**
     * @type {!number}
     */
    this.rangeCount = 0;
    /**
     * @type {Node}
     */
    this.focusNode = null;
    /**
     * @type {!number}
     */
    this.focusOffset = 0;
};
