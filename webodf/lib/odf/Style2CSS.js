/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
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
/*global odf, runtime*/
/**
 * @constructor
 */
odf.Style2CSS = function Style2CSS() {
    "use strict";
    // helper constants
    var xlinkns = 'http://www.w3.org/1999/xlink',
        drawns = "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
        fons = "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
        officens = "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
        presentationns = "urn:oasis:names:tc:opendocument:xmlns:presentation:1.0",
        stylens = "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
        svgns = "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
        tablens = "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
        textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
        xmlns = "http://www.w3.org/XML/1998/namespace",
        namespaces = {
            "draw": drawns,
            "fo": fons,
            "office": officens,
            "presentation": presentationns,
            "style": stylens,
            "svg": svgns,
            "table": tablens,
            "text": textns,
            "xlink": xlinkns,
            "xml": xmlns
        },

        familynamespaceprefixes = {
            'graphic': 'draw',
            'paragraph': 'text',
            'presentation': 'presentation',
            'ruby': 'text',
            'section': 'text',
            'table': 'table',
            'table-cell': 'table',
            'table-column': 'table',
            'table-row': 'table',
            'text': 'text',
            'list': 'text'
        },

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

        textPropertySimpleMapping = [
            [ fons, 'color', 'color' ],
            // this sets the element background, not just the text background
            [ fons, 'background-color', 'background-color' ],
            [ fons, 'font-weight', 'font-weight' ],
            [ fons, 'font-style', 'font-style' ],
            [ fons, 'font-size', 'font-size' ]
        ],

        bgImageSimpleMapping = [
            [ stylens, 'repeat', 'background-repeat' ]
        ],

        paragraphPropertySimpleMapping = [
            [ fons, 'background-color', 'background-color' ],
            [ fons, 'text-align', 'text-align' ],
            [ fons, 'padding-left', 'padding-left' ],
            [ fons, 'padding-right', 'padding-right' ],
            [ fons, 'padding-top', 'padding-top' ],
            [ fons, 'padding-bottom', 'padding-bottom' ],
            [ fons, 'border-left', 'border-left' ],
            [ fons, 'border-right', 'border-right' ],
            [ fons, 'border-top', 'border-top' ],
            [ fons, 'border-bottom', 'border-bottom' ],
            [ fons, 'margin-left', 'margin-left' ],
            [ fons, 'margin-right', 'margin-right' ],
            [ fons, 'margin-top', 'margin-top' ],
            [ fons, 'margin-bottom', 'margin-bottom' ],
            [ fons, 'border', 'border' ]
        ],

        graphicPropertySimpleMapping = [
            [ drawns, 'fill-color', 'background-color' ],
            [ drawns, 'fill', 'background' ],
            [ fons, 'min-height', 'min-height' ],
            [ drawns, 'stroke', 'border' ],
            [ svgns, 'stroke-color', 'border-color' ]
        ],

        tablecellPropertySimpleMapping = [
            [ fons, 'background-color', 'background-color' ],
            [ fons, 'border-left', 'border-left' ],
            [ fons, 'border-right', 'border-right' ],
            [ fons, 'border-top', 'border-top' ],
            [ fons, 'border-bottom', 'border-bottom' ],
            [ fons, 'border', 'border' ]
        ],

        tablecolumnPropertySimpleMapping = [
            [ stylens, 'column-width', 'width' ]
        ],

        tablerowPropertySimpleMapping = [
            [ stylens, 'row-height', 'height' ],
            [ fons, 'keep-together', null ]
        ],

        tablePropertySimpleMapping = [
            [ stylens, 'width', 'width' ],
            [ fons, 'margin-left', 'margin-left' ],
            [ fons, 'margin-right', 'margin-right' ],
            [ fons, 'margin-top', 'margin-top' ],
            [ fons, 'margin-bottom', 'margin-bottom' ]
        ],

        // A font-face declaration map, to be populated once style2css is called.
        fontFaceDeclsMap = {};

    // helper functions
    /**
     * @param {string} prefix
     * @return {string}
     */
    function namespaceResolver(prefix) {
        return namespaces[prefix] || null;
    }
    /**
     * @param {!Document} doc
     * @param {!Element} stylesnode
     * @return {!Object}
     */
    function getStyleMap(doc, stylesnode) {
        // put all style elements in a hash map by family and name
        var stylemap = {}, node, name, family, map;
        if (!stylesnode) {
            return stylemap;
        }
        node = stylesnode.firstChild;
        while (node) {
            if (node.namespaceURI === stylens &&
                    ((node.localName === 'style')  || (node.localName === 'default-style'))) {
                family = node.getAttributeNS(stylens, 'family');
            } else if (node.namespaceURI === textns &&
                    node.localName === 'list-style') {
                family = "list";
            }
            name = family && node.getAttributeNS &&
                node.getAttributeNS(stylens, 'name');
            
            if (!stylemap[family]) {
                stylemap[family] = {};
            }

            if (name) {
                stylemap[family][name] = node;
            } else {
                // For a default style, there is no name
                stylemap[family][''] = node;
            }

            node = node.nextSibling;
        }

        return stylemap;
    }
    /**
     * @param {?Object} stylestree
     * @param {?string} name
     * @return {?string}
     */
    function findStyle(stylestree, name) {
        if (!name || !stylestree) {
            return null;
        }
        if (stylestree[name]) {
            return stylestree[name];
        }
        var derivedStyles = stylestree.derivedStyles,
            n,
            style;
        for (n in stylestree) {
            if (stylestree.hasOwnProperty(n)) {
                style = findStyle(stylestree[n].derivedStyles, name);
                if (style) {
                    return style;
                }
            }
        }
        return null;
    }
    /**
     * @param {!string} stylename
     * @param {!Object} stylesmap
     * @param {!Object} stylestree
     * @return {undefined}
     */
    function addStyleToStyleTree(stylename, stylesmap, stylestree) {
        var style = stylesmap[stylename], parentname, parentstyle;
        if (!style) {
            return;
        }
        parentname = style.getAttributeNS(stylens, 'parent-style-name');
        parentstyle = null;
        if (parentname) {
            parentstyle = findStyle(stylestree, parentname);
            if (!parentstyle && stylesmap[parentname]) {
                // parent style has not been handled yet, do that now
                addStyleToStyleTree(parentname, stylesmap, stylestree);
                parentstyle = stylesmap[parentname];
                stylesmap[parentname] = null;
            }
        }
        if (parentstyle) {
            if (!parentstyle.derivedStyles) {
                parentstyle.derivedStyles = {};
            }
            parentstyle.derivedStyles[stylename] = style;
        } else {
            // no parent so add the root
            stylestree[stylename] = style;
        }
    }
    /**
     * @param {!Object} stylesmap
     * @param {!Object} stylestree
     * @return {undefined}
     */
    function addStyleMapToStyleTree(stylesmap, stylestree) {
        var name;
        for (name in stylesmap) {
            if (stylesmap.hasOwnProperty(name)) {
                addStyleToStyleTree(name, stylesmap, stylestree);
                stylesmap[name] = null;
            }
        }
    }
    /**
     * @param {!string} family
     * @param {!string} name
     * @return {?string}
     */
    function createSelector(family, name) {
        var prefix = familynamespaceprefixes[family],
            namepart,
            selector = "",
            first = true;
        if (prefix === null) {
            return null;
        }

        // If there is no name, it is a default style, in which case style-name shall be used without a value
        if (name) {
            namepart = '[' + prefix + '|style-name="' + name + '"]';
        } else {
            namepart = '[' + prefix + '|style-name]';
        }
        if (prefix === 'presentation') {
            prefix = 'draw';
            if (name) {
                namepart = '[presentation|style-name="' + name + '"]';
            } else {
                namepart = '[presentation|style-name]';
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
     * @param {!Element} node
     * @return {!Array}
     */
    function getSelectors(family, name, node) {
        var selectors = [], n, ss, s;
        selectors.push(createSelector(family, name));
        for (n in node.derivedStyles) {
            if (node.derivedStyles.hasOwnProperty(n)) {
                ss = getSelectors(family, n, node.derivedStyles[n]);
                for (s in ss) {
                    if (ss.hasOwnProperty(s)) {
                        selectors.push(ss[s]);
                    }
                }
            }
        }
        return selectors;
    }
    /**
     * @param {?Element} node
     * @param {!string} ns
     * @param {!string} name
     * @return {?Element}
     */
    function getDirectChild(node, ns, name) {
        if (!node) {
            return null;
        }
        var c = node.firstChild, e;
        while (c) {
            if (c.namespaceURI === ns && c.localName === name) {
                e = /**@type{Element}*/(c);
                return e;
            }
            c = c.nextSibling;
        }
        return null;
    }
    /**
     * @param {!Element} props
     * @param {!Object} mapping
     * @return {!string}
     */
    function applySimpleMapping(props, mapping) {
        var rule = '', r, value;
        for (r in mapping) {
            if (mapping.hasOwnProperty(r)) {
                r = mapping[r];
                value = props.getAttributeNS(r[0], r[1]);
                if (value) {
                    rule += r[2] + ':' + value + ';';
                }
            }
        }
        return rule;
    }

    /**
     * @param {!Document} doc
     * @param {!Element} fontFaceDeclsNode
     * @return {!Object}
     */
    function makeFontFaceDeclsMap(doc, fontFaceDeclsNode) {
        // put all style elements in a hash map by family and name
        var fontFaceDeclsMap = {}, node, name, family, map;
        if (!fontFaceDeclsNode) {
            return fontFaceDeclsNode;
        }
        node = fontFaceDeclsNode.firstChild;
        while (node) {
            if (node.nodeType === 1) {
                family = node.getAttributeNS(svgns, 'font-family');
                name = family && node.getAttributeNS(stylens, 'name');
                if (name) {
                    if (!fontFaceDeclsMap[name]) {
                        fontFaceDeclsMap[name] = {};
                    }
                    fontFaceDeclsMap[name] = family;
                }
            }
            node = node.nextSibling;
        }
        return fontFaceDeclsMap;
    }

    /**
     * @param {!string} name
     * @return {!string}
     */
    function getFontDeclaration(name) {
        return fontFaceDeclsMap[name];
    }
    /**
     * @param {!Element} props
     * @return {!string}
     */
    function getTextProperties(props) {
        var rule = '', value, textDecoration = '';
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

        value = props.getAttributeNS(stylens, 'font-name');
        if (value) {
            value = getFontDeclaration(value);
            if (value) {
                rule += 'font-family: ' + value + ';';
            }
        }
        return rule;
    }
    /**
     * @param {!Element} props
     * @return {!string}
     */
    function getParagraphProperties(props) {
        var rule = '', imageProps, url, element;
        rule += applySimpleMapping(props, paragraphPropertySimpleMapping);
        imageProps = props.getElementsByTagNameNS(stylens, 'background-image');
        if (imageProps.length > 0) {
            url = imageProps.item(0).getAttributeNS(xlinkns, 'href');
            if (url) {
                rule += "background-image: url('odfkit:" + url + "');";
                //rule += "background-repeat: repeat;"; //FIXME test
                element = /**@type{!Element}*/(imageProps.item(0));
                rule += applySimpleMapping(element, bgImageSimpleMapping);
            }
        }
        return rule;
    }
    /**
     * @param {!Element} props
     * @return {!string}
     */
    function getGraphicProperties(props) {
        var rule = '';
        rule += applySimpleMapping(props, graphicPropertySimpleMapping);
        return rule;
    }
    /**
     * @param {!Element} props
     * @return {!string}
     */
    function getTableCellProperties(props) {
        var rule = '';
        rule += applySimpleMapping(props, tablecellPropertySimpleMapping);
        return rule;
    }
    /**
     * @param {!Element} props
     * @return {!string}
     */
    function getTableRowProperties(props) {
        var rule = '';
        rule += applySimpleMapping(props, tablerowPropertySimpleMapping);
        return rule;
    }
    /**
     * @param {!Element} props
     * @return {!string}
     */
    function getTableColumnProperties(props) {
        var rule = '';
        rule += applySimpleMapping(props, tablecolumnPropertySimpleMapping);
        return rule;
    }
    /**
     * @param {!Element} props
     * @return {!string}
     */
    function getTableProperties(props) {
        var rule = '';
        rule += applySimpleMapping(props, tablePropertySimpleMapping);
        return rule;
    }
    /**
     * @param {!StyleSheet} sheet
     * @param {!string} family
     * @param {!string} name
     * @param {!Element} node
     * @return {undefined}
     */
    function addStyleRule(sheet, family, name, node) {
        var selectors = getSelectors(family, name, node),
            selector = selectors.join(','),
            rule = '',
            properties = getDirectChild(node, stylens, 'text-properties');
        if (properties) {
            rule += getTextProperties(properties);
        }
        properties = getDirectChild(node, stylens, 'paragraph-properties');
        if (properties) {
            rule += getParagraphProperties(properties);
        }
        properties = getDirectChild(node, stylens, 'graphic-properties');
        if (properties) {
            rule += getGraphicProperties(properties);
        }
        properties = getDirectChild(node, stylens, 'table-cell-properties');
        if (properties) {
            rule += getTableCellProperties(properties);
        }
        properties = getDirectChild(node, stylens, 'table-row-properties');
        if (properties) {
            rule += getTableRowProperties(properties);
        }
        properties = getDirectChild(node, stylens, 'table-column-properties');
        if (properties) {
            rule += getTableColumnProperties(properties);
        }
        properties = getDirectChild(node, stylens, 'table-properties');
        if (properties) {
            rule += getTableProperties(properties);
        }
        if (family === "table") {
            runtime.log(rule);
        }
        if (rule.length === 0) {
            return;
        }
        rule = selector + '{' + rule + '}';
        try {
            sheet.insertRule(rule, sheet.cssRules.length);
        } catch (e) {
            throw e;
        }
    }
    /**
     * @param {!Element} node
     * @return {!string}
     */
    function getNumberRule(node) {
        var style = node.getAttributeNS(stylens, "num-format"),
            suffix = node.getAttributeNS(stylens, "num-suffix"),
            prefix = node.getAttributeNS(stylens, "num-prefix"),
            rule = "",
            stylemap = {'1': 'decimal', 'a': 'lower-latin', 'A': 'upper-latin',
                'i': 'lower-roman', 'I': 'upper-roman'},
            content = "";

        content = prefix || "";

        if (stylemap.hasOwnProperty(style)) {
            content += " counter(list, " + stylemap[style] + ")";
        } else if (style) {
            content += "'" + style + "';";
        } else {
            content += " ''";
        }
        if (suffix) {
            content += " '" + suffix + "'";
        }
        rule = "content: " + content + ";";
        return rule;
    }
    /**
     * @param {!Element} node
     * @return {!string}
     */
    function getImageRule(node) {
        var rule = "content: none;";
        return rule;
    }
    /**
     * @param {!Element} node
     * @return {!string}
     */
    function getBulletRule(node) {
        var rule = "",
            bulletChar = node.getAttributeNS(textns, "bullet-char");
        return "content: '" + bulletChar + "';";
    }
    /**
     * @param {!StyleSheet} sheet
     * @param {!string} name
     * @param {!Element} node
     * @return {undefined}
     */
    function addListStyleRule(sheet, name, node, itemrule) {
        var selector = 'text|list[text|style-name="' + name + '"]',
            level = node.getAttributeNS(textns, "level"),
            itemSelector,
            listItemRule,
            listLevelProps = node.firstChild, // {Element}
            listLevelLabelAlign = listLevelProps.firstChild, // {Element}
            labelAlignAttr,
            bulletIndent,
            listIndent,
            bulletWidth,
            rule = "";

        if (listLevelLabelAlign) {
            labelAlignAttr = listLevelLabelAlign.attributes;
            bulletIndent = labelAlignAttr["fo:text-indent"].value;
            listIndent = labelAlignAttr["fo:margin-left"].value;
        }

        // If no values are specified, use default values
        if (!bulletIndent) {
            bulletIndent = "-0.6cm";
        }

        // bulletWidth is the negative of bulletIndent
        // Obtain this my stripping the fist character
        if (bulletIndent.charAt(0) === '-') {
            bulletWidth = bulletIndent.substring(1);
        } else {
            bulletWidth = "-" + bulletIndent;
        }

        level = level && parseInt(level, 10);
        while (level > 1) {
            selector += ' > text|list-item > text|list';
            level -= 1;
        }
        itemSelector = selector;
        itemSelector += ' > text|list-item > *:not(text|list):first-child';
        if (listIndent !== undefined) {
            listItemRule = itemSelector + '{margin-left:' + listIndent + ';}';
            sheet.insertRule(listItemRule, sheet.cssRules.length);
        }
        // insert a block before every immediate child of the list-item, except for lists
        selector += ' > text|list-item > *:not(text|list):first-child:before';
        rule = itemrule;
        rule = selector + '{' + rule + ';';

        rule += 'counter-increment:list;';
        rule += 'margin-left:' + bulletIndent + ';';
        rule += 'width:' + bulletWidth + ';';
        rule += 'display:inline-block}';

        try {
            sheet.insertRule(rule, sheet.cssRules.length);
        } catch (e) {
            throw e;
        }
    }
    /**
     * @param {!StyleSheet} sheet
     * @param {!string} name
     * @param {!Element} node
     * @return {undefined}
     */
    function addListStyleRules(sheet, name, node) {
        var n = node.firstChild, e, itemrule;
        while (n) {
            if (n.namespaceURI === textns) {
                e = /**@type{!Element}*/(n);
                if (n.localName === "list-level-style-number") {
                    itemrule = getNumberRule(e);
                    addListStyleRule(sheet, name, e, itemrule);
                } else if (n.localName === "list-level-style-image") {
                    itemrule = getImageRule(e);
                    addListStyleRule(sheet, name, e, itemrule);
                } else if (n.localName === "list-level-style-bullet") {
                    itemrule = getBulletRule(e);
                    addListStyleRule(sheet, name, e, itemrule);
                }
            }
            n = n.nextSibling;
        }
    }
    /**
     * @param {!StyleSheet} sheet
     * @param {!string} family
     * @param {!string} name
     * @param {!Element} node
     * @return {undefined}
     */
    function addRule(sheet, family, name, node) {
        if (family === "list") {
            addListStyleRules(sheet, name, node);
        } else {
            addStyleRule(sheet, family, name, node);
        }
    }
    /**
     * @param {!StyleSheet} sheet
     * @param {!string} family
     * @param {!string} name
     * @param {!Element} node
     * @return {undefined}
     */
    function addRules(sheet, family, name, node) {
        addRule(sheet, family, name, node);
        var n;
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

    this.namespaces = namespaces;
    this.namespaceResolver = namespaceResolver;
    this.namespaceResolver.lookupNamespaceURI = this.namespaceResolver;

    // Font face declarations map
    this.makeFontFaceDeclsMap = makeFontFaceDeclsMap;

    /**
     * @param {!StyleSheet} stylesheet
     * @param {!Element} fontFaceDecls
     * @param {!Element} styles
     * @param {!Element} autostyles
     * @return {undefined}
     */
    this.style2css = function (stylesheet, fontFaceDecls, styles, autostyles) {
        var doc, prefix, styletree, tree, name, rule, family,
            stylenodes, styleautonodes;
        // make stylesheet empty
        while (stylesheet.cssRules.length) {
            stylesheet.deleteRule(stylesheet.cssRules.length - 1);
        }
        doc = null;
        if (styles) {
            doc = styles.ownerDocument;
        }
        if (autostyles) {
            doc = autostyles.ownerDocument;
        }
        if (!doc) {
            return;
        }
        // add @namespace rules
        for (prefix in namespaces) {
            if (namespaces.hasOwnProperty(prefix)) {
                rule = '@namespace ' + prefix + ' url(' + namespaces[prefix] + ');';
                try {
                    stylesheet.insertRule(rule, stylesheet.cssRules.length);
                } catch (e) {
                    // WebKit can throw an exception here, but it will have
                    // retained the namespace declarations anyway.
                }
            }
        }
        
        // Populate the font face declarations map
        fontFaceDeclsMap = makeFontFaceDeclsMap(doc, fontFaceDecls);
        // add the various styles
        stylenodes = getStyleMap(doc, styles);
        styleautonodes = getStyleMap(doc, autostyles);
        styletree = {};
        for (family in familynamespaceprefixes) {
            if (familynamespaceprefixes.hasOwnProperty(family)) {
                tree = styletree[family] = {};
                addStyleMapToStyleTree(stylenodes[family], tree);
                addStyleMapToStyleTree(styleautonodes[family], tree);

                for (name in tree) {
                    if (tree.hasOwnProperty(name)) {
                        addRules(stylesheet, family, name, tree[name]);
                    }
                }
            }
        }
    };
};
