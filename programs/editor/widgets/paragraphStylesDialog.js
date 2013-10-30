/**
 * @license
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
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
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global define,require,dojo,dijit */

define("webodf/editor/widgets/paragraphStylesDialog", [], function () {
    "use strict";
    return function ParagraphStylesDialog(callback) {
        var self = this,
            editorSession,
            dialog,
            stylePicker, alignmentPane, fontEffectsPane;

        function makeWidget(callback) {
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
                    tr = runtime.tr,
                    tabContainer,
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
                    newStyleName = null,
                    /**
                    * Mapping of the properties from edit pane properties to the attributes of style:text-properties
                    * @const@type{Array.<!{propertyName:string,attributeName:string,unit:string}>}
                    */
                    textPropertyMapping = [
                    {
                        propertyName:  'fontSize',
                        attributeName: 'fo:font-size',
                        unit:          'pt'
                    }, {
                        propertyName:  'fontName',
                        attributeName: 'style:font-name'
                    }, {
                        propertyName:  'color',
                        attributeName: 'fo:color'
                    }, {
                        propertyName:  'backgroundColor',
                        attributeName: 'fo:background-color'
                    }, {
                        propertyName:  'fontWeight',
                        attributeName: 'fo:font-weight'
                    }, {
                        propertyName:  'fontStyle',
                        attributeName: 'fo:font-style'
                    }, {
                        propertyName:  'underline',
                        attributeName: 'style:text-underline-style'
                    }, {
                        propertyName:  'strikethrough',
                        attributeName: 'style:text-line-through-style'
                    }],
                    /**
                    * Mapping of the properties from edit pane properties to the attributes of style:paragraph-properties
                    * @const@type{Array.<!{propertyName:string,attributeName:string,unit:string}>}
                    */
                    paragraphPropertyMapping = [
                    {
                        propertyName:  'topMargin',
                        attributeName: 'fo:margin-top',
                        unit:          'mm'
                    }, {
                        propertyName:  'bottomMargin',
                        attributeName: 'fo:margin-bottom',
                        unit:          'mm'
                    }, {
                        propertyName:  'leftMargin',
                        attributeName: 'fo:margin-left',
                        unit:          'mm'
                    }, {
                        propertyName:  'rightMargin',
                        attributeName: 'fo:margin-right',
                        unit:          'mm'
                    }, {
                        propertyName:  'textAlign',
                        attributeName: 'fo:text-align'
                    }];

                /**
                * Sets attributes of a node by the properties of the object properties,
                * based on the mapping defined in propertyMapping.
                * @param {!Object} properties
                * @param {!Array.<!{propertyName:string,attributeName:string,unit:string}>} propertyMapping
                * @return {undefined}
                */
                function mappedProperties(properties, propertyMapping) {
                    var i, m, value,
                        result = {};
                    for (i = 0; i < propertyMapping.length; i += 1) {
                        m = propertyMapping[i];
                        value = properties[m.propertyName];
                        // Set a value as the attribute of a node, if that value is defined.
                        // If there is a unit specified, it is suffixed to the value.
                        if (value !== undefined) {
                            result[m.attributeName] = (m.unit !== undefined) ? value + m.unit : value;
                        }
                    }
                    return result;
                }

                function accept() {
                    editorSession.updateParagraphStyle(stylePicker.value(), {
                        "style:paragraph-properties": mappedProperties(alignmentPane.value(), paragraphPropertyMapping),
                        "style:text-properties": mappedProperties(fontEffectsPane.value(), textPropertyMapping)
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
                    title: tr("Paragraph Styles")
                });

                cloneTooltip = new TooltipDialog({
                    content:
                        '<h2 style="margin: 0;">'+tr("Clone this Style")+'</h2><br/>' +
                        '<label for="name">'+tr("New Name:")+'</label> <input data-dojo-type="dijit/form/TextBox" id="name" name="name"><br/><br/>',
                    style: "width: 300px;"
                });
                cloneButton = new Button({
                    label: tr("Create"),
                    onClick: function () {
                        cloneStyle(stylePicker.value(), cloneTooltip.get('value').name);
                        cloneTooltip.reset();
                        popup.close(cloneTooltip);
                    }
                });
                cloneTooltip.addChild(cloneButton);
                cloneDropDown = new DropDownButton({
                    label: tr("Clone"),
                    showLabel: false,
                    iconClass: 'dijitEditorIcon dijitEditorIconCopy',
                    dropDown: cloneTooltip,
                    style: "float: right; margin-bottom: 5px;"
                });
                dialog.addChild(cloneDropDown, 1);

                deleteButton = new Button({
                    label: tr("Delete"),
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
                    label: tr("OK"),
                    onClick: accept
                }).placeAt(actionBar);
                cancelButton = new dijit.form.Button({
                    label: tr("Cancel"),
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
                        // If it is a default (nameless) style or is used, make it undeletable.
                        if (value === "" || editorSession.isStyleUsed(editorSession.getParagraphStyleElement(value))) {
                            deleteButton.domNode.style.display = 'none';
                        } else {
                            deleteButton.domNode.style.display = 'block';
                        }
                    }

                    p = new ParagraphStyles(function (paragraphStyles) {
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

                        stylePicker.onChange = openStyle;
                        stylePicker.setEditorSession(editorSession);
                    });
                    a = new AlignmentPane(function (pane) {
                        alignmentPane = pane;
                        alignmentPane.widget().startup();
                        tabContainer.addChild(alignmentPane.widget());
                        alignmentPane.setEditorSession(editorSession);
                    });
                    f = new FontEffectsPane(function (pane) {
                        fontEffectsPane = pane;
                        fontEffectsPane.widget().startup();
                        tabContainer.addChild(fontEffectsPane.widget());
                        fontEffectsPane.setEditorSession(editorSession);
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

                    dialog.onHide = self.onToolDone;
                });

                tabContainer.startup();

                return callback(dialog);
            });
        }

        this.setEditorSession = function(session) {
            editorSession = session;
            if (stylePicker) {
                stylePicker.setEditorSession(session);
            }
            if (alignmentPane) {
                alignmentPane.setEditorSession(session);
            }
            if (fontEffectsPane) {
                fontEffectsPane.setEditorSession(session);
            }
            if (!editorSession && dialog) { // TODO: check show state
                dialog.hide();
            }
        };

        this.onToolDone = function () {};

        // init
        makeWidget(function (dialog) {
            return callback(dialog);
        });
    };

});
