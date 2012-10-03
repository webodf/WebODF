widgets.ParagraphStyles = (function () {

    var textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";

    function makeWidget(documentObject, callback) {
        require(["dijit/form/Select"], function (Select) {
            var i,
                widget,
                selectionList = [],
                availableStyles = documentObject.odfCanvas.getFormatting().getAvailableParagraphStyles(),
                currentParagraph = null;

            for (i = 0; i < availableStyles.length; i += 1) {
                selectionList.push({
                    label: availableStyles[i].displayName,
                    value: availableStyles[i].name
                });
                console.log(availableStyles[i].name);
            }

            widget = new Select({
                name: 'ParagraphStyles',
                options: selectionList,
                maxHeight: 200,
                style: { 
                    width: '100px'
                }
            });

            documentObject.odfCanvas.addListener("click", function (event) {
                var e = event.target;
                while (e && !((e.localName === "p" || e.localName === "h") && e.namespaceURI === textns)) {
                    e = e.parentNode;
                }
                currentParagraph = e;
                widget.set("value", e.getAttributeNS(textns, 'style-name'));
            });

            widget.onChange = function(value) {
                if(currentParagraph) {
                    currentParagraph.setAttributeNS(textns, 'style-name', value);
                }
            }

            return callback(widget);
        });
    }

    widgets.ParagraphStyles = function ParagraphStyles(documentObject, callback) {
        makeWidget(documentObject, function (widget) {
            return callback(widget);
        });
    };

    return widgets.ParagraphStyles;
}());
