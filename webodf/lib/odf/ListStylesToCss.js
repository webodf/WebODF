/**
 * @license
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


/*global odf, runtime*/

(function () {
    "use strict";

    var /**@const
           @type{!string}*/
        fons = odf.Namespaces.fons,
        /**@const
           @type{!string}*/
        stylens = odf.Namespaces.stylens,
        /**@const
           @type{!string}*/
        textns = odf.Namespaces.textns,
        /**@const
           @type{!Object.<string,string>}*/
        stylemap = {
            '1': 'decimal',
            'a': 'lower-latin',
            'A': 'upper-latin',
            'i': 'lower-roman',
            'I': 'upper-roman'
        };

    /***
     * @constructor
     */
    odf.ListStyleToCss = function ListStyleToCss() {

        /**
         * Appends the rule into the stylesheets and logs any errors that occur
         * @param {!CSSStyleSheet} styleSheet
         * @param {!string} rule
         */
        function appendRule(styleSheet, rule) {
            try {
                styleSheet.insertRule(rule, styleSheet.cssRules.length);
            } catch (/**@type{!DOMException}*/e) {
                runtime.log("cannot load rule: " + rule);
            }
        }

        /**
         * Gets the CSS content for a numbered list
         * @param {!Element} node
         * @return {!string}
         */
        function getNumberRule(node) {
            var style = node.getAttributeNS(stylens, "num-format"),
                /**@type{!string}*/
                suffix = node.getAttributeNS(stylens, "num-suffix") || "",
                /**@type{!string}*/
                prefix = node.getAttributeNS(stylens, "num-prefix") || "",
                /**@type{!string}*/
                content = "";
            if (prefix) {
                content += ' "' + prefix + '"';
            }
            if (stylemap.hasOwnProperty(style)) {
                content += " counter(list, " + stylemap[style] + ")";
            } else if (style) {
                content += ' "' + style + '"';
            } else {
                content += " ''";
            }
            return 'content:' + content + ' "' + suffix + '"';
        }

        /**
         * Gets the CSS content for a image bullet list
         * @return {!string}
         */
        function getImageRule() {
            return "content: none;";
        }

        /**
         * Gets the CSS content for a bullet list
         * @param {!Element} node
         * @return {!string}
         */
        function getBulletRule(node) {
            var bulletChar = node.getAttributeNS(textns, "bullet-char");
            return "content: '" + bulletChar + "';";
        }

        /**
         * Creates the final CSS rule with the correct indentation and content
         * @param {!CSSStyleSheet} styleSheet
         * @param {!string} name
         * @param {!Element} node
         * @param {!string} itemRule
         * @return {undefined}
         */
        function addListStyleRule(styleSheet, name, node, itemRule) {
            var selector = 'text|list[text|style-name="' + name + '"]',
                level = node.getAttributeNS(textns, "level"),
                itemSelector,
                listItemRule,
                listLevelProps = /**@type{!Element}*/(node.getElementsByTagNameNS(stylens, "list-level-properties")[0]),
                listLevelLabelAlign = /**@type{!Element}*/(listLevelProps.getElementsByTagNameNS(stylens, "list-level-label-alignment")[0]),
                bulletIndent,
                listIndent,
                bulletWidth,
                rule;

            if (listLevelLabelAlign) {
                bulletIndent = listLevelLabelAlign.getAttributeNS(fons,
                    "text-indent");
                listIndent = listLevelLabelAlign.getAttributeNS(fons,
                    "margin-left");
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
            if (listIndent) {
                itemSelector = selector;
                itemSelector += ' > text|list-item > *:not(text|list):first-child';
                listItemRule = itemSelector + "{";
                listItemRule += 'margin-left:' + listIndent + ';';
                listItemRule += "}";
                appendRule(styleSheet, listItemRule);
            }
            // insert a block before every immediate child of the list-item, except for lists
            selector += ' > text|list-item > *:not(text|list):first-child:before';
            rule = selector + '{' + itemRule + ';';

            rule += 'counter-increment:list;';
            rule += 'margin-left:' + bulletIndent + ';';
            rule += 'width:' + bulletWidth + ';';
            rule += 'display:inline-block}';

            appendRule(styleSheet, rule);
        }

        /**
         * Adds a CSS rule for every ODF list style
         * @param {!CSSStyleSheet} styleSheet
         * @param {!string} name
         * @param {!Element} node
         * @return {undefined}
         */
        function addRule(styleSheet, name, node) {
            var n = node.firstChild, e, itemrule;
            while (n) {
                if (n.namespaceURI === textns) {
                    e = /**@type{!Element}*/(n);
                    if (n.localName === "list-level-style-number") {
                        itemrule = getNumberRule(e);
                        addListStyleRule(styleSheet, name, e, itemrule);
                    } else if (n.localName === "list-level-style-image") {
                        itemrule = getImageRule();
                        addListStyleRule(styleSheet, name, e, itemrule);
                    } else if (n.localName === "list-level-style-bullet") {
                        itemrule = getBulletRule(e);
                        addListStyleRule(styleSheet, name, e, itemrule);
                    }
                }
                n = n.nextSibling;
            }
        }

        /**
         * Creates CSS styles from the given ODF list styles and applies them to the stylesheet
         * @param {!CSSStyleSheet} stylesheet
         * @param {!odf.StyleTree.Tree} styleTree
         * @return {undefined}
         */
        this.applyListStyles = function (stylesheet, styleTree) {
            var styleFamilyTree,
                node;

            /*jslint sub:true*/
            // The available families are defined in StyleUtils.familyNamespacePrefixes.
            styleFamilyTree = (styleTree["list"]);
            /*jslint sub:false*/
            if (styleFamilyTree) {
                Object.keys(styleFamilyTree).forEach(function (styleName) {
                    node = /**@type{!odf.StyleTreeNode}*/(styleFamilyTree[styleName]);
                    addRule(stylesheet, styleName, node.element);
                });
            }
        };
    };
}());