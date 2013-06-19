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
            "dijit/TooltipDialog",
            "dijit/popup",
            "dijit/layout/TabContainer",
            "dijit/layout/ContentPane",
            "dijit/form/Button",
            "dijit/form/DropDownButton",
            "dijit/form/RadioButton"], function (Dialog, TooltipDialog, popup, TabContainer, ContentPane, Button, DropDownButton, RadioButton) {
            var i,
                dialog,
                translator = document.translator,
                tabContainer,
                alignmentPane,
                fontEffectsPane,
                stylePicker,
                flowPane,
                numberingPane,
                tabsPane,
                capsPane,
                bordersPane,
                backgroundPane,
                indentsPane,
                actionBar,
                okButton,
                cancelButton,
                cloneButton,
                deleteButton,
                cloneTooltip,
                cloneDropDown,
                newStyleName = null;

            function accept() {
                editorSession.updateParagraphStyle(stylePicker.value(), {
                    paragraphProperties: alignmentPane.value(),
                    textProperties: fontEffectsPane.value()
                });

                dialog.hide();
            }

            function cancel() {
                dialog.hide();
            }

            /**
             * Creates and enqueues a paragraph-style cloning operation.
             * Remembers the id of the created style in newStyleName, so the
             * style picker can be set to it, once the operation has been applied.
             * @param {!string} styleName id of the style to clone
             * @param {!string} newStyleDisplayName display name of the new style
             */
            function cloneStyle(styleName, newStyleDisplayName) {
                newStyleName = editorSession.cloneParagraphStyle(styleName, newStyleDisplayName);
            }

            function deleteStyle(styleName) {
                editorSession.deleteStyle(styleName);
            }
            // Dialog
            dialog = new Dialog({
                title: translator("paragraphStyles")
            });

            cloneTooltip = new TooltipDialog({
                content:
                    '<h2 style="margin: 0;">Clone this style</h2><br/>' +
                    '<label for="name">New name </label><input data-dojo-type="dijit/form/TextBox" id="name" name="name"><br/><br/>',
                style: "width: 300px;"
            });
            cloneButton = new Button({
                label: 'Create',
                onClick: function () {
                    cloneStyle(stylePicker.value(), cloneTooltip.get('value').name);
                    cloneTooltip.reset();
                    popup.close(cloneTooltip);
                }
            });
            cloneTooltip.addChild(cloneButton);
            cloneDropDown = new DropDownButton({
                label: 'Clone',
                showLabel: false,
                iconClass: 'dijitEditorIcon dijitEditorIconCopy',
                dropDown: cloneTooltip,
                style: "float: right; margin-bottom: 5px;"
            });
            dialog.addChild(cloneDropDown, 1);

            deleteButton = new Button({
                label: 'Delete',
                showLabel: false,
                iconClass: 'dijitEditorIcon dijitEditorIconDelete',
                style: "float: right; margin-bottom: 5px;",
                onClick: function () {
                    deleteStyle(stylePicker.value());
                }
            });
            dialog.addChild(deleteButton, 2);

            // Tab Container
            tabContainer = new TabContainer({
                style: "height: 100%; width: 100%;"
            });
            dialog.addChild(tabContainer, 3);

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

                function openStyle(value) {
                    alignmentPane.setStyle(value);
                    fontEffectsPane.setStyle(value);
                    if (editorSession.isStyleUsed(editorSession.getParagraphStyleElement(value))) {
                        deleteButton.domNode.style.display = 'none';
                    } else {
                        deleteButton.domNode.style.display = 'block';
                    }
                }

                p = new ParagraphStyles(editorSession, function (paragraphStyles) {
                    stylePicker = paragraphStyles;
                    stylePicker.widget().startup();
                    stylePicker.widget().domNode.style.float = "left";
                    stylePicker.widget().domNode.style.width = "350px";
                    stylePicker.widget().domNode.style.marginTop = "5px";
                    dialog.addChild(stylePicker.widget(), 0);

                    stylePicker.onAdd = function (name) {
                        if (newStyleName === name) {
                            stylePicker.setValue(name);
                            newStyleName = null; // reset 'flag' name
                        }
                    };

                    stylePicker.onRemove = function (name) {
                        // Set the first style name as current
                        stylePicker.setValue(stylePicker.widget().getOptions(0));
                    };

                    stylePicker.widget().onChange = openStyle;
                });
                a = new AlignmentPane(editorSession, function (pane) {
                    alignmentPane = pane;
                    alignmentPane.widget().startup();
                    tabContainer.addChild(alignmentPane.widget());
                });
                f = new FontEffectsPane(editorSession, function (pane) {
                    fontEffectsPane = pane;
                    fontEffectsPane.widget().startup();
                    tabContainer.addChild(fontEffectsPane.widget());
                });

                dialog.onShow = function () {
                    var currentStyle = editorSession.getCurrentParagraphStyle();
                    // setting the stylepicker value if the style name is the same
                    // will not trigger onChange, so specifically open the style in
                    // the panes.
                    if (stylePicker.value() === currentStyle) {
                        openStyle(currentStyle);
                    } else {
                        stylePicker.setValue(currentStyle);
                    }
                };
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
