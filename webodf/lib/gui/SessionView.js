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
runtime.loadClass("gui.Avatar");
runtime.loadClass("gui.SelectionManager");
runtime.loadClass("ops.TrivialUserModel");

gui.SessionView = (function () {
    "use strict";

    /**
        * @constructor
        */
    function SessionView(session) {
        var guiAvatarFactory = null,
            selectionManager = new gui.SelectionManager(session.getRootNode()),
            members = {};

        /**
        * @return {ops.Session}
        */
        this.getSession = function () {
            return session;
        };
        /**
        * @param {!string} memberid
        * @return {gui.Avatar}
        */
        this.getAvatar = function (memberid) {
            return members[memberid];
        };
        /**
        * @return {!Array.<!gui.Avatar>}
        */
        this.getAvatars = function () {
            var list = [], i;
            for (i in members) {
                if (members.hasOwnProperty(i)) {
                    list.push(members[i]);
                }
            }
            return list;
        };

        this.setGuiAvatarFactory = function(factory) {
            guiAvatarFactory = factory;
        };

        /**
        * @param {!string} memberid
        */
        function onAvatarAdded(memberid) {
            var selectionMover = selectionManager.createSelectionMover(),
                avatar = guiAvatarFactory.createAvatar(memberid, selectionMover),
                userData = session.getUserModel().getUserDetails(memberid);
            // TODO: check if all data is set, here or in usermodel
            avatar.setImageUrl(userData.imageurl);
            avatar.setColor(userData.color);

            runtime.log("+++ View here +++ eagerly created an Avatar! +++");

            members[memberid] = avatar;
        }

        /**
        * @param {!string} memberid
        */
        function onAvatarRemoved(memberid) {
            var avatar = members[memberid];

            avatar.removeFromSession();
            delete members[memberid];
        }

        /**
        * @param {!Object} moveData
        */
        function onAvatarMoved(moveData) {
            var avatar = members[moveData.memberid],
                caret = avatar.getCaret(),
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
            // TODO: who should/needs to care for that?
            if (avatar.getMemberId() === session.getUserModel().getLocalMemberId()) {
                caret.focus();
            }
        }

        session.subscribe("avatar/added", onAvatarAdded);
        session.subscribe("avatar/removed", onAvatarRemoved);
        session.subscribe("avatar/moved", onAvatarMoved);

    }

    return SessionView;
} ());

