/**
 * @license
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
 *
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

/*global ops, runtime, odf, Node*/

runtime.loadClass("odf.OdfUtils");

/**
 * @constructor
 * @implements ops.Operation
 */
ops.OpApplyStyle = function OpApplyStyle() {
    "use strict";

    var memberid, timestamp, position, length, info,
        odfUtils = new odf.OdfUtils(),
        /**@const@type {!string}*/ textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";

    this.init = function (data) {
        memberid = data.memberid;
        timestamp = data.timestamp;
        position = data.position;
        length = data.length;
        info = data.info;
    };

    function getRange(odtDocument) {
        var point1 = length >= 0 ? position : position + length,
            point2 = length >= 0 ? position + length : position,
            p1 = odtDocument.getIteratorAtPosition(point1),
            p2 = length ? odtDocument.getIteratorAtPosition(point2) : p1,
            range = odtDocument.getDOM().createRange();

        range.setStart(p1.container(), p1.unfilteredDomOffset());
        range.setEnd(p2.container(), p2.unfilteredDomOffset());
        return range;
    }

    function intersectsNode(range, node) {
        var nodeLength = node.nodeType === Node.TEXT_NODE ? node.length : node.childNodes.length;
        return range.comparePoint(node, 0) <= 0 && range.comparePoint(node, nodeLength) >= 0;
    }

    function getImpactedParagraphs(range) {
        var outerContainer = range.commonAncestorContainer,
            impactedParagraphs;

        impactedParagraphs = Array.prototype.slice.call(outerContainer.getElementsByTagNameNS(textns, "p"));
        impactedParagraphs = impactedParagraphs.concat(Array.prototype.slice.call(outerContainer.getElementsByTagNameNS(textns, "h")));

        while (outerContainer && !odfUtils.isParagraph(outerContainer)) {
            outerContainer = outerContainer.parentNode;
        }
        if (outerContainer) {
            impactedParagraphs.push(outerContainer);
        }

        return impactedParagraphs.filter(function(n) { return intersectsNode(range, n); });
    }

    this.execute = function (odtDocument) {
        var range = getRange(odtDocument),
            impactedParagraphs = getImpactedParagraphs(range);

        odtDocument.getFormatting().applyStyle(range, info);
        range.detach();
        odtDocument.getOdfCanvas().refreshCSS();

        impactedParagraphs.forEach(function(n) {
            odtDocument.emit(ops.OdtDocument.signalParagraphChanged, {
                paragraphElement: n,
                memberId: memberid,
                timeStamp: timestamp
            });
        });
        return true;
    };

    this.spec = function () {
        return {
            optype: "ApplyStyle",
            memberid: memberid,
            timestamp: timestamp,
            position: position,
            length: length,
            info: info
        };
    };

};
