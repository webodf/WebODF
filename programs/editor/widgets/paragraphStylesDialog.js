/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>

 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * As additional permission under GNU AGPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * As a special exception to the AGPL, any HTML file which merely makes function
 * calls to this code, and for that purpose includes it by reference shall be
 * deemed a separate work for copyright law purposes. In addition, the copyright
 * holders of this code give you permission to combine this code with free
 * software libraries that are released under the GNU LGPL. You may copy and
 * distribute such a system following the terms of the GNU AGPL for this code
 * and the LGPL for the libraries. If you modify this code, you may extend this
 * exception to your version of the code, but you are not obligated to do so.
 * If you do not wish to do so, delete this exception statement from your
 * version.
 *
 * This license applies to this entire compilation.
 * @licend
 * @source: http://www.webodf.org/
 * @source: http://gitorious.org/webodf/webodf/
 */
widgets.ParagraphStylesDialog = (function () {

    function makeWidget(documentObject, callback) {
        require(["dijit/Dialog", "dijit/layout/TabContainer", "dijit/layout/ContentPane", "dijit/form/RadioButton"], function (Dialog, TabContainer, ContentPane, RadioButton) {
            var i,
                dialog,
                tabContainer, alignmentPane, flowPane, numberingPane, tabsPane, capsPane, bordersPane, backgroundPane, indentsPane;

            // Dialog
            dialog = new Dialog({
            	title: document.translator.paragraphStyles
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
                label: document.translator.ok
            }).placeAt(actionBar);
            new dijit.form.Button({
                label: document.translator.cancel
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
