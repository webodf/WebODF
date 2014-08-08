/**
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

/*global runtime, odf*/

/**
 * Object that retrieves properties lazily and caches them.
 * If the element does not define the property it is retrieved from a parent
 * LazyStyleProperties object.
 * An object with getters functions is passed into the constructor. There must
 * be a getter function for each property.
 * @constructor
 * @param {!odf.LazyStyleProperties|undefined} parent
 * @param {!Object.<!string,function():*>} getters
 */
odf.LazyStyleProperties = function (parent, getters) {
    "use strict";
    var /**@type{!Object.<!string,*>}*/
        data = {};
    /**
     * Retrieve a value by name.
     * The getter for the value must be defined in the getters object.
     * If the getter returns undefined and a parent object is provided, the
     * value is gotten from the parent object.
     * @param {!string} name
     * @return {*}
     */
    this.value = function (name) {
        var /**@type{*}*/
            v;
        if (data.hasOwnProperty(name)) {
            v = data[name];
        } else {
            v = getters[name]();
            if (v === undefined && parent) {
                v = parent.value(name);
            }
            data[name] = v;
        }
        return v;
    };
    /**
     * Give a new parent to the LazyStyleProperties.
     * The cache is invalidated when this is done.
     * @param {!odf.LazyStyleProperties|undefined} p
     * @return {undefined}
     */
    this.reset = function (p) {
        parent = p;
        data = {};
    };
};
/**
 * A collection of helper functions for parsing style attributes.
 * @constructor
 */
odf.StyleParseUtils = function () {
    "use strict";
    var stylens = odf.Namespaces.stylens;
    /**
     * Returns the length split as value and unit, from an ODF attribute.
     * If the length does not match the regular expression, null is returned.
     * @param {?string|undefined} length
     * @return {?{value:!number,unit:!string}}
     */
    function splitLength(length) {
        var re = /(-?[0-9]*[0-9][0-9]*(\.[0-9]*)?|0+\.[0-9]*[1-9][0-9]*|\.[0-9]*[1-9][0-9]*)((cm)|(mm)|(in)|(pt)|(pc)|(px))/,
            m = re.exec(length);
        if (!m) {
            return null;
        }
        return {value: parseFloat(m[1]), unit: m[3]};
    }
    /**
     * Convert a unit in a string to number of pixels at 96 dpi.
     * If the input value has unit 'px' or is a number, the number is taken as
     * is. Other allowed unit: cm, mm, pt, pc.
     * If the value cannot be parsed, the value undefined is returned.
     * @param {?string|undefined} val
     * @return {!number|undefined}
     */
    function parseLength(val) {
        var n, length, unit;
        length = splitLength(val);
        unit = length && length.unit;
        if (unit === "px") {
            n = length.value;
        } else if (unit === "cm") {
            n = length.value / 2.54 * 96;
        } else if (unit === "mm") {
            n = length.value / 25.4 * 96;
        } else if (unit === "in") {
            n = length.value * 96;
        } else if (unit === "pt") {
            n = length.value / 0.75;
        } else if (unit === "pc") {
            n = length.value * 16;
        }
        return n;
    }
    this.parseLength = parseLength;
    /**
     * Parse a percentage of the form -?([0-9]+(\.[0-9]*)?|\.[0-9]+)%.
     * If parsing fails undefined is returned.
     * @param {?string|undefined} value
     * @return {!number|undefined}
     */
    function parsePercent(value) {
        var v;
        if (value) {
            v = parseFloat(value.substr(0, value.indexOf("%")));
            if (isNaN(v)) {
                v = undefined;
            }
        }
        return v;
    }
    /**
     * Parse a value that is a positive length or a percentage.
     * If parsing fails undefined is returned.
     * @param {?string|undefined} value
     * @param {!string} name
     * @param {!odf.LazyStyleProperties|undefined} parent
     * @return {!number|undefined}
     */
    function parsePositiveLengthOrPercent(value, name, parent) {
        var v = parsePercent(value),
            parentValue;
        if (v !== undefined) {
            if (parent) {
                parentValue = parent.value(name);
            }
            if (parentValue === undefined) {
                v = undefined;
            } else {
                v *= /**@type{!number}*/(parentValue) / 100;
            }
        } else {
            v = parseLength(value);
        }
        return v;
    }
    this.parsePositiveLengthOrPercent = parsePositiveLengthOrPercent;
    /**
     * Find a child element from the ODF style namespace with the given local
     * name.
     * The search is started after the given previousPropertyElement or, if
     * previousPropertyElement is not given, from the first child element.
     * @param {!string} name
     * @param {!Element} styleElement
     * @param {?Element=} previousPropertyElement
     * @return {?Element}
     */
    function getPropertiesElement(name, styleElement, previousPropertyElement) {
        var e = previousPropertyElement
                ? previousPropertyElement.nextElementSibling
                : styleElement.firstElementChild;
        while (e !== null && (e.localName !== name || e.namespaceURI !== stylens)) {
            e = e.nextElementSibling;
        }
        return e;
    }
    this.getPropertiesElement = getPropertiesElement;


    /**
     * Split a space-separated attribute list into it's list items. Ignores leading & trailing
     * whitespace, and collapses excessive internal whitespace. If the input text is null, undefined
     * or pure whitespace, an empty array will be returned.
     *
     * @param {?string|undefined} text
     * @return {!Array.<!string>}
     */
    /*jslint regexp: true*/
    function parseAttributeList(text) {
        if (text) {
            text = text.replace(/^\s*(.*?)\s*$/g, "$1"); // Trim leading + trailing whitespace
        }
        // Calling split on an empty string returns a [""]. Avoid this by only attempting to split if the
        // string is non-zero-length
        return text && text.length > 0 ? text.split(/\s+/) : [];
    }
    /*jslint regexp: false*/
    this.parseAttributeList = parseAttributeList;
};
