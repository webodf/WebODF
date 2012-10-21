widgets.TextFlowPane = (function () {

    function makeWidget(documentObject, callback) {
        require(["dojo/ready", "dojo/dom-construct", "dijit/layout/ContentPane" ], function (ready, domConstruct, ContentPane) {
            ready(function() {
            	var contentPane = new ContentPane({
            		title: "Text Flow",
                    href: "widgets/dialogWidgets/textFlowPane.html"
            	});

            	return callback(contentPane);
            });
        });
    }

    widgets.TextFlowPane = function TextFlowPane(documentObject, callback) {
        makeWidget(documentObject, function (pane) {
            return callback(pane);
        });
    };

    return widgets.TextFlowPane;
}());