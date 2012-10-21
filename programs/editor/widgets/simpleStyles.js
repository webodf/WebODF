widgets.SimpleStyles = (function () {

    function makeWidget(documentObject, callback) {
        require(["dijit/form/ToggleButton"], function (ToggleButton) {
            var i,
                widget = {};

            widget.children = [
            (new ToggleButton({
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconBold"
            })),
            (new ToggleButton({
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconItalic"
            })),
            (new ToggleButton({
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconUnderline"
            })),
            (new ToggleButton({
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconStrikethrough"
            }))
            ];

            widget.startup = function () {
                widget.children.forEach(function (element) {
                    element.startup();
                });
            };

            widget.placeAt = function (container) {
                widget.children.forEach(function (element) {
                    element.placeAt(container);
                });
                return widget;
            };

            return callback(widget);
        });
    }

    widgets.SimpleStyles = function SimpleStyles(documentObject, callback) {
        makeWidget(documentObject, function (widget) {
            return callback(widget);
        });
    };

    return widgets.SimpleStyles;
}());