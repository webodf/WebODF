/**
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
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
/*jslint emptyblock: true, unparam: true*/

/**
 * An operation that can be performed on a document.
 * @interface
 */
core.Destroyable = function Destroyable() {
    "use strict";
};
/**
 * Destroy the object.
 * Do not access any member of this object after this call.
 * @param {function(!Error=):undefined} callback
 * @return {undefined}
 */
core.Destroyable.prototype.destroy = function (callback) {"use strict"; };

