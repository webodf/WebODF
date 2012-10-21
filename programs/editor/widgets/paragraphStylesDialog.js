widgets.ParagraphStylesDialog = (function () {

    function makeWidget(documentObject, callback) {
        require(["dijit/Dialog", "dijit/layout/TabContainer", "dijit/layout/ContentPane", "dijit/form/RadioButton"], function (Dialog, TabContainer, ContentPane, RadioButton) {
            var i,
                dialog,
                tabContainer, alignmentPane, flowPane, numberingPane, tabsPane, capsPane, bordersPane, backgroundPane, indentsPane;

            // Dialog
            dialog = new Dialog({
            	title: "Paragraph Styles",
        	});

            // Tab Container
            tabContainer = new TabContainer({
                style: "height: 100%; width: 100%;"
            });
            dialog.addChild(tabContainer);

            var actionBar = dojo.create("div", {
                "class": "dijitDialogPaneActionBar"
            });
            new dijit.form.Button({
                "label": "Ok"
            }).placeAt(actionBar);
            new dijit.form.Button({
                "label": "Cancel"
            }).placeAt(actionBar);
            dialog.domNode.appendChild(actionBar);


            require([
                "widgets/dialogWidgets/alignmentPane.js",
                "widgets/dialogWidgets/textFlowPane.js",                
                "widgets/dialogWidgets/numberingPane.js", 
                ], function() {
                new widgets.AlignmentPane(documentObject, function(alignmentPane) {
                    alignmentPane.startup();
                    tabContainer.addChild(alignmentPane);
                });
                new widgets.TextFlowPane(documentObject, function(textFlowPane) {
                    textFlowPane.startup();
                    tabContainer.addChild(textFlowPane);
                });
                new widgets.NumberingPane(documentObject, function(numberingPane) {
                    numberingPane.startup();
                    tabContainer.addChild(numberingPane);
                });
            });

            tabContainer.startup();

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
