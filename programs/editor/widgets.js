function loadWidgets(documentObject) {
	var dojoWin, toolbar;
	require(["dojo/_base/window"], function (win) {
		dojoWin = win;
	});

    // Toolbar
    require(["dijit/Toolbar"], function(Toolbar) {
        toolbar = new Toolbar({}, "toolbar");

        // Paragraph Style Selector
        require(["widgets/paragraphStyles.js"], function () {
            var styles = new widgets.ParagraphStyles(documentObject, function (widget) {
                widget.placeAt(toolbar);
                widget.startup();
            });
        });
    });
}
