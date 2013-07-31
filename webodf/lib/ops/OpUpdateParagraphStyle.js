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

/*global runtime, odf, ops*/

/**
 * @constructor
 * @implements ops.Operation
 */
ops.OpUpdateParagraphStyle = function OpUpdateParagraphStyle() {
    "use strict";

    var memberid, timestamp, styleName,
        /**@type{Object}*/setProperties,
        /**@type{{paragraphPropertyNames,textPropertyNames}}*/removedProperties,
        /**@const*/stylens = "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
        /**@const*/svgns = "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0";

    /**
     * Removes attributes of a node by the names listed in removedPropertyNames.
     * @param {!Node} node
     * @param {!Array.<!string>} removedPropertyNames
     */
    function removePropertiesFromStyleNode(node, removedPropertyNames) {
        var i, propertyNameParts;

        for (i = 0; i < removedPropertyNames.length; i += 1) {
            propertyNameParts = removedPropertyNames[i].split(":");
            // TODO: ensure all used prefixes have a namespaces listed
            node.removeAttributeNS(odf.Namespaces.resolvePrefix(propertyNameParts[0]), propertyNameParts[1]);
        }
    }

    this.init = function (data) {
        memberid = data.memberid;
        timestamp = data.timestamp;
        styleName = data.styleName;
        setProperties = data.setProperties;
        removedProperties = data.removedProperties;
    };

    this.execute = function (odtDocument) {
        var styleNode, paragraphPropertiesNode, textPropertiesNode, fontFaceNode, fontName,
            formatting = odtDocument.getFormatting();

        styleNode = odtDocument.getParagraphStyleElement(styleName);

        if (styleNode) {
            paragraphPropertiesNode = styleNode.getElementsByTagNameNS(stylens, 'paragraph-properties')[0];
            textPropertiesNode = styleNode.getElementsByTagNameNS(stylens, 'text-properties')[0];

            if (setProperties) {
                // ensure nodes if needed
                if ((paragraphPropertiesNode === undefined)
                        && setProperties["style:paragraph-properties"]) {
                    paragraphPropertiesNode = odtDocument.getDOM().createElementNS(stylens, 'style:paragraph-properties');
                    styleNode.appendChild(paragraphPropertiesNode);
                }
                if ((textPropertiesNode === undefined)
                        && setProperties["style:text-properties"]) {
                    textPropertiesNode = odtDocument.getDOM().createElementNS(stylens, 'style:text-properties');
                    styleNode.appendChild(textPropertiesNode);
                }

                // set attributes in the style nodes
                if (setProperties["style:paragraph-properties"]) {
                    formatting.updateStyle(paragraphPropertiesNode, setProperties["style:paragraph-properties"]);
                }

                if (setProperties["style:text-properties"]) {
                    // Declare the requested font if it is not already declared
                    fontName = setProperties["style:text-properties"]["style:font-name"];
                    if (fontName &&
                        !formatting.getFontMap().hasOwnProperty(fontName)) {

                        fontFaceNode = odtDocument.getDOM().createElementNS(stylens, 'style:font-face');
                        fontFaceNode.setAttributeNS(stylens, 'style:name', fontName);
                        fontFaceNode.setAttributeNS(svgns, 'svg:font-family', fontName);
                        odtDocument.getOdfCanvas().odfContainer().rootElement.fontFaceDecls.appendChild(fontFaceNode);
                    }
                    formatting.updateStyle(textPropertiesNode, setProperties["style:text-properties"]);
                }
            }

            // remove attributes in the style nodes
            if (removedProperties) {
                if (removedProperties.paragraphPropertyNames) {
                    removePropertiesFromStyleNode(paragraphPropertiesNode, removedProperties.paragraphPropertyNames);
                    if (paragraphPropertiesNode.attributes.length === 0) {
                        styleNode.removeChild(paragraphPropertiesNode);
                    }
                }

                if (removedProperties.textPropertyNames) {
                    // TODO: check if fontname can be removed from font-face-declaration
                    removePropertiesFromStyleNode(textPropertiesNode, removedProperties.textPropertyNames);
                    if (textPropertiesNode.attributes.length === 0) {
                        styleNode.removeChild(textPropertiesNode);
                    }
                }
            }

            odtDocument.getOdfCanvas().refreshCSS();
            odtDocument.emit(ops.OdtDocument.signalParagraphStyleModified, styleName);
            odtDocument.getOdfCanvas().getAnnotationManager().rerenderAnnotations();
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
            setProperties: setProperties,
            removedProperties: removedProperties
        };
    };

};
