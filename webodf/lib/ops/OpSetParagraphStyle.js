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

/*global ops*/

/**
 * @constructor
 * @implements ops.Operation
 */
ops.OpSetParagraphStyle = function OpSetParagraphStyle() {
    "use strict";

    var memberid, timestamp, position, styleName,
        textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";

    /**
     * @param {!ops.OpSetParagraphStyle.InitSpec} data
     */
    this.init = function (data) {
        memberid = data.memberid;
        timestamp = data.timestamp;
        position = data.position;
        styleName = data.styleName;
    };

    this.isEdit = true;
    this.group = undefined;

    /**
     * @param {!ops.Document} document
     */
    this.execute = function (document) {
        var odtDocument = /**@type{ops.OdtDocument}*/(document),
            iterator,
            paragraphNode;

        iterator = odtDocument.getIteratorAtPosition(position);
        paragraphNode = odtDocument.getParagraphElement(iterator.container());
        if (paragraphNode) {
            if (styleName !== "") {
                paragraphNode.setAttributeNS(textns, 'text:style-name', styleName);
            } else {
                paragraphNode.removeAttributeNS(textns, 'style-name');
            }

            odtDocument.getOdfCanvas().refreshSize();
            odtDocument.emit(ops.OdtDocument.signalParagraphChanged, {
                paragraphElement: paragraphNode,
                timeStamp: timestamp,
                memberId: memberid
            });

            odtDocument.getOdfCanvas().rerenderAnnotations();
            return true;
        }
        return false;
    };

    /**
     * @return {!ops.OpSetParagraphStyle.Spec}
     */
    this.spec = function () {
        return {
            optype: "SetParagraphStyle",
            memberid: memberid,
            timestamp: timestamp,
            position: position,
            styleName: styleName
        };
    };
};
/**@typedef{{
    optype:string,
    memberid:string,
    timestamp:number,
    position:number,
    styleName:string
}}*/
ops.OpSetParagraphStyle.Spec;
/**@typedef{{
    memberid:string,
    timestamp:(number|undefined),
    position:number,
    styleName:string
}}*/
ops.OpSetParagraphStyle.InitSpec;
