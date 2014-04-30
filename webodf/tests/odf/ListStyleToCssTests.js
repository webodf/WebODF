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
        namespaceMap = odf.Namespaces.namespaceMap,
        document = runtime.getWindow().document;

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
            t.styleSheetImpl.insertRule(rule, t.styleSheetImpl.cssRules.length);
            cssRules.rules.push({
                ruleText: rule,
                cssRule: t.styleSheetImpl.cssRules[t.styleSheetImpl.cssRules.length - 1]
            });
            return cssRules.length;
        };
    }

    this.setUp = function () {
        t = {
            list2css : new odf.ListStyleToCss(),
            testArea: core.UnitTest.provideTestAreaDiv()
        };
    };
    this.tearDown = function () {
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };

    /**
     * @param {!string} styles
     * @param {!string} automaticStyles
     * @return {undefined}
     */
    function applyListStyles(styles, automaticStyles) {
        var stylesTree,
            automaticStylesTree,
            styleElement,
            text = "";

        stylesTree = core.UnitTest.createXmlDocument('office:styles', styles, namespaceMap).documentElement;
        automaticStylesTree = core.UnitTest.createXmlDocument('office:automatic-styles', automaticStyles, namespaceMap).documentElement;

        styleElement = document.createElement("style");
        odf.Namespaces.forEachPrefix(function(prefix, ns) {
            text += "@namespace " + prefix + " url(" + ns + ");\n";
        });
        styleElement.appendChild(document.createTextNode(text));
        t.testArea.appendChild(styleElement);
        t.styleSheetImpl = styleElement.sheet;
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
        r.shouldBe(t, "t.styleSheet.cssRules.rules[0].ruleText", "'text|list[text|style-name=\"lijst\"] > text|list-item{margin-left: 0px;}'");
        r.shouldBe(t, "t.styleSheet.cssRules.rules[1].ruleText", "'text|list[text|style-name=\"lijst\"] > text|list-item > text|list{margin-left: 0px;}'");
        r.shouldBe(t, "t.styleSheet.cssRules.rules[2].ruleText", "'text|list[text|style-name=\"lijst\"] > text|list-item > *:not(text|list):first-child:before{text-align: left;counter-increment:list;display: inline-block;margin-left: 0px;padding-right: 0.2cm;\\ncontent: \"-\";\\n}'");

    }

    /**
     * WebKit, Chrome + FF all have radically different ways of joining & quoting CSS content.
     * The tests being created depend on a predictable string being parsed out for comparison, hence
     * the need for this function.
     *
     * This function takes a string input, and tokenizes it based on the following rules:
     *
     * 1. strings (either single or double)
     *      - both single and double-quoted strings are parsed
     *      - for easier readability, the new string is surrounded by square brackets (i.e., "ab" => [ab]) to reduce
     *          quoting confusion
     *      - any escaped quotes in the string are replaced (e.g., "a\"b\'" => [a"b'] or 'a\'b\"' => [a'b"])
     *
     * 2. joining commas (i.e., commas between strings) are removed completely (some browsers separate content parts with commas)
     * 3. no whitespace trimming or normalization is performed
     * 4. replace counter(.*) with the text "counter(...)". It seems qtruntimetests fail as the counters don't survive
     *      insertion and report random numbers inside the counter. E.g., counter(-87879878e564)
     *
     * @param {!string} content
     * @return {!string} Returns a normalized string. String values are surrounded with square brackets.
     */
    /*jslint regexp:true*/
    function normalizeCSSContent(content) {
        var tokens = [],
            isEscaped = false,
            regionEndDelim,
            isQuote = /["']/,
            stringStartIndex,
            currentCharIndex,
            currentCharacter,
            contentSubstring;

        // Replace counters as they report counter(<SOME RANDOM NUMBER>) in qtjsruntimetests... grrr..
        content = content.replace(/counter\([^)]*\)/g, "counter(...)");
        for (stringStartIndex = 0, currentCharIndex = 0; currentCharIndex < content.length; currentCharIndex += 1) {
            currentCharacter = content[currentCharIndex];

            if (regionEndDelim) {
                // Inside a region that can only be exited by matching the region end delimiter
                if (isEscaped) {
                    isEscaped = false;
                } else if (currentCharacter === "\\") {
                    isEscaped = true;
                } else if(currentCharacter === regionEndDelim) {
                    contentSubstring = '[' + content.substring(stringStartIndex, currentCharIndex) + ']';
                    // Replace any escaped quotes with unescaped quotes. This allows us to cope with FF always
                    // escaping any type of quote, whilst Chrome/WebKit only escaping if the quote is the same as
                    // the delimiter
                    // Regex matches
                    //  (line start OR backslash followed by char OR non-backslash)
                    //  followed by a backslash followed by a quote
                    contentSubstring = contentSubstring.replace(/(^|(?:\\.)|[^\\])\\(["'])/g, "$1$2");

                    tokens.push(contentSubstring);
                    regionEndDelim = undefined;
                    // Start next string just after the current region delimiter
                    stringStartIndex = currentCharIndex + 1;
                }
            } else if (currentCharacter === ",") {
                // Commas may separate components when not in a string region. Save the current region and start a new one
                if (stringStartIndex !== currentCharIndex) {
                    tokens.push(content.substring(stringStartIndex, currentCharIndex));
                }
                // Trim the comma off the start of the next region
                stringStartIndex = currentCharIndex + 1;
            } else if (isQuote.test(currentCharacter)) {
                // Quote character outside a string. Sae the current region and start a new one
                if (stringStartIndex !== currentCharIndex) {
                    tokens.push(content.substring(stringStartIndex, currentCharIndex));
                }
                regionEndDelim = currentCharacter;
                // Trim the quote from the start of the next string
                stringStartIndex = currentCharIndex + 1;
            }
        }
        if (stringStartIndex !== currentCharIndex) {
            tokens.push(content.substring(stringStartIndex, currentCharIndex));
        }
        return tokens.join("");
    }
    /*jslint regexp:false*/

    /**
     * Tests to ensure the CSS content normalization is robust enough to be used for the prefix
     * checking below. Because someone has to watch the watchers :)
     * @return {undefined}
     */
    function verifyCSSContentNormalization() {
        var contentTests = [
            {
                output: '[a] b [c]',
                inputs: ['"a" b "c"', '"a", b, "c"', "'a' b 'c'"]
            },
            {
                output: '[a] [c]',
                inputs: ['"a", "c"', "'a', 'c'"]
            },
            {
                output: '[a] counter(...)',
                inputs: ['"a" counter(a, b)', "'a', counter(a, b)"]
            },
            {
                output: '[a, \'b\'] [c, "d"]',
                inputs: ['"a, \'b\'" \'c, "d"\'']
            },
            {
                output: '[] b []',
                inputs: ['"" b ""', '"", b, ""', "'', b, ''"]
            },
            {
                output: '["]',
                inputs: ["'\"'", '"\\""', "'\\\"'"]
            },
            {
                output: '[\']',
                inputs: ['"\'"', "'\\''", '"\\\'"']
            },
            {
                output: '[\\\\"]',
                inputs: ["'\\\\\"'"]
            }
        ];
        contentTests.forEach(function(testSetup) {
            t.output = testSetup.output;
            testSetup.inputs.forEach(function(input) {
                t.input = normalizeCSSContent(input);
                r.shouldBe(t, "t.input", "t.output");
            });
        });
    }

    /**
     * Searches in the present stylesheet rules for a rule intended for the supplied style
     * name who's normalized style.content value matches the expected value
     * @param {!string} styleName
     * @param {!string} normalizedContentValue
     * @return {undefined}
     */
    function matchContentBlock(styleName, normalizedContentValue) {
        var contentFound,
            ruleIndex,
            rule;

        t.expectedContent = normalizedContentValue;
        for (ruleIndex = 0; ruleIndex < t.styleSheet.cssRules.length; ruleIndex += 1) {
            rule = t.styleSheet.cssRules.rules[ruleIndex];
            if (rule.cssRule.selectorText.indexOf(styleName) !== -1 && rule.cssRule.style.content) {
                contentFound = true;
                t.actualContent = normalizeCSSContent(rule.cssRule.style.content);
                r.shouldBe(t, "t.actualContent", "t.expectedContent");
                break;
            }
        }
        if (!contentFound) {
            r.testFailed("Non-empty CSS content attribute expected in stylesheet");
        }
    }

    /**
     * @param {!string} attribute
     * @param {!string} value
     * @param {!string} expectedContentValue
     * @return {undefined}
     */
    function checkListLevelStyleNumberAttribute(attribute, value, expectedContentValue) {
        applyListStyles(
                '<text:list-style style:name="check_stylenumber_attribute">' +
                '<text:list-level-style-number text:level="1" ' + attribute + '="' + value  +'" style:num-format="1">' +
                '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">' +
                '<style:list-level-label-alignment text:label-followed-by="listtab" fo:margin-left="0cm"/>' +
                '</style:list-level-properties>' +
                '</text:list-level-style-number>' +
                '</text:list-style>',
            "");

        matchContentBlock("check_stylenumber_attribute", expectedContentValue);
    }

    function numberedListPrefixes() {
        var numberPrefix = "style:num-prefix";
        checkListLevelStyleNumberAttribute(numberPrefix, "a b", '[a b] counter(...) []');
        checkListLevelStyleNumberAttribute(numberPrefix, "&apos;", '[\'] counter(...) []');
        checkListLevelStyleNumberAttribute(numberPrefix, "&quot;", '["] counter(...) []');
        checkListLevelStyleNumberAttribute(numberPrefix, "\\", '[\\\\] counter(...) []');
        checkListLevelStyleNumberAttribute(numberPrefix, ";", '[;] counter(...) []');
        checkListLevelStyleNumberAttribute(numberPrefix, ",", '[,] counter(...) []');
    }

    function numberedListSuffixes() {
        var numberSuffix = "style:num-suffix";
        checkListLevelStyleNumberAttribute(numberSuffix, "a b", 'counter(...) [a b]');
        checkListLevelStyleNumberAttribute(numberSuffix, "&apos;", 'counter(...) [\']');
        checkListLevelStyleNumberAttribute(numberSuffix, "&quot;", 'counter(...) ["]');
        checkListLevelStyleNumberAttribute(numberSuffix, "\\", 'counter(...) [\\\\]');
        checkListLevelStyleNumberAttribute(numberSuffix, ";", 'counter(...) [;]');
        checkListLevelStyleNumberAttribute(numberSuffix, ",", 'counter(...) [,]');
    }

    function checkBulletCharacter(value, expectedContentValue) {
        applyListStyles(
                '<text:list-style style:name="checkBulletCharacter">' +
                '<text:list-level-style-bullet text:level="1" text:bullet-char="' + value  +'">' +
                '<style:list-level-properties text:list-level-position-and-space-mode="label-alignment">' +
                '<style:list-level-label-alignment text:label-followed-by="listtab" fo:margin-left="0cm"/>' +
                '</style:list-level-properties>' +
                '</text:list-level-style-bullet>' +
                '</text:list-style>',
            "");

        matchContentBlock("checkBulletCharacter", expectedContentValue);
    }

    function bulletCharacters() {
        checkBulletCharacter("a b", "[a b]");
        checkBulletCharacter("&apos;", "[']");
        checkBulletCharacter("&quot;", "[\"]");
        checkBulletCharacter("\\", "[\\\\]");
        checkBulletCharacter(";", "[;]");
        checkBulletCharacter(",", "[,]");
    }

    this.tests = function () {
        return r.name([
            verifyCSSContentNormalization,
            style_list_level_label_alignment_WithNo_fo_margin_left,
            numberedListPrefixes,
            numberedListSuffixes,
            bulletCharacters
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
