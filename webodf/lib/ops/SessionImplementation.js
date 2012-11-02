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
/*global runtime, core, gui, ops, odf*/
runtime.loadClass("ops.TrivialUserModel");
runtime.loadClass("ops.TrivialOperationRouter");
runtime.loadClass("ops.OperationFactory");
/**
 * An operation that can be performed on a document.
 * @constructor
 * @implements ops.Session
 * @param {!odf.OdfContainer} odfcontainer
 */
ops.SessionImplementation = function SessionImplementation(odfcontainer) {
    "use strict";
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
    /**
     * @param {!ops.Session} session
     */
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
        filter = new TextPositionFilter(),
        style2CSS = new odf.Style2CSS(),
        namespaces = style2CSS.namespaces,
        localMemberCursorStepCounter = null, ///< TEMPORARY, until cursors are split from avatars
        cursors = {},
        m_user_model = null,
        m_operation_router = null,
        m_event_listener = {};

    /* declare events */
    m_event_listener["avatar/added"] = [];
    m_event_listener["avatar/removed"] = [];
    m_event_listener["avatar/moved"] = [];

    /**
     * This function will iterate through positions allowed by the position
     * iterator and count only the text positions. When the amount defined by
     * offset has been counted, the Text node that that position is returned
     * as well as the offset in that text node.
     * @param {!number} position
     * @return {?{textNode: !Text, offset: !number}}
     */
    function getPositionInTextNode(position) {
        var iterator = gui.SelectionMover.createPositionIterator(rootNode),
            lastTextNode = null,
            node,
            nodeOffset = 0;
        position += 1; // add one because we check for position === 0
        // iterator should be at the start of rootNode
        if (filter.acceptPosition(iterator) === 1) {
            node = iterator.container();
            if (node.nodeType === 3) {
                lastTextNode = /**@type{!Text}*/(node);
                nodeOffset = 0;
            } else if (position === 0) {
                // create a new text node at the start of the paragraph
                lastTextNode = rootNode.ownerDocument.createTextNode('');
                node.insertBefore(lastTextNode, null);
                nodeOffset = 0;
            }
        }
        while (position > 0 || lastTextNode === null) {
            if (!iterator.nextPosition()) {
                // the desired position cannot be found
                return null;
            }
            if (filter.acceptPosition(iterator) === 1) {
                position -= 1;
                node = iterator.container();
                if (node.nodeType === 3) {
                    if (node !== lastTextNode) {
                        lastTextNode = /**@type{!Text}*/(node);
                        nodeOffset = 0;
                    } else {
                        nodeOffset += 1;
                    }
                } else if (lastTextNode !== null) {
                    if (position === 0) {
                        nodeOffset = lastTextNode.length;
                        break;
                    }
                    lastTextNode = null;
                } else if (position === 0) {
                    lastTextNode = node.ownerDocument.createTextNode('');
                    node.appendChild(lastTextNode);
                    nodeOffset = 0;
                    break;
                }
            }
        }
        if (lastTextNode === null) {
            return null;
        }
        // if the position is just after a cursor, then move in front of that
        // cursor
        while (nodeOffset === 0 && lastTextNode.previousSibling &&
                lastTextNode.previousSibling.localName === "cursor") {
            node = lastTextNode.previousSibling.previousSibling;
            while (node && node.nodeType !== 3) {
                node = node.previousSibling;
            }
            if (node === null) {
                node = rootNode.ownerDocument.createTextNode('');
                lastTextNode.parentNode.insertBefore(node,
                        lastTextNode.parentNode.firstChild);
            }
            lastTextNode = /**@type{!Text}*/(node);
            nodeOffset = lastTextNode.length;
        }
        return {textNode: lastTextNode, offset: nodeOffset };
    }

    function setUserModel (userModel) {
        m_user_model = userModel;
    }
    this.setUserModel = setUserModel;

    function setOperationRouter (opRouter) {
        m_operation_router = opRouter;
        opRouter.setPlaybackFunction(self.playOperation);
        opRouter.setOperationFactory(new ops.OperationFactory(self));
    }
    this.setOperationRouter = setOperationRouter;

    function getUserModel() {
        return m_user_model;
    }
    this.getUserModel = getUserModel;

    this.emit = function (eventid, args) {
        var i, subscribers;
        runtime.assert(m_event_listener.hasOwnProperty(eventid),
            "unknown event fired \""+eventid+"\"");
        subscribers = m_event_listener[eventid];
        runtime.log("firing event \""+eventid+"\" to "+subscribers.length+" subscribers.");
        for (i=0; i<subscribers.length; i+=1) {
            subscribers[i](args);
        }
    };
    this.subscribe = function(eventid, cb) {
        runtime.assert(m_event_listener.hasOwnProperty(eventid),
            "tried to subscribe to unknown event \""+eventid+"\"");
        m_event_listener[eventid].push(cb);
        runtime.log("event \""+eventid+"\" subscribed.");
    };

    /* SESSION OPERATIONS */

    // controller sends operations to this method
    this.enqueue = function(operation) {
        m_operation_router.push(operation);
    };

    this.playOperation = function(op) {
        op.execute(rootNode);
    };

    /**
     * This function calculates the steps in ODF world between the cursor of the member and the given position in the DOM.
     * @param {!string} memberid
     * @param {!Node} node
     * @param {!number} offset
     * @return {!number}
     */
    this.getDistanceFromCursor = function(memberid, node, offset) {
        var counter,
            steps = 0;
        // TEMPORARY solution until cursors are split from avatars, so currently only works for local user
        if (localMemberCursorStepCounter) {
            counter = localMemberCursorStepCounter.countStepsToPosition;
            steps = counter(node, offset, filter);
        }
        return steps;
    };

    /**
     * This function returns the position in ODF world of the cursor of the member.
     * @param {!string} memberid
     * @return {!number}
     */
    this.getCursorPosition = function(memberid) {
        return -self.getDistanceFromCursor(memberid, rootNode, 0);
    };

    /**
     * This function will return the Text node as well as the offset in that text node
     * of the cursor.
     * @param {!string} memberid
     * @return {?{textNode: !Text, offset: !number}}
     */
    this.getPositionInTextNode = getPositionInTextNode;

    /**
     * @param {!string} memberid
     * @param {!number} position
     * @param {!string} text
     * @return {!boolean}
     */
    this.insertText = function (memberid, position, text) {
        var domPosition;
        domPosition = getPositionInTextNode(position);
runtime.log(domPosition + " -- " + text + " " + position);
        if (domPosition) {
            domPosition.textNode.insertData(domPosition.offset, text);
            return true;
        }
        return false;
    };
    /**
     * @param {!string} memberid
     * @param {!number} position
     * @param {!number} length
     * @return {!boolean}
     */
    this.removeText = function (memberid, position, length) {
        var domPosition;
        domPosition = getPositionInTextNode(position);
runtime.log("Vaporizing text:" + domPosition + " -- " + position + " " + length);
        if (domPosition) {
            domPosition.textNode.deleteData(domPosition.offset, length);
            return true;
        }
        return false;
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
     * @return {!core.PositionFilter}
     */
    this.getFilter = function () {
        return filter;
    };
    /**
     * @return {!Node}
     */
    this.getRootNode = function () {
        return rootNode;
    };
    /**
    * @param {!string} memberid
    * @return {core.Cursor}
    */
    this.getCursor = function (memberid) {
        return cursors[memberid];
    };
    /**
    * @param {!core.Cursor} cursor
    */
    this.addCursor = function (cursor) {
        cursors[cursor.getMemberId()] = cursor;
    };
    /**
    * @param {!string} memberid
    */
    this.removeCursor = function (memberid) {
        delete cursors[memberid];
    };

    /// TEMPORARY, until cursor is split out of avatars
    this.setLocalMemberCursorStepCounter = function (stepCounter) {
        localMemberCursorStepCounter = stepCounter;
    };
    /**
     * @return {undefined}
     */
    function init() {
        setUserModel(new ops.TrivialUserModel());
        setOperationRouter(new ops.TrivialOperationRouter());
        rootNode = findTextRoot(self);
    }
    init();
};
// vim:expandtab
