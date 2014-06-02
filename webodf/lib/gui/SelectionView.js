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

/*global gui*/
/*jslint emptyblock: true, unparam: true*/

/**
 * An interface for rendering a visible selection for the provided cursor
 * @interface
 * @param {!(ops.OdtCursor|gui.ShadowCursor)} cursor
 */
gui.SelectionView = function SelectionView(cursor) { "use strict"; };

/**
 * Rerender the selection overlay
 * @return {undefined}
 */
gui.SelectionView.prototype.rerender = function() { "use strict"; };

/**
 * Show selection overlay
 * @return {undefined}
 */
gui.SelectionView.prototype.show = function() { "use strict"; };
/**
 * Hide selection overlay
 * @return {undefined}
 */
gui.SelectionView.prototype.hide = function() { "use strict"; };

/**
 * Clear all overlay from the DOM
 * @param {function(!Error=)} callback
 * @return {undefined}
 */
gui.SelectionView.prototype.destroy = function (callback) { "use strict"; };
