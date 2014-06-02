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

/*global ops */
/*jslint emptyblock: true, unparam: true */

/**
 * @interface
 */
ops.Canvas = function Canvas() { "use strict"; };
/**
 * @return {number}
 */
ops.Canvas.prototype.getZoomLevel = function () { "use strict"; };
/**
 * @return {!Element}
 */
ops.Canvas.prototype.getElement = function () { "use strict"; };
/**
 * @return {!HTMLElement}
 */
ops.Canvas.prototype.getSizer = function () { "use strict"; };
/**
 * @return {!gui.ZoomHelper}
 */
ops.Canvas.prototype.getZoomHelper = function () { "use strict"; };
