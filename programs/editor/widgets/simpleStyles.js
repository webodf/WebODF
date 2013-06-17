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
/*global define,require,document */
define("webodf/editor/widgets/simpleStyles",
       ["webodf/editor/EditorSession"],

  function (EditorSession) {
    "use strict";

    function makeWidget(editorSession, callback) {
        require(["dijit/form/ToggleButton"], function (ToggleButton) {
            var i,
                widget = {},
                boldButton,
                italicButton,
                underlineButton,
                strikethroughButton;

            boldButton = new ToggleButton({
                label: document.translator('bold'),
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconBold",
                onChange: function (checked) {
                    var value = checked ? 'bold' : 'normal';
                    editorSession.formatSelection({
                        'style:text-properties': {
                            'fo:font-weight' : value
                        }
                    });
                }
            });

            italicButton = new ToggleButton({
                label: document.translator('italic'),
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconItalic",
                onChange: function (checked) {
                    var value = checked ? 'italic' : 'normal';
                    editorSession.formatSelection({
                        'style:text-properties': {
                            'fo:font-style' : value
                        }
                    });
                }
            });
            underlineButton = new ToggleButton({
                label: document.translator('underline'),
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconUnderline",
                onChange: function (checked) {
                    var value = checked ? 'solid' : 'none';
                    editorSession.formatSelection({
                        'style:text-properties': {
                            'style:text-underline-style' : value
                        }
                    });
                }
            });
            strikethroughButton = new ToggleButton({
                label: document.translator('strikethrough'),
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconStrikethrough",
                onChange: function (checked) {
                    var value = checked ? 'solid' : 'none';
                    editorSession.formatSelection({
                        'style:text-properties': {
                            'style:text-line-through-style' : value
                        }
                    });
                }
            });
            
            function checkStyleButtons() {
                var fontWeight, fontStyle, underline, strikethrough, appliedStyles;
                appliedStyles = editorSession.getCurrentSelectionStyle();

                fontWeight = false;
                fontStyle = false;
                underline = false;
                strikethrough = false;

                appliedStyles.forEach(function(appliedStyle) {
                    var textProperties = appliedStyle['style:text-properties'];
                    fontWeight = fontWeight || textProperties['fo:font-weight'] === 'bold';
                    fontStyle = fontStyle || textProperties['fo:font-style'] === 'italic';
                    underline = underline || textProperties['style:text-underline-style'] === 'solid';
                    strikethrough = strikethrough || textProperties['style:text-line-through-style'] === 'solid';
                });

                // The 3rd parameter is false to avoid firing onChange when setting the value
                // programmatically.
                boldButton.set('checked', fontWeight, false);
                italicButton.set('checked', fontStyle, false);
                underlineButton.set('checked', underline, false);
                strikethroughButton.set('checked', strikethrough, false);
            }

            editorSession.subscribe(EditorSession.signalCursorMoved, checkStyleButtons);
            editorSession.subscribe(EditorSession.signalParagraphChanged, checkStyleButtons);
            editorSession.subscribe(EditorSession.signalParagraphStyleModified, checkStyleButtons);

            widget.children = [boldButton, italicButton, underlineButton, strikethroughButton];
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

    return function SimpleStyles(editorSession, callback) {
        makeWidget(editorSession, function (widget) {
            return callback(widget);
        });
    };
});
