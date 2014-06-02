/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
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

/*global Node, NodeFilter, odf*/

/**
 * Class that filters runtime specific nodes from the DOM.
 * @constructor
 * @implements {xmldom.LSSerializerFilter}
 */
odf.OdfNodeFilter = function OdfNodeFilter() {
    "use strict";

    /**
     * @param {!Node} node
     * @return {!number}
     */
    this.acceptNode = function (node) {
        var result;
        if (node.namespaceURI === "http://www.w3.org/1999/xhtml") {
            result = NodeFilter.FILTER_SKIP;
        } else if (node.namespaceURI && node.namespaceURI.match(/^urn:webodf:/)) {
            // skip all webodf nodes incl. child nodes
            result = NodeFilter.FILTER_REJECT;
        } else {
            result = NodeFilter.FILTER_ACCEPT;
        }
        return result;
    };
};
