/**
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
/*global define,document,require */
define("webodf/editor/widgets", [
    "webodf/editor/widgets/simpleStyles",
    "webodf/editor/widgets/undoRedoMenu",
    "webodf/editor/widgets/toolbarWidgets/currentStyle",
    "webodf/editor/widgets/paragraphStylesDialog",
    "webodf/editor/widgets/zoomSlider"],
    function (SimpleStyles, UndoRedoMenu, CurrentStyle, ParagraphStylesDialog, ZoomSlider) {
        "use strict";

        return function loadWidgets(editorSession, loadOdtFile, saveOdtFile) {
            var translator = document.translator;

            // Menubar
            require([
                "dojo/ready",
                "dijit/MenuItem",
                "dijit/DropDownMenu",
                "dijit/form/Button",
                "dijit/form/DropDownButton",
                "dijit/Toolbar"
            ], function (ready, MenuItem, DropDownMenu, Button, DropDownButton, Toolbar) {
                ready(function () {
                    var loadButton, saveButton, dropDownMenu, menuButton, paragraphStylesMenuItem, dialog, toolbar, simpleStyles, currentStyle, zoomSlider,
                        undoRedoMenu;

                    dropDownMenu = new DropDownMenu({});
                    paragraphStylesMenuItem = new MenuItem({
                        label: translator("paragraph_DDD")
                    });
                    dropDownMenu.addChild(paragraphStylesMenuItem);

                    dialog = new ParagraphStylesDialog(editorSession, function (dialog) {
                        paragraphStylesMenuItem.onClick = function () {
                            dialog.startup();
                            dialog.show();
                        };
                    });

                    // Toolbar
                    toolbar = new Toolbar({}, "toolbar");

                    if (editorSession.hasUndoManager()) {
                        undoRedoMenu = new UndoRedoMenu(editorSession, function (widget) {
                            widget.placeAt(toolbar);
                            widget.startup();
                        });
                    }

                    // Simple Style Selector [B, I, U, S]
                    simpleStyles = new SimpleStyles(editorSession, function (widget) {
                        widget.placeAt(toolbar);
                        widget.startup();
                    });

                    // Paragraph Style Selector
                    currentStyle = new CurrentStyle(editorSession, function (widget) {
                        widget.placeAt(toolbar);
                        widget.startup();
                    });

                    // Zoom Level Selector
                    zoomSlider = new ZoomSlider(editorSession, function (widget) {
                        widget.placeAt(toolbar);
                        widget.startup();
                    });

                    if (loadOdtFile) {
                        loadButton = new Button({
                            label: translator('open'),
                            showLabel: false,
                            iconClass: 'dijitIcon dijitIconFolderOpen',
                            style: {
                                float: 'left'
                            },
                            onClick: function () {
                                loadOdtFile();
                            }
                        });
                        loadButton.placeAt(toolbar);
                    }
                    if (saveOdtFile) {
                        saveButton = new Button({
                            label: translator('save'),
                            showLabel: false,
                            iconClass: 'dijitEditorIcon dijitEditorIconSave',
                            style: {
                                float: 'left'
                            },
                            onClick: function () {
                                saveOdtFile();
                            }
                        });
                        saveButton.placeAt(toolbar);
                    }

                    menuButton = new DropDownButton({
                        dropDown: dropDownMenu,
                        label: translator('format'),
                        iconClass: "dijitIconEditTask",
                        style: {
                            float: 'left'
                        }
                    });
                    menuButton.placeAt(toolbar);
                });
            });
        };

    });
