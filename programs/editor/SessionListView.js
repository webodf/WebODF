/**
 * @license
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
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

/*global Node, define, runtime */

define("webodf/editor/SessionListView", [], function () {
    "use strict";

    return function SessionListView(sessionList, sessionListDiv, cb) {
        var self = this,
            memberDataChangedHandler;

        function createSessionDescription(sessionDetails) {
            return sessionDetails.title + " ("+sessionDetails.cursors.length+" members)";
        }

        /**
         */
        function createSessionViewItem(sessionDetails) {
            runtime.assert(sessionListDiv, "sessionListDiv unavailable");
            var doc = sessionListDiv.ownerDocument,
                htmlns = doc.documentElement.namespaceURI,
                sessionDiv = doc.createElementNS(htmlns, "div"),
                fullnameTextNode = doc.createTextNode(createSessionDescription(sessionDetails));

            sessionDiv.appendChild(fullnameTextNode);
            sessionDiv.sessionId = sessionDetails.id; // TODO: namespace?
            sessionDiv.style.cursor = "pointer"; // TODO: do not set on each element, use CSS
            sessionDiv.onclick = function () {
                cb(sessionDetails.id);
            };

            sessionListDiv.appendChild(sessionDiv);
        }

        function updateSessionViewItem(sessionDetails) {
            var node = sessionListDiv.firstChild;
            while (node) {
                if (node.sessionId === sessionDetails.id) {
                    node = node.firstChild;
                    while (node) {
                        if (node.nodeType == Node.TEXT_NODE) {
                            node.data = createSessionDescription(sessionDetails);
                        }
                        node = node.nextSibling;
                    }
                    return;
                }
                node = node.nextSibling;
            }
        }

        /**
         * @param {!string} sessionId
         */
        function removeSessionViewItem(sessionId) {
            var node = sessionListDiv.firstChild;
            while (node) {
                if (node.sessionId === sessionId) {
                    sessionListDiv.removeChild(node);
                    return;
                }
                node = node.nextSibling;
            }
        }

        function init() {
            var idx,
                subscriber = {onCreated: createSessionViewItem, onUpdated: updateSessionViewItem, onRemoved: removeSessionViewItem},
                sessions = sessionList.getSessions(subscriber);

            // fill session list
            for (idx = 0; idx < sessions.length; idx += 1) {
                createSessionViewItem(sessions[idx]);
            }
        }

        init();
    };
});
