widgets.FontEffectsPane = (function () {

    function makeWidget(documentObject, callback) {
        require(["dojo/ready", "dojo/dom-construct", "dijit/layout/ContentPane", "dojox/widget/ColorPicker" ], function (ready, domConstruct, ContentPane) {
            ready(function() {
            	var contentPane = new ContentPane({
            		title: "Font Effects",
                    href: "widgets/dialogWidgets/fontEffectsPane.html"
            	});

            	return callback(contentPane);
            });
        });
    }

    widgets.FontEffectsPane = function FontEffectsPane(documentObject, callback) {
        makeWidget(documentObject, function (pane) {
            return callback(pane);
        });
    };

    return widgets.FontEffectsPane;
}());
