/**
 * @license
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
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
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global define,require*/

define("webodf/editor/widgets/undoRedoMenu",
    ["webodf/editor/EditorSession", "dijit/form/Button"],

    function (EditorSession, Button) {
        "use strict";

        return function UndoRedoMenu(callback) {
            var self = this,
                editorSession,
                undoButton,
                redoButton,
                widget = {};

            undoButton = new Button({
                label: runtime.tr('Undo'),
                showLabel: false,
                disabled: true, // TODO: get current session state
                iconClass: "dijitEditorIcon dijitEditorIconUndo",
                onClick: function () {
                    if (editorSession) {
                        editorSession.undo();
                        self.onToolDone();
                    }
                }
            });

            redoButton = new Button({
                label: runtime.tr('Redo'),
                showLabel: false,
                disabled: true, // TODO: get current session state
                iconClass: "dijitEditorIcon dijitEditorIconRedo",
                onClick: function () {
                    if (editorSession) {
                        editorSession.redo();
                        self.onToolDone();
                    }
                }
            });

            widget.children = [undoButton, redoButton];
            widget.startup = function () {
                widget.children.forEach(function (element) {
                    element.startup();
                });
            };

            widget.placeAt = function (container) {
                widget.children.forEach(function (element) {
                    element.placeAt(container);
                });
                return widget;
            };

            function checkUndoButtons(e) {
                if (undoButton) {
                    undoButton.set('disabled', e.undoAvailable === false);
                }
                if (redoButton) {
                    redoButton.set('disabled', e.redoAvailable === false);
                }
            }

            this.setEditorSession = function(session) {
                if (editorSession) {
                    editorSession.unsubscribe(EditorSession.signalUndoStackChanged, checkUndoButtons);
                }
                editorSession = session;
                if (editorSession) {
                    editorSession.subscribe(EditorSession.signalUndoStackChanged, checkUndoButtons);
                    // TODO: checkUndoButtons(editorSession.getundoredoavailablalalo());
                }
            };

            this.onToolDone = function () {};

            // init
            callback(widget);
        };
    });
