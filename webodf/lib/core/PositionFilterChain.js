/**
 * Copyright (C) 2013 KO GmbH <aditya.bhatt@kogmbh.com>
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

/*global runtime, core*/
/*jslint emptyblock: true, unparam: true*/

/**
 * A structure that acts like a filter for all purposes,
 * and also can be combined with other instances of it's own kind or other filters.
 * @constructor
 * @implements {core.PositionFilter}
 */
core.PositionFilterChain = function PositionFilterChain() {
    "use strict";

    var /**@type{!Array.<!core.PositionFilter|!core.PositionFilterChain>}*/
        filterChain = [],
        /**@const*/
        FILTER_ACCEPT = core.PositionFilter.FilterResult.FILTER_ACCEPT,
        /**@const*/
        FILTER_REJECT  = core.PositionFilter.FilterResult.FILTER_REJECT;

    /**
     * Returns accept if all filters in the chain accept the position, else reject.
     * @param {!core.PositionIterator} iterator
     * @return {!core.PositionFilter.FilterResult}
     */
    this.acceptPosition = function (iterator) {
        var i;
        for (i = 0; i < filterChain.length; i += 1) {
            if (filterChain[i].acceptPosition(iterator) === FILTER_REJECT) {
                return FILTER_REJECT;
            }
        }
        return FILTER_ACCEPT;
    };

    /**
     * Adds a filter to the filter chain.
     * @param {!core.PositionFilter|!core.PositionFilterChain} filterInstance
     * @return {undefined}
     */
    this.addFilter = function (filterInstance) {
        filterChain.push(filterInstance);
    };

};
