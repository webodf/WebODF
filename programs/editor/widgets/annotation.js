/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global define, require */

define("webodf/editor/widgets/annotation", [
    "dijit/form/Button"],

    function (Button) {
        "use strict";

        var AnnotationControl = function (callback) {
            var self = this,
                widget = {},
                addAnnotationButton,
                annotationController;


            addAnnotationButton = new Button({
                label: runtime.tr('Annotate'),
                disabled: true,
                showLabel: false,
                iconClass: 'dijitIconBookmark',
                onClick: function () {
                    if (annotationController) {
                        annotationController.addAnnotation();
                        self.onToolDone();
                    }
                }
            });

            widget.children = [addAnnotationButton];
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

            function onAnnotatableChanged(isAnnotatable) {
                addAnnotationButton.setAttribute('disabled', !isAnnotatable);
            }

            this.setEditorSession = function (session) {
                if (annotationController) {
                    annotationController.unsubscribe(gui.AnnotationController.annotatableChanged, onAnnotatableChanged);
                }
                annotationController = session && session.sessionController.getAnnotationController();
                if (annotationController) {
                    annotationController.subscribe(gui.AnnotationController.annotatableChanged, onAnnotatableChanged);
                }
                onAnnotatableChanged(annotationController && annotationController.isAnnotatable());
            };

            this.onToolDone = function () {};

            callback(widget);
        };

        return AnnotationControl;
    }
);
