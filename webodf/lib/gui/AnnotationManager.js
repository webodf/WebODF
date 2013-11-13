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

/*global runtime, core, gui, odf, ops, Node*/

runtime.loadClass("core.EventNotifier");
runtime.loadClass("core.PositionFilter");
runtime.loadClass("ops.OpAddAnnotation");
runtime.loadClass("ops.OpRemoveAnnotation");
runtime.loadClass("gui.SelectionMover");

/**
 * @constructor
 * @param {!ops.Session} session
 * @param {!string} inputMemberId
 */
gui.AnnotationManager = function AnnotationManager(session, inputMemberId) {
    "use strict";

    var odtDocument = session.getOdtDocument(),
        isAnnotatable = false,
        eventNotifier = new core.EventNotifier([gui.AnnotationManager.annotatableChanged]),
        /**@const @type {!string}*/officens = odf.Namespaces.officens;

    /**
     * @param {?Node} node  Node to start searching with
     * @param {!Node} container  Root container to stop searching at.
     * @return {!boolean}
     */
    function isWithinAnnotation(node, container) {
        while (node && node !== container) {
            if (node.namespaceURI === officens && node.localName === 'annotation') {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }

    /**
     * @return {undefined}
     */
    function updatedCachedValues() {
        var cursor = odtDocument.getCursor(inputMemberId),
            cursorNode = cursor && cursor.getNode(),
            newIsAnnotatable = cursorNode && ! isWithinAnnotation(cursorNode, odtDocument.getRootNode());

        if (newIsAnnotatable !== isAnnotatable) {
            isAnnotatable = newIsAnnotatable;
            eventNotifier.emit(gui.AnnotationManager.annotatableChanged, isAnnotatable);
        }
    }

    /**
     * @param {!ops.OdtCursor} cursor
     * @return {undefined}
     */
    function onCursorAdded(cursor) {
        if (cursor.getMemberId() === inputMemberId) {
            updatedCachedValues();
        }
    }

    /**
     * @param {!string} memberId
     * @return {undefined}
     */
    function onCursorRemoved(memberId) {
        if (memberId === inputMemberId) {
            updatedCachedValues();
        }
    }

    /**
     * @param {!ops.OdtCursor} cursor
     * @return {undefined}
     */
    function onCursorMoved(cursor) {
        if (cursor.getMemberId() === inputMemberId) {
            updatedCachedValues();
        }
    }

    /**
     * @return {!boolean}
     */
    this.isAnnotatable = function() {
        return isAnnotatable;
    };

    /**
     * Adds an annotation to the document based on the current selection
     * @return {undefined}
     */
    this.addAnnotation = function () {
        var op = new ops.OpAddAnnotation(),
            selection = odtDocument.getCursorSelection(inputMemberId),
            length = selection.length,
            position = selection.position;

        if (! isAnnotatable) {
            return;
        }

        position = length >= 0 ? position : position + length;
        length = Math.abs(length);

        op.init({
            memberid: inputMemberId,
            position: position,
            length: length,
            name: inputMemberId + Date.now()
        });
        session.enqueue([op]);
    };


    /**
     * @param {!Node} annotationNode
     * @return {undefined}
     */
    this.removeAnnotation = function(annotationNode) {
        var startStep, endStep, op, moveCursor;

        // (annotationNode, 0) will report as the step just before the first step in the annotation node
        // Add 1 to this to actually get *within* the annotation
        startStep = odtDocument.convertDomPointToCursorStep(annotationNode, 0) + 1;
        // Will report the last walkable step within the annotation
        endStep = odtDocument.convertDomPointToCursorStep(annotationNode, annotationNode.childNodes.length);

        op = new ops.OpRemoveAnnotation();
        op.init({
            memberid: inputMemberId,
            position: startStep,
            length: endStep - startStep
        });
        moveCursor = new ops.OpMoveCursor();
        moveCursor.init({
            memberid: inputMemberId,
            position: startStep > 0 ? startStep - 1 : startStep, // Last position just before the annotation starts
            length: 0
        });
        session.enqueue([op, moveCursor]);
    };

    /**
     * @param {!string} eventid
     * @param {!Function} cb
     * @return {undefined}
     */
    this.subscribe = function (eventid, cb) {
        eventNotifier.subscribe(eventid, cb);
    };

    /**
     * @param {!string} eventid
     * @param {!Function} cb
     * @return {undefined}
     */
    this.unsubscribe = function (eventid, cb) {
        eventNotifier.unsubscribe(eventid, cb);
    };

    /**
     * @param {!function(!Object=)} callback, passing an error object in case of error
     * @return {undefined}
     */
    this.destroy = function(callback) {
        odtDocument.unsubscribe(ops.OdtDocument.signalCursorAdded, onCursorAdded);
        odtDocument.unsubscribe(ops.OdtDocument.signalCursorRemoved, onCursorRemoved);
        odtDocument.unsubscribe(ops.OdtDocument.signalCursorMoved, onCursorMoved);
        callback();
    };

    function init() {
        odtDocument.subscribe(ops.OdtDocument.signalCursorAdded, onCursorAdded);
        odtDocument.subscribe(ops.OdtDocument.signalCursorRemoved, onCursorRemoved);
        odtDocument.subscribe(ops.OdtDocument.signalCursorMoved, onCursorMoved);
        updatedCachedValues();
    }

    init();
};

/**@const*/gui.AnnotationManager.annotatableChanged = "annotatable/changed";

(function () {
    "use strict";
    return gui.AnnotationManager;
}());

