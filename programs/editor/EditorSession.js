/**
 * @license
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
/*global define, runtime, core, gui, ops, document */
define("webodf/editor/EditorSession", [
    "dojo/text!resources/fonts/fonts.css"
], function (fontsCSS) { // fontsCSS is retrieved as a string, using dojo's text retrieval AMD plugin
    "use strict";

    runtime.libraryPaths = function () {
        return [ "../../webodf/lib" ];
    };

    runtime.loadClass("ops.OdtDocument");
    runtime.loadClass("ops.Session");
    runtime.loadClass("ops.NowjsOperationRouter");
    runtime.loadClass("ops.NowjsUserModel");
    runtime.loadClass("odf.OdfCanvas");
    runtime.loadClass("gui.CaretFactory");
    runtime.loadClass("gui.Caret");
    runtime.loadClass("gui.SessionController");
    runtime.loadClass("gui.SessionView");
    runtime.loadClass("gui.TrivialUndoManager");
    runtime.loadClass("core.EventNotifier");

    /**
     * Instantiate a new editor session attached to an existing operation session
     * @param {!ops.Session} session
     * @param {!string} memberid
     * @param {{viewOptions:gui.SessionViewOptions}} config
     * @constructor
     */
    var EditorSession = function EditorSession(session, memberid, config) {
        var self = this,
            currentParagraphNode = null,
            currentNamedStyleName = null,
            currentStyleName = null,
            odtDocument = session.getOdtDocument(),
            textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
            formatting = odtDocument.getFormatting(),
            eventNotifier = new core.EventNotifier([
                EditorSession.signalUserAdded,
                EditorSession.signalUserRemoved,
                EditorSession.signalCursorMoved,
                EditorSession.signalParagraphChanged,
                EditorSession.signalStyleCreated,
                EditorSession.signalStyleDeleted,
                EditorSession.signalParagraphStyleModified,
                EditorSession.signalUndoStackChanged]);


        this.sessionController = new gui.SessionController(session, memberid);
        this.sessionView = new gui.SessionView(config.viewOptions, session, new gui.CaretFactory(self.sessionController));
        this.availableFonts = [];

        /*
         * @return {Array.{!string}}
         */
        function getAvailableFonts() {
            var availableFonts, regex, matches;

            availableFonts = {};

            regex =  /font-family *: *(?:\'([^']*)\'|\"([^"]*)\")/gm;
            matches = regex.exec(fontsCSS);

            while (matches) {
                availableFonts[matches[1] || matches[2]] = 1;
                matches = regex.exec(fontsCSS);
            }
            availableFonts = Object.keys(availableFonts);

            return availableFonts;
        }
        this.availableFonts = getAvailableFonts();

        function checkParagraphStyleName() {
            var newStyleName,
                newNamedStyleName;

            newStyleName = currentParagraphNode.getAttributeNS(textns, 'style-name');
            if (newStyleName !== currentStyleName) {
                currentStyleName = newStyleName;
                // check if named style is still the same
                newNamedStyleName = formatting.getFirstNamedParentStyleNameOrSelf(newStyleName);
                if (!newNamedStyleName) {
                    // TODO: how to handle default styles?
                    return;
                }
                // a named style
                if (newNamedStyleName !== currentNamedStyleName) {
                    currentNamedStyleName = newNamedStyleName;
                    self.emit(EditorSession.signalParagraphChanged, {
                        type: 'style',
                        node: currentParagraphNode,
                        styleName: currentNamedStyleName
                    });
                }
            }
        }
        /**
         * Creates a NCName from the passed string
         * @param {!string} name
         * @return {!string}
         */
        function createNCName(name) {
            var letter,
                result = "",
                i;

            // encode
            for (i = 0; i < name.length; i++) {
                letter = name[i];
                // simple approach, can be improved to not skip other allowed chars
                if (letter.match(/[a-zA-Z0-9.-_]/) !== null) {
                    result += letter;
                } else {
                    result += "_" + letter.charCodeAt(0).toString(16) + "_";
                }
            }
            // ensure leading char is from proper range
            if (result.match(/^[a-zA-Z_]/) === null) {
                result = "_" + result;
            }

            return result;
        }

        function uniqueParagraphStyleNCName(name) {
            var result,
                i = 0,
                ncMemberId = createNCName(memberid),
                ncName = createNCName(name);

            // create default paragraph style
            // memberid is used to avoid id conflicts with ids created by other users
            result = ncName + "_" + ncMemberId;
            // then loop until result is really unique
            while (formatting.hasParagraphStyle(result)) {
                result = ncName + "_" + i + "_" + ncMemberId;
                i++;
            }

            return result;
        }

        function trackCursor(cursor) {
            var node;

            node = odtDocument.getParagraphElement(cursor.getNode());
            if (!node) {
                return;
            }
            currentParagraphNode = node;
            checkParagraphStyleName();
        }

        function trackCurrentParagraph(info) {
            if (info.paragraphElement !== currentParagraphNode) {
                return;
            }
            checkParagraphStyleName();
        }

        // Custom signals, that make sense in the Editor context. We do not want to expose webodf's ops signals to random bits of the editor UI.
        odtDocument.subscribe(ops.OdtDocument.signalCursorAdded, function (cursor) {
            self.emit(EditorSession.signalUserAdded, cursor.getMemberId());
            trackCursor(cursor);
        });

        odtDocument.subscribe(ops.OdtDocument.signalCursorRemoved, function (memberId) {
            self.emit(EditorSession.signalUserRemoved, memberId);
        });

        odtDocument.subscribe(ops.OdtDocument.signalCursorMoved, function (cursor) {
            // Emit 'cursorMoved' only when *I* am moving the cursor, not the other users
            if (cursor.getMemberId() === memberid) {
                self.emit(EditorSession.signalCursorMoved, cursor);
            }
        });

        odtDocument.subscribe(ops.OdtDocument.signalStyleCreated, function (newStyleName) {
            self.emit(EditorSession.signalStyleCreated, newStyleName);
        });

        odtDocument.subscribe(ops.OdtDocument.signalStyleDeleted, function (styleName) {
            self.emit(EditorSession.signalStyleDeleted, styleName);
        });

        odtDocument.subscribe(ops.OdtDocument.signalParagraphStyleModified, function (styleName) {
            self.emit(EditorSession.signalParagraphStyleModified, styleName);
        });

        odtDocument.subscribe(ops.OdtDocument.signalParagraphChanged, trackCurrentParagraph);

        this.startEditing = function () {
            self.sessionController.startEditing();
        };

        this.endEditing = function () {
            self.sessionController.endEditing();
        };

        /**
         * Call all subscribers for the given event with the specified argument
         * @param {!string} eventid
         * @param {Object} args
         */
        this.emit = function (eventid, args) {
            eventNotifier.emit(eventid, args);
        };

        /**
         * Subscribe to a given event with a callback
         * @param {!string} eventid
         * @param {!Function} cb
         */
        this.subscribe = function (eventid, cb) {
            eventNotifier.subscribe(eventid, cb);
        };

        this.getUserDetailsAndUpdates = function (memberId, subscriber) {
            return session.getUserModel().getUserDetailsAndUpdates(memberId, subscriber);
        };

        this.unsubscribeUserDetailsUpdates = function (memberId, subscriber) {
            return session.getUserModel().unsubscribeUserDetailsUpdates(memberId, subscriber);
        };

        this.getCursorPosition = function () {
            return odtDocument.getCursorPosition(memberid);
        };

        this.getCursorSelection = function () {
            return odtDocument.getCursorSelection(memberid);
        };

        this.getOdfCanvas = function () {
            return odtDocument.getOdfCanvas();
        };

        this.getCurrentParagraph = function () {
            return currentParagraphNode;
        };

        this.getAvailableParagraphStyles = function () {
            return formatting.getAvailableParagraphStyles();
        };

        this.getCurrentSelectionStyle = function () {
            var cursor = odtDocument.getCursor(memberid),
                selectedRange;
            // no own cursor yet/currently added?
            if (!cursor) {
                return [];
            }
            selectedRange = cursor.getSelectedRange();
            if (selectedRange.collapsed) {
                return [formatting.getAppliedStylesForElement(cursor.getNode())];
            }
            return formatting.getAppliedStyles(selectedRange);
        };

        this.getCurrentParagraphStyle = function () {
            return currentNamedStyleName;
        };

        this.formatSelection = function (value) {
            var op = new ops.OpApplyStyle(),
                selection = self.getCursorSelection();
            op.init({
                memberid: memberid,
                position: selection.position,
                length: selection.length,
                info: value
            });
            session.enqueue(op);
        };

        this.setCurrentParagraphStyle = function (value) {
            var op;
            if (currentNamedStyleName !== value) {
                op = new ops.OpSetParagraphStyle();
                op.init({
                    memberid: memberid,
                    position: self.getCursorPosition(),
                    styleName: value
                });
                session.enqueue(op);
            }
        };

        this.insertTable = function (initialRows, initialColumns, tableStyleName, tableColumnStyleName, tableCellStyleMatrix) {
            var op = new ops.OpInsertTable();
            op.init({
                memberid: memberid,
                position: self.getCursorPosition(),
                initialRows: initialRows,
                initialColumns: initialColumns,
                tableStyleName: tableStyleName,
                tableColumnStyleName: tableColumnStyleName,
                tableCellStyleMatrix: tableCellStyleMatrix
            });
            session.enqueue(op);
        };

        this.getParagraphStyleElement = function (styleName) {
            return odtDocument.getParagraphStyleElement(styleName);
        };

        /**
         * Returns if the style is used anywhere in the document
         * @param {!Element} styleElement
         * @return {boolean}
         */
        this.isStyleUsed = function (styleElement) {
            return formatting.isStyleUsed(styleElement);
        };

        this.getParagraphStyleAttributes = function (styleName) {
            return odtDocument.getParagraphStyleAttributes(styleName);
        };

        /**
         * Creates and enqueues a paragraph-style cloning operation.
         * Returns the created id for the new style.
         * @param {!string} styleName  id of the style to update
         * @param {!{paragraphProperties,textProperties}} setProperties  properties which are set
         * @param {!{paragraphPropertyNames,textPropertyNames}=} removedProperties  properties which are removed
         * @return {undefined}
         */
        this.updateParagraphStyle = function (styleName, setProperties, removedProperties) {
            var op;
            op = new ops.OpUpdateParagraphStyle();
            op.init({
                memberid: memberid,
                styleName: styleName,
                setProperties: setProperties,
                removedProperties: (!removedProperties) ? {} : removedProperties
            });
            session.enqueue(op);
        };

        /**
         * Creates and enqueues a paragraph-style cloning operation.
         * Returns the created id for the new style.
         * @param {!string} styleName id of the style to clone
         * @param {!string} newStyleDisplayName display name of the new style
         * @return {!string}
         */
        this.cloneParagraphStyle = function (styleName, newStyleDisplayName) {
            var newStyleName = uniqueParagraphStyleNCName(newStyleDisplayName),
                op;

            op = new ops.OpCloneParagraphStyle();
            op.init({
                memberid: memberid,
                styleName: styleName,
                newStyleName: newStyleName,
                newStyleDisplayName: newStyleDisplayName
            });
            session.enqueue(op);

            return newStyleName;
        };

        this.deleteStyle = function (styleName) {
            var op;
            op = new ops.OpDeleteParagraphStyle();
            op.init({
                memberid: memberid,
                styleName: styleName
            });
            session.enqueue(op);
        };

        /**
         * Returns an array of the declared fonts in the ODF document,
         * with 'duplicates' like Arial1, Arial2, etc removed. The alphabetically
         * first font name for any given family is kept.
         * The elements of the array are objects containing the font's name and
         * the family.
         * @return {Array.{Object}}
         */
        this.getDeclaredFonts = function () {
            var fontMap = formatting.getFontMap(),
                usedFamilies = [],
                array = [],
                sortedNames,
                key,
                value,
                i;

            // Sort all the keys in the font map alphabetically
            sortedNames = Object.keys(fontMap);
            sortedNames.sort();

            for (i = 0; i < sortedNames.length; i += 1) {
                key = sortedNames[i];
                value = fontMap[key];

                // Use the font declaration only if the family is not already used.
                // Therefore we are able to discard the alphabetic successors of the first
                // font name.
                if (usedFamilies.indexOf(value) === -1) {
                    array.push({
                        name: key,
                        family: value
                    });
                    if (value) {
                        usedFamilies.push(value);
                    }
                }
            }

            return array;
        };

        function undoStackModified(e) {
            self.emit(EditorSession.signalUndoStackChanged, e);
        }

        this.hasUndoManager = function () {
            return Boolean(self.sessionController.getUndoManager());
        };

        this.undo = function () {
            var undoManager = self.sessionController.getUndoManager();
            undoManager.moveBackward(1);
        };

        this.redo = function () {
            var undoManager = self.sessionController.getUndoManager();
            undoManager.moveForward(1);
        };

        this.subscribe(EditorSession.signalCursorMoved, trackCursor);

        function init() {
            var head = document.getElementsByTagName('head')[0],
                fontStyles = document.createElement('style');
            fontStyles.type = 'text/css';
            fontStyles.media = 'screen, print, handheld, projection';
            fontStyles.appendChild(document.createTextNode(fontsCSS));
            head.appendChild(fontStyles);
            odtDocument.subscribe(ops.OdtDocument.signalUndoStackChanged, undoStackModified);
        }

        init();
    };

    /**@const*/EditorSession.signalUserAdded =              "userAdded";
    /**@const*/EditorSession.signalUserRemoved =            "userRemoved";
    /**@const*/EditorSession.signalCursorMoved =            "cursorMoved";
    /**@const*/EditorSession.signalParagraphChanged =       "paragraphChanged";
    /**@const*/EditorSession.signalStyleCreated =           "styleCreated";
    /**@const*/EditorSession.signalStyleDeleted =           "styleDeleted";
    /**@const*/EditorSession.signalParagraphStyleModified = "paragraphStyleModified";
    /**@const*/EditorSession.signalUndoStackChanged =      "signalUndoStackChanged";

    return EditorSession;
});
