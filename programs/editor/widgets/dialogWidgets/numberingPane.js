widgets.NumberingPane = (function () {

    function makeWidget(documentObject, callback) {
        require(["dojo/ready", "dojo/dom-construct", "dijit/layout/ContentPane" ], function (ready, domConstruct, ContentPane) {
            ready(function() {
            	var contentPane = new ContentPane({
            		title: "Outline & Numbering",
                    href: "widgets/dialogWidgets/numberingPane.html"
            	});

            	return callback(contentPane);
            });
        });
    }

    widgets.NumberingPane = function NumberingPane(documentObject, callback) {
        makeWidget(documentObject, function (pane) {
            return callback(pane);
        });
    };

    return widgets.NumberingPane;
}());
