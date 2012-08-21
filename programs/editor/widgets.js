function loadWidgets(documentObject) {
	var dojoWin, toolbar,
        ToolbarSeparator;

	require(["dojo/_base/window"], function (win) {
		dojoWin = win;
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
    });
}
