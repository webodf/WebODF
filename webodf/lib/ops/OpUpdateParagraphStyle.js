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
        /**@type{{paragraphProperties,textProperties}}*/setProperties,
        /**@type{{paragraphPropertyNames,textPropertyNames}}*/removedProperties,
        /**@const*/fons = "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
        /**@const*/stylens = "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
        /**@const*/svgns = "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
        /**
         * Mapping of the properties from info.textProperties to the attributes of style:text-properties
         * @const@type{Array.<!{propertyName:string,attrNs:string,attrPrefix:string,attrLocaName:string,unit:string}>}
         */
        textPropertyMapping = [
        {
            propertyName: 'fontSize',
            attrNs:       fons,
            attrPrefix:   'fo',
            attrLocaName: 'font-size',
            unit:         'pt'
        }, {
            propertyName: 'fontName',
            attrNs:       stylens,
            attrPrefix:   'style',
            attrLocaName: 'font-name'
        }, {
            propertyName: 'color',
            attrNs:       fons,
            attrPrefix:   'fo',
            attrLocaName: 'color'
        }, {
            propertyName: 'backgroundColor',
            attrNs:       fons,
            attrPrefix:   'fo',
            attrLocaName: 'background-color'
        }, {
            propertyName: 'fontWeight',
            attrNs:       fons,
            attrPrefix:   'fo',
            attrLocaName: 'font-weight'
        }, {
            propertyName: 'fontStyle',
            attrNs:       fons,
            attrPrefix:   'fo',
            attrLocaName: 'font-style'
        }, {
            propertyName: 'underline',
            attrNs:       stylens,
            attrPrefix:   'style',
            attrLocaName: 'text-underline-style'
        }, {
            propertyName: 'strikethrough',
            attrNs:       stylens,
            attrPrefix:   'style',
            attrLocaName: 'text-line-through-style'
        }],
        /**
         * Mapping of the properties from info.paragraphProperties to the attributes of style:paragraph-properties
         * @const@type{Array.<!{propertyName:string,attrNs:string,attrPrefix:string,attrLocaName:string,unit:string}>}
         */
        paragraphPropertyMapping = [
        {
            propertyName: 'topMargin',
            attrNs:       fons,
            attrPrefix:   'fo',
            attrLocaName: 'margin-top',
            unit:         'mm'
        }, {
            propertyName: 'bottomMargin',
            attrNs:       fons,
            attrPrefix:   'fo',
            attrLocaName: 'margin-bottom',
            unit:         'mm'
        }, {
            propertyName: 'leftMargin',
            attrNs:       fons,
            attrPrefix:   'fo',
            attrLocaName: 'margin-left',
            unit:         'mm'
        }, {
            propertyName: 'rightMargin',
            attrNs:       fons,
            attrPrefix:   'fo',
            attrLocaName: 'margin-right',
            unit:         'mm'
        }, {
            propertyName: 'textAlign',
            attrNs:       fons,
            attrPrefix:   'fo',
            attrLocaName: 'text-align'
        }];

    /**
     * Sets attributes of a node by the properties of the object properties,
     * based on the mapping defined in propertyMapping.
     * @param {!Node} node
     * @param {!Object} properties
     * @param {!Array.<!{propertyName:string,attrNs:string,attrPrefix:string,attrLocaName:string,unit:string}>} propertyMapping
     */
    function setPropertiesInStyleNode(node, properties, propertyMapping) {
        var i, m, value;
        for (i = 0; i < propertyMapping.length; i += 1) {
            m = propertyMapping[i];
            value = properties[m.propertyName];
            // Set a value as the attribute of a node, if that value is defined.
            // If there is a unit specified, it is suffixed to the value.
            if (value !== undefined) {
                node.setAttributeNS(m.attrNs, m.attrPrefix+":"+m.attrLocaName, (m.unit !== undefined) ? value + m.unit : value);
            }
        }
    }

    /**
     * Removes attributes of a node by the names listed in removedPropertyNames,
     * based on the mapping defined in propertyMapping.
     * @param {!Node} node
     * @param {!Array.<!string>} removedPropertyNames
     * @param {!Array.<!{propertyName:string,attrNs:string,attrPrefix:string,attrLocaName:string,unit:string}>} propertyMapping
     */
    function removePropertiesFromStyleNode(node, removedPropertyNames, propertyMapping) {
        var i, m;
        for (i = 0; i < propertyMapping.length; i += 1) {
            m = propertyMapping[i];
            if (removedPropertyNames.indexOf(m.propertyName) !== -1) {
                node.removeAttributeNS(m.attrNs, m.attrLocaName);
            }
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
        var styleNode, paragraphPropertiesNode, textPropertiesNode, fontFaceNode;

        styleNode = odtDocument.getParagraphStyleElement(styleName);

        if (styleNode) {
            paragraphPropertiesNode = styleNode.getElementsByTagNameNS(stylens, 'paragraph-properties')[0];
            textPropertiesNode = styleNode.getElementsByTagNameNS(stylens, 'text-properties')[0];

            if (setProperties) {
                // ensure nodes if needed
                if ((paragraphPropertiesNode === undefined)
                        && setProperties.paragraphProperties) {
                    paragraphPropertiesNode = odtDocument.getDOM().createElementNS(stylens, 'style:paragraph-properties');
                    styleNode.appendChild(paragraphPropertiesNode);
                }
                if ((textPropertiesNode === undefined)
                        && setProperties.textProperties) {
                    textPropertiesNode = odtDocument.getDOM().createElementNS(stylens, 'style:text-properties');
                    styleNode.appendChild(textPropertiesNode);
                }

                // set attributes in the style nodes
                if (setProperties.paragraphProperties) {
                    setPropertiesInStyleNode(paragraphPropertiesNode, setProperties.paragraphProperties, paragraphPropertyMapping);
                }

                if (setProperties.textProperties) {
                    // Declare the requested font if it is not already declared
                    if (setProperties.textProperties.fontName &&
                        !odtDocument.getOdfCanvas().getFormatting().getFontMap().hasOwnProperty(setProperties.textProperties.fontName)) {

                        fontFaceNode = odtDocument.getDOM().createElementNS(stylens, 'style:font-face');
                        fontFaceNode.setAttributeNS(stylens, 'style:name', setProperties.textProperties.fontName);
                        fontFaceNode.setAttributeNS(svgns, 'svg:font-family', setProperties.textProperties.fontName);
                        odtDocument.getOdfCanvas().odfContainer().rootElement.fontFaceDecls.appendChild(fontFaceNode);
                    }
                    setPropertiesInStyleNode(textPropertiesNode, setProperties.textProperties, textPropertyMapping);
                }
            }

            // remove attributes in the style nodes
            if (removedProperties) {
                if (removedProperties.paragraphPropertyNames) {
                    removePropertiesFromStyleNode(paragraphPropertiesNode, removedProperties.paragraphPropertyNames, paragraphPropertyMapping);
                    if (paragraphPropertiesNode.attributes.length === 0) {
                        styleNode.removeChild(paragraphPropertiesNode);
                    }
                }

                if (removedProperties.textPropertyNames) {
                    // TODO: check if fontname can be removed from font-face-declaration
                    removePropertiesFromStyleNode(textPropertiesNode, removedProperties.textPropertyNames, textPropertyMapping);
                    if (textPropertiesNode.attributes.length === 0) {
                        styleNode.removeChild(textPropertiesNode);
                    }
                }
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
            setProperties: setProperties,
            removedProperties: removedProperties
        };
    };

};
