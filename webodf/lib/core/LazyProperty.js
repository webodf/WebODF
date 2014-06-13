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

/*global core*/

// TODO Apparently newer closure compilers do a better job with generics

/**
 * Lazily loaded property. The value is loaded using the valueLoader and cached
 * the first time it's requested. Subsequent requests will return the cached value.
 * Calling reset will clear the cached value, causing the next value request
 * to load a new value via the valueLoader.
 *
 * @constructor
 * @template T
 * @param {!function():Object} valueLoader Property value loader
 */
core.LazyProperty = function (valueLoader) {
    "use strict";
    var cachedValue,
        valueLoaded = false;

    /**
     * @return {T}
     */
    this.value = function() {
        if (!valueLoaded) {
            cachedValue = valueLoader();
            valueLoaded = true;
        }
        return cachedValue;
    };

    /**
     * @return {undefined}
     */
    this.reset = function() {
        valueLoaded = false;
    };
};
