/**
 * Copyright (C) 2010-2014 KO GmbH <copyright@kogmbh.com>
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

/*global odf*/

(function () {
    "use strict";

    var /**@const
           @type{!string}*/
        stylens = odf.Namespaces.stylens,
        /**@const
           @type{!string}*/
        textns = odf.Namespaces.textns,
        /**
         * This dictionary maps between ODF style family names and the
         * tag prefixes they use. This is currently a duplicate of the same
         * dictionary in Styles2CSS. Here only the style family names are used
         * as keys in the StyleTree that is generated.
         * @const
           @type{!Object.<string,string>}*/
        familyNamespacePrefixes = {
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
        };

    /**
     * StyleTreeNode encapsulates an ODF style element and its derived styles
     * This class is used within the StyleTree where it is associated with a key
     * that is the style name for this node.
     * @constructor
     * @param {!Element} element
     */
    odf.StyleTreeNode = function StyleTreeNode(element) {
        /**@type{!Object.<string,!odf.StyleTreeNode>}*/
        this.derivedStyles = {};

        /**@type{!Element}*/
        this.element = element;
    };

    /**
     * StyleTree creates a nested dictionary of the styles in an ODF document
     * This is to allow the lookup of all styles for a given family by using the family name as the key
     * and then the specific style in that family by using the style name as the key.
     * @constructor
     * @param {!Element} styles
     * @param {!Element} autoStyles
     */
    odf.StyleTree = function StyleTree(styles, autoStyles) {

        var tree = {};

        /**
         * @param {!Element} stylesNode
         * @return {!Object.<string,!Object.<string,?Element>>}
         */
        function getStyleMap(stylesNode) {
            // put all style elements in a hash map by family and name
            var node, name, family, style,
                /**@type{!Object.<string,!Object.<string,?Element>>}*/
                styleMap = {};
            if (!stylesNode) {
                return styleMap;
            }
            node = stylesNode.firstElementChild;
            while (node) {
                if (node.namespaceURI === stylens &&
                    ((node.localName === 'style') ||
                        (node.localName === 'default-style'))) {
                    family = node.getAttributeNS(stylens, 'family');
                } else if (node.namespaceURI === textns &&
                    node.localName === 'list-style') {
                    family = "list";
                } else if (node.namespaceURI === stylens &&
                    (node.localName === 'page-layout' || node.localName === 'default-page-layout')) {
                    family = "page";
                } else {
                    // Skip insignificant white-space only nodes in the style tree
                    family = undefined;
                }

                if (family) {
                    // get style name
                    name = node.getAttributeNS(stylens, 'name');
                    if (!name) {
                        // For a default style, there is no name
                        name = '';
                    }

                    // get style (and create, if not yet existing)
                    if (styleMap.hasOwnProperty(family)) {
                        style = styleMap[family];
                    } else {
                        styleMap[family] = style = {};
                    }

                    // then store style node in map
                    style[name] = node;
                }

                node = node.nextElementSibling;
            }

            return styleMap;
        }

        /**
         * @param {!Object.<string,!odf.StyleTreeNode>} stylesTree
         * @param {string} name
         * @return {odf.StyleTreeNode}
         */
        function findStyleTreeNode(stylesTree, name) {
            if (stylesTree.hasOwnProperty(name)) {
                return stylesTree[name];
            }
            var style = null,
                styleNames = Object.keys(stylesTree),
                i;

            for (i = 0; i < styleNames.length; i += 1) {
                style = findStyleTreeNode(stylesTree[styleNames[i]].derivedStyles, name);
                if (style) {
                    break;
                }
            }
            return style;
        }

        /**
         * Creates the StyleTreeNode from the style element
         * and inserts it into the given StyleTree
         * @param {string} styleName
         * @param {!Object.<string,!Element>} stylesMap
         * @param {!Object.<string,!odf.StyleTreeNode>} stylesTree
         * @return {?odf.StyleTreeNode}
         */
        function createStyleTreeNode(styleName, stylesMap, stylesTree) {
            var style, parentname, parentstyle;
            if (!stylesMap.hasOwnProperty(styleName)) {
                return null;
            }
            style = new odf.StyleTreeNode(stylesMap[styleName]);
            parentname = style.element.getAttributeNS(stylens, 'parent-style-name');
            parentstyle = null;
            if (parentname) {
                parentstyle = findStyleTreeNode(stylesTree, parentname)
                    || createStyleTreeNode(parentname, stylesMap, stylesTree);
            }
            if (parentstyle) {
                parentstyle.derivedStyles[styleName] = style;
            } else {
                // no parent so add the root
                stylesTree[styleName] = style;
            }
            delete stylesMap[styleName];
            return style;
        }

        /**
         * @param {!Object.<string,!Element>} stylesMap
         * @param {!Object.<string,!odf.StyleTreeNode>} stylesTree
         * @return {undefined}
         */
        function addStyleMapToStyleTree(stylesMap, stylesTree) {
            if (stylesMap) {
                Object.keys(stylesMap).forEach(function (styleName) {
                    createStyleTreeNode(styleName, stylesMap, stylesTree);
                });
            }
        }

        /**
         * @return {!odf.StyleTree.Tree}
         */
        this.getStyleTree = function () {
            return tree;
        };

        function init() {
            var subTree,
                styleNodes,
                autoStyleNodes;

            styleNodes = getStyleMap(styles);
            autoStyleNodes = getStyleMap(autoStyles);

            Object.keys(familyNamespacePrefixes).forEach(function (family) {
                subTree = tree[family] = {};
                addStyleMapToStyleTree(styleNodes[family], subTree);
                addStyleMapToStyleTree(autoStyleNodes[family], subTree);
            });
        }

        init();
    };
}());

/**
 * @typedef{!Object.<string,!Object.<string,!odf.StyleTreeNode>>}
 */
odf.StyleTree.Tree;
