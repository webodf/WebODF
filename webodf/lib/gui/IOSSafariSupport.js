/**
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
            runtime.requestAnimationFrame(function () {
                eventTrap.style.display = "block";
            });
        }
    }

    /**
     * @param {!function(!Error=)} callback
     * @return {undefined}
     */
    this.destroy = function (callback) {
        eventManager.unsubscribe('focus', suppressFocusScrollIfKeyboardOpen);
        eventTrap.removeAttribute("autocapitalize");
        eventTrap.style.WebkitTransform = "";
        callback();
    };

    function init() {
        eventManager.subscribe('focus', suppressFocusScrollIfKeyboardOpen);
        // FIXME: This can be removed once we have better/any iOS IME support.
        // Till then, we need to avoid typing all-caps because the keyboard
        // thinks that the eventTrap is empty and therefore a new line has begun.
        eventTrap.setAttribute("autocapitalize", "off");
        // On iOS the caret is not hideable even if the text color is made transparent
        // and opacity is set to 0. However, we do not have a positional IME
        // on that platform, so just CSS-translate it offscreen.
        eventTrap.style.WebkitTransform = "translateX(-10000px)";
    }
    init();
};
