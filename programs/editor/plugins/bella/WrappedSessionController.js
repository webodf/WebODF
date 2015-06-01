/**
 * Copyright (C) 2014-2015 KO GmbH <copyright@kogmbh.com>
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

/*global define, window*/

define("webodf/editor/plugins/bella/WrappedSessionController", function() {
    "use strict";
    var webodf = window;

    function WrappedSessionController(sessionController) {
        var session = sessionController.getSession(),
            inputMemberId = sessionController.getInputMemberId(),
            constraints = sessionController.getSessionConstraints(),
            sessionContext = new webodf.gui.SessionContext(session, inputMemberId),
            mimeDataExporter = new webodf.gui.MimeDataExporter(),
            pasteHandler = new webodf.gui.PasteController(session, constraints, sessionContext, inputMemberId);

        this.undo = sessionController.undo;
        this.redo = sessionController.redo;
        this.getSession = sessionController.getSession;
        this.getInputMemberId = sessionController.getInputMemberId;
        this.getTextController = sessionController.getTextController;
        this.getSelectionController = sessionController.getSelectionController;
        this.getDirectFormattingController = sessionController.getDirectFormattingController;
        this.getAnnotationController = sessionController.getAnnotationController;
        this.getEventManager = sessionController.getEventManager;

        this.simulateCopy = function(range) {
            var selectedData = "",
                dataTransfer = { setData: function(ignored, text) { selectedData = text; /**Just returning for jslint*/return ignored; } };

            mimeDataExporter.exportRangeToDataTransfer(dataTransfer, range);
            return selectedData;
        };

        this.simulatePaste = function(plainText) {
            pasteHandler.paste(plainText);
        };
    }

    return WrappedSessionController;
});
