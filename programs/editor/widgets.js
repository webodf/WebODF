function loadWidgets(documentObject) {
	var dojoWin, toolbar,
        ToolbarSeparator;

	require(["dojo/_base/window"], function (win) {
		dojoWin = win;
	});

    // Menubar
    require(["dojo/ready", "dijit/MenuBar", "dijit/PopupMenuBarItem", "dijit/Menu", "dijit/MenuItem", "dijit/DropDownMenu"], function(ready, MenuBar, PopupMenuBarItem, Menu, MenuItem, DropDownMenu) {
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
                label: "File"
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
