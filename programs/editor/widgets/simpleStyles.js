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
define("webodf/editor/widgets/simpleStyles", [], function () {
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
                    var currentStyleName = editorSession.getCurrentParagraphStyle();
                    if (checked) {
                        editorSession.updateParagraphStyle(currentStyleName, {
                            textProperties: { fontWeight: 'bold' }
                        });
                    } else {
                        editorSession.updateParagraphStyle(currentStyleName, {
                            textProperties: { fontWeight: 'normal' }
                        });
                    }
                }
            });

            italicButton = new ToggleButton({
                label: document.translator('italic'),
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconItalic",
                onChange: function (checked) {
                    var currentStyleName = editorSession.getCurrentParagraphStyle();
                    if (checked) {
                        editorSession.updateParagraphStyle(currentStyleName, {
                            textProperties: { fontStyle: 'italic' }
                        });
                    } else {
                        editorSession.updateParagraphStyle(currentStyleName, {
                            textProperties: { fontStyle: 'normal' }
                        });
                    }
                }
            });
            underlineButton = new ToggleButton({
                label: document.translator('underline'),
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconUnderline",
                onChange: function (checked) {
                    var currentStyleName = editorSession.getCurrentParagraphStyle();
                    if (checked) {
                        editorSession.updateParagraphStyle(currentStyleName, {
                            textProperties: { underline: 'solid' }
                        });
                    } else {
                        editorSession.updateParagraphStyle(currentStyleName, {
                            textProperties: { underline: 'none' }
                        });
                    }
                }
            });
            strikethroughButton = new ToggleButton({
                label: document.translator('strikethrough'),
                showLabel: false,
                checked: false,
                iconClass: "dijitEditorIcon dijitEditorIconStrikethrough",
                onChange: function (checked) {
                    var currentStyleName = editorSession.getCurrentParagraphStyle();
                    if (checked) {
                        editorSession.updateParagraphStyle(currentStyleName, {
                            textProperties: { strikethrough: 'solid' }
                        });
                    } else {
                        editorSession.updateParagraphStyle(currentStyleName, {
                            textProperties: { strikethrough: 'none' }
                        });
                    }
                }
            });
            
            function loadStyle(styleName) {
                var fontWeight, fontStyle, underline, strikethrough, textProperties;
                textProperties = editorSession.getParagraphStyleAttributes(styleName)['style:text-properties'];
                
                fontWeight = textProperties['fo:font-weight'];
                fontStyle = textProperties['fo:font-style'];
                underline = textProperties['style:text-underline-style'];
                strikethrough = textProperties['style:text-line-through-style'];

                boldButton.set('checked', fontWeight === 'bold' ? true : false);
                italicButton.set('checked', fontStyle === 'italic' ? true : false);
                underlineButton.set('checked', underline === 'solid' ? true : false);
                strikethroughButton.set('checked', strikethrough === 'solid' ? true : false);
            }

            editorSession.subscribe('paragraphChanged', function (info) {
                var currentStyleName;
                if (info.type === 'style') {
                    currentStyleName = editorSession.getCurrentParagraphStyle();
                    loadStyle(currentStyleName);
                }
            });
            editorSession.subscribe('paragraphStyleModified', function (styleName) {
                var currentStyleName = editorSession.getCurrentParagraphStyle();
                if (currentStyleName === styleName) {
                    loadStyle(currentStyleName);
                }
            });

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
