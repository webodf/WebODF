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

/*global runtime, xmled */

/**
 * @constructor
 * This class checks for some problems in XSD schemas. Aspects that it should
 * check:
 *  - references
 *  - UPA (http://en.wikipedia.org/wiki/Unique_Particle_Attribution)
 * These checks have not been implemented yet, but the implementation of
 * ValidationModel assumes that all references are correct and that there is
 * no problem with UPA.
 * @return {?}
 **/
xmled.XsdChecker = function XsdChecker() {
    "use strict";
    /**
     * @param {!Document} xsddoc 
     * @return {?string}
     */
    this.check = function (xsddoc) {
        return xsddoc ? null : "No doc.";
    };
};
