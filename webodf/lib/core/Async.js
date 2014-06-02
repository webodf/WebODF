/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
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

(function() {
    "use strict";

    /**
     * @return {!{forEach:!function(!Array.<*>,!function(*, !function(!string):undefined):undefined,!function(?string)):undefined, destroyAll:function(!Array.<!function(!function(!Error=))>,!function(!Error=)):undefined}}
     */
    function createASyncSingleton() {
        /**
         * @param {!Array.<*>} items
         * @param {!function(*, !function(!string):undefined):undefined} f
         * @param {!function(?string)} callback
         * @return {undefined}
         */
        function forEach(items, f, callback) {
            var i, l = items.length,
                /**@type{!number}*/
                itemsDone = 0;
            /**
             * @param {?string} err
             * @return {undefined}
             */
            function end(err) {
                if (itemsDone !== l) {
                    if (err) {
                        itemsDone = l;
                        callback(err);
                    } else {
                        itemsDone += 1;
                        if (itemsDone === l) {
                            callback(null);
                        }
                    }
                }
            }
            for (i = 0; i < l; i += 1) {
                f(items[i], end);
            }
        }

        /**
         * @param {!Array.<!function(!function(!Error=))>} items
         * @param {!function(!Error=)} callback
         * @return {undefined}
         */
        function destroyAll(items, callback) {
            /**
             * @param {!number} itemIndex
             * @param {!Error|undefined} err
             * @return {undefined}
             */
            function destroy(itemIndex, err) {
                if (err) {
                    callback(err);
                } else {
                    if (itemIndex < items.length) {
                        items[itemIndex](function (err) { destroy(itemIndex + 1, err); });
                    } else {
                        callback();
                    }
                }
            }
            destroy(0, undefined);
        }

        return {
            forEach: forEach,
            destroyAll: destroyAll
        };
    }

    /**
     * Wrapper for Async functions
     * @const
     * @type {!{forEach:!function(!Array.<*>,!function(*, !function(!string):undefined):undefined,!function(?string)):undefined, destroyAll:function(!Array.<!function(!function(!Error=))>,!function(!Error=)):undefined}}
     */
    core.Async = createASyncSingleton();
}());
