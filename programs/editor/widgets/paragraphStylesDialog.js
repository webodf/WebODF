/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
 *
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
/*global define,require,document,dojo,dijit */
define("webodf/editor/widgets/paragraphStylesDialog", [], function () {
    "use strict";
    function makeWidget(editorSession, callback) {
        require([
            "dijit/Dialog",
            "dijit/layout/TabContainer",
            "dijit/layout/ContentPane",
            "dijit/form/RadioButton"], function (Dialog, TabContainer, ContentPane, RadioButton) {
            var i,
                dialog,
                translator = document.translator,
                tabContainer,
                alignmentPane,
                flowPane,
                numberingPane,
                tabsPane,
                capsPane,
                bordersPane,
                backgroundPane,
                indentsPane,
                actionBar,
                okButton,
                cancelButton;

            function accept() {
                var alignment = dijit.byId('alignmentPaneForm').get('value'),
                    fontEffects = dijit.byId('fontEffectsPaneForm').get('value');
                
                editorSession.updateParagraphStyle(editorSession.getCurrentParagraphStyle(), {
                    paragraphProperties: alignment,
                    textProperties: fontEffects
                });

                dialog.hide();
            }

            function cancel() {
                dialog.hide();
            }

            // Dialog
            dialog = new Dialog({
                title: translator("paragraphStyles")
            });

            // Tab Container
            tabContainer = new TabContainer({
                style: "height: 100%; width: 100%;"
            });
            dialog.addChild(tabContainer, 1);

            actionBar = dojo.create("div", {
                "class": "dijitDialogPaneActionBar"
            });
            okButton = new dijit.form.Button({
                label: translator("ok"),
                onClick: accept
            }).placeAt(actionBar);
            cancelButton = new dijit.form.Button({
                label: translator("cancel"),
                onClick: cancel
            }).placeAt(actionBar);
            dialog.domNode.appendChild(actionBar);


            require([
                "webodf/editor/widgets/paragraphStyles",
                "webodf/editor/widgets/dialogWidgets/alignmentPane",
                "webodf/editor/widgets/dialogWidgets/fontEffectsPane"
            ], function (ParagraphStyles, AlignmentPane, FontEffectsPane) {
                var p, a, f;
                p = new ParagraphStyles(editorSession, function (paragraphStyles) {
                    paragraphStyles.startup();
                    paragraphStyles.domNode.style.width = '100%';
                    paragraphStyles.domNode.style.marginBottom = '5px';
                    dialog.addChild(paragraphStyles, 0);
                });
                a = new AlignmentPane(editorSession, function (alignmentPane) {
                    alignmentPane.widget().startup();
                    tabContainer.addChild(alignmentPane.widget());
                });
                f = new FontEffectsPane(editorSession, function (fontEffectsPane) {
                    fontEffectsPane.widget().startup();
                    tabContainer.addChild(fontEffectsPane.widget());
                });
            });
            
            tabContainer.startup();

            return callback(dialog);
        });
    }

    return function ParagraphStylesDialog(editorSession, callback) {
        makeWidget(editorSession, function (dialog) {
            return callback(dialog);
        });
    };

});
