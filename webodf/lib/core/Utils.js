/**
 * Copyright (C) 2012 KO GmbH <aditya.bhatt@kogmbh.com>
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
 *
 * As additional permission under GNU AGPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * As a special exception to the AGPL, any HTML file which merely makes function
 * calls to this code, and for that purpose includes it by reference shall be
 * deemed a separate work for copyright law purposes. In addition, the copyright
 * holders of this code give you permission to combine this code with free
 * software libraries that are released under the GNU LGPL. You may copy and
 * distribute such a system following the terms of the GNU AGPL for this code
 * and the LGPL for the libraries. If you modify this code, you may extend this
 * exception to your version of the code, but you are not obligated to do so.
 * If you do not wish to do so, delete this exception statement from your
 * version.
 *
 * This license applies to this entire compilation.
 * @licend
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global core*/

/**
 * A collection of useful utility functions
 * @constructor
 */
core.Utils = function Utils() {
    "use strict";

    /**
     * Simple string hash
     * Based off http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
     * @param {!string} value
     * @returns {!number}
     */
    function hashString(value) {
        var hash = 0, i, l;
        for (i = 0, l = value.length; i < l; i += 1) {
            /*jslint bitwise:true*/
            hash = ((hash << 5) - hash) + value.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
            /*jslint bitwise:false*/
        }
        return hash;
    }
    this.hashString = hashString;

    var mergeObjects;
    /**
     * @param {*} destination
     * @param {*} source
     * @return {*}
     */
    function mergeItems(destination, source) {
        // Property in destination object set; update its value.
        if (source && Array.isArray(source)) {
            // create destination array if it does not exist yet
            destination = destination || [];
            if (!Array.isArray(destination)) {
                throw "Destination is not an array.";
            }
            // An array will report as a type of object, but this is not able to
            // mapped using mergeObjects
            // The following will clone each individual item in the source array
            // and append them to the end of the destination array
            destination = /**@type{!Array.<*>}*/(destination).concat(
                /**@type{!Array.<*>}*/(source).map(function (obj) {
                    return mergeItems(null, obj);
                })
            );
        } else if (source && typeof source === 'object') {
            destination = destination || {};
            if (typeof destination !== 'object') {
                throw "Destination is not an object.";
            }
            Object.keys(/**@type{!Object}*/(source)).forEach(function (p) {
                destination[p] = mergeItems(destination[p], source[p]);
            });
        } else {
            destination = source;
        }
        return destination;
    }
    /**
     * Recursively merge properties of two objects
     * Merge behaviours for the object members are:
     *  array => array - Append clones of source array onto the end of the
     *                   destination array
     *  object => object - Map each individual key from source onto destination
     *                     (recursive, so these are clones)
     *  primitive => primitive - return primitive value
     *
     * @param {!Object.<string,*>} destination
     * @param {!Object.<string,*>} source
     * @return {!Object.<string,*>}
     */
    mergeObjects = function (destination, source) {
        Object.keys(source).forEach(function (p) {
            destination[p] = mergeItems(destination[p], source[p]);
        });
        return destination;
    };
    this.mergeObjects = mergeObjects;
};

