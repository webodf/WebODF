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

/*global ops, runtime, odf, core, Node*/


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
        /**@type {string|undefined}*/
        mergedParagraphStyleName,
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
        mergedParagraphStyleName = data.mergedParagraphStyleName;
        odfUtils = new odf.OdfUtils();
        domUtils = new core.DomUtils();

    };

    this.isEdit = true;
    this.group = undefined;

    /**
     * Defines a set of rules for how elements can be collapsed based on whether they contain ODT content (e.g.,
     * text or character elements).
     * @param {!Node} rootNode Root text element of the odtDocument
     * @constructor
     */
    function CollapsingRules(rootNode) {
       /**
         * Returns true if a given node is odf node or a text node that has a odf parent.
         * @param {!Node} node
         * @return {!boolean}
         */
        function shouldRemove(node) {
            return odfUtils.isODFNode(node)
                || (node.localName === "br" && odfUtils.isLineBreak(node.parentNode))
                || (node.nodeType === Node.TEXT_NODE && odfUtils.isODFNode(/** @type {!Node}*/(node.parentNode)));
        }

        /**
         * Returns true if the supplied node should be automatically collapsed (i.e., removed) if it contains no
         * text or ODF character elements. The only element that should always be kept is a paragraph element.
         * Paragraph elements can only be deleted through merging
         * @param {!Node} node
         * @return {!boolean}
         */
        function isCollapsibleContainer(node) {
            return !odfUtils.isParagraph(node) && node !== rootNode && odfUtils.hasNoODFContent(node);
        }

        /**
         * Merge all child nodes into the node's parent and remove the node entirely
         * @param {!Node} targetNode Node to merge into parent
         * @return {?Node} Final parent node collapsing ended at
         */
        function mergeChildrenIntoParent(targetNode) {
            var parent;
            if (targetNode.nodeType === Node.TEXT_NODE) {
                parent = targetNode.parentNode;
                parent.removeChild(targetNode);
            } else {
                // removes all odf nodes
                parent = domUtils.removeUnwantedNodes(targetNode, shouldRemove);
            }
            if (parent && isCollapsibleContainer(parent)) {
                return mergeChildrenIntoParent(parent);
            }
            return parent;
        }
        this.mergeChildrenIntoParent = mergeChildrenIntoParent;
    }

    /**
     * Merges the 'second' paragraph into the 'first' paragraph.
     * @param {!Element} destination Paragraph to merge content into
     * @param {!Element} source Paragraph to merge content from
     * @param {!CollapsingRules} collapseRules
     * @return {!Element} Destination paragraph
     */
    function mergeParagraphs(destination, source, collapseRules) {
        var child,
            sourceParent;

        if (odfUtils.hasNoODFContent(destination)) {
            if (source.parentNode !== destination.parentNode) {
                // We're just about to move the second paragraph in to the right position for the merge.
                // Therefore, we need to remember if the second paragraph is from a different parent in order to clean
                // it up afterwards
                sourceParent = source.parentNode;
                destination.parentNode.insertBefore(source, destination.nextSibling);
            }
        }

        while (source.firstChild) {
            child = source.firstChild;
            source.removeChild(child);
            if (child.localName !== 'editinfo') {
                destination.appendChild(child);
            }
        }

        if (sourceParent && odfUtils.hasNoODFContent(sourceParent)) {
            // Make sure the second paragraph's original parent is checked to see if it can be cleaned up too
            collapseRules.mergeChildrenIntoParent(sourceParent);
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
            collapseRules = new CollapsingRules(odtDocument.getRootNode());

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

        if (mergedParagraphStyleName !== undefined) {
            // An empty string means no style name, so remove the attribute
            if (mergedParagraphStyleName === "") {
                destinationParagraph.removeAttributeNS(odf.Namespaces.textns, 'style-name');
            } else {
                destinationParagraph.setAttributeNS(odf.Namespaces.textns, 'text:style-name', mergedParagraphStyleName);
            }
        }

        odtDocument.emit(ops.OdtDocument.signalStepsRemoved, {position: position, length: length});
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
            length: length,
            mergedParagraphStyleName: mergedParagraphStyleName
        };
    };
};
/**@typedef{{
    optype:string,
    memberid:string,
    timestamp:number,
    position:number,
    mergedParagraphStyleName: (string|undefined),
    length:number
}}*/
ops.OpRemoveText.Spec;
/**@typedef{{
    memberid:string,
    timestamp:(number|undefined),
    position:number,
    mergedParagraphStyleName: (string|undefined),
    length:number
}}*/
ops.OpRemoveText.InitSpec;
