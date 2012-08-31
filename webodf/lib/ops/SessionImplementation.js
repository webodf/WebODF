/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
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
 * @source: http://gitorious.org/odfkit/webodf/
 */
/*global runtime, gui, ops*/
runtime.loadClass("gui.Avatar");
/**
 * An operation that can be performed on a document.
 * @constructor
 * @implements ops.Session
 * @param {!odf.OdfContainer} odfcontainer
 */
ops.SessionImplementation = function SessionImplementation(odfcontainer) {
    "use strict";
    function listenEvent(eventTarget, eventType, eventHandler) {
        if (eventTarget.addEventListener) {
            eventTarget.addEventListener(eventType, eventHandler, false);
        } else if (eventTarget.attachEvent) {
            eventType = "on" + eventType;
            eventTarget.attachEvent(eventType, eventHandler);
        } else {
            eventTarget["on" + eventType] = eventHandler;
        }
    }
    /**
     * @constructor
     * @implements {core.PositionFilter}
     */
    function TextPositionFilter() {
        this.acceptPosition = function (iterator) {
            var n = iterator.container(), p, o, d;
            // only stop in text nodes
            if (n.nodeType !== 3) {
                return 2;
            }
            // only stop in text nodes in 'p', 'h' or 'span' elements
            p = n.parentNode;
            o = p && p.localName;
            if (o !== "p" && o !== "span" && o !== "h") {
                return 2;
            }
            // do not stop between spaces
            o = iterator.offset();
            d = n.data;
            if (o > 0 && d[o - 1] === ' ' && d[o] === ' ') {
                return 2;
            }
            return 1;
        };
    }
    function findTextRoot(session) {
        // set the root node to be the text node
        var root = session.getOdfContainer().rootElement.firstChild;
        while (root && root.localName !== "body") {
            root = root.nextSibling;
        }
        root = root && root.firstChild;
        while (root && root.localName !== "text") {
            root = root.nextSibling;
        }
        return root;
    }
    var self = this,
        rootNode,
        members = {},
        filter = new TextPositionFilter();

    /* SESSION OPERATIONS */

    this.addMemberToSession = function (memberid) {
        var avatar = new gui.Avatar(memberid, rootNode, filter, function (n) {
                self.moveMemberCaret(memberid, n);
            });
        members[memberid] = avatar;
    };
    this.removeMemberFromSession = function (memberid) {
        var avatar = members[memberid];
        avatar.removeFromSession();
        delete members[memberid];
    };
    this.moveMemberCaret = function (memberid, number) {
        var avatar = members[memberid];
        avatar.getCaret().move(number);
    };

    /* RELAYING OF SESSION OPERATIONS */
    this.addSessionListener = function (session) {
    };

    /* SESSION INTROSPECTION */

    this.getOdfContainer = function () {
        return odfcontainer;
    };
    this.getAvatar = function (memberid) {
        return members[memberid];
    };
    this.getAvatars = function () {
        var list = [], i;
        for (i in members) {
            if (members.hasOwnProperty(i)) {
                list.push(members[i]);
            }
        }
        return list;
    };
    function getFocussedAvatar() {
        return self.getAvatars()[0];
    }
    function handleDocumentClick(e) {
        var avatar = getFocussedAvatar(),
            caret,
            counter,
            steps;
        if (!avatar) {
            return;
        }
        caret = avatar.getCaret();
        counter = caret.getStepCounter().countStepsToPosition;
        steps = counter(e.target, e.x, e.y, filter);
        caret.move(steps);
        caret.focus();
        //runtime.log(steps);
        //runtime.log(e.target.getBoundingClientRect());
    }
    function init() {
        rootNode = findTextRoot(self);
        listenEvent(rootNode, "click", handleDocumentClick);
    }
    init();
};
