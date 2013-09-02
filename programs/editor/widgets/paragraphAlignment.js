/**
 * @license
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
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

/*global define,require,document */

define("webodf/editor/widgets/paragraphAlignment", [
    "webodf/editor/EditorSession",
    "dijit/form/ToggleButton",
    "dijit/form/Button"],

    function (EditorSession, ToggleButton, Button) {
        "use strict";

        var ParagraphAlignment = function (callback) {
            var widget = {},
                editorSession,
                justifyLeft,
                justifyCenter,
                justifyRight,
                justifyFull,
                indent,
                outdent;

            justifyLeft = new ToggleButton({
                label: document.translator('justifyLeft'),
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconJustifyLeft",
                onChange: function () {
                    editorSession.sessionController.alignParagraphLeft();
                }
            });

            justifyCenter = new ToggleButton({
                label: document.translator('justifyCenter'),
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconJustifyCenter",
                onChange: function () {
                    editorSession.sessionController.alignParagraphCenter();
                }
            });

            justifyRight = new ToggleButton({
                label: document.translator('justifyRight'),
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconJustifyRight",
                onChange: function () {
                    editorSession.sessionController.alignParagraphRight();
                }
            });

            justifyFull = new ToggleButton({
                label: document.translator('justifyFull'),
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconJustifyFull",
                onChange: function () {
                    editorSession.sessionController.alignParagraphJustified();
                }
            });

            outdent = new Button({
                label: document.translator('outdent'),
                showLabel: false,
                disabled: false,
                iconClass: "dijitEditorIcon dijitEditorIconOutdent",
                onClick: function () {
                    editorSession.sessionController.outdent();
                }
            });

            indent = new Button({
                label: document.translator('indent'),
                showLabel: false,
                disabled: false,
                iconClass: "dijitEditorIcon dijitEditorIconIndent",
                onClick: function () {
                    editorSession.sessionController.indent();
                }
            });

            function checkStyleButtons() {
                // The 3rd parameter is false to avoid firing onChange when setting the value
                // programmatically.
                justifyLeft.set('checked', editorSession.isAlignedLeft(), false);
                justifyCenter.set('checked', editorSession.isAlignedCenter(), false);
                justifyRight.set('checked', editorSession.isAlignedRight(), false);
                justifyFull.set('checked', editorSession.isAlignedJustified(), false);
            }



            widget.children = [justifyLeft,
                justifyCenter,
                justifyRight,
                justifyFull,
                outdent,
                indent
            ];

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
                if (editorSession) {
                    editorSession.unsubscribe(EditorSession.signalCursorMoved, checkStyleButtons);
                    editorSession.unsubscribe(EditorSession.signalParagraphChanged, checkStyleButtons);
                    editorSession.unsubscribe(EditorSession.signalParagraphStyleModified, checkStyleButtons);
                }
                editorSession = session;
                if (editorSession) {
                    editorSession.subscribe(EditorSession.signalCursorMoved, checkStyleButtons);
                    editorSession.subscribe(EditorSession.signalParagraphChanged, checkStyleButtons);
                    editorSession.subscribe(EditorSession.signalParagraphStyleModified, checkStyleButtons);
                    checkStyleButtons();
                }
            };

            callback(widget);
        };

        return ParagraphAlignment;
});
