/**
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
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

/*global ops, runtime, odf, core*/

/**
 * @constructor
 * @implements ops.Operation
 */
ops.OpRemoveText = function OpRemoveText() {
    "use strict";

    var memberid, timestamp,
        /**@type {number}*/
        position,
        /**@type {number}*/
        length,
        /**@type{!odf.OdfUtils}*/
        odfUtils,
        /**@type{!core.DomUtils}*/
        domUtils;

    /**
     * @param {!ops.OpRemoveText.InitSpec} data
     */
    this.init = function (data) {
        runtime.assert(data.length >= 0, "OpRemoveText only supports positive lengths");
        memberid = data.memberid;
        timestamp = data.timestamp;
        position = parseInt(data.position, 10);
        length = parseInt(data.length, 10);
        odfUtils = new odf.OdfUtils();
        domUtils = new core.DomUtils();

    };

    this.isEdit = true;
    this.group = undefined;

    /**
     * Merges the 'second' paragraph into the 'first' paragraph.
     * @param {!Element} destination Paragraph to merge content into
     * @param {!Element} source Paragraph to merge content from
     * @param {!odf.CollapsingRules} collapseRules
     * @return {!Element} Destination paragraph
     */
    function mergeParagraphs(destination, source, collapseRules) {
        var child;

        while (source.firstChild) {
            child = source.firstChild;
            source.removeChild(child);
            if (child.localName !== 'editinfo') {
                destination.appendChild(child);
            }
        }

        // All children have been migrated, now consume up the source parent chain
        collapseRules.mergeChildrenIntoParent(source);
        return destination;
    }

    /**
     * @param {!ops.Document} document
     */
    this.execute = function (document) {
        var odtDocument = /**@type{ops.OdtDocument}*/(document),
            paragraphElement,
            destinationParagraph,
            range,
            textNodes,
            paragraphs,
            cursor = odtDocument.getCursor(memberid),
            collapseRules = new odf.CollapsingRules(odtDocument.getRootNode());

        odtDocument.upgradeWhitespacesAtPosition(position);
        odtDocument.upgradeWhitespacesAtPosition(position + length);

        range = odtDocument.convertCursorToDomRange(position, length);
        domUtils.splitBoundaries(range);
        paragraphElement = odtDocument.getParagraphElement(range.startContainer);
        textNodes = odfUtils.getTextElements(range, false, true);
        paragraphs = odfUtils.getParagraphElements(range);
        range.detach();

        // Each character element is fully contained within the range, so will be completely removed
        textNodes.forEach(function (element) {
            if (element.parentNode) {
                // If this is an empty text node, it might have already been removed from it's container.
                // Although WebODF specifically avoids empty text nodes at all times, incorrect 3rd party
                // DOM manipulation (or undiscovered WebODF bugs) may leave these behind.
                collapseRules.mergeChildrenIntoParent(element);
            } else {
                runtime.log("WARN: text element has already been removed from it's container");
            }
        });

        /**
         * @param {!Element} destination
         * @param {!Element} paragraph
         * @return {!Element}
         */
        function merge(destination, paragraph) {
            return mergeParagraphs(destination, paragraph, collapseRules);
        }
        destinationParagraph = paragraphs.reduce(merge);

        odtDocument.emit(ops.OdtDocument.signalStepsRemoved, {position: position});
        odtDocument.downgradeWhitespacesAtPosition(position);
        odtDocument.fixCursorPositions();
        odtDocument.getOdfCanvas().refreshSize();
        // TODO: signal also the deleted paragraphs, so e.g. SessionView can clean up the EditInfo
        odtDocument.emit(ops.OdtDocument.signalParagraphChanged, {
            paragraphElement: destinationParagraph || paragraphElement,
            memberId: memberid,
            timeStamp: timestamp
        });

        if (cursor) {
            cursor.resetSelectionType();
            odtDocument.emit(ops.Document.signalCursorMoved, cursor);
        }

        odtDocument.getOdfCanvas().rerenderAnnotations();
        return true;
    };

    /**
     * @return {!ops.OpRemoveText.Spec}
     */
    this.spec = function () {
        return {
            optype: "RemoveText",
            memberid: memberid,
            timestamp: timestamp,
            position: position,
            length: length
        };
    };
};
/**@typedef{{
    optype:string,
    memberid:string,
    timestamp:number,
    position:number,
    length:number
}}*/
ops.OpRemoveText.Spec;
/**@typedef{{
    memberid:string,
    timestamp:(number|undefined),
    position:number,
    length:number
}}*/
ops.OpRemoveText.InitSpec;
