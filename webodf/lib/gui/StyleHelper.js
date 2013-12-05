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

/*global core, runtime, gui, odf*/

runtime.loadClass("odf.Namespaces");
runtime.loadClass("odf.OdfUtils");

/**
 * @constructor
 * @param {!odf.Formatting} formatting
 */
gui.StyleHelper = function StyleHelper(formatting) {
    "use strict";
    var odfUtils = new odf.OdfUtils(),
        /**@const*/
        textns = odf.Namespaces.textns;

    /**
     * @param {!Range} range
     */
    function getAppliedStyles(range) {
        var container, nodes;

        if (range.collapsed) {
            container = range.startContainer;
            if (container.hasChildNodes() && range.startOffset < container.childNodes.length) {
                container = container.childNodes.item(range.startOffset);
            }
            nodes = [container];
        } else {
            nodes = odfUtils.getTextNodes(range, true);
        }

        return formatting.getAppliedStyles(nodes);
    }

    /**
     * Returns an array of all unique styles in a given range for each text node
     * @param {!Range} range
     * @returns {!Array.<Object>}
     */
    this.getAppliedStyles = getAppliedStyles;

    /**
     * Returns true if all the node within given range have the same value for
     * the property; otherwise false.
     * @param {!Array.<!Object.<string,!Object.<string,string>>>} appliedStyles
     * @param {string} propertyName
     * @param {string} propertyValue
     * @return {boolean}
     */
    function hasTextPropertyValue(appliedStyles, propertyName, propertyValue) {
        var hasOtherValue = true, properties, i;

        for (i = 0; i < appliedStyles.length; i += 1) {
            properties = appliedStyles[i]['style:text-properties'];
            hasOtherValue = !properties || properties[propertyName] !== propertyValue;
            if (hasOtherValue) {
                break;
            }
        }
        return !hasOtherValue;
    }

    /**
     * Returns true if all the text within the range are bold; otherwise false.
     * @param {!Array.<Object>} appliedStyles
     * @return {!boolean}
     */
    this.isBold = function (appliedStyles) {
        return hasTextPropertyValue(appliedStyles, 'fo:font-weight', 'bold');
    };

    /**
     * Returns true if all the text within the range are italic; otherwise false.
     * @param {!Array.<Object>} appliedStyles
     * @return {!boolean}
     */
    this.isItalic = function (appliedStyles) {
        return hasTextPropertyValue(appliedStyles, 'fo:font-style', 'italic');
    };

    /**
     * Returns true if all the text within the range have underline; otherwise false.
     * @param {!Array.<Object>} appliedStyles
     * @return {!boolean}
     */
    this.hasUnderline = function (appliedStyles) {
        return hasTextPropertyValue(appliedStyles, 'style:text-underline-style', 'solid');
    };

    /**
     * Returns true if all the text within the range have strike through; otherwise false.
     * @param {!Array.<Object>} appliedStyles
     * @return {!boolean}
     */
    this.hasStrikeThrough = function (appliedStyles) {
        return hasTextPropertyValue(appliedStyles, 'style:text-line-through-style', 'solid');
    };

    /**
     * Returns true if all the node within given range have the same value for
     * the property; otherwise false.
     * @param {!Range} range
     * @param {!string} propertyName
     * @param {Array.<!string>} propertyValues
     * @return {!boolean}
     */
    function hasParagraphPropertyValue(range, propertyName, propertyValues) {
        var paragraphStyleName, paragraphStyleElement, paragraphStyleAttributes,
            properties,
            nodes = odfUtils.getParagraphElements(range),
            isStyleChecked = {},
            isDefaultParagraphStyleChecked = false;

        function pickDefaultParagraphStyleElement() {
            isDefaultParagraphStyleChecked = true;
            paragraphStyleElement = formatting.getDefaultStyleElement('paragraph');
            // have to fallback to check built-in default style?
            if (!paragraphStyleElement) {
                paragraphStyleElement = null;
            }
        }

        while (nodes.length > 0) {
            paragraphStyleName = nodes[0].getAttributeNS(textns, 'style-name');
            if (paragraphStyleName) {
                if (!isStyleChecked[paragraphStyleName]) {
                    paragraphStyleElement = formatting.getStyleElement(paragraphStyleName, 'paragraph');
                    isStyleChecked[paragraphStyleName] = true;
                    // in no such style node exists, fallback to default style
                    if (!paragraphStyleElement && !isDefaultParagraphStyleChecked) {
                        pickDefaultParagraphStyleElement();
                    }
                }
            } else if (!isDefaultParagraphStyleChecked) {
                pickDefaultParagraphStyleElement();
            } else {
                paragraphStyleElement = undefined;
            }

            if (paragraphStyleElement !== undefined) {
                // have to use built-in default style?
                if (paragraphStyleElement === null) {
                    paragraphStyleAttributes = formatting.getSystemDefaultStyleAttributes('paragraph');
                } else {
                    paragraphStyleAttributes = formatting.getInheritedStyleAttributes(/**@type{!Element}*/(paragraphStyleElement), true);
                }
                properties = paragraphStyleAttributes['style:paragraph-properties'];
                if (properties && propertyValues.indexOf(properties[propertyName]) === -1) {
                    return false;
                }
            }

            nodes.pop();
        }
        return true;
    }

    /**
     * Returns true if all the text within the range is left aligned; otherwise false.
     * @param {!Range} range
     * @return {!boolean}
     */
    this.isAlignedLeft = function (range) {
        return hasParagraphPropertyValue(range, 'fo:text-align', ['left', 'start']);
    };

    /**
     * Returns true if all the text within the range is center aligned; otherwise false.
     * @param {!Range} range
     * @return {!boolean}
     */
    this.isAlignedCenter = function (range) {
        return hasParagraphPropertyValue(range, 'fo:text-align', ['center']);
    };

    /**
     * Returns true if all the text within the range is right aligned; otherwise false.
     * @param {!Range} range
     * @return {!boolean}
     */
    this.isAlignedRight = function (range) {
        return hasParagraphPropertyValue(range, 'fo:text-align', ['right', 'end']);
    };

    /**
     * Returns true if all the text within the range is justified; otherwise false.
     * @param {!Range} range
     * @return {!boolean}
     */
    this.isAlignedJustified = function (range) {
        return hasParagraphPropertyValue(range, 'fo:text-align', ['justify']);
    };
};
