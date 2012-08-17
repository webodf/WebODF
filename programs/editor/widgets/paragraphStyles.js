widgets.ParagraphStyles = (function () {

    function makeWidget(documentObject, callback) {
        require(["dijit/form/Select"], function(Select) {
            var i,
                widget,
                selectionList = [];
                availableStyles = documentObject.formatting.getAvailableParagraphStyles();

            for (i = 0; i < availableStyles.length; i += 1) {
                selectionList.push({
                    label: availableStyles[i].displayName,
                    value: availableStyles[i].name
                });
            }

            widget = new Select({
                name: 'ParagraphStyles',
                options: selectionList
            });

            return callback(widget);
        });
    }

    widgets.ParagraphStyles = function ParagraphStyles(documentObject, callback) {
        makeWidget(documentObject, function(widget) {
            return callback(widget);
        });
    }

    return widgets.ParagraphStyles;
}());