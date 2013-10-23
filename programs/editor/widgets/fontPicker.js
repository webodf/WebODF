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
/*global define,require,document */
define("webodf/editor/widgets/fontPicker", [
    "dijit/form/Select"],

    function (Select) {
        "use strict";

        /**
         * @constructor
         */
        var FontPicker = function (callback) {
            var self = this,
                editorSession,
                select,
                editorFonts = [],
                documentFonts = [],
                selectionList = [];

            select = new Select({
                name: 'FontPicker',
                maxHeight: 200,
                style: {
                    width: '150px'
                }
            });

            this.widget = function () {
                return select;
            };

            this.value = function () {
                return select.get('value');
            };

            this.setValue = function (value) {
                select.set('value', value);
            };

            /**
             * Returns the font family for a given font name. If unavailable,
             * return the name itself (e.g. editor fonts won't have a name-family separation
             * @param {!string} name
             * @return {!string}
             */
            this.getFamily = function (name) {
                var i;
                for (i = 0; i < documentFonts.length; i += 1) {
                    if ((documentFonts[i].name === name) && documentFonts[i].family) {
                        return documentFonts[i].family;
                    }
                }
                return name;
            };
            // events
            this.onAdd = null;
            this.onRemove = null;

            function populateFonts() {
                var i, name, family;
                editorFonts = editorSession ? editorSession.availableFonts : [];
                documentFonts = editorSession ? editorSession.getDeclaredFonts() : [];

                // First populate the fonts used in the document
                for (i = 0; i < documentFonts.length; i += 1) {
                    name = documentFonts[i].name;
                    family = documentFonts[i].family || name;
                    selectionList.push({
                        label: '<span style="font-family: ' + family + ';">' + name + '</span>',
                        value: name
                    });
                }
                if (editorFonts.length) {
                    // Then add a separator
                    selectionList.push({
                        type: 'separator'
                    });
                }
                // Lastly populate the fonts provided by the editor
                for (i = 0; i < editorFonts.length; i += 1) {
                    selectionList.push({
                        label: '<span style="font-family: ' + editorFonts[i] + ';">' + editorFonts[i] + '</span>',
                        value: editorFonts[i]
                    });
                }

                select.removeOption(select.getOptions());
                select.addOption(selectionList);
            }

            this.setEditorSession = function(session) {
                editorSession = session;
                populateFonts();
            };

            populateFonts();
            callback(self);
        };

        return FontPicker;
});
