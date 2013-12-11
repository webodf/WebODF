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
/*global Node, odf, runtime, console, core*/

runtime.loadClass("core.Utils");
runtime.loadClass("odf.ObjectNameGenerator");
runtime.loadClass("odf.Namespaces");
runtime.loadClass("odf.OdfContainer");
runtime.loadClass("odf.StyleInfo");
runtime.loadClass("odf.OdfUtils");

/**
 * @constructor
 */
odf.Formatting = function Formatting() {
    "use strict";
    var /**@type{odf.OdfContainer}*/
        odfContainer,
        /**@type{odf.StyleInfo}*/
        styleInfo = new odf.StyleInfo(),
        /**@const*/
        svgns = odf.Namespaces.svgns,
        /**@const*/
        stylens = odf.Namespaces.stylens,
        /**@const*/
        textns = odf.Namespaces.textns,
        /**@const*/
        numberns = odf.Namespaces.numberns,
        /**@const*/
        fons = odf.Namespaces.fons,
        odfUtils = new odf.OdfUtils(),
        domUtils = new core.DomUtils(),
        utils = new core.Utils(),
        // TODO: needs to be extended. Possibly created together with CSS from sone default description?
        /**@const*/
        builtInDefaultStyleAttributesByFamily = {
            'paragraph' : {
                'style:paragraph-properties': {
                    'fo:text-align': 'left'
                }
            }
        },
        /**@const*/
        defaultPageFormatSettings = {
            width: 21.001, // showing as 21.00 in page format dialog but the value is actually 21.001 in the xml
            height: 29.7,
            margin: 2,
            padding: 0
        }; // LO 4.1.1.2's default page format settings. All numbers are in cm.

    /**
     * Returns a JSON representation of the built-in default style attributes
     * of a given style family.
     * Creates a deep copy, so the result can be modified by the callee.
     * If there are no such attributes, null is returned.
     * @param {string} styleFamily
     * @return {!Object.<string,!Object.<string,string>>}
     */
    function getSystemDefaultStyleAttributes(styleFamily) {
        var result,
            /**@type{!Object|undefined}*/
            builtInDefaultStyleAttributes = builtInDefaultStyleAttributesByFamily[styleFamily];

        if (builtInDefaultStyleAttributes) {
            // reusing mergeObjects to copy builtInDefaultStyleAttributes into the result
            result = utils.mergeObjects({}, builtInDefaultStyleAttributes);
        } else {
            result = {};
        }

        return result;
    }
    this.getSystemDefaultStyleAttributes = getSystemDefaultStyleAttributes;

    /**
     * @param {!odf.OdfContainer} odfcontainer
     * @return {undefined}
     */
    this.setOdfContainer = function (odfcontainer) {
        odfContainer = odfcontainer;
    };
    /**
     * @param {?Element} node
     * @param {!string} ns
     * @param {!string} name
     * @return {?Element}
     */
    function getDirectChild(node, ns, name) {
        var e = node && node.firstElementChild;
        while (e) {
            if (e.namespaceURI === ns && e.localName === name) {
                break;
            }
            e = e.nextElementSibling;
        }
        return e;
    }
    /**
     * Returns a font face declarations map, where the key is the style:name and
     * the value is the svg:font-family or null, if none set but a svg:font-face-uri
     * @return {!Object.<string,string>}
     */
    function getFontMap() {
        var fontFaceDecls = odfContainer.rootElement.fontFaceDecls,
            /**@type {!Object.<string,string>}*/
            fontFaceDeclsMap = {},
            node,
            name,
            family;

        node = fontFaceDecls && fontFaceDecls.firstElementChild;
        while (node) {
            name = node.getAttributeNS(stylens, 'name');
            if (name) {
                // add family name as value, or, if there is a
                // font-face-uri, an empty string
                family = node.getAttributeNS(svgns, 'font-family');
                if (family || node.getElementsByTagNameNS(svgns, 'font-face-uri').length > 0) {
                    fontFaceDeclsMap[name] = family;
                }
            }
            node = node.nextElementSibling;
        }

        return fontFaceDeclsMap;
    }
    this.getFontMap = getFontMap;

    /**
     * Loop over the <style:style> elements and place the attributes
     * style:name and style:display-name in an array.
     * @return {!Array}
     */
    this.getAvailableParagraphStyles = function () {
        var node = odfContainer.rootElement.styles,
            p_family,
            p_name,
            p_displayName,
            paragraphStyles = [];
        node = node && node.firstElementChild;
        while (node) {
            if (node.localName === "style" && node.namespaceURI === stylens) {
                p_family = node.getAttributeNS(stylens, 'family');
                if (p_family === "paragraph") {
                    p_name = node.getAttributeNS(stylens, 'name');
                    p_displayName = node.getAttributeNS(stylens, 'display-name') || p_name;
                    if (p_name && p_displayName) {
                        paragraphStyles.push({
                            name: p_name,
                            displayName: p_displayName
                        });
                    }
                }
            }
            node = node.nextElementSibling;
        }
        return paragraphStyles;
    };

    /**
     * Returns if the given style is used anywhere in the document.
     * @param {!Element} styleElement
     * @return {!boolean}
     */
    this.isStyleUsed = function (styleElement) {
        var hasDerivedStyles, isUsed,
            root = odfContainer.rootElement;

        hasDerivedStyles = styleInfo.hasDerivedStyles(root,
            odf.Namespaces.lookupNamespaceURI, styleElement);

        isUsed =
            new styleInfo.UsedStyleList(root.styles).uses(styleElement)
            || new styleInfo.UsedStyleList(root.automaticStyles).uses(styleElement)
            || new styleInfo.UsedStyleList(root.body).uses(styleElement);

        return hasDerivedStyles || isUsed;
    };

    /**
     * @param {!string} family
     * @return {?Element}
     */
    function getDefaultStyleElement(family) {
        var node = odfContainer.rootElement.styles.firstElementChild;

        while (node) {
            if (node.namespaceURI === stylens
                    && node.localName === "default-style"
                    && node.getAttributeNS(stylens, 'family') === family) {
                return node;
            }
            node = node.nextElementSibling;
        }
        return null;
    }
    this.getDefaultStyleElement = getDefaultStyleElement;

    /**
     * Fetch style element associated with the requested name and family
     * @param {!string} styleName
     * @param {!string} family
     * @param {!Array.<!Element>=} styleElements Specific style trees to search. If unspecified will search both automatic
     *  and user-created styles
     * @return {Element}
     */
    function getStyleElement(styleName, family, styleElements) {
        var node,
            nodeStyleName,
            styleListElement,
            i;

        styleElements = styleElements || [odfContainer.rootElement.automaticStyles, odfContainer.rootElement.styles];
        for (i = 0; i < styleElements.length; i += 1) {
            styleListElement = /**@type{!Element}*/(styleElements[i]);
            node = styleListElement.firstElementChild;
            while (node) {
                nodeStyleName = node.getAttributeNS(stylens, 'name');
                if (node.namespaceURI === stylens
                        && node.localName === "style"
                        && node.getAttributeNS(stylens, 'family') === family
                        && nodeStyleName === styleName) {
                    return node;
                }
                if (family === "list-style"
                        && node.namespaceURI === textns
                        && node.localName === "list-style"
                        && nodeStyleName === styleName) {
                    return node;
                }
                if (family === "data"
                        && node.namespaceURI === numberns
                        && nodeStyleName === styleName) {
                    return node;
                }
                node = node.nextElementSibling;
            }
        }
        return null;
    }
    this.getStyleElement = getStyleElement;

    /**
     * Returns a JSON representation of the style attributes of a given style element
     * @param {!Element} styleNode
     * @return {!Object}
     */
    function getStyleAttributes(styleNode) {
        var i, a, map, ai,
            propertiesMap = {},
            propertiesNode = styleNode.firstElementChild;

        while (propertiesNode) {
            if (propertiesNode.namespaceURI === stylens) {
                map = propertiesMap[propertiesNode.nodeName] = {};
                a = propertiesNode.attributes;
                for (i = 0; i < a.length; i += 1) {
                    ai = /**@type{!Attr}*/(a.item(i));
                    map[ai.name] = ai.value;
                }
            }
            propertiesNode = propertiesNode.nextElementSibling;
        }
        a = styleNode.attributes;
        for (i = 0; i < a.length; i += 1) {
            ai = /**@type{!Attr}*/(a.item(i));
            propertiesMap[ai.name] = ai.value;
        }

        return propertiesMap;
    }
    this.getStyleAttributes = getStyleAttributes;

    /**
     * Returns a JSON representation of the style attributes of a given style element, also containing attributes
     * inherited from it's ancestry - up to and including the default style for the family.
     * @param {!Element} styleNode
     * @param {!boolean=} includeSystemDefault
     * @return {!Object.<string,!Object.<string,string>>}
     */
    function getInheritedStyleAttributes(styleNode, includeSystemDefault) {
        var styleListElement = odfContainer.rootElement.styles,
            parentStyleName,
            propertiesMap,
            inheritedPropertiesMap = {},
            styleFamily = styleNode.getAttributeNS(stylens, 'family'),
            node = styleNode;

        // Iterate through the style ancestry
        while (node) {
            propertiesMap = getStyleAttributes(node);
            // All child properties should override any matching parent properties
            inheritedPropertiesMap = utils.mergeObjects(propertiesMap, inheritedPropertiesMap);

            parentStyleName = node.getAttributeNS(stylens, 'parent-style-name');
            if (parentStyleName) {
                node = getStyleElement(parentStyleName, styleFamily, [styleListElement]);
            } else {
                node = null;
            }
        }

        // Next incorporate attributes from the default style
        node = getDefaultStyleElement(styleFamily);
        if (node) {
            propertiesMap = getStyleAttributes(node);
            // All child properties should override any matching parent properties
            inheritedPropertiesMap = utils.mergeObjects(propertiesMap, inheritedPropertiesMap);
        }

        // Last incorporate attributes from the built-in default style
        if (includeSystemDefault) {
            propertiesMap = getSystemDefaultStyleAttributes(styleFamily);
            if (propertiesMap) {
                // All child properties should override any matching parent properties
                inheritedPropertiesMap = utils.mergeObjects(propertiesMap, inheritedPropertiesMap);
            }
        }

        return inheritedPropertiesMap;
    }
    this.getInheritedStyleAttributes = getInheritedStyleAttributes;

    /**
     * Get the name of the first common style in the parent style chain.
     * If none is found, null is returned and you should assume the Default style.
     * @param {!string} styleName
     * @return {!string|null}
     */
    this.getFirstCommonParentStyleNameOrSelf = function (styleName) {
        var automaticStyleElementList = odfContainer.rootElement.automaticStyles,
            styleElementList = odfContainer.rootElement.styles,
            styleElement;

        // first look for automatic style with the name
        styleElement = getStyleElement(styleName, "paragraph", [automaticStyleElementList]);
        while (styleElement) {
            styleName = styleElement.getAttributeNS(stylens, 'parent-style-name');
            styleElement = getStyleElement(styleName, "paragraph", [automaticStyleElementList]);
        }
        // then see if that style is in common styles
        styleElement = getStyleElement(styleName, "paragraph", [styleElementList]);
        if (!styleElement) {
            return null;
        }
        return styleName;
    };

    /**
     * Returns if there is an automatic or common paragraph style with the given name.
     * @param {!string} styleName
     * @return {!boolean}
     */
    this.hasParagraphStyle = function (styleName) {
        return Boolean(getStyleElement(styleName, "paragraph"));
    };

    /**
     * Builds up a style chain for a given node by climbing up all parent nodes and checking for style information
     * @param {!Node} node
     * @param {Object.<string, Array.<Object>>=} collectedChains Dictionary to add any new style chains to
     * @return {Array.<Object>|undefined}
     */
    function buildStyleChain(node, collectedChains) {
        var parent = /**@type{!Element}*/(node.nodeType === Node.TEXT_NODE
                  ? node.parentNode : node),
            nodeStyles,
            appliedStyles = [],
            /**@type{string}*/
            chainKey = '',
            foundContainer = false;
        while (parent) {
            if (!foundContainer && odfUtils.isGroupingElement(parent)) {
                foundContainer = true;
            }
            nodeStyles = styleInfo.determineStylesForNode(parent);
            if (nodeStyles) {
                appliedStyles.push(nodeStyles);
            }
            parent = /**@type{!Element}*/(parent.parentNode);
        }

        /**
         * @param {!Array.<!Object.<string,!Object.<string,number>>>} usedStyleMap
         */
        function chainStyles(usedStyleMap) {
            Object.keys(usedStyleMap).forEach(function (styleFamily) {
                Object.keys(usedStyleMap[styleFamily]).forEach(function (styleName) {
                    chainKey += '|' + styleFamily + ':' + styleName + '|';
                });
            });
        }
        if (foundContainer) {
            appliedStyles.forEach(chainStyles);
            if (collectedChains) {
                collectedChains[chainKey] = appliedStyles;
            }
        }

        return foundContainer ? appliedStyles : undefined;
    }

    /**
     * Takes a provided style chain and calculates the resulting inherited style, starting from the outer-most to the
     * inner-most style
     * @param {Array.<Object>} styleChain Ordered list starting from inner-most style to outer-most style
     * @return {Object}
     */
    function calculateAppliedStyle(styleChain) {
        var mergedChildStyle = { orderedStyles: [] };

        // The complete style is built up by starting at the base known style and merging each new entry
        // on top of it, so the inner-most style properties override the outer-most
        styleChain.forEach(function (elementStyleSet) {
            Object.keys(/**@type {!Object}*/(elementStyleSet)).forEach(function (styleFamily) {
                // Expect there to only be a single style for a given family per element (e.g., 1 text, 1 paragraph)
                var styleName = Object.keys(elementStyleSet[styleFamily])[0],
                    styleElement,
                    parentStyle,
                    displayName;

                styleElement = getStyleElement(styleName, styleFamily);
                if (styleElement) {
                    parentStyle = getInheritedStyleAttributes(/**@type {!Element}*/(styleElement));
                    mergedChildStyle = utils.mergeObjects(parentStyle, mergedChildStyle);
                    displayName = styleElement.getAttributeNS(stylens, 'display-name');
                } else {
                    runtime.log("No style element found for '" + styleName + "' of family '" + styleFamily + "'");
                }
                mergedChildStyle.orderedStyles.push({
                    name: styleName,
                    family: styleFamily,
                    displayName: displayName
                });
            });
        });
        return mergedChildStyle;
    }

    /**
     * Returns an array of all unique styles in the given text nodes
     * @param {!Array.<!CharacterData>} textNodes
     * @return {!Array.<Object>}
     */
    this.getAppliedStyles = function (textNodes) {
        var styleChains = {},
            styles = [];

        textNodes.forEach(function (n) {
            buildStyleChain(n, styleChains);
        });

        Object.keys(styleChains).forEach(function (key) {
            styles.push(calculateAppliedStyle(styleChains[key]));
        });
        return styles;
    };

    /**
     * Returns a the applied style to the current node
     * @param {!CharacterData} node
     * @return {Object|undefined}
     */
    this.getAppliedStylesForElement = function (node) {
        var styleChain;
        styleChain = buildStyleChain(node);
        return styleChain ? calculateAppliedStyle(styleChain) : undefined;
    };

    /**
     * Overrides the specific properties on the styleNode from the values in the supplied properties Object.
     * If a newStylePrefix is supplied, this method will automatically generate a unique name for the style node
     * @param {!Element} styleNode
     * @param {!Object.<string,!Object.<string,string>>} properties Prefix to put in front of new auto styles
     */
    this.updateStyle = function (styleNode, properties) {
        var fontName, fontFaceNode;

        domUtils.mapObjOntoNode(styleNode, properties, odf.Namespaces.lookupNamespaceURI);

        fontName = properties["style:text-properties"] && properties["style:text-properties"]["style:font-name"];
        if (fontName && !getFontMap().hasOwnProperty(fontName)) {
            fontFaceNode = styleNode.ownerDocument.createElementNS(stylens, 'style:font-face');
            fontFaceNode.setAttributeNS(stylens, 'style:name', fontName);
            fontFaceNode.setAttributeNS(svgns, 'svg:font-family', fontName);
            odfContainer.rootElement.fontFaceDecls.appendChild(fontFaceNode);
        }
    };

    /**
     * Returns true if the supplied style node is an automatic style
     * @param {!Node} styleNode
     * @return {!boolean}
     */
    function isAutomaticStyleElement(styleNode) {
        return styleNode.parentNode === odfContainer.rootElement.automaticStyles;
    }

    /**
     * Create a style object (JSON-equivalent) that is equivalent to inheriting from the parent
     * style and family, and applying the specified overrides.
     * This contains logic for simulating inheritance for automatic styles
     * @param {!string} parentStyleName
     * @param {!string} family
     * @param {!Object} overrides
     * @return {!Object}
     */
    this.createDerivedStyleObject = function(parentStyleName, family, overrides) {
        var originalStyleElement = /**@type{!Element}*/(getStyleElement(parentStyleName, family)),
            newStyleObject;
        runtime.assert(Boolean(originalStyleElement), "No style element found for '" + parentStyleName + "' of family '" + family + "'");
        if (isAutomaticStyleElement(originalStyleElement)) {
            // Automatic styles cannot be inherited from. The way to create a derived style is to clone it entirely
            newStyleObject = getStyleAttributes(originalStyleElement);
        } else {
            newStyleObject = { "style:parent-style-name" : parentStyleName };
        }
        newStyleObject["style:family"] =  family;
        utils.mergeObjects(newStyleObject, overrides);
        return newStyleObject;
    };

    /**
     * Get the default tab-stop distance defined for this document
     * See http://docs.oasis-open.org/office/v1.2/os/OpenDocument-v1.2-os-part1.html#property-style_tab-stop-distance
     * @return {?{value: !number, unit: !string}}
     */
    this.getDefaultTabStopDistance = function () {
        var defaultParagraph = getDefaultStyleElement('paragraph'),
            paragraphProperties = defaultParagraph && defaultParagraph.firstElementChild,
            tabStopDistance;
        while (paragraphProperties) {
            if (paragraphProperties.namespaceURI === stylens && paragraphProperties.localName === "paragraph-properties") {
                tabStopDistance = paragraphProperties.getAttributeNS(stylens, "tab-stop-distance");
            }
            paragraphProperties = paragraphProperties.nextElementSibling;
        }

        if (!tabStopDistance) {
            tabStopDistance =  "1.25cm"; // What is the default value for tab stops? Pulled this from LO 4.1.1
        }
        return odfUtils.parseNonNegativeLength(tabStopDistance);
    };

    /**
     * Gets the associated page layout style node for the given style and family.
     * @param {!string} styleName
     * @param {!string} styleFamily either 'paragraph' or 'table'
     * @return {?Element}
     */
    function getPageLayoutStyleElement(styleName, styleFamily) {
        var masterPageName, layoutName, pageLayoutElements, node, i,
            styleElement = getStyleElement(styleName, styleFamily);

        runtime.assert(styleFamily === "paragraph" || styleFamily === "table",
            "styleFamily has to be either paragraph or table");

        if (styleElement) {
            masterPageName = styleElement.getAttributeNS(stylens, "master-page-name") || "Standard";
            node = odfContainer.rootElement.masterStyles.lastElementChild;
            while (node) {
                if (node.getAttributeNS(stylens, "name") === masterPageName) {
                    break;
                }
                node = node.previousElementSibling;
            }

            layoutName = node.getAttributeNS(stylens, "page-layout-name");
            pageLayoutElements = domUtils.getElementsByTagNameNS(odfContainer.rootElement.automaticStyles, stylens, "page-layout");
            for (i = 0; i < pageLayoutElements.length; i += 1) {
                node = pageLayoutElements[i];
                if (node.getAttributeNS(stylens, "name") === layoutName) {
                    return /** @type {!Element} */(node);
                }
            }
        }
        return null;
    }

    /**
     * @param {!string} length
     * @param {?number} defaultValue
     * @return {?number}
     */
    function lengthInCm(length, defaultValue) {
        var result = odfUtils.parseLength(length),
            value = defaultValue;
        if (result) {
            switch (result.unit) {
                case "cm":
                    value = result.value;
                    break;
                case "mm":
                    value = result.value * 0.1;
                    break;
                case "in":
                    value = result.value * 2.54;
                    break;
                case "pt":
                    value = result.value * 0.035277778;
                    break;
                case "pc":
                case "px":
                case "em":
                    // length in pc, px and em is ignored, a default value will be used in this case.
                    // Seems this is how LO handles it
                    break;
                default:
                    runtime.log("Unit identifier: " + result.unit + " is not supported.");
                    break;
            }
        }
        return value;
    }

    /**
     * Gets the width and height of content area in centimeters.
     * @param {string} styleName
     * @param {string} styleFamily
     * @return {!{width: number, height: number}}
     */
    this.getContentSize = function(styleName, styleFamily) {
        var pageLayoutElement, props, printOrientation,
            defaultOrientedPageWidth, defaultOrientedPageHeight, pageWidth, pageHeight,
            margin, marginLeft, marginRight, marginTop, marginBottom,
            padding, paddingLeft, paddingRight, paddingTop, paddingBottom;

        pageLayoutElement = getPageLayoutStyleElement(styleName, styleFamily);
        if (!pageLayoutElement) {
            pageLayoutElement = getDirectChild(odfContainer.rootElement.styles,
                    stylens, "default-page-layout");
        }
        props = getDirectChild(pageLayoutElement, stylens,
                "page-layout-properties");
        if (props) {
            printOrientation = props.getAttributeNS(stylens, "print-orientation") || "portrait";
            // set page's default width and height based on print orientation
            if (printOrientation === "portrait") {
                defaultOrientedPageWidth  = defaultPageFormatSettings.width;
                defaultOrientedPageHeight = defaultPageFormatSettings.height;
            } else  {
                // swap the default width and height around in landscape
                defaultOrientedPageWidth = defaultPageFormatSettings.height;
                defaultOrientedPageHeight = defaultPageFormatSettings.width;
            }

            pageWidth = lengthInCm(props.getAttributeNS(fons, "page-width"), defaultOrientedPageWidth);
            pageHeight = lengthInCm(props.getAttributeNS(fons, "page-height"), defaultOrientedPageHeight);

            margin = lengthInCm(props.getAttributeNS(fons, "margin"), null);
            if (margin === null) {
                marginLeft = lengthInCm(props.getAttributeNS(fons, "margin-left"), defaultPageFormatSettings.margin);
                marginRight = lengthInCm(props.getAttributeNS(fons, "margin-right"), defaultPageFormatSettings.margin);
                marginTop = lengthInCm(props.getAttributeNS(fons, "margin-top"), defaultPageFormatSettings.margin);
                marginBottom = lengthInCm(props.getAttributeNS(fons, "margin-bottom"), defaultPageFormatSettings.margin);
            } else {
                marginLeft = marginRight = marginTop = marginBottom = margin;
            }

            padding = lengthInCm(props.getAttributeNS(fons, "padding"), null);
            if (padding === null) {
                paddingLeft = lengthInCm(props.getAttributeNS(fons, "padding-left"), defaultPageFormatSettings.padding);
                paddingRight = lengthInCm(props.getAttributeNS(fons, "padding-right"), defaultPageFormatSettings.padding);
                paddingTop = lengthInCm(props.getAttributeNS(fons, "padding-top"), defaultPageFormatSettings.padding);
                paddingBottom = lengthInCm(props.getAttributeNS(fons, "padding-bottom"), defaultPageFormatSettings.padding);
            } else {
                paddingLeft = paddingRight = paddingTop = paddingBottom = padding;
            }
        }
        return {
            width: pageWidth - marginLeft - marginRight - paddingLeft - paddingRight,
            height: pageHeight - marginTop - marginBottom - paddingTop - paddingBottom
        };
    };
};
