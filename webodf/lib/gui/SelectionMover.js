/**
 * Copyright (C) 2011 KO GmbH <jos.van.den.oever@kogmbh.com>
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
/*global runtime, core, gui, XMLSerializer*/
runtime.loadClass("core.Cursor");
runtime.loadClass("core.PositionIterator");

/**
 * This class modifies the selection in different ways.
 * @constructor
 * @param {!Node} rootNode
 */
gui.SelectionMover = function SelectionMover(rootNode) {
    "use strict";
    /**
     * @constructor
     * @extends NodeFilter
     */
    function CursorFilter() {
        this.acceptNode = function (node) {
            if (node.namespaceURI === "urn:webodf:names:cursor") {
                return 2;
            }
            return 1;
        };
    }
    var self = this,
        doc = /**@type{!Document}*/(rootNode.ownerDocument),
        selection = new core.Selection(doc),
        positionIterator,
        cursor = new core.Cursor(selection, doc),
        filter = new CursorFilter();
    function doMove(steps, extend, move) {
        var left = steps;
        // assume positionIterator reflects current state
        // positionIterator.setPosition(selection.focusNode, selection.focusOffset);
        cursor.remove();
        while (left > 0) {
            if (!move()) {
                break;
            }
            left -= 1;
        }
        if (steps - left > 0) {
            selection.collapse(positionIterator.container(),
                    positionIterator.offset());
        }
        cursor.updateToSelection();
        return steps - left;
    }
    /**
     * Move selection forward one position.
     * @param {!number} steps
     * @param {boolean} extend true if range is to be expanded from the current
     *                         point
     * @return {!number}
     **/
    this.movePointForward = function (steps, extend) {
        return doMove(steps, extend, positionIterator.nextPosition);
    };
    /**
     * Move selection forward one position.
     * @param {boolean} extend true if range is to be expanded from the current
     *                         point
     * @return {!number}
     **/
    this.movePointBackward = function (steps, extend) {
        return doMove(steps, extend, positionIterator.previousPosition);
    };
/*
    this.moveLineForward = function (extend) {
        if (selection.modify) {
            // TODO add a way to 
            selection.modify(extend ? "extend" : "move", "forward", "line");
        } else {
            doMove(extend, moveCursorDown);
        }
    };
    this.moveLineBackward = function (extend) {
        if (selection.modify) {
            selection.modify(extend ? "extend" : "move", "backward", "line");
        } else {
            doMove(extend, function () {
            });
        }
    };
*/
    this.getCursor = function () {
        return cursor;
    };
    this.getSelection = function () {
        return selection;
    };
    this.createIterator = function () {
        return new core.PositionIterator(rootNode, 5, filter, false);
    };
    function init() {
        positionIterator = self.createIterator();
        // put the cursor at the start of the rootNode
        selection.collapse(positionIterator.container(),
                positionIterator.offset());
        cursor.updateToSelection();
/*
        n = 1;
        while (self.movePointForward()) {
            n += 1;
        }
 runtime.log("YO " + n);
        n = 1;
        while (self.movePointBackward()) {
            n += 1;
        }
 runtime.log("YO " + n);
*/
    }
    init();
};
