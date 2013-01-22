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
/*global runtime,core,define,require,document,dijit */

runtime.loadClass("core.CSSUnits");

define("webodf/editor/widgets/dialogWidgets/alignmentPane", [], function () {
    "use strict";
    function makeWidget(editorSession, callback) {
        require(["dojo/ready", "dojo/dom-construct", "dijit/layout/ContentPane"], function (ready, domConstruct, ContentPane) {
            ready(function () {
                var contentPane = new ContentPane({
                    title: document.translator("alignment"),
                    href: "widgets/dialogWidgets/alignmentPane.html",
                    preload: true
                }),
                    fons = "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
                    stylens = "urn:oasis:names:tc:opendocument:xmlns:style:1.0";

                contentPane.onLoad = function () {
                    var form = dijit.byId('alignmentPaneForm');
                    editorSession.subscribe('paragraphChanged', function () {
                        var style = editorSession.getParagraphStyleAttributes(editorSession.getCurrentParagraphStyle())['style:paragraph-properties'],
                            cssUnits = new core.CSSUnits(),
                            s_topMargin,
                            s_bottomMargin,
                            s_leftMargin,
                            s_rightMargin,
                            s_textAlign;

                        if (style !== undefined) {
                            s_topMargin = parseFloat(cssUnits.convertMeasure(style['fo:margin-top'], 'mm'));
                            s_leftMargin = parseFloat(cssUnits.convertMeasure(style['fo:margin-left'], 'mm'));
                            s_rightMargin = parseFloat(cssUnits.convertMeasure(style['fo:margin-right'], 'mm'));
                            s_bottomMargin = parseFloat(cssUnits.convertMeasure(style['fo:margin-bottom'], 'mm'));
                            s_textAlign = style['fo:text-align'];
                            
                            form.attr('value', {
                                topMargin: isNaN(s_topMargin) ? 0 : s_topMargin,
                                bottomMargin: isNaN(s_bottomMargin) ? 0 : s_bottomMargin,
                                leftMargin: isNaN(s_leftMargin) ? 0 : s_leftMargin,
                                rightMargin: isNaN(s_rightMargin) ? 0 : s_rightMargin,
                                alignment: s_textAlign && s_textAlign.length ? s_textAlign : 'left'
                            });
                        } else {
                            form.attr('value', {
                                topMargin: 0,
                                bottomMargin: 0,
                                leftMargin: 0,
                                rightMargin: 0,
                                alignment: 'left'
                            });
                        }
                    });
                };
                return callback(contentPane);
            });
        });
    }

    return function AlignmentPane(editorSession, callback) {
        makeWidget(editorSession, function (pane) {
            return callback(pane);
        });
    };
});
