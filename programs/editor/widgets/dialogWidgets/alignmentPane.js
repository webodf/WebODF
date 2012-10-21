widgets.AlignmentPane = (function () {

    function makeWidget(documentObject, callback) {
        require(["dojo/ready", "dojo/dom-construct", "dijit/layout/ContentPane"], function (ready, domConstruct, ContentPane) {
            ready(function() {
            	var contentPane = new ContentPane({
            		title: "Alignment",
                    href: "widgets/dialogWidgets/alignmentPane.html"
            	});

            	return callback(contentPane);
            });
        });
    }

    widgets.AlignmentPane = function AlignmentPane(documentObject, callback) {
        makeWidget(documentObject, function (pane) {
            return callback(pane);
        });
    };

    return widgets.AlignmentPane;
}());