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

/*global ops*/

/**
 * @constructor
 * @implements ops.Operation
 */
ops.OpUpdateParagraphStyle = function OpUpdateParagraphStyle() {
    "use strict";

    var memberid, timestamp, styleName,
        /**@type{{paragraphProperties,textProperties}}*/info,
        /**@const*/fons = "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
        /**@const*/stylens = "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
        /**@const*/svgns = "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
        /**
         * Mapping of the properties from info.textProperties to the attributes of style:text-properties
         * @const@type{Array.<!{propertyName:string,attrNs:string,attrLocaName:string,unit:string}>}
         */
        textPropertyMapping = [
        {
            propertyName: 'fontSize',
            attrNs:       fons,
            attrLocaName: 'fo:font-size',
            unit:         'pt'
        }, {
            propertyName: 'fontName',
            attrNs:       stylens,
            attrLocaName: 'style:font-name'
        }, {
            propertyName: 'color',
            attrNs:       fons,
            attrLocaName: 'fo:color'
        }, {
            propertyName: 'backgroundColor',
            attrNs:       fons,
            attrLocaName: 'fo:background-color'
        }, {
            propertyName: 'fontWeight',
            attrNs:       fons,
            attrLocaName: 'fo:font-weight'
        }, {
            propertyName: 'fontStyle',
            attrNs:       fons,
            attrLocaName: 'fo:font-style'
        }, {
            propertyName: 'underline',
            attrNs:       stylens,
            attrLocaName: 'style:text-underline-style'
        }, {
            propertyName: 'strikethrough',
            attrNs:       stylens,
            attrLocaName: 'style:text-line-through-style'
        }],
        /**
         * Mapping of the properties from info.paragraphProperties to the attributes of style:paragraph-properties
         * @const@type{Array.<!{propertyName:string,attrNs:string,attrLocaName:string,unit:string}>}
         */
        paragraphPropertyMapping = [
        {
            propertyName: 'topMargin',
            attrNs:       fons,
            attrLocaName: 'fo:margin-top',
            unit:         'mm'
        }, {
            propertyName: 'bottomMargin',
            attrNs:       fons,
            attrLocaName: 'fo:margin-bottom',
            unit:         'mm'
        }, {
            propertyName: 'leftMargin',
            attrNs:       fons,
            attrLocaName: 'fo:margin-left',
            unit:         'mm'
        }, {
            propertyName: 'rightMargin',
            attrNs:       fons,
            attrLocaName: 'fo:margin-right',
            unit:         'mm'
        }, {
            propertyName: 'textAlign',
            attrNs:       fons,
            attrLocaName: 'fo:text-align'
        }];

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

    /**
     * Sets attributes of a node by the properties of the object properties,
     * based on the mapping defined in propertyData.
     * @param {!Node} node
     * @param {!Object} properties
     * @param {!Array.<!{propertyName:string,attrNs:string,attrLocaName:string,unit:string}>} propertyData
     */
    function setProperties(node, properties, propertyData) {
        var i, d;
        for (i = 0; i < propertyData.length; i += 1) {
            d = propertyData[i];
            setRealAttributeNS(node, d.attrNs, d.attrLocaName, properties[d.propertyName], d.unit);
        }
    }

    this.init = function (data) {
        memberid = data.memberid;
        timestamp = data.timestamp;
        styleName = data.styleName;
        info = data.info;
    };

    this.execute = function (odtDocument) {
        var styleNode, paragraphPropertiesNode, textPropertiesNode, fontFaceNode;

        styleNode = odtDocument.getParagraphStyleElement(styleName);

        if (styleNode) {
            paragraphPropertiesNode = styleNode.getElementsByTagNameNS(stylens, 'paragraph-properties')[0];
            textPropertiesNode = styleNode.getElementsByTagNameNS(stylens, 'text-properties')[0];

            // ensure nodes if needed
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

            // update the style nodes
            if (info.paragraphProperties) {
                setProperties(paragraphPropertiesNode, info.paragraphProperties, paragraphPropertyMapping);
            }

            if (info.textProperties) {
                // Declare the requested font if it is not already declared
                if (info.textProperties.fontName &&
                    !odtDocument.getOdfCanvas().getFormatting().getFontMap().hasOwnProperty(info.textProperties.fontName)) {

                    fontFaceNode = odtDocument.getDOM().createElementNS(stylens, 'style:font-face');
                    fontFaceNode.setAttributeNS(stylens, 'style:name', info.textProperties.fontName);
                    fontFaceNode.setAttributeNS(svgns, 'svg:font-family', info.textProperties.fontName);
                    odtDocument.getOdfCanvas().odfContainer().rootElement.fontFaceDecls.appendChild(fontFaceNode);
                }
                setProperties(textPropertiesNode, info.textProperties, textPropertyMapping);
            }

            odtDocument.getOdfCanvas().refreshCSS();
            odtDocument.emit(ops.OdtDocument.signalParagraphStyleModified, styleName);
            return true;
        }
        return false;
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
