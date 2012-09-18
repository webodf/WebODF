widgets.CharacterStylesDialog = (function () {

    function makeWidget(documentObject, callback) {
        require(["dijit/Dialog", "dijit/layout/TabContainer", "dijit/layout/ContentPane", "dijit/form/RadioButton"], function (Dialog, TabContainer, ContentPane, RadioButton) {
            var i,
                dialog,
                tabContainer, alignmentPane, flowPane, numberingPane, tabsPane, capsPane, bordersPane, backgroundPane, indentsPane;

            // Dialog
            dialog = new Dialog({
            	title: "Character",
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
                "widgets/dialogWidgets/fontEffectsPane.js" 
                ], function() {
                new widgets.FontEffectsPane(documentObject, function(fontEffectsPane) {
                    fontEffectsPane.startup();
                    tabContainer.addChild(fontEffectsPane);
                });
            });

            tabContainer.startup();

            return callback(dialog);
        });
    }

    widgets.CharacterStylesDialog = function CharacterStylesDialog(documentObject, callback) {
        makeWidget(documentObject, function (dialog) {
            return callback(dialog);
        });
    };

    return widgets.CharacterStylesDialog;
}());
