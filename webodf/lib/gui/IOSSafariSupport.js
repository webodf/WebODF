/**
 * @license
 * Copyright (C) 2014 KO GmbH <copyright@kogmbh.com>
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


/*global runtime, gui, core*/

/**
 * Drop-in workaround for several bugs/quirks
 * found in iOS Safari.
 * @constructor
 * @implements {core.Destroyable}
 * @param {!gui.EventManager} eventManager
 */
gui.IOSSafariSupport = function (eventManager) {
    "use strict";
    var window = runtime.getWindow(),
        eventTrap = eventManager.getEventTrap();

    /**
     * Mobile browsers tend to automatically scroll to a focussed element
     * However we do not want this uncontrollable animated scroll when
     * the keyboard is already open. Therefore, we try to guess if it is
     * open, and in that case momentarily hide the eventTrap,
     * and open it after the next animation frame. This causes the
     * keyboard to not know where the event trap is when it is opening,
     * thus resulting in no scroll, just like we wanted.
     * @return {undefined}
     */
    function suppressFocusScrollIfKeyboardOpen() {
        // This keyboard detection trick seems to work on iOS
        if (window.innerHeight !== window.outerHeight) {
            eventTrap.style.display = "none";
            window.requestAnimationFrame(function () {
                eventTrap.style.display = "block";
            });
        }
    }

    /**
     * @param {!function(!Object=)} callback
     * @return {undefined}
     */
    this.destroy = function (callback) {
        eventManager.unsubscribe('focus', suppressFocusScrollIfKeyboardOpen);
        callback();
    };

    function init() {
        eventManager.subscribe('focus', suppressFocusScrollIfKeyboardOpen);
    }
    init();
};
