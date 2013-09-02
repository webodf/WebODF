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

    return function SimpleStyles(callback) {
        var editorSession,
            boldButton,
            italicButton,
            underlineButton,
            strikethroughButton;

        function makeWidget(callback) {
            require(["dijit/form/ToggleButton"], function (ToggleButton) {
                var i,
                    widget = {};

                boldButton = new ToggleButton({
                    label: document.translator('bold'),
                    showLabel: false,
                    checked: editorSession ? editorSession.isBold(): false,
                    iconClass: "dijitEditorIcon dijitEditorIconBold",
                    onChange: function (checked) {
                        var value = checked ? 'bold' : 'normal';
                        if (editorSession) {
                            editorSession.formatSelection({
                                'style:text-properties': {
                                    'fo:font-weight' : value
                                }
                            });
                        }
                    }
                });

                italicButton = new ToggleButton({
                    label: document.translator('italic'),
                    showLabel: false,
                    checked: editorSession ? editorSession.isItalic(): false,
                    iconClass: "dijitEditorIcon dijitEditorIconItalic",
                    onChange: function (checked) {
                        var value = checked ? 'italic' : 'normal';
                        if (editorSession) {
                            editorSession.formatSelection({
                                'style:text-properties': {
                                    'fo:font-style' : value
                                }
                            });
                        }
                    }
                });
                underlineButton = new ToggleButton({
                    label: document.translator('underline'),
                    showLabel: false,
                    checked: editorSession ? editorSession.hasUnderline(): false,
                    iconClass: "dijitEditorIcon dijitEditorIconUnderline",
                    onChange: function (checked) {
                        var value = checked ? 'solid' : 'none';
                        if (editorSession) {
                            editorSession.formatSelection({
                                'style:text-properties': {
                                    'style:text-underline-style' : value
                                }
                            });
                        }
                    }
                });
                strikethroughButton = new ToggleButton({
                    label: document.translator('strikethrough'),
                    showLabel: false,
                    checked: editorSession ? editorSession.hasStrikeThrough(): false,
                    iconClass: "dijitEditorIcon dijitEditorIconStrikethrough",
                    onChange: function (checked) {
                        var value = checked ? 'solid' : 'none';
                        if (editorSession) {
                            editorSession.formatSelection({
                                'style:text-properties': {
                                    'style:text-line-through-style' : value
                                }
                            });
                        }
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

        function checkStyleButtons() {
            // The 3rd parameter is false to avoid firing onChange when setting the value
            // programmatically.
            if (boldButton) {
                boldButton.set('checked', editorSession.isBold(), false);
            }
            if (italicButton) {
                italicButton.set('checked', editorSession.isItalic(), false);
            }
            if (underlineButton) {
                underlineButton.set('checked', editorSession.hasUnderline(), false);
            }
            if (strikethroughButton) {
                strikethroughButton.set('checked', editorSession.hasStrikeThrough(), false);
            }
        }

        this.setEditorSession = function(session) {
            if (editorSession) {
                editorSession.unsubscribe(EditorSession.signalCursorMoved, checkStyleButtons);
                editorSession.unsubscribe(EditorSession.signalParagraphChanged, checkStyleButtons);
                editorSession.unsubscribe(EditorSession.signalParagraphStyleModified, checkStyleButtons);
            }
            editorSession = session;
            if (editorSession) {
                editorSession.subscribe(EditorSession.signalCursorMoved, checkStyleButtons);
                editorSession.subscribe(EditorSession.signalParagraphChanged, checkStyleButtons);
                editorSession.subscribe(EditorSession.signalParagraphStyleModified, checkStyleButtons);
                checkStyleButtons();
            }
        };

            // init
        makeWidget(function (widget) {
            return callback(widget);
        });
    };
});
