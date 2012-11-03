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
/*global runtime, gui */
runtime.loadClass("gui.Caret");
runtime.loadClass("gui.SelectionManager");
runtime.loadClass("ops.TrivialUserModel");

gui.SessionView = (function () {
    "use strict";

    /**
      * @constructor
      */
    function SessionView(session, caretFactory) {
        var selectionManager = new gui.SelectionManager(session.getRootNode()),
            carets = {};

        /**
         * @return {ops.Session}
         */
        this.getSession = function () {
            return session;
        };
        /**
         * @param {!string} memberid
         * @return {gui.Caret}
         */
        this.getCaret = function (memberid) {
            return carets[memberid];
        };

        /**
         * @param {core.Cursor} cursor
         */
        function onCursorAdded(cursor) {
            var selectionMover = selectionManager.createSelectionMover(cursor),
                caret = caretFactory.createCaret(selectionMover),
                userData = session.getUserModel().getUserDetails(cursor.getMemberId());

            caret.setAvatarImageUrl(userData.imageurl);
            caret.setColor(userData.color);

            runtime.log("+++ View here +++ eagerly created an Caret for '"+cursor.getMemberId()+"'! +++");

            carets[cursor.getMemberId()] = caret;
        }

        /**
         * @param {!string} memberid
         */
        function onCursorRemoved(memberid) {
            delete carets[memberid];
        }

        /**
         * @param {!Object} moveData
         */
        function onCursorMoved(moveData) {
            var caret = carets[moveData.memberid],
                stepCounter = caret.getStepCounter(),
                positionFilter = session.getFilter(),
                steps;

            if (moveData.number > 0) {
                steps = stepCounter.countForwardSteps(moveData.number, positionFilter);
            } else if (moveData.number < 0) {
                steps = -stepCounter.countBackwardSteps(-moveData.number, positionFilter);
            } else {
                // nothing to do
                return;
            }
            runtime.log("Moving. moving, moving... walkableSteps "+steps);
            caret.move(steps);
        }

        session.subscribe("cursor/added", onCursorAdded);
        session.subscribe("cursor/removed", onCursorRemoved);
        session.subscribe("cursor/moved", onCursorMoved);

    }

    return SessionView;
} ());

