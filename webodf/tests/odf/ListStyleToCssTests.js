/**
 * @license
 * Copyright (C) 2014 KO GmbH <copyright@kogmbh.com>
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

/*global runtime, core, odf*/

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
odf.ListStyleToCssTests = function ListStyleToCssTests(runner) {
    "use strict";
    var t,
        r = runner,
        namespaceMap = odf.Namespaces.namespaceMap;

    /**
     * @extends {CSSRuleList} Well.... we don't really, but please shut your face closure compiler :)
     * @constructor
     */
    function MockCSSRuleList() {
        this.length = 0;

        this.rules = [];
    }

    /**
     * @extends {CSSStyleSheet} Well.... we don't really, but please shut your face closure compiler :)
     * @constructor
     */
    function MockCSSStyleSheet() {
        var cssRules = new MockCSSRuleList();

        this.cssRules = cssRules;
        /**
         * @param {!string} rule
         * @param {!number} index
         * @return {!number}
         */
        this.insertRule = function (rule, index) {
            if (index !== cssRules.length) {
                runtime.log("surprise, not appended!");
            }
            cssRules.length += 1;
            cssRules.rules.push(rule);
            return cssRules.length;
        };
    }

    this.setUp = function () {
        t = {
            list2css : new odf.ListStyleToCss()
        };
    };
    this.tearDown = function () {
        t = {};
    };

    /**
     * @param {!string} styles
     * @param {!string} automaticStyles
     * @return {undefined}
     */
    function applyListStyles(styles, automaticStyles) {
        var stylesTree,
            automaticStylesTree;

        stylesTree = core.UnitTest.createXmlDocument('office:styles', styles, namespaceMap).documentElement;
        automaticStylesTree = core.UnitTest.createXmlDocument('office:automatic-styles', automaticStyles, namespaceMap).documentElement;

        t.styleSheet = new MockCSSStyleSheet();
        t.styleTree = new odf.StyleTree(stylesTree, automaticStylesTree).getStyleTree();

        t.list2css.applyListStyles(t.styleSheet, t.styleTree);

    }

    function style_list_level_label_alignment_WithNo_fo_margin_left() {
        applyListStyles(
            '<text:list-style style:name="lijst">' +
              '<text:list-level-style-bullet text:bullet-char="-" text:level="1">' +
                '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">' +
                  // testing no fo:margin-left attribute set here
                  '<style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="0.3cm"></style:list-level-label-alignment>' +
                '</style:list-level-properties>' +
              '</text:list-level-style-bullet>' +
            '</text:list-style>',
            "");
        r.shouldBe(t, "t.styleSheet.cssRules.length", "3");
        r.shouldBe(t, "t.styleSheet.cssRules.rules[0]", "'text|list[text|style-name=\"lijst\"] > text|list-item{margin-left: 0px;}'");
        r.shouldBe(t, "t.styleSheet.cssRules.rules[1]", "'text|list[text|style-name=\"lijst\"] > text|list-item > text|list{margin-left: 0px;}'");
        r.shouldBe(t, "t.styleSheet.cssRules.rules[2]", "'text|list[text|style-name=\"lijst\"] > text|list-item > *:not(text|list):first-child:before{text-align: left;counter-increment:list;display: inline-block;margin-left: ;padding-right: 0.2cm;content: \\'-\\';}'");

    }

    this.tests = function () {
        return r.name([
            style_list_level_label_alignment_WithNo_fo_margin_left
        ]);
    };
    this.asyncTests = function () {
        return [];
    };
};
odf.ListStyleToCssTests.prototype.description = function () {
    "use strict";
    return "Test the ListStyleToCss class.";
};
(function () {
    "use strict";
    return odf.ListStyleToCssTests;
}());
