/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
 *
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
 * @source: http://gitorious.org/webodf/webodf/
 */
/*global runtime, gui, core, window */

runtime.loadClass("core.EventNotifier");

/**
 * @constructor
 * @return {?}
 */
gui.ClickHandler = function ClickHandler() {
    "use strict";

    var clickTimer,
        clickCount = 0,
        clickPosition = null,
        eventNotifier = new core.EventNotifier([
            gui.ClickHandler.signalSingleClick,
            gui.ClickHandler.signalDoubleClick,
            gui.ClickHandler.signalTripleClick]);

    function resetClick () {
        clickCount = 0;
        clickPosition = null;
    }

    /**
     * Subscribe to a given event with a callback
     * @param {!string} eventid
     * @param {!Function} cb
     */
    this.subscribe = function (eventid, cb) {
        eventNotifier.subscribe(eventid, cb);
    };

    /**
     * @param {!Event} e
     */
    this.handleMouseUp = function (e) {
        var window = runtime.getWindow();

        if (clickPosition && clickPosition.x === e.screenX && clickPosition.y === e.screenY) {
            clickCount += 1;

            if (clickCount === 1) {
                eventNotifier.emit(gui.ClickHandler.signalSingleClick, undefined);
            }
            else if (clickCount === 2) { // double click
                eventNotifier.emit(gui.ClickHandler.signalDoubleClick, undefined);
            }
            else if (clickCount === 3) { // triple click
                window.clearTimeout(clickTimer);
                eventNotifier.emit(gui.ClickHandler.signalTripleClick, undefined);
                resetClick();
            }
        } else {
            eventNotifier.emit(gui.ClickHandler.signalSingleClick, undefined);

            clickCount = 1;
            clickPosition = {x: e.screenX, y: e.screenY};
            window.clearTimeout(clickTimer);
            clickTimer = window.setTimeout(resetClick, 400);
        }
    };
};

/**@const*/gui.ClickHandler.signalSingleClick = "click";
/**@const*/gui.ClickHandler.signalDoubleClick = "doubleClick";
/**@const*/gui.ClickHandler.signalTripleClick = "tripleClick";

(function () {
    "use strict";
    return gui.ClickHandler;
}());
