widgets.ParagraphStylesDialog = (function () {

    function makeWidget(documentObject, callback) {
        require(["dijit/Dialog"], function (Dialog) {
            var i,
                dialog;
            
            dialog = new Dialog({
            	title: "Paragraph Styles",
            	style: "width: 300px"
        	});

	        // Paragraph Style Selector
	        require(["widgets/paragraphStyles.js"], function () {
	            var styles = new widgets.ParagraphStyles(documentObject, function (widget) {
	                widget.placeAt(dialog);
	                widget.startup();
	            });
	        });

            return callback(dialog);
        });
    }

    widgets.ParagraphStylesDialog = function ParagraphStylesDialog(documentObject, callback) {
        makeWidget(documentObject, function (dialog) {
            return callback(dialog);
        });
    };

    return widgets.ParagraphStylesDialog;
}());