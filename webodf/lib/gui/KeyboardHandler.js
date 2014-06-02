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

/*global gui, runtime */
/*jslint bitwise: true*/

/**
 * @constructor
 * @return {?}
 */
gui.KeyboardHandler = function KeyboardHandler() {
    "use strict";
    var modifier = gui.KeyboardHandler.Modifier,
        /**@type{?function(!KeyboardEvent):boolean}*/
        defaultBinding = null,
        /**@type{!Object.<string,function():boolean>}*/
        bindings = {};

    /**
     * @param {!KeyboardEvent} e
     * @return {!number}
     */
    function getModifiers(e) {
        var modifiers = modifier.None;
        if (e.metaKey) { modifiers |= modifier.Meta; }
        if (e.ctrlKey) { modifiers |= modifier.Ctrl; }
        if (e.altKey) { modifiers |= modifier.Alt; }
        if (e.shiftKey) { modifiers |= modifier.Shift; }
        return modifiers;
    }

    /**
     * @param {!number}     keyCode
     * @param {!number}     modifiers
     * @return {!string}
     */
    function getKeyCombo(keyCode, modifiers) {
        if (!modifiers) {
            modifiers = modifier.None;
        }
        // When a modifier key is pressed on it's own, different browsers + platforms
        // may report the state of the corresponding modifier flag as trailing the event.
        // For example, pressing the ctrl key in FF on Linux will report (ctrlKey:false)
        // in the keydown event, while Chrome on Linux will report (ctrlKey:true) in the
        // keydown event.
        //
        // Easiest way to cope with this is to manually normalize these events.
        switch (keyCode) {
            case gui.KeyboardHandler.KeyCode.LeftMeta:
            case gui.KeyboardHandler.KeyCode.RightMeta:
            case gui.KeyboardHandler.KeyCode.MetaInMozilla:
                modifiers |= modifier.Meta;
                break;
            case gui.KeyboardHandler.KeyCode.Ctrl:
                modifiers |= modifier.Ctrl;
                break;
            case gui.KeyboardHandler.KeyCode.Alt:
                modifiers |= modifier.Alt;
                break;
            case gui.KeyboardHandler.KeyCode.Shift:
                modifiers |= modifier.Shift;
                break;
        }

        return keyCode + ':' + modifiers;
    }

    /**
     * @param {?Function}   callback
     */
    this.setDefault = function (callback) {
        defaultBinding = callback;
    };

    /**
     * Bind to the specified keycode + modifiers. To bind directly to one of the modifiers, simply
     * pass in the modifier as the keyCode (e.g., Keycode.Ctrl), and set the modifiers to Modifier.None.
     * This class will take care of binding to the appropriate modifiers to ensure the keybinding works as
     * expected.
     *
     * @param {!number}     keyCode
     * @param {!number}     modifiers
     * @param {!Function}   callback
     * @param {boolean=}   overwrite    Set to true to force a binding to be overwritten
     */
    this.bind = function (keyCode, modifiers, callback, overwrite) {
        var keyCombo = getKeyCombo(keyCode, modifiers);
        runtime.assert(overwrite || bindings.hasOwnProperty(keyCombo) === false,
            "tried to overwrite the callback handler of key combo: " + keyCombo);
        bindings[keyCombo] = callback;
    };

    /**
     * @param {!number}     keyCode
     * @param {!number}    modifiers
     */
    this.unbind = function (keyCode, modifiers) {
        var keyCombo = getKeyCombo(keyCode, modifiers);
        delete bindings[keyCombo];
    };

    /*
     * removes all the bindings includes the default binding
     */
    this.reset = function () {
        defaultBinding = null;
        bindings = {};
    };

    /**
     * @param {!KeyboardEvent} e
     */
    this.handleEvent = function (e) {
        var keyCombo = getKeyCombo(e.keyCode, getModifiers(e)),
            /**@type{function():boolean|undefined}*/
            callback = bindings[keyCombo],
            handled = false;

        if (callback) {
            handled = callback();
        } else if (defaultBinding !== null) {
            handled = defaultBinding(e);
        }

        if (handled) {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
        }
    };
};

/**@const*/
gui.KeyboardHandler.Modifier = {
    None: 0,
    Meta: 1,
    Ctrl: 2,
    Alt: 4,
    CtrlAlt: 6,
    Shift: 8,
    MetaShift: 9,
    CtrlShift: 10,
    AltShift: 12
};

/**@const*/
gui.KeyboardHandler.KeyCode = {
    Backspace: 8,
    Tab: 9,
    Clear: 12,
    Enter: 13,
    Shift: 16,
    Ctrl: 17,
    Alt: 18,
    End: 35,
    Home: 36,
    Left: 37,
    Up: 38,
    Right: 39,
    Down: 40,
    Delete: 46,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    LeftMeta: 91,
    RightMeta: 93,
    MetaInMozilla: 224
};
