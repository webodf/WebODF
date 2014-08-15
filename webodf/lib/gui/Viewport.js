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

/*global gui*/
/*jslint emptyblock: true, unparam: true*/

/**
 * @interface
 */
gui.Viewport = function Viewport() { "use strict"; };

/**
 * Scroll the specified client rectangle into the viewport. No scrolling
 * will occur if the clientRect is already visible, is null, or the scroll pane
 * itself is invisible.
 *
 * If the clientRect is larger than the available scroll height, as much of the
 * rect will be shown in the view as possible whilst ensuring the top is still
 * on screen. Similar logic applies if the clientRect width is too large.
 *
 * @param {?core.SimpleClientRect} clientRect
 * @param {!boolean=} alignWithTop Align the clientRect to the top of the viewport. If unspecified or false, the
 *  view will scroll only as much as required to bring the clientRect into view.
 * @return {undefined}
 */
gui.Viewport.prototype.scrollIntoView = function(clientRect, alignWithTop) { "use strict"; };