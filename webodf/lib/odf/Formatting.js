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
/*global odf, runtime, console*/

runtime.loadClass("odf.OdfContainer");

/**
 * @constructor
 */
odf.Formatting = function Formatting() {
    "use strict";
    var /**@type{odf.OdfContainer}*/ odfContainer,
        /**@type{odf.StyleInfo}*/ styleInfo = new odf.StyleInfo(),
        /**@const@type {!string}*/ svgns = odf.Namespaces.svgns,
        /**@const@type {!string}*/ stylens = odf.Namespaces.stylens;

    /**
     * Class that iterates over all elements that are part of the range.
     * @constructor
     * @param {!Range} range
     * @return {undefined}
     */
    function RangeElementIterator(range) {
        /**
         * @param {Node} parent
         * @param {!number} n
         * @return {Node}
         */
        function getNthChild(parent, n) {
            var c = parent && parent.firstChild;
            while (c && n) {
                c = c.nextSibling;
                n -= 1;
            }
            return c;
        }
        var start = getNthChild(range.startContainer, range.startOffset),
            end = getNthChild(range.endContainer, range.endOffset),
            current = start;
        /**
         * @return {Element|null}
         */
        this.next = function () {
            var c = current;
            if (c === null) {
                return c;
            }
            return null;
        };
    }

    /**
     * Recursively merge properties of two objects 
     */
    function mergeRecursive(obj1, obj2) {
        var p;
        for (p in obj2) {
            if (obj2.hasOwnProperty(p)) {
                try {
                    // Property in destination object set; update its value.
                    if (obj2[p].constructor === Object) {
                        obj1[p] = mergeRecursive(obj1[p], obj2[p]);
                    } else {
                        obj1[p] = obj2[p];
                    }
                } catch (e) {
                    // Property in destination object not set; create it and set its value.
                    obj1[p] = obj2[p];
                }
            }
        }
        return obj1;
    }

    /**
     * @param {!Element} element
     * @return {Element}
     */
    function getParentStyle(element) {
        var n = element.firstChild, e;
        if (n.nodeType === 1) { // Element
            e = /**@type{Element}*/(n);
            return e;
        }
        return null;
    }
    /**
     * @param {!Range} range
     * @return {!Array.<!Element>}
     */
    function getParagraphStyles(range) {
        var iter = new RangeElementIterator(range), e, styles = [];
        e = iter.next();
        while (e) {
            if (styleInfo.canElementHaveStyle("paragraph", e)) {
                styles.push(e);
            }
        }
        return styles;
    }

    /**
     * @param {!odf.OdfContainer} odfcontainer
     * @return {undefined}
     */
    this.setOdfContainer = function (odfcontainer) {
        odfContainer = odfcontainer;
    };

    /**
     * Returns a font face declarations map, where the key is the style:name and
     * the value is the svg:font-family or null, if none set but a svg:font-face-uri
     * @return {!Object.<string,string>}
     */
    this.getFontMap = function () {
        var fontFaceDecls = odfContainer.rootElement.fontFaceDecls,
            /**@type {!Object.<string,string>}*/
            fontFaceDeclsMap = {},
            node, name, family;

        node = fontFaceDecls && fontFaceDecls.firstChild;
        while (node) {
            if (node.nodeType === 1) {
                name = node.getAttributeNS(stylens, 'name');
                if (name) {
                    // add family name as value, or, if there is a
                    // font-face-uri, an empty string
                    family = node.getAttributeNS(svgns, 'font-family');
                    if (family || node.getElementsByTagNameNS(svgns, 'font-face-uri')[0]) {
                        fontFaceDeclsMap[name] = family;
                    }
                }
            }
            node = node.nextSibling;
        }

        return fontFaceDeclsMap;
    };
    /**
     * Loop over the <style:style> elements and place the attributes
     * style:name and style:display-name in an array.
     * @return {!Array}
     */
    this.getAvailableParagraphStyles = function () {
        var node = odfContainer.rootElement.styles && odfContainer.rootElement.styles.firstChild,
            p_family,
            p_name,
            p_displayName,
            paragraphStyles = [],
            style;
        while (node) {
            if (node.nodeType === 1 && node.localName === "style"
                    && node.namespaceURI === stylens) {
                style = node;
                p_family = style.getAttributeNS(stylens, 'family');
                if (p_family === "paragraph") {
                    p_name = style.getAttributeNS(stylens, 'name');
                    p_displayName = style.getAttributeNS(stylens, 'display-name') || p_name;
                    if (p_name && p_displayName) {
                        paragraphStyles.push({
                            name: p_name,
                            displayName: p_displayName
                        });
                    }
                }
            }
            node = node.nextSibling;
        }
        return paragraphStyles;
    };

    /**
     * Returns if the given style is used anywhere in the document.
     * @param {!Element} styleElement
     * @return {boolean}
     */
    this.isStyleUsed = function (styleElement) {
        var hasDerivedStyles, isUsed;

        hasDerivedStyles = styleInfo.hasDerivedStyles(odfContainer.rootElement, odf.Namespaces.resolvePrefix, styleElement);

        isUsed = new styleInfo.UsedStyleList(odfContainer.rootElement.styles).uses(styleElement)
            || new styleInfo.UsedStyleList(odfContainer.rootElement.automaticStyles).uses(styleElement)
            || new styleInfo.UsedStyleList(odfContainer.rootElement.body).uses(styleElement);

        return hasDerivedStyles || isUsed;
    };

    function getDefaultStyleElement(styleListElement, family) {
        var node = styleListElement.firstChild;

        while (node) {
            if (node.nodeType === 1
                    && node.namespaceURI === stylens
                    && node.localName === "default-style"
                    && node.getAttributeNS(stylens, 'family') === family) {
                return node;
            }
            node = node.nextSibling;
        }
        return null;
    }

    function getStyleElement(styleListElement, styleName, family) {
        var node = styleListElement.firstChild;

        while (node) {
            if (node.nodeType === 1
                    && node.namespaceURI === stylens
                    && node.localName === "style"
                    && node.getAttributeNS(stylens, 'family') === family
                    && node.getAttributeNS(stylens, 'name') === styleName) {
                return node;
            }
            node = node.nextSibling;
        }
        return null;
    }

    this.getStyleElement = getStyleElement;

    /**
     * Returns a JSON representation of the style attributes of a given style element
     * @param {!Node} styleNode
     * @return {Object}
     */
    function getStyleAttributes(styleNode) {
        var i,
            propertiesMap = {},
            propertiesNode = styleNode.firstChild;

        while (propertiesNode) {
            if (propertiesNode.nodeType === 1 && propertiesNode.namespaceURI === stylens) {
                propertiesMap[propertiesNode.nodeName] = {};
                for (i = 0; i < propertiesNode.attributes.length; i += 1) {
                    propertiesMap[propertiesNode.nodeName][propertiesNode.attributes[i].name] = propertiesNode.attributes[i].value;
                }
            }
            propertiesNode = propertiesNode.nextSibling;
        }
        return propertiesMap;
    }

    /**
     * Returns a JSON representation of the style attributes of a given style element, also containing attributes
     * inherited from it's ancestry - up to and including the default style for the family.
     * @param {!Element} styleListElement
     * @param {!Node} styleNode
     * @return {Object}
     */
    function getInheritedStyleAttributes(styleListElement, styleNode) {
        var i,
            parentStyleName,
            propertiesMap = {},
            inheritedPropertiesMap = {},
            node = styleNode;

        // Iterate through the style ancestry
        while (node) {
            propertiesMap = getStyleAttributes(node);
            inheritedPropertiesMap = mergeRecursive(propertiesMap, inheritedPropertiesMap);

            parentStyleName = node.getAttributeNS(stylens, 'parent-style-name');
            if (parentStyleName) {
                node = getStyleElement(styleListElement, parentStyleName, styleNode.getAttributeNS(stylens, 'family'));
            } else {
                node = null;
            }
        }

        // Now incorporate attributes from the default style
        propertiesMap = getStyleAttributes(getDefaultStyleElement(styleListElement, styleNode.getAttributeNS(stylens, 'family')));
        inheritedPropertiesMap = mergeRecursive(propertiesMap, inheritedPropertiesMap);

        return inheritedPropertiesMap;
    }

    this.getInheritedStyleAttributes = getInheritedStyleAttributes;

    /**
     * Get the name of the first named style in the parent style chain.
     * If none is found, null is returned and you should assume the Default style.
     * @param {!string} styleName
     * @return {!string|null}
     */
    this.getFirstNamedParentStyleNameOrSelf = function (styleName) {
        var automaticStyleElementList = odfContainer.rootElement.automaticStyles,
            styleElementList = odfContainer.rootElement.styles,
            styleElement;

        // first look for automatic style with the name
        while ((styleElement = getStyleElement(automaticStyleElementList, styleName, "paragraph")) !== null) {
            styleName = styleElement.getAttributeNS(stylens, 'parent-style-name');
        }
        // then see if that style is in named styles
        styleElement = getStyleElement(styleElementList, styleName, "paragraph");
        if (!styleElement) {
            return null;
        }
        return styleName;
    };

    /**
     * Returns if there is an automatic or named paragraph style with the given name.
     * @param {!string} styleName
     * @return {!boolean}
     */
    this.hasParagraphStyle = function (styleName) {
        return (getStyleElement(odfContainer.rootElement.automaticStyles, styleName, "paragraph") ||
                getStyleElement(odfContainer.rootElement.styles, styleName, "paragraph"));
    };

    /**
     * Get the value of the attribute with the given name from the style with the given name
     * or, if not set there, from the first style in the chain of parent styles where it is set.
     * If the attribute is not found, null is returned.
     * @param {!string} styleName
     * @param {!string} attributeNameNS
     * @param {!string} attributeName
     * @return {!string|null}
     */
    this.getParagraphStyleAttribute = function (styleName, attributeNameNS, attributeName) {
        var automaticStyleElementList = odfContainer.rootElement.automaticStyles,
            styleElementList = odfContainer.rootElement.styles,
            styleElement,
            attributeValue;

        // first look for automatic style with the attribute
        while ((styleElement = getStyleElement(automaticStyleElementList, styleName, "paragraph")) !== null) {
            attributeValue = styleElement.getAttributeNS(attributeNameNS, attributeName);
            if (attributeValue) {
                return attributeValue;
            }
            styleName = styleElement.getAttributeNS(stylens, 'parent-style-name');
        }
        // then see if that style is in named styles
        while ((styleElement = getStyleElement(styleElementList, styleName, "paragraph")) !== null) {
            attributeValue = styleElement.getAttributeNS(attributeNameNS, attributeName);
            if (attributeValue) {
                return attributeValue;
            }
            styleName = styleElement.getAttributeNS(stylens, 'parent-style-name');
        }
        return null;
    };
};
