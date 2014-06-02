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

/*global odf, runtime, xmldom, core, document*/

/**
 * @constructor
 */
odf.Style2CSS = function Style2CSS() {
    "use strict";
    var // helper constants
        /**@const
           @type{!string}*/
        drawns = odf.Namespaces.drawns,
        /**@const
           @type{!string}*/
        fons = odf.Namespaces.fons,
        /**@const
           @type{!string}*/
        officens = odf.Namespaces.officens,
        /**@const
           @type{!string}*/
        stylens = odf.Namespaces.stylens,
        /**@const
           @type{!string}*/
        svgns = odf.Namespaces.svgns,
        /**@const
           @type{!string}*/
        tablens = odf.Namespaces.tablens,
        /**@const
           @type{!string}*/
        xlinkns = odf.Namespaces.xlinkns,
        /**@const
           @type{!string}*/
        presentationns = odf.Namespaces.presentationns,
        domUtils = new core.DomUtils(),

        /**@const
           @type{!Object.<string,string>}*/
        familynamespaceprefixes = {
            'graphic': 'draw',
            'drawing-page': 'draw',
            'paragraph': 'text',
            'presentation': 'presentation',
            'ruby': 'text',
            'section': 'text',
            'table': 'table',
            'table-cell': 'table',
            'table-column': 'table',
            'table-row': 'table',
            'text': 'text',
            'list': 'text',
            'page': 'office'
        },

        /**@const
           @type{!Object.<string,!Array.<!string>>}*/
        familytagnames = {
            'graphic': ['circle', 'connected', 'control', 'custom-shape',
                'ellipse', 'frame', 'g', 'line', 'measure', 'page',
                'page-thumbnail', 'path', 'polygon', 'polyline', 'rect',
                'regular-polygon' ],
            'paragraph': ['alphabetical-index-entry-template', 'h',
                'illustration-index-entry-template', 'index-source-style',
                'object-index-entry-template', 'p',
                'table-index-entry-template', 'table-of-content-entry-template',
                'user-index-entry-template'],
            'presentation': ['caption', 'circle', 'connector', 'control',
                'custom-shape', 'ellipse', 'frame', 'g', 'line', 'measure',
                'page-thumbnail', 'path', 'polygon', 'polyline', 'rect',
                'regular-polygon'],
            'drawing-page': ['caption', 'circle', 'connector', 'control', 'page',
                'custom-shape', 'ellipse', 'frame', 'g', 'line', 'measure',
                'page-thumbnail', 'path', 'polygon', 'polyline', 'rect',
                'regular-polygon'],
            'ruby': ['ruby', 'ruby-text'],
            'section': ['alphabetical-index', 'bibliography',
                'illustration-index', 'index-title', 'object-index', 'section',
                'table-of-content', 'table-index', 'user-index'],
            'table': ['background', 'table'],
            'table-cell': ['body', 'covered-table-cell', 'even-columns',
                'even-rows', 'first-column', 'first-row', 'last-column',
                'last-row', 'odd-columns', 'odd-rows', 'table-cell'],
            'table-column': ['table-column'],
            'table-row': ['table-row'],
            'text': ['a', 'index-entry-chapter', 'index-entry-link-end',
                'index-entry-link-start', 'index-entry-page-number',
                'index-entry-span', 'index-entry-tab-stop', 'index-entry-text',
                'index-title-template', 'linenumbering-configuration',
                'list-level-style-number', 'list-level-style-bullet',
                'outline-level-style', 'span'],
            'list': ['list-item']
        },

        /**@const
           @type{!Array.<!Array.<!string>>}*/
        textPropertySimpleMapping = [
            [ fons, 'color', 'color' ],
            // this sets the element background, not just the text background
            [ fons, 'background-color', 'background-color' ],
            [ fons, 'font-weight', 'font-weight' ],
            [ fons, 'font-style', 'font-style' ]
        ],

        /**@const
           @type{!Array.<!Array.<!string>>}*/
        bgImageSimpleMapping = [
            [ stylens, 'repeat', 'background-repeat' ]
        ],

        /**@const
           @type{!Array.<!Array.<!string>>}*/
        paragraphPropertySimpleMapping = [
            [ fons, 'background-color', 'background-color' ],
            [ fons, 'text-align', 'text-align' ],
            [ fons, 'text-indent', 'text-indent' ],
            [ fons, 'padding', 'padding' ],
            [ fons, 'padding-left', 'padding-left' ],
            [ fons, 'padding-right', 'padding-right' ],
            [ fons, 'padding-top', 'padding-top' ],
            [ fons, 'padding-bottom', 'padding-bottom' ],
            [ fons, 'border-left', 'border-left' ],
            [ fons, 'border-right', 'border-right' ],
            [ fons, 'border-top', 'border-top' ],
            [ fons, 'border-bottom', 'border-bottom' ],
            [ fons, 'margin', 'margin' ],
            [ fons, 'margin-left', 'margin-left' ],
            [ fons, 'margin-right', 'margin-right' ],
            [ fons, 'margin-top', 'margin-top' ],
            [ fons, 'margin-bottom', 'margin-bottom' ],
            [ fons, 'border', 'border' ]
        ],

        /**@const
           @type{!Array.<!Array.<!string>>}*/
        graphicPropertySimpleMapping = [
            [ fons, 'background-color', 'background-color'],
            [ fons, 'min-height', 'min-height' ],
            [ drawns, 'stroke', 'border' ],
            [ svgns, 'stroke-color', 'border-color' ],
            [ svgns, 'stroke-width', 'border-width' ],
            [ fons, 'border', 'border' ],
            [ fons, 'border-left', 'border-left' ],
            [ fons, 'border-right', 'border-right' ],
            [ fons, 'border-top', 'border-top' ],
            [ fons, 'border-bottom', 'border-bottom' ]
        ],

        /**@const
           @type{!Array.<!Array.<!string>>}*/
        tablecellPropertySimpleMapping = [
            [ fons, 'background-color', 'background-color' ],
            [ fons, 'border-left', 'border-left' ],
            [ fons, 'border-right', 'border-right' ],
            [ fons, 'border-top', 'border-top' ],
            [ fons, 'border-bottom', 'border-bottom' ],
            [ fons, 'border', 'border' ]
        ],

        /**@const
           @type{!Array.<!Array.<!string>>}*/
        tablecolumnPropertySimpleMapping = [
            [ stylens, 'column-width', 'width' ]
        ],

        /**@const
           @type{!Array.<!Array.<!string>>}*/
        tablerowPropertySimpleMapping = [
            [ stylens, 'row-height', 'height' ],
            [ fons, 'keep-together', null ]
        ],

        /**@const
           @type{!Array.<!Array.<!string>>}*/
        tablePropertySimpleMapping = [
            [ stylens, 'width', 'width' ],
            [ fons, 'margin-left', 'margin-left' ],
            [ fons, 'margin-right', 'margin-right' ],
            [ fons, 'margin-top', 'margin-top' ],
            [ fons, 'margin-bottom', 'margin-bottom' ]
        ],

        /**@const
           @type{!Array.<!Array.<!string>>}*/
        pageContentPropertySimpleMapping = [
            [ fons, 'background-color', 'background-color' ],
            [ fons, 'padding', 'padding' ],
            [ fons, 'padding-left', 'padding-left' ],
            [ fons, 'padding-right', 'padding-right' ],
            [ fons, 'padding-top', 'padding-top' ],
            [ fons, 'padding-bottom', 'padding-bottom' ],
            [ fons, 'border', 'border' ],
            [ fons, 'border-left', 'border-left' ],
            [ fons, 'border-right', 'border-right' ],
            [ fons, 'border-top', 'border-top' ],
            [ fons, 'border-bottom', 'border-bottom' ],
            [ fons, 'margin', 'margin' ],
            [ fons, 'margin-left', 'margin-left' ],
            [ fons, 'margin-right', 'margin-right' ],
            [ fons, 'margin-top', 'margin-top' ],
            [ fons, 'margin-bottom', 'margin-bottom' ]
        ],

        /**@const
           @type{!Array.<!Array.<!string>>}*/
        pageSizePropertySimpleMapping = [
            [ fons, 'page-width', 'width' ],
            [ fons, 'page-height', 'height' ]
        ],

        /**@const
           @type{!Object.<!boolean>}*/
        borderPropertyMap = {
            'border': true,
            'border-left': true,
            'border-right': true,
            'border-top': true,
            'border-bottom': true,
            'stroke-width': true
        },

        // A font-face declaration map, to be populated once style2css is called.
        /**@type{!Object.<string,string>}*/
        fontFaceDeclsMap = {},
        utils = new odf.OdfUtils(),
        documentType,
        odfRoot,
        defaultFontSize,
        xpath = xmldom.XPath,
        cssUnits = new core.CSSUnits();

    /**
     * @param {!string} family
     * @param {!string} name
     * @return {?string}
     */
    function createSelector(family, name) {
        var prefix = familynamespaceprefixes[family],
            namepart,
            selector;
        if (prefix === undefined) {
            return null;
        }

        // If there is no name, it is a default style, in which case style-name shall be used without a value
        if (name) {
            namepart = '[' + prefix + '|style-name="' + name + '"]';
        } else {
            namepart = '';
        }
        if (prefix === 'presentation') {
            prefix = 'draw';
            if (name) {
                namepart = '[presentation|style-name="' + name + '"]';
            } else {
                namepart = '';
            }
        }
        selector = prefix + '|' + familytagnames[family].join(
            namepart + ',' + prefix + '|'
        ) + namepart;
        return selector;
    }
    /**
     * @param {!string} family
     * @param {!string} name
     * @param {!odf.StyleTreeNode} node
     * @return {!Array.<string>}
     */
    function getSelectors(family, name, node) {
        var selectors = [], ss,
            derivedStyles = node.derivedStyles,
            /**@type{string}*/
            n;
        ss = createSelector(family, name);
        if (ss !== null) {
            selectors.push(ss);
        }
        for (n in derivedStyles) {
            if (derivedStyles.hasOwnProperty(n)) {
                ss = getSelectors(family, n, derivedStyles[n]);
                selectors = selectors.concat(ss);
            }
        }
        return selectors;
    }
    /**
     * Make sure border width is no less than 1px wide; otherwise border is not rendered.
     * Only have problems with point unit at the moment. Please add more rule if needed.
     * @param {!string} value a string contains border attributes eg. 1pt solid black or 1px
     * @return {!string}
     */
    function fixBorderWidth(value) {
        var index = value.indexOf(' '),
            width, theRestOfBorderAttributes;

        if (index !== -1) {
            width = value.substring(0, index);
            theRestOfBorderAttributes = value.substring(index); // everything after the width attribute
        } else {
            width = value;
            theRestOfBorderAttributes = '';
        }

        width = utils.parseLength(width);
        // According to CSS 2.1, 1px is equal to 0.75pt http://www.w3.org/TR/CSS2/syndata.html#length-units
        if (width && width.unit === 'pt' && width.value < 0.75) {
            value = '0.75pt' + theRestOfBorderAttributes;
        }
        return value;
    }
    /**
     * @param {!Element} props
     * @param {!Array.<!Array.<!string>>} mapping
     * @return {!string}
     */
    function applySimpleMapping(props, mapping) {
        var rule = '', i, r, value;
        for (i = 0; i < mapping.length; i += 1) {
            r = mapping[i];
            value = props.getAttributeNS(r[0], r[1]);

            if (value) {
                value = value.trim();

                if (borderPropertyMap.hasOwnProperty(r[1])) {
                    value = fixBorderWidth(value);
                }
                if (r[2]) {
                    rule += r[2] + ':' + value + ';';
                }
            }
        }
        return rule;
    }

    /**
     * Returns the font size attribute value from the text properties of a style node
     * @param {?Element} styleNode
     * @return {?{value: !number, unit: !string}}
     */
    function getFontSize(styleNode) {
        var props = domUtils.getDirectChild(styleNode, stylens, 'text-properties');
        if (props) {
            return utils.parseFoFontSize(props.getAttributeNS(fons, 'font-size'));
        }
        return null;
    }

    /**
     * Returns the parent style node of a given style node
     * @param {!Element} styleNode
     * @return {Element}
     */
    function getParentStyleNode(styleNode) {
        var parentStyleName = '',
            parentStyleFamily = '',
            parentStyleNode = null,
            xp;

        if (styleNode.localName === 'default-style') {
            return null;
        }

        parentStyleName = styleNode.getAttributeNS(stylens, 'parent-style-name');
        parentStyleFamily = styleNode.getAttributeNS(stylens, 'family');
        
        if (parentStyleName) {
            xp = "//style:*[@style:name='" + parentStyleName + "'][@style:family='" + parentStyleFamily + "']";
        } else {
            xp = "//style:default-style[@style:family='" + parentStyleFamily + "']";
        }
        parentStyleNode = xpath.getODFElementsWithXPath(/**@type{!Element}*/(odfRoot), xp, odf.Namespaces.lookupNamespaceURI)[0];
        return parentStyleNode;
    }
    /**
     * @param {!Element} props
     * @return {!string}
     */
    function getTextProperties(props) {
        var rule = '', fontName, fontSize, value, textDecoration = '',
            fontSizeRule = '',
            sizeMultiplier = 1,
            parentStyle;

        rule += applySimpleMapping(props, textPropertySimpleMapping);

        value = props.getAttributeNS(stylens, 'text-underline-style');
        if (value === 'solid') {
            textDecoration += ' underline';
        }
        value = props.getAttributeNS(stylens, 'text-line-through-style');
        if (value === 'solid') {
            textDecoration += ' line-through';
        }

        if (textDecoration.length) {
            textDecoration = 'text-decoration:' + textDecoration + ';';
            rule += textDecoration;
        }

        fontName = props.getAttributeNS(stylens, 'font-name')
            || props.getAttributeNS(fons, 'font-family');
        if (fontName) {
            value = fontFaceDeclsMap[fontName];
            // TODO: use other information from style:font-face, like style:font-family-generic
            rule += 'font-family: ' + (value || fontName) + ';';
        }

        parentStyle = /**@type{!Element}*/(props.parentNode);
        fontSize = getFontSize(parentStyle);
        // This is actually the font size of the current style.
        if (!fontSize) {
            return rule;
        }

        while (parentStyle) {
            fontSize = getFontSize(parentStyle);
            if (fontSize) {
                // If the current style's font size is a non-% value, then apply the multiplier to get the child style (with the %)'s
                // actual font size. And now we can stop crawling up the style ancestry since we have a concrete font size.
                if (fontSize.unit !== '%') {
                    fontSizeRule = 'font-size: ' + (fontSize.value * sizeMultiplier) + fontSize.unit + ';';
                    break;
                }
                // If we got a % font size for the current style, then update the multiplier with it's 'normalized' multiplier
                sizeMultiplier *= (fontSize.value / 100);
            }
            // Crawl up the style ancestry
            parentStyle = getParentStyleNode(parentStyle);
        }

        // If there was nothing in the ancestry that specified a concrete font size, just apply the multiplier onto the page's default font size.
        if (!fontSizeRule) {
            fontSizeRule = 'font-size: ' + parseFloat(defaultFontSize) * sizeMultiplier + cssUnits.getUnits(defaultFontSize) + ';';
        }

        rule += fontSizeRule;
        return rule;
    }
    /**
     * @param {!Element} props <style:paragraph-properties/>
     * @return {!string}
     */
    function getParagraphProperties(props) {
        var rule = '', bgimage, url, lineHeight;
        rule += applySimpleMapping(props, paragraphPropertySimpleMapping);
        bgimage = domUtils.getDirectChild(props, stylens, 'background-image');
        if (bgimage) {
            url = bgimage.getAttributeNS(xlinkns, 'href');
            if (url) {
                rule += "background-image: url('odfkit:" + url + "');";
                //rule += "background-repeat: repeat;"; //FIXME test
                rule += applySimpleMapping(bgimage, bgImageSimpleMapping);
            }
        }

        lineHeight = props.getAttributeNS(fons, 'line-height');
        if (lineHeight && lineHeight !== 'normal') {
            lineHeight = utils.parseFoLineHeight(lineHeight);
            if (lineHeight.unit !== '%') {
                rule += 'line-height: ' + lineHeight.value + lineHeight.unit + ';';
            } else {
                rule += 'line-height: ' + lineHeight.value / 100 + ';';
            }
        }

        return rule;
    }

/*jslint unparam: true*/
    /**
     * @param {*} m
     * @param {string} r
     * @param {string} g
     * @param {string} b
     * @return {string}
     */
    function matchToRgb(m, r, g, b) {
        return r + r + g + g + b + b;
    }
/*jslint unparam: false*/

    /**
     * @param {!string} hex
     * @return {?{ r: number, g: number, b: number}}
     */
    function hexToRgb(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var result,
            shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, matchToRgb);

        result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * @param {string} n
     * @return {boolean}
     */
    function isNumber(n) {
        return !isNaN(parseFloat(n));
    }

   /**
     * @param {!Element} props
     * @return {string}
     */
    function getGraphicProperties(props) {
        var rule = '', alpha, bgcolor, fill;

        rule += applySimpleMapping(props, graphicPropertySimpleMapping);
        alpha = props.getAttributeNS(drawns, 'opacity');
        fill = props.getAttributeNS(drawns, 'fill');
        bgcolor = props.getAttributeNS(drawns, 'fill-color');

        if (fill === 'solid' || fill === 'hatch') {
            if (bgcolor && bgcolor !== 'none') {
                alpha = isNumber(alpha) ? parseFloat(alpha) / 100 : 1;
                bgcolor = hexToRgb(bgcolor);
                if (bgcolor) {
                    rule += "background-color: rgba("
                        + bgcolor.r + ","
                        + bgcolor.g + ","
                        + bgcolor.b + ","
                        + alpha + ");";
                }
            } else {
                rule += "background: none;";
            }
        } else if (fill === "none") {
            rule += "background: none;";
        }

        return rule;
    }
   /**
     * @param {!Element} props
     * @return {string}
     */
    function getDrawingPageProperties(props) {
        var rule = '';

        rule += applySimpleMapping(props, graphicPropertySimpleMapping);
        if (props.getAttributeNS(presentationns, 'background-visible') === 'true') {
            rule += "background: none;";
        }
        return rule;
    }
    /**
     * @param {!Element} props
     * @return {string}
     */
    function getTableCellProperties(props) {
        var rule = '';
        rule += applySimpleMapping(props, tablecellPropertySimpleMapping);
        return rule;
    }
    /**
     * @param {!Element} props
     * @return {string}
     */
    function getTableRowProperties(props) {
        var rule = '';
        rule += applySimpleMapping(props, tablerowPropertySimpleMapping);
        return rule;
    }
    /**
     * @param {!Element} props
     * @return {string}
     */
    function getTableColumnProperties(props) {
        var rule = '';
        rule += applySimpleMapping(props, tablecolumnPropertySimpleMapping);
        return rule;
    }
    /**
     * @param {!Element} props
     * @return {string}
     */
    function getTableProperties(props) {
        var rule = '', borderModel;
        rule += applySimpleMapping(props, tablePropertySimpleMapping);
        borderModel = props.getAttributeNS(tablens, 'border-model');

        if (borderModel === 'collapsing') {
            rule += 'border-collapse:collapse;';
        } else if (borderModel === 'separating') {
            rule += 'border-collapse:separate;';
        }

        return rule;
    }
    /**
     * @param {!CSSStyleSheet} sheet
     * @param {string} family
     * @param {string} name
     * @param {!odf.StyleTreeNode} node
     * @return {undefined}
     */
    function addStyleRule(sheet, family, name, node) {
        var selectors = getSelectors(family, name, node),
            selector = selectors.join(','),
            rule = '',
            properties;
        properties = domUtils.getDirectChild(node.element, stylens, 'text-properties');
        if (properties) {
            rule += getTextProperties(properties);
        }
        properties = domUtils.getDirectChild(node.element,
                stylens, 'paragraph-properties');
        if (properties) {
            rule += getParagraphProperties(properties);
        }
        properties = domUtils.getDirectChild(node.element,
                 stylens, 'graphic-properties');
        if (properties) {
            rule += getGraphicProperties(properties);
        }
        properties = domUtils.getDirectChild(node.element,
                 stylens, 'drawing-page-properties');
        if (properties) {
            rule += getDrawingPageProperties(properties);
        }
        properties = domUtils.getDirectChild(node.element,
                 stylens, 'table-cell-properties');
        if (properties) {
            rule += getTableCellProperties(properties);
        }
        properties = domUtils.getDirectChild(node.element,
                 stylens, 'table-row-properties');
        if (properties) {
            rule += getTableRowProperties(properties);
        }
        properties = domUtils.getDirectChild(node.element,
                 stylens, 'table-column-properties');
        if (properties) {
            rule += getTableColumnProperties(properties);
        }
        properties = domUtils.getDirectChild(node.element,
                 stylens, 'table-properties');
        if (properties) {
            rule += getTableProperties(properties);
        }
        if (rule.length === 0) {
            return;
        }
        rule = selector + '{' + rule + '}';
        sheet.insertRule(rule, sheet.cssRules.length);
    }

    /**
     * @param {!CSSStyleSheet} sheet
     * @param {!Element} node <style:page-layout/>/<style:default-page-layout/>
     * @return {undefined}
     */
    function addPageStyleRules(sheet, node) {
        var rule = '', imageProps, url,
            contentLayoutRule = '',
            pageSizeRule = '',
            props = domUtils.getDirectChild(node, stylens, 'page-layout-properties'),
            stylename,
            masterStyles,
            e,
            masterStyleName;
        if (!props) {
            return;
        }
        stylename = node.getAttributeNS(stylens, 'name');

        rule += applySimpleMapping(props, pageContentPropertySimpleMapping);
        imageProps = domUtils.getDirectChild(props, stylens, 'background-image');
        if (imageProps) {
            url = imageProps.getAttributeNS(xlinkns, 'href');
            if (url) {
                rule += "background-image: url('odfkit:" + url + "');";
                //rule += "background-repeat: repeat;"; //FIXME test
                rule += applySimpleMapping(imageProps, bgImageSimpleMapping);
            }
        }

        if (documentType === 'presentation') {
            masterStyles = domUtils.getDirectChild(/**@type{!Element}*/(node.parentNode.parentNode), officens, 'master-styles');
            e = masterStyles && masterStyles.firstElementChild;
            while (e) {
                // Generate CSS for all the pages that use the master page that use this page-layout
                if (e.namespaceURI === stylens && e.localName === "master-page"
                        && e.getAttributeNS(stylens, 'page-layout-name')
                            === stylename) {
                    masterStyleName = e.getAttributeNS(stylens, 'name');

                    contentLayoutRule = 'draw|page[draw|master-page-name=' + masterStyleName + '] {' + rule + '}';
                    pageSizeRule = 'office|body, draw|page[draw|master-page-name=' + masterStyleName + '] {'
                            + applySimpleMapping(props, pageSizePropertySimpleMapping)
                            + ' }';

                    sheet.insertRule(contentLayoutRule, sheet.cssRules.length);
                    sheet.insertRule(pageSizeRule, sheet.cssRules.length);
                }
                e = e.nextElementSibling;
            }

        } else if (documentType === 'text') {
            contentLayoutRule = 'office|text {' + rule + '}';
            rule = '';

            // TODO: We want to use the simpleMapping for ODTs, but not until we have pagination.
            // So till then, set only the width.
            //rule += applySimpleMapping(props, pageSizePropertySimpleMapping);
            pageSizeRule = 'office|body {'
                + 'width: ' + props.getAttributeNS(fons, 'page-width') + ';'
                + '}';

            sheet.insertRule(contentLayoutRule, sheet.cssRules.length);
            sheet.insertRule(pageSizeRule, sheet.cssRules.length);
        }

    }

    /**
     * @param {!CSSStyleSheet} sheet
     * @param {string} family
     * @param {string} name
     * @param {!odf.StyleTreeNode} node
     * @return {undefined}
     */
    function addRule(sheet, family, name, node) {
        if (family === "page") {
            addPageStyleRules(sheet, node.element);
        } else {
            addStyleRule(sheet, family, name, node);
        }
    }
    /**
     * @param {!CSSStyleSheet} sheet
     * @param {string} family
     * @param {string} name
     * @param {!odf.StyleTreeNode} node
     * @return {undefined}
     */
    function addRules(sheet, family, name, node) {
        addRule(sheet, family, name, node);
        var /**@type{string}*/
            n;
        for (n in node.derivedStyles) {
            if (node.derivedStyles.hasOwnProperty(n)) {
                addRules(sheet, family, n, node.derivedStyles[n]);
            }
        }
    }

    // css vs odf styles
    // ODF styles occur in families. A family is a group of odf elements to
    // which an element applies. ODF families can be mapped to a group of css
    // elements

    /**
     * @param {!string} doctype
     * @param {!Element} rootNode
     * @param {!CSSStyleSheet} stylesheet
     * @param {!Object.<string,string>} fontFaceMap
     * @param {!Object.<string,!Object.<string,!odf.StyleTreeNode>>} styleTree
     * @return {undefined}
     */
    this.style2css = function (doctype, rootNode, stylesheet, fontFaceMap, styleTree) {
        var tree, rule,
            /**@type{string}*/
            name,
            /**@type{string}*/
            family;

        odfRoot = rootNode;

        // make stylesheet empty
        while (stylesheet.cssRules.length) {
            stylesheet.deleteRule(stylesheet.cssRules.length - 1);
        }

        // add @odfRoot namespace rules
        odf.Namespaces.forEachPrefix(function (prefix, ns) {
            rule = '@namespace ' + prefix + ' url(' + ns + ');';
            try {
                stylesheet.insertRule(rule, stylesheet.cssRules.length);
            } catch (/**@type{!DOMException}*/ignore) {
                // WebKit can throw an exception here, but it will have
                // retained the namespace declarations anyway.
            }
        });

        fontFaceDeclsMap = fontFaceMap;
        documentType = doctype;
        defaultFontSize = runtime.getWindow().getComputedStyle(document.body, null).getPropertyValue('font-size') || '12pt';

        // add the various styles
        for (family in familynamespaceprefixes) {
            if (familynamespaceprefixes.hasOwnProperty(family)) {
                tree = styleTree[family];
                for (name in tree) {
                    if (tree.hasOwnProperty(name)) {
                        addRules(stylesheet, family, name, tree[name]);
                    }
                }
            }
        }
    };
};
