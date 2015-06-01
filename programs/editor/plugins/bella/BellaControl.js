/**
 * Copyright (C) 2014-2015 KO GmbH <copyright@kogmbh.com>
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

/*global define, runtime*/

define("webodf/editor/plugins/bella/BellaControl", [
        "webodf/editor/plugins/bella/Bella", "dijit/form/Button"
    ],
    function(Bella, Button) {
    "use strict";

    function BellaControl(config, onInitialise) {
        var self = this,
            bella,
            editorSession,
            startButton,
            stopButton,
            widget = {};

        startButton = new Button({
            label: runtime.tr('Start'),
            showLabel: true,
            disabled: true,
            onClick: function () {
                if (bella) {
                    bella.addToDocument(editorSession.sessionController);
                    editorSession.sessionView.showCaretAvatars();
                    editorSession.sessionView.showEditInfoMarkers();
                    startButton.set('disabled', true);
                    stopButton.set('disabled', false);
                    self.onToolDone();
                }
            }
        });

        stopButton = new Button({
            label: runtime.tr('Stop'),
            showLabel: true,
            disabled: true,
            onClick: function () {
                if (bella) {
                    bella.removeFromDocument();
                    startButton.set('disabled', false);
                    stopButton.set('disabled', true);
                    self.onToolDone();
                }
            }
        });

        widget.children = [startButton, stopButton];
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

        this.setEditorSession = function(session) {
            if (bella) {
                bella.destroy();
                bella = undefined;
            }

            editorSession = session;

            if (editorSession) {
                bella = new Bella(config);
            }
            startButton.set('disabled', bella === undefined);
            stopButton.set('disabled', true);
        };

        /*jslint emptyblock: true*/
        this.onToolDone = function () {};
        /*jslint emptyblock: false*/

        // init
        onInitialise(widget);
    }

    return BellaControl;
});