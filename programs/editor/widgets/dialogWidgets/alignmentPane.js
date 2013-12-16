/**
 * @license
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
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

/*global runtime,core,define,require,dijit */

define("webodf/editor/widgets/dialogWidgets/alignmentPane", [], function () {
    "use strict";

    runtime.loadClass("core.CSSUnits");

    var AlignmentPane = function (callback) {
        var self = this,
            editorSession,
            contentPane,
            form;

        this.widget = function () {
            return contentPane;
        };

        this.value = function () {
            return form.get('value');
        };

        this.setStyle = function (styleName) {
            var style = editorSession.getParagraphStyleAttributes(styleName)['style:paragraph-properties'],
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
                    textAlign: s_textAlign && s_textAlign.length ? s_textAlign : 'left'
                });
            } else {
                form.attr('value', {
                    topMargin: 0,
                    bottomMargin: 0,
                    leftMargin: 0,
                    rightMargin: 0,
                    textAlign: 'left'
                });
            }
        };

        this.setEditorSession = function(session) {
            editorSession = session;
        };

        function init(cb) {
            require([
                "dojo",
                "dojo/ready",
                "dojo/dom-construct",
                "dijit/layout/ContentPane"],
                function (dojo, ready, domConstruct, ContentPane) {
                    var editorBase = dojo.config && dojo.config.paths &&
                            dojo.config.paths['webodf/editor'];
                runtime.assert(editorBase, "webodf/editor path not defined in dojoConfig");
                ready(function () {
                    contentPane = new ContentPane({
                        title: runtime.tr("Alignment"),
                        href: editorBase+"/widgets/dialogWidgets/alignmentPane.html",
                        preload: true
                    });
                    contentPane.onLoad = function () {
                        form = dijit.byId('alignmentPaneForm');
                        runtime.translateContent(form.domNode);
                    };
                    return cb();
                });
            });
        }

        init(function () {
            return callback(self);
        });
    };

    return AlignmentPane;
});
