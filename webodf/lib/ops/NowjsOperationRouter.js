/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>

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

/*global runtime, ops, now */

/*
 * route operations in a networked collaborative manner.
 *
 * incoming operations (from controller) are sent to a server,
 * who will distribute them.
 *
 * incoming operations (from the server are played on the DOM.
 */

/**
 * @constructor
 */
ops.NowjsOperationRouter = function NowjsOperationRouter(sessionId, memberid) {
    "use strict";

    var self = this,
        net = runtime.getNetwork(),
        last_server_seq = -1, // first seq will be 0
        reorder_queue = {},
        sends_since_server_op = 0,
        router_sequence = 1000;

    function nextNonce() {
        runtime.assert(memberid !== null, "Router sequence N/A without memberid");
        router_sequence += 1;
        return "C:"+memberid+":"+router_sequence;
    }

    this.setOperationFactory = function (f) {
        self.op_factory = f;
    };

    this.setPlaybackFunction = function (playback_func) {
        self.playback_func = playback_func;
    };

    /**
    * @param {{server_seq: number}} opspec
    */
    function receiveOpFromNetwork(opspec) {
        // use factory to create an instance, and playback!
        var idx, seq, op = self.op_factory.create(opspec);
        runtime.log(" op in: "+runtime.toJson(opspec));
        if (op !== null) {
            seq = Number(opspec.server_seq);
            runtime.assert(!isNaN(seq), "server seq is not a number");
            if (seq === (last_server_seq + 1)) {
                self.playback_func(op);
                last_server_seq = seq;
                sends_since_server_op = 0;
                for (idx = (last_server_seq + 1);
                        reorder_queue.hasOwnProperty(idx);
                        idx += 1) {
                    self.playback_func(reorder_queue[idx]);
                    delete reorder_queue[idx];
                    runtime.log("op with server seq "+seq+" taken from hold (reordered)");
                }
            } else {
                // i'm not sure if now.js actually prevents receiving incorrectly ordered ops
                runtime.assert(seq !== (last_server_seq + 1), "received incorrect order from server");
                // but if now.js does not prevent it, we have code to re-order

                // re-order incoming ops from server (hold and un-hold)
                runtime.assert(!reorder_queue.hasOwnProperty(seq), "reorder_queue has incoming op");
                runtime.log("op with server seq "+seq+" put on hold");
                reorder_queue[seq] = op;
            }
        } else {
            runtime.log("ignoring invalid incoming opspec: " + opspec);
        }
    }
    net.ping = function (pong) {
        if (memberid !== null) {
            pong(memberid);
        }
    };
    net.receiveOp = function(op_session_id, opspec) {
        if (op_session_id === sessionId) {
            receiveOpFromNetwork(opspec);
        }
    };

    this.push = function (op) {
        // add client nonce and reference to server-side-op-sequence
        var opspec = op.spec();
        opspec.client_nonce = nextNonce();
        opspec.parent_op = last_server_seq+"+"+sends_since_server_op;
        sends_since_server_op += 1;

        runtime.log("op out: "+runtime.toJson(opspec));
        net.deliverOp(sessionId, opspec);
    };

    this.requestReplay = function (done_cb) {
        net.requestReplay(
            sessionId,
            function (opspec) {
                runtime.log("replaying: " + runtime.toJson(opspec));
                receiveOpFromNetwork(opspec);
            },
            function (count) {
                runtime.log("replay done (" + count + " ops).");
                if (done_cb) {
                    done_cb();
                }
            }
        );
    };

    function init() {
        var sessionJoinSuccess;

        net.memberid = memberid;

        sessionJoinSuccess = net.joinSession(sessionId, function(sessionJoinSuccess) {
            runtime.assert(sessionJoinSuccess, "Trying to join a session which does not exists or where we are already in");
        });
    }

    init();
};
