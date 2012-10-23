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
function loadWidgets(documentObject) {
	var dojoWin, toolbar,
        ToolbarSeparator;

	require(["dojo/_base/window"], function (win) {
		dojoWin = win;
	});

    // Menubar
    require([
                "dojo/ready", 
                "dijit/MenuBar", 
                "dijit/PopupMenuBarItem", 
                "dijit/Menu", 
                "dijit/MenuItem", 
                "dijit/DropDownMenu"
    ], function(ready, MenuBar, PopupMenuBarItem, Menu, MenuItem, DropDownMenu) {
        ready(function() {
            var menuBar = new MenuBar({}, "menubar");

            var formatSubmenu = new DropDownMenu({});
            var paragraphStylesMenuItem = new MenuItem({
                label: 'Paragraph...'
            });
            var characterStylesMenuItem = new MenuItem({
                label: 'Character...'
            });
            formatSubmenu.addChild(paragraphStylesMenuItem);
            formatSubmenu.addChild(characterStylesMenuItem);

            menuBar.addChild(new PopupMenuBarItem({
                label: document.translator.file
            }));
            menuBar.addChild(new PopupMenuBarItem({
                label: "Edit"
            }));
            menuBar.addChild(new PopupMenuBarItem({
                label: "View"
            }));
            menuBar.addChild(new PopupMenuBarItem({
                label: "Insert"
            }));
            menuBar.addChild(new PopupMenuBarItem({
                label: "Format",
                popup: formatSubmenu
            }));

            require(["widgets/paragraphStylesDialog.js"], function() {
                var dialogBox = new widgets.ParagraphStylesDialog(documentObject, function(dialog) {
                    paragraphStylesMenuItem.onClick = function() {
                        dialog.startup();
                        dialog.show();
                    }
                });
            });
            
            require(["widgets/characterStylesDialog.js"], function() {
                var dialogBox = new widgets.CharacterStylesDialog(documentObject, function(dialog) {
                    characterStylesMenuItem.onClick = function() {
                        dialog.startup();
                        dialog.show();
                    }
                });
            });
        });
    });

    // Toolbar
    require(["dijit/Toolbar"], function(Toolbar) {
        toolbar = new Toolbar({}, "toolbar");

        // Simple Style Selector [B, I, U, S]
        require(["widgets/simpleStyles.js"], function () {
            var styles = new widgets.SimpleStyles(documentObject, function (widget) {
                widget.placeAt(toolbar);
                widget.startup();
            });
        });

        // Paragraph Style Selector
        require(["widgets/paragraphStyles.js"], function () {
            var styles = new widgets.ParagraphStyles(documentObject, function (widget) {
                widget.placeAt(toolbar);
                widget.startup();
            });
        });

        // Zoom Level Selector
        require(["widgets/zoomSlider.js"], function () {
            var zoomSlider = new widgets.ZoomSlider(documentObject, function (widget) {
                widget.placeAt(toolbar);
                widget.startup();
            });
        });

    });
}
