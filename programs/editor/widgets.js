function loadWidgets(documentObject) {
	// Load a Paragraph Style Selector widget.
	var dojoWin;
	require(["dojo/_base/window"], function (win) {
		dojoWin = win;
	});

    require(["widgets/paragraphStyles.js"], function () {
        var styles = new widgets.ParagraphStyles(documentObject, function (widget) {
            widget.placeAt(dojoWin.body());
            widget.startup();
        });
    });
}
