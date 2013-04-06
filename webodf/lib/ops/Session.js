/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
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
/*global runtime, core, gui, ops, odf*/
runtime.loadClass("core.EventNotifier");
runtime.loadClass("ops.TrivialUserModel");
runtime.loadClass("ops.TrivialOperationRouter");
runtime.loadClass("ops.OperationFactory");
runtime.loadClass("gui.SelectionManager");
runtime.loadClass("ops.OdtDocument");
/**
 * An editing session and what belongs to it.
 * @constructor
 * @param {!odf.OdfCanvas} odfCanvas
 */
ops.Session = function Session(odfCanvas) {
    "use strict";
    var self = this,
        odtDocument = new ops.OdtDocument(odfCanvas),
        style2CSS = new odf.Style2CSS(),
        namespaces = style2CSS.namespaces,
        m_user_model = null,
        m_operation_router = null,
        eventNotifier = new core.EventNotifier([
            ops.Session.signalCursorAdded,
            ops.Session.signalCursorRemoved,
            ops.Session.signalCursorMoved,
            ops.Session.signalParagraphChanged,
            ops.Session.signalStyleCreated,
            ops.Session.signalStyleDeleted,
            ops.Session.signalParagraphStyleModified]);

    function setUserModel(userModel) {
        m_user_model = userModel;
    }
    this.setUserModel = setUserModel;

    function setOperationRouter(opRouter) {
        m_operation_router = opRouter;
        opRouter.setPlaybackFunction(self.playOperation);
        opRouter.setOperationFactory(new ops.OperationFactory(self));
    }
    this.setOperationRouter = setOperationRouter;

    function getUserModel() {
        return m_user_model;
    }
    this.getUserModel = getUserModel;

    /**
     * @return {!ops.OdtDocument}
     */
    this.getOdtDocument = function () {
        return odtDocument;
    };

    this.emit = function (eventid, args) {
        eventNotifier.emit(eventid, args);
    };
    this.subscribe = function (eventid, cb) {
        eventNotifier.subscribe(eventid, cb);
    };

    /* SESSION OPERATIONS */

    // controller sends operations to this method
    this.enqueue = function (operation) {
        m_operation_router.push(operation);
    };

    this.playOperation = function (op) {
        op.execute(odtDocument.getRootNode());
    };

    /**
     * @return {undefined}
     */
    function init() {
        setUserModel(new ops.TrivialUserModel());
        setOperationRouter(new ops.TrivialOperationRouter());
    }
    init();
};

/**@const*/ops.Session.signalCursorAdded =   "cursor/added";
/**@const*/ops.Session.signalCursorRemoved = "cursor/removed";
/**@const*/ops.Session.signalCursorMoved =   "cursor/moved";
/**@const*/ops.Session.signalParagraphChanged = "paragraph/changed";
/**@const*/ops.Session.signalStyleCreated = "style/created";
/**@const*/ops.Session.signalStyleDeleted = "style/deleted";
/**@const*/ops.Session.signalParagraphStyleModified = "paragraphstyle/modified";

(function () {
    "use strict";
    return ops.Session;
}());

// vim:expandtab
