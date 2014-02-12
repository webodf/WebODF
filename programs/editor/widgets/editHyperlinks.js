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

/*global define,require,document,odf */

define("webodf/editor/widgets/editHyperlinks", [
    "webodf/editor/EditorSession",
    "webodf/editor/widgets/dialogWidgets/editHyperlinkPane",
    "dijit/form/Button",
    "dijit/form/DropDownButton",
    "dijit/TooltipDialog"],

    function (EditorSession, EditHyperlinkPane, Button, DropDownButton, TooltipDialog) {
        "use strict";

        runtime.loadClass("odf.OdfUtils");

        var EditHyperlinks = function (callback) {
            var self = this,
                widget = {},
                editorSession,
                hyperlinkController,
                linkEditorContent,
                editHyperlinkButton,
                removeHyperlinkButton,
                odfUtils = new odf.OdfUtils(),
                dialog;

            linkEditorContent = new EditHyperlinkPane();
            dialog = new TooltipDialog({
                title: runtime.tr("Edit link"),
                content: linkEditorContent.widget()
            });

            editHyperlinkButton = new DropDownButton({
                label: runtime.tr('Edit link'),
                showLabel: false,
                iconClass: 'dijitEditorIcon dijitEditorIconCreateLink',
                dropDown: dialog
            });

            removeHyperlinkButton = new Button({
                label: runtime.tr('Remove link'),
                showLabel: false,
                disabled: true,
                iconClass: 'dijitEditorIcon dijitEditorIconUnlink',
                onClick: function () {
                    hyperlinkController.removeHyperlinks();
                    self.onToolDone();
                }
            });

            linkEditorContent.onSave = function () {
                var hyperlinkData = linkEditorContent.value();
                editHyperlinkButton.closeDropDown(false);
                if (hyperlinkData.isReadOnlyText == "true") {
                    hyperlinkController.removeHyperlinks();
                    hyperlinkController.addHyperlink(hyperlinkData.linkUrl);
                } else {
                    hyperlinkController.addHyperlink(hyperlinkData.linkUrl, hyperlinkData.linkDisplayText);
                }
                self.onToolDone();
            };

            linkEditorContent.onCancel = function () {
                editHyperlinkButton.closeDropDown(false);
                self.onToolDone();
            };

            widget.children = [editHyperlinkButton, removeHyperlinkButton];
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

            function checkHyperlinkButtons() {
                var selection = editorSession.getSelectedRange(),
                    textContent,
                    linksInSelection = editorSession.getSelectedHyperlinks(),
                    linkTarget = linksInSelection[0] ? odfUtils.getHyperlinkTarget(linksInSelection[0]) : "http://";

                if (selection && selection.collapsed && linksInSelection.length === 1) {
                    // Selection is collapsed within a single hyperlink. Assume user is modifying the hyperlink
                    textContent = selection.cloneRange();
                    textContent.selectNodeContents(linksInSelection[0]);
                    linkEditorContent.set({
                        linkDisplayText: textContent.toString(),
                        linkUrl: linkTarget,
                        isReadOnlyText: true
                    });
                    textContent.detach();
                } else if (selection && !selection.collapsed) {
                    // User has selected part of a hyperlink or a block of text. Assume user is attempting to modify the
                    // existing hyperlink, or wants to convert the selection into a hyperlink
                    linkEditorContent.set({
                        linkDisplayText: selection.toString(),
                        linkUrl: linkTarget,
                        isReadOnlyText: true
                    });
                } else {
                    // Selection is collapsed and is not in an existing hyperlink
                    linkEditorContent.set({
                        linkDisplayText: "",
                        linkUrl: linkTarget,
                        isReadOnlyText: false
                    });
                }

                // The 3rd parameter is false to avoid firing onChange when setting the value programmatically.
                removeHyperlinkButton.set('disabled', linksInSelection.length === 0, false);
            }

            this.setEditorSession = function (session) {
                if (editorSession) {
                    editorSession.unsubscribe(EditorSession.signalCursorMoved, checkHyperlinkButtons);
                    editorSession.unsubscribe(EditorSession.signalParagraphChanged, checkHyperlinkButtons);
                    editorSession.unsubscribe(EditorSession.signalParagraphStyleModified, checkHyperlinkButtons);
                }
                editorSession = session;
                hyperlinkController = session && session.sessionController.getHyperlinkController();
                widget.children.forEach(function (element) {
                    element.setAttribute('disabled', !hyperlinkController);
                });
                if (editorSession) {
                    editorSession.subscribe(EditorSession.signalCursorMoved, checkHyperlinkButtons);
                    editorSession.subscribe(EditorSession.signalParagraphChanged, checkHyperlinkButtons);
                    editorSession.subscribe(EditorSession.signalParagraphStyleModified, checkHyperlinkButtons);
                    checkHyperlinkButtons();
                }
            };

            this.onToolDone = function () {};

            callback(widget);
        };

        return EditHyperlinks;
});
