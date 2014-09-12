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

/*global ops, odf, core, runtime */

/**
 * @constructor
 * @implements ops.Operation
 */
ops.OpRemoveHyperlink = function OpRemoveHyperlink() {
    "use strict";

    var memberid, timestamp, position, length,
        domUtils = core.DomUtils,
        odfUtils = odf.OdfUtils;

    /**
     * @param {!ops.OpRemoveHyperlink.InitSpec} data
     */
    this.init = function (data) {
        memberid = data.memberid;
        timestamp = data.timestamp;
        position = data.position;
        length = data.length;
    };

    this.isEdit = true;
    this.group = undefined;

    /**
     * @param {!ops.Document} document
     */
    this.execute = function (document) {
        var odtDocument = /**@type{ops.OdtDocument}*/(document),
            range = odtDocument.convertCursorToDomRange(position, length),
            links = odfUtils.getHyperlinkElements(range),
            node;

        runtime.assert(links.length === 1, "The given range should only contain a single link.");
        node = domUtils.mergeIntoParent(/**@type{!Node}*/(links[0]));
        range.detach();

        odtDocument.fixCursorPositions();
        odtDocument.getOdfCanvas().refreshSize();
        odtDocument.getOdfCanvas().rerenderAnnotations();
        odtDocument.emit(ops.OdtDocument.signalParagraphChanged, {
            paragraphElement: odfUtils.getParagraphElement(node),
            memberId: memberid,
            timeStamp: timestamp
        });
        return true;
    };

    /**
     * @return {!ops.OpRemoveHyperlink.Spec}
     */
    this.spec = function () {
        return {
            optype: "RemoveHyperlink",
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
ops.OpRemoveHyperlink.Spec;
/**@typedef{{
    memberid:string,
    timestamp:(number|undefined),
    position:number,
    length:number
}}*/
ops.OpRemoveHyperlink.InitSpec;
