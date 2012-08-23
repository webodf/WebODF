/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
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
 * @source: http://gitorious.org/odfkit/webodf/
 */
/*global core: true, Node: true*/
/**
 * A walker that allows finegrained stepping through the DOM.
 * A PointWalker goes from point to point. Each point points to positions
 * between elements of the dom tree. So each point has a node and a position.
 * In that regard, a point is the same as a start and end of Range.
 * @interface
 */
core.PointWalker = function PointWalker() {"use strict"; };
/**
 * Move the walker to the point given by @p node and @p position.
 * @param {!Node} node must be the root of this walker or part of the
 *                   tree of this walker.
 * @param {!number} position must be a valid position in @node.
 **/
core.PointWalker.prototype.setPoint = function (node, position) {"use strict"; };
/**
 * @return {!boolean}
 */
core.PointWalker.prototype.stepForward = function () {"use strict"; };
/**
 * @return {!boolean}
 */
core.PointWalker.prototype.stepBackward = function () {"use strict"; };
/**
 * @return {!Node}
 */
core.PointWalker.prototype.node = function () {"use strict"; };
/**
 * @return {!number}
 */
core.PointWalker.prototype.position = function () {"use strict"; };
/**
 * @param {!Node} node
 * @return {!number}
 */
core.PointWalker.prototype.countPositions = function (node) {"use strict"; };
/**
 * @return {?Node}
 */
core.PointWalker.prototype.precedingSibling = function () {"use strict"; };
/**
 * @return {?Node}
 */
core.PointWalker.prototype.followingSibling = function () {"use strict"; };
(function () {
    "use strict";
    return core.PointWalker;
}());
