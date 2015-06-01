/**
 * Copyright (C) 2014-2015 KO GmbH <copyright@kogmbh.com>
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

/*global define*/

define("webodf/editor/plugins/bella/Random", ["./seedrandom"], function(seedrandom) {
    "use strict";

    function Random(seed) {
/*jslint newcap: true */
        var random = new seedrandom(seed);
/*jslint newcap: false */

        /**
         * Return a random number between min (included) & max (excluded)
         * @param {number=} min
         * @param {number=} max
         * @returns {!number}
         */
        function getInt(min, max) {
            min = min === undefined ? Number.MIN_VALUE : min;
            max = max === undefined ? Number.MAX_VALUE : max;
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
            // Also http://stackoverflow.com/questions/1527803/generating-random-numbers-in-javascript-in-a-specific-range
            return Math.floor(random() * (max - min) + min);
        }

        this.getInt = getInt;

        function getBool() {
            return random() < 0.5;
        }

        this.getBool = getBool;

        function getElement(list) {
            var index = getInt(0, list.length);
            return list[index];
        }

        this.getElement = getElement;

        function popListElement(list) {
            var index = getInt(0, list.length),
                item = list[index];
            list.splice(index, -1);
            return item;
        }

        this.popListElement = popListElement;

        function oneIn(chance) {
            return getInt(0, chance) === 0;
        }

        this.oneIn = oneIn;
    }

    return Random;
});