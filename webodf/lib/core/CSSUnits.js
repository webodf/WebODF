/**
 * Copyright (C) 2012 KO GmbH <aditya.bhatt@kogmbh.com>
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

/*global core*/
/*jslint plusplus: true, bitwise: true */

/**
 * @constructor
 */
core.CSSUnits = function CSSUnits() {
    "use strict";

    // Unit values relative to 1 inch
    var self = this,
        sizemap = {
            "in": 1,
            "cm": 2.54,
            "mm": 25.4,
            "pt": 72,
            "pc": 12,
            "px": 96
        };

    /**
     * Takes a number of an oldUnit and returns its value in newUnit
     * @param {!number} value
     * @param {!string} oldUnit
     * @param {!string} newUnit
     * @return {!number}
     */
    this.convert = function (value, oldUnit, newUnit) {
        return value * sizemap[newUnit] / sizemap[oldUnit];
    };

    /**
     * Takes a measure such as "2cm" and returns it's measurement in the new unit, e.g. 20
     * @param {!string} measure
     * @param {!string} newUnit
     * @return {!number|undefined}
     */
    this.convertMeasure = function (measure, newUnit) {
        var value, oldUnit, newMeasure;
        if (measure && newUnit) {
            value = parseFloat(measure);
            oldUnit = measure.replace(value.toString(), "");

            newMeasure = self.convert(value, oldUnit, newUnit);
        }
        return newMeasure;
    };
    /**
     * @param {!string} measure
     * @return {!string}
     */
    this.getUnits = function (measure) {
        return measure.substr(measure.length - 2, measure.length);
    };
};
