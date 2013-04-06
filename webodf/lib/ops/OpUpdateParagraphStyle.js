/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
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

/*global ops*/

/**
 * @constructor
 * @implements ops.Operation
 */
ops.OpUpdateParagraphStyle = function OpUpdateParagraphStyle(session) {
    "use strict";

    var memberid, timestamp, styleName,
        /**@type{{paragraphProperties,textProperties}}*/info,
        /**@const*/fons = "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
        /**@const*/stylens = "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
        /**@const*/svgns = "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0";

    /**
     * Sets a value as the attribute of a node, if that value is defined.
     * If there is a unit specified, it is suffixed to the value.
     * @param {!Node} node
     * @param {!string} ns
     * @param {!string} prefixedAttribute
     * @param {string} value
     * @param {string=} unit
     */
    function setRealAttributeNS(node, ns, prefixedAttribute, value, unit) {
        if (value !== undefined) {
            node.setAttributeNS(ns, prefixedAttribute, (unit !== undefined) ? value + unit : value);
        }
    }

    this.init = function (data) {
        memberid = data.memberid;
        timestamp = data.timestamp;
        styleName = data.styleName;
        info = data.info;
    };

    this.execute = function (domroot) {
        var odtDocument = session.getOdtDocument(),
            styleNode, paragraphPropertiesNode, textPropertiesNode, fontFaceNode;

        styleNode = odtDocument.getParagraphStyleElement(styleName);

        if (styleNode) {
            paragraphPropertiesNode = styleNode.getElementsByTagNameNS(stylens, 'paragraph-properties')[0];
            textPropertiesNode = styleNode.getElementsByTagNameNS(stylens, 'text-properties')[0];

            if ((paragraphPropertiesNode === undefined)
                    && info.paragraphProperties) {
                paragraphPropertiesNode = odtDocument.getDOM().createElementNS(stylens, 'style:paragraph-properties');
                styleNode.appendChild(paragraphPropertiesNode);
            }
            if ((textPropertiesNode === undefined)
                    && info.textProperties) {
                textPropertiesNode = odtDocument.getDOM().createElementNS(stylens, 'style:text-properties');
                styleNode.appendChild(textPropertiesNode);
            }

            if (info.paragraphProperties) {
                setRealAttributeNS(paragraphPropertiesNode, fons,
                    'fo:margin-top', info.paragraphProperties.topMargin, 'mm');
                setRealAttributeNS(paragraphPropertiesNode, fons,
                    'fo:margin-bottom', info.paragraphProperties.bottomMargin, 'mm');
                setRealAttributeNS(paragraphPropertiesNode, fons,
                    'fo:margin-left', info.paragraphProperties.leftMargin, 'mm');
                setRealAttributeNS(paragraphPropertiesNode, fons,
                    'fo:margin-right', info.paragraphProperties.rightMargin, 'mm');
                setRealAttributeNS(paragraphPropertiesNode, fons,
                    'fo:text-align', info.paragraphProperties.textAlign);
            }

            if (info.textProperties) {
                setRealAttributeNS(textPropertiesNode, fons,
                    'fo:font-size', info.textProperties.fontSize, 'pt');

                // Declare the requested font if it is not already declared
                if (info.textProperties.fontName &&
                    !odtDocument.getOdfCanvas().getFormatting().getFontMap().hasOwnProperty(info.textProperties.fontName)) {

                    fontFaceNode = odtDocument.getDOM().createElementNS(stylens, 'style:font-face');
                    fontFaceNode.setAttributeNS(stylens, 'style:name', info.textProperties.fontName);
                    fontFaceNode.setAttributeNS(svgns, 'svg:font-family', info.textProperties.fontName);
                    odtDocument.getOdfCanvas().odfContainer().rootElement.fontFaceDecls.appendChild(fontFaceNode);
                }
                setRealAttributeNS(textPropertiesNode, stylens,
                    'style:font-name', info.textProperties.fontName);

                setRealAttributeNS(textPropertiesNode, fons,
                    'fo:color', info.textProperties.color);
                setRealAttributeNS(textPropertiesNode, fons,
                    'fo:background-color', info.textProperties.backgroundColor);

                setRealAttributeNS(textPropertiesNode, fons,
                    'fo:font-weight', info.textProperties.fontWeight);
                setRealAttributeNS(textPropertiesNode, fons,
                    'fo:font-style', info.textProperties.fontStyle);
                setRealAttributeNS(textPropertiesNode, stylens,
                    'style:text-underline-style', info.textProperties.underline);
                setRealAttributeNS(textPropertiesNode, stylens,
                    'style:text-line-through-style', info.textProperties.strikethrough);
            }

            odtDocument.getOdfCanvas().refreshCSS();
            odtDocument.emit(ops.OdtDocument.signalParagraphStyleModified, styleName);
        }
    };

    this.spec = function () {
        return {
            optype: "UpdateParagraphStyle",
            memberid: memberid,
            timestamp: timestamp,
            styleName: styleName,
            info: info
        };
    };

};
