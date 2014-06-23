/**
 * Copyright (C) 2012-2014 KO GmbH <copyright@kogmbh.com>
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

/*global runtime, gui*/

/**
 * @constructor
 * @param {!Array.<!odf.Formatting.AppliedStyle>} styles
 */
gui.StyleSummary = function StyleSummary(styles) {
    "use strict";
    var propertyValues = {};

    /**
     * Get all values for the section + propertyName across all supplied styles. If a
     * one or more styles do not have a defined value for the specified propertyName, the
     * returned array will contain an "undefined" value to indicate the property is
     * missing on some of the styles.
     *
     * @param {!string} section Section (e.g., style:text-properties)
     * @param {!string} propertyName Property (e.g., fo:font-weight)
     * @return {!Array.<!string|undefined>}
     */
    function getPropertyValues(section, propertyName) {
        var cacheKey = section + "|" + propertyName,
            /**@type{Array.<!string>}*/values;
        if (!propertyValues.hasOwnProperty(cacheKey)) {
            values = [];
            styles.forEach(function (style) {
                var styleSection = /**@type{!Object.<!string, !string>}*/(style.styleProperties[section]),
                    value = styleSection && styleSection[propertyName];
                if (values.indexOf(value) === -1) {
                    values.push(value);
                }
            });
            propertyValues[cacheKey] = values;
        }
        return propertyValues[cacheKey];
    }
    this.getPropertyValues = getPropertyValues;

    /**
     * Create a lazily-loaded, cached lookup function that returns true if all section + propertyName
     * values are contained in the supplied acceptedPropertyValues array
     *
     * @param {!string} section Section (e.g., style:text-properties)
     * @param {!string} propertyName Property (e.g., fo:font-weight)
     * @param {!Array.<!string>} acceptedPropertyValues Array of accepted values
     * @return {!function():!boolean} Returns true if all values are in the accepted property values
     */
    function lazilyLoaded(section, propertyName, acceptedPropertyValues) {
        return function () {
            var existingPropertyValues = getPropertyValues(section, propertyName);
            // As a small optimization, check accepted vs. existing lengths first.
            // If there are more existing values than accepted, this function should return
            // false as there are definitely some non-acceptable values.
            return acceptedPropertyValues.length >= existingPropertyValues.length
                // Next, ensure each existing property value appears in the accepted properties array
                && existingPropertyValues.every(function (v) { return acceptedPropertyValues.indexOf(v) !== -1; });
        };
    }

    /**
     * Return the common value for a section + propertyName if it has an identical value in all
     * supplied styles. If there are multiple values, or one or more styles do not have either
     * the section or propertyName present, this function will return undefined.
     *
     * @param {!string} section Section (e.g., style:text-properties)
     * @param {!string} propertyName Property (e.g., fo:font-weight)
     * @return {string|undefined}
     */
    function getCommonValue(section, propertyName) {
        var values = getPropertyValues(section, propertyName);
        return values.length === 1 ? values[0] : undefined;
    }
    this.getCommonValue = getCommonValue;

    /**
     * Returns true if all styles specify text as bold; otherwise false.
     * @return {!boolean}
     */
    this.isBold = lazilyLoaded("style:text-properties", "fo:font-weight", ["bold"]);

    /**
     * Returns true if all styles specify text as italic; otherwise false.
     * @return {!boolean}
     */
    this.isItalic = lazilyLoaded("style:text-properties", "fo:font-style", ["italic"]);

    /**
     * Returns true if all styles specify text as underlined; otherwise false.
     * @return {!boolean}
     */
    this.hasUnderline = lazilyLoaded("style:text-properties", "style:text-underline-style", ["solid"]);

    /**
     * Returns true if all styles specify text as strike-through; otherwise false.
     * @return {!boolean}
     */
    this.hasStrikeThrough = lazilyLoaded("style:text-properties", "style:text-line-through-style", ["solid"]);

    /**
     * Returns the common font size in the supplied styles; otherwise undefined if there is no common font size
     * @return {number|undefined}
     */
    this.fontSize = function () {
        var stringFontSize = getCommonValue('style:text-properties', 'fo:font-size');
        return /**@type{number|undefined}*/(stringFontSize && parseFloat(stringFontSize)); // TODO: support other units besides pt!
    };

    /**
     * Returns the common font name in the supplied styles; otherwise undefined if there is no common font name
     * @return {string|undefined}
     */
    this.fontName = function () {
        return getCommonValue('style:text-properties', 'style:font-name');
    };

    /**
     * Returns true if all styles are left aligned; otherwise false.
     * @return {!boolean}
     */
    this.isAlignedLeft = lazilyLoaded("style:paragraph-properties", "fo:text-align", ["left", "start"]);

    /**
     * Returns true if all styles are center aligned; otherwise false.
     * @return {!boolean}
     */
    this.isAlignedCenter = lazilyLoaded("style:paragraph-properties", "fo:text-align", ["center"]);

    /**
     * Returns true if all styles are right aligned; otherwise false.
     * @return {!boolean}
     */
    this.isAlignedRight = lazilyLoaded("style:paragraph-properties", "fo:text-align", ["right", "end"]);

    /**
     * Returns true if all styles are justified; otherwise false.
     * @return {!boolean}
     */
    this.isAlignedJustified = lazilyLoaded("style:paragraph-properties", "fo:text-align", ["justify"]);
    /**
     * @type{!Object.<string,function():*>}
     */
    this.text = {
        isBold: this.isBold,
        isItalic: this.isItalic,
        hasUnderline: this.hasUnderline,
        hasStrikeThrough: this.hasStrikeThrough,
        fontSize: this.fontSize,
        fontName: this.fontName
    };
    /**
     * @type{!Object.<string,function():*>}
     */
    this.paragraph = {
        isAlignedLeft: this.isAlignedLeft,
        isAlignedCenter: this.isAlignedCenter,
        isAlignedRight: this.isAlignedRight,
        isAlignedJustified: this.isAlignedJustified
    };
};
