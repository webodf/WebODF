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
/*global define,require,document,dijit,console */
define("webodf/editor/widgets/dialogWidgets/fontEffectsPane", [], function () {
    "use strict";
    function makeWidget(editorSession, callback) {
        require(["dojo/ready", "dojo/dom-construct", "dijit/layout/ContentPane", "dojox/widget/ColorPicker" ], function (ready, domConstruct, ContentPane) {
            var translator = document.translator;
            ready(function () {
                var contentPane = new ContentPane({
                    title: translator("fontEffects"),
                    href: "widgets/dialogWidgets/fontEffectsPane.html",
                    preload: true
                }),
                    fons = "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
                    stylens = "urn:oasis:names:tc:opendocument:xmlns:style:1.0";
                    
                contentPane.onLoad = function () {
                    var form = dijit.byId('fontEffectsPaneForm'),
                        preview = document.getElementById('previewText');

                    editorSession.subscribe('paragraphChanged', function () {
                        var style = editorSession.getParagraphStyleAttributes(editorSession.getCurrentParagraphStyle())['style:text-properties'],
                            s_bold,
                            s_italic,
                            s_underline,
                            s_fontSize,
                            s_fontName;
                        
                        if (style !== undefined) {
                            s_bold = style['fo:font-weight'];
                            s_italic = style['fo:font-style'];
                            s_underline = style['fo:text-decoration'];
                            s_fontSize = parseFloat(style['fo:font-size']);
                            s_fontName = style['fo:font-family'];
                            
                            form.attr('value', {
                                fontFamily: s_fontName && s_fontName.length ? s_fontName : 'sans-serif',
                                fontSize: isNaN(s_fontSize) ? 12 : s_fontSize,
                                textStyle: [s_bold, s_italic, s_underline]
                            });
                        } else {
                            // TODO: Use default style here
                            form.attr('value', {
                                fontFamily: 'sans-serif',
                                fontSize: 12,
                                textStyle: []
                            });
                        }
                    });
                    // Automatically update preview when selections change
                    form.watch('value', function () {
                        if (form.value.textStyle.indexOf('bold') !== -1) {
                            preview.style.fontWeight = 'bold';
                        } else {
                            preview.style.fontWeight = 'normal';
                        }
                        if (form.value.textStyle.indexOf('italic') !== -1) {
                            preview.style.fontStyle = 'italic';
                        } else {
                            preview.style.fontStyle = 'normal';
                        }
                        if (form.value.textStyle.indexOf('underline') !== -1) {
                            preview.style.textDecoration = 'underline';
                        } else {
                            preview.style.textDecoration = 'none';
                        }

                        preview.style.fontSize = form.value.fontSize + 'pt';
                        preview.style.fontFamily = form.value.fontFamily;
                    });
                };
                return callback(contentPane);
            });
        });
    }

    return function FontEffectsPane(editorSession, callback) {
        makeWidget(editorSession, function (pane) {
            return callback(pane);
        });
    };

});
