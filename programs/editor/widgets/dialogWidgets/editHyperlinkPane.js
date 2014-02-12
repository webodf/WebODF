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

/*global runtime,core,define,require,document,dijit */

define("webodf/editor/widgets/dialogWidgets/editHyperlinkPane", [
    "dojo",
    "dijit/layout/ContentPane"],

    function (dojo, ContentPane) {
        "use strict";

        runtime.loadClass("core.CSSUnits");

        var EditHyperlinkPane = function () {
            var self = this,
                editorBase = dojo.config && dojo.config.paths && dojo.config.paths['webodf/editor'],
                contentPane,
                form,
                displayTextField,
                initialValue;

            runtime.assert(editorBase, "webodf/editor path not defined in dojoConfig");

            function onSave() {
                if (self.onSave) {
                    self.onSave();
                }
                return false;
            }

            function onCancel() {
                form.set('value', initialValue);
                if (self.onCancel) {
                    self.onCancel();
                }
            }

            contentPane = new ContentPane({
                title: runtime.tr("editLink"),
                href: editorBase+"/widgets/dialogWidgets/editHyperlinkPane.html",
                preload: true,
                onLoad : function () {
                    form = dijit.byId('editHyperlinkPaneForm');
                    form.onSubmit = onSave;
                    dijit.byId('cancelHyperlinkChangeButton').onClick = onCancel;
                    displayTextField = dijit.byId('linkDisplayText');
                    runtime.translateContent(form.domNode);
                    if (initialValue) {
                        form.set('value', initialValue);
                        displayTextField.set('disabled', initialValue.isReadOnlyText);
                        initialValue = undefined;
                    }
                }
            });

            this.widget = function () {
                return contentPane;
            };

            this.value = function () {
                return form && form.get('value');
            };

            this.set = function (value) {
                initialValue = value;
                if (form) {
                    form.set('value', value);
                    displayTextField.set('disabled', value.isReadOnlyText);
                }
            };
        };

        return EditHyperlinkPane;
});
