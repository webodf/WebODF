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
 * @source: http://gitorious.org/webodf/webodf/
 */
/*global runtime, core, gui, ops, odf, window*/
runtime.loadClass("gui.Avatar");
runtime.loadClass("gui.SelectionManager");
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
        var /**@const*/accept = core.PositionFilter.FilterResult.FILTER_ACCEPT,
            /**@const*/reject = core.PositionFilter.FilterResult.FILTER_REJECT;
        /**
         * @param {!core.PositionIterator} iterator
         * @return {core.PositionFilter.FilterResult}
         */
        this.acceptPosition = function (iterator) {
            var n = iterator.container(), p, o, d;
            // only stop in text nodes or at end of <p>, <h> o <span/>
            if (n.nodeType !== 3) {
                if (n.localName !== "p" && n.localName !== "h" && n.localName !== "span") {
                    return reject;
                }
                return accept;
            }
            if (n.length === 0) {
                return reject;
            }
            // only stop in text nodes in 'p', 'h' or 'span' elements
            p = n.parentNode;
            o = p && p.localName;
            if (o !== "p" && o !== "span" && o !== "h") {
                return reject;
            }
            // do not stop between spaces
            o = iterator.textOffset();
            if (o > 0 && iterator.substr(o - 1, 2) === "  ") {
                return reject;
            }
            return accept;
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
    /**
     * Find the position of the avatar in the text.
     * The position contains the paragraph number (starting from 0 and
     * including text:p and text:h and the offset.
     * @param {!gui.Avatar} avatar
     * @return {{paragraph: !number, offset: !number}}
     */
    function getAvatarPosition(avatar) {
        var paragraph = 0,
            offset = 0;
        return { paragraph: paragraph, offset: offset };
    }
    var self = this,
        localMemberid = 'Bob', // TODO: get from somewhere, and perhaps store/keep somewhere else?
        rootNode,
        selectionManager,
        members = {},
        filter = new TextPositionFilter(),
        style2CSS = new odf.Style2CSS(),
        namespaces = style2CSS.namespaces,
        activeAvatar = null,
        guiAvatarFactory = null,
        m_event_listener = {},
        m_incoming_ops = [],
        m_ready_ops = [];
    /**
     * This function will iterate through positions allowed by the position
     * iterator and count only the text positions. When the amount defined by
     * offset has been counted, the Text node that that position is returned
     * as well as the offset in that text node.
     * @param {!Element} paragraph
     * @param {!number} offset
     * @return {?{textNode: !Text, offset: !number}}
     */
    function getPositionInTextNode(paragraph, offset) {
        var iterator = gui.SelectionMover.createPositionIterator(rootNode),
            lastTextNode = null,
            node,
            nodeOffset = 0;
        iterator.setPosition(paragraph, 0);
        node = iterator.container();
        if (node.nodeType === 3) {
            lastTextNode = /**@type{!Text}*/(node);
            nodeOffset = 0;
        } else if (offset === 0) {
            // create a new text node at the start of the paragraph
            lastTextNode = paragraph.ownerDocument.createTextNode('');
            node.insertBefore(lastTextNode, null);
            nodeOffset = 0;
        }
        while (offset > 0 || lastTextNode === null) {
            if (!iterator.nextPosition()) {
                // the desired position cannot be found
                return null;
            }
            node = iterator.container();
            if (node.nodeType === 3) {
                offset -= 1;
                if (node !== lastTextNode) {
                    lastTextNode = /**@type{!Text}*/(node);
                    nodeOffset = 0;
                } else {
                    nodeOffset += 1;
                }
            } else if (lastTextNode !== null) {
                offset -= 1;
                if (offset === 0) {
                    nodeOffset = lastTextNode.length;
                    break;
                }
                lastTextNode = null;
            }
        }
        if (lastTextNode === null) {
            return null;
        }
        return {textNode: lastTextNode, offset: nodeOffset };
    }
    /**
     * @param {!number} paragraph
     * @return {?Element}
     */
    function findParagraph(paragraph) {
        function acceptNode(node) {
            if ((node.localName !== "p" && node.localName !== "h")
                    || node.namespaceURI !== namespaces.text) {
                return 3; // skip, but inspect children
            }
            return 1; // accept
        }
        var walker,
            count = 0,
            node;
        acceptNode.acceptNode = acceptNode;
        // create a walker that just shows elements
        walker = rootNode.ownerDocument.createTreeWalker(rootNode,
                0x00000001, acceptNode, false);
        node = walker.nextNode();
        while (node !== null) {
            if (count === paragraph) {
                return node;
            }
            count += 1;
        }
        return null;
    }

    this.emit = function (eventid, args) {
        var i;
        runtime.assert(m_event_listener.hasOwnProperty(eventid),
            "unknown event fired");
        for (i=0; i<m_event_listener.length; i+=1) {
            m_event_listener[eventid][i](args);
        }
    };
    this.subscribe = function(eventid, cb) {
        runtime.assert(m_event_listener.hasOwnProperty(eventid),
            "tried to subscribe to unknown event");
        m_event_listener[eventid].push(cb);
    };

    /* SESSION OPERATIONS */

    // controller sends operations to this method
    this.enqueue = function(operation) {
        m_incoming_ops.push(operation);
        this.handleOperation();
    };

    /* reference implementation is the trivial implementation
     * immediately replaying the operation onto the DOM
     */
    this.handleOperation = function() {
        var op;

        // get next operation from queue
        op = m_incoming_ops.shift();

        // immediately enqueue the operation for playing it on the DOM
        m_ready_ops.push(op);

        // and execute the operation
        this.playOperation();
    };

    this.playOperation = function() {
        var op;
        op = m_ready_ops.shift();
        op.execute(rootNode);
    };

    // this is an operation. the user decided that
    // he wants to take part in the editing session,
    // and wants to change its state from observer to
    // editor. the operation will insert an avatar in
    // the document, which is also broadcasted to the
    // other session members.
    this.addEditingAvatar = function () {
       self.addMemberToSession(localMemberid);
    };

    // TODO: this needs to move to the upcoming view class
    this.setGuiAvatarFactory = function(factory) {
       guiAvatarFactory = factory;
    };

    this.getLocalMemberid = function() {
        return localMemberid;
    };
    /**
     * @param {!string} memberid
     * @return {!boolean}
     */
    this.addMemberToSession = function (memberid) {
        var selectionMover = selectionManager.createSelectionMover(),
            avatar = guiAvatarFactory(memberid, self);

        activeAvatar = activeAvatar || avatar;
        members[memberid] = avatar;
        return true;
    };
    /**
     * @param {!string} memberid
     * @return {!boolean}
     */
    this.removeMemberFromSession = function (memberid) {
        var avatar = members[memberid];
        avatar.removeFromSession();
        delete members[memberid];
        return true;
    };
    /**
     * @param {!string} memberid
     * @param {!number} number
     * @return {!boolean}
     */
    this.moveMemberCaret = function (memberid, number) {
        var avatar = members[memberid],
            moveEvent;
        avatar.getCaret().move(number);

        this.emit("avatar/moved", {
            detail: {
                avatar: avatar
            }
        });

        rootNode.ownerDocument.dispatchEvent(moveEvent);

        return true;
    };
    /**
     * @param {!number} paragraph
     * @param {!number} position
     * @param {!string} text
     * @return {!boolean}
     */
    this.insertText = function (paragraph, position, text) {
        var p = findParagraph(paragraph),
            pos = p && getPositionInTextNode(p, position);
        if (!pos) {
            return false;
        }
        pos.textNode.insertData(pos.offset, text);
        return true;
    };
    /**
     * @param {!number} paragraph
     * @param {!number} position
     * @param {!string} text
     * @return {!boolean}
     */
    this.removeText = function (paragraph, position, text) {
        return true;
    };
    /**
     * @param {!number} position
     * @return {!boolean}
     */
    this.insertParagraph = function (position) {
        return true;
    };
    /**
     * @param {!number} position
     * @return {!boolean}
     */
    this.removeParagraph = function (position) {
        return true;
    };
    /* RELAYING OF SESSION OPERATIONS */
    this.addSessionListener = function (session) {
    };

    /* SESSION INTROSPECTION */

    /**
     * @return {!odf.OdfContainer}
     */
    this.getOdfContainer = function () {
        return odfcontainer;
    };
    /**
     * @return {!gui.SelectionManager}
     */
    this.getSelectionManager = function () {
        return selectionManager;
    };
    /**
     * @return {!core.PositionFilter}
     */
    this.getFilter = function () {
        return filter;
    };
    /**
     * @param {!string} memberid
     * @return {gui.Avatar}
     */
    this.getAvatar = function (memberid) {
        return members[memberid];
    };
    /**
     * @param {!string} memberid
     * @return {!boolean}
     */
    this.setActiveAvatar = function (memberid) {
        var avatarActivated;
        if (members.hasOwnProperty(memberid)) {
            activeAvatar = members[memberid];
            activeAvatar.getCaret().focus();

            avatarActivated = new window.CustomEvent("avatarActivated", {
                detail: {
                    avatar: activeAvatar
                }
            });

            rootNode.ownerDocument.dispatchEvent(avatarActivated);
            return true;
        }
        return false;
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
    /**
     * @return {?gui.Avatar}
     */
    this.getActiveAvatar = function() {
        return activeAvatar;
    };
    /**
     * @param {!Event} e
     * @return {undefined}
     */
    function handleDocumentClick(e) {
        var avatar = self.getActiveAvatar(),
            caret,
            counter,
            steps,
            selection,
            member;

        if (!avatar) {
            return;
        }
        caret = avatar.getCaret();
        counter = caret.getStepCounter().countStepsToPosition;
        selection = window.getSelection();
        steps = counter(selection.focusNode, selection.focusOffset, filter);
        self.moveMemberCaret(avatar.getMemberId(), steps);
        caret.focus();
        //runtime.log(steps);
        //runtime.log(e.target.getBoundingClientRect());
    }
    /**
     * @return {undefined}
     */
    function init() {
        rootNode = findTextRoot(self);
        selectionManager = new gui.SelectionManager(rootNode);
        listenEvent(rootNode, "click", handleDocumentClick);
    }
    init();
};
// vim:expandtab
