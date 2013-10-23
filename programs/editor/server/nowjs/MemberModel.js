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

/*global ops, runtime */

define("webodf/editor/server/nowjs/MemberModel", [], function () {
    "use strict";

    /**
     * @constructor
     * @implements ops.MemberModel
     */
    return function NowjsMemberModel(server) {

        var cachedUserData = {},
            memberDataSubscribers = {},
            nowObject = server.getNowObject();


        /**
        * @param {!string} memberId
        * @return {!string}
        */
        function userIdFromMemberId(memberId) {
            return memberId.split("___")[0];
        }

        /**
        * @param {!string} userId
        * @param {?Object} userData
        */
        function cacheUserDatum(userId, userData) {
            var subscribers,
                i;

            // notify all subscribers who are interested in this data
            subscribers = memberDataSubscribers[userId];
            if (subscribers) {
                // cache
                cachedUserData[userId] = userData;

                for (i = 0; i < subscribers.length; i += 1) {
                    subscribers[i].subscriber(subscribers[i].memberId, userData);
                }
            }
        }

        /**
        * callback is called as soon as the userdata is available and after that
        * on every userdata update.
        * a parameter `null` passed to the callback means that the user is finally
        * not known.
        *
        * @param {!string} memberId
        * @param {!function(!string, ?Object)} subscriber
        * @return {undefined}
        */
        this.getMemberDetailsAndUpdates = function (memberId, subscriber) {
            // TODO: remove the ___ split.
            // FIXME: caching data by userid seems to be incorrect:
            // a user can have multiple members in a document,
            // data should be per member (e.g.: current network lag, current
            // description of what the member is changing, even the avatar
            // image might be member-specific (home vs. work); this reminds
            // me of XMPP resources).
            // member-details should probably start with some values received
            // from the user. also the subscriptions here should be per
            // avatar and thus per member (and in fact the handling of the
            // callback is per memberId already)
            // fixing that should happen in a later commit to reduce change-
            // complexity.
            var userId = userIdFromMemberId(memberId),
                /**@type{Object}*/
                userData = cachedUserData[userId],
                subscribers = memberDataSubscribers[userId] || [],
                i;
            memberDataSubscribers[userId] = subscribers;

            runtime.assert(subscriber !== undefined, "missing callback");

            // detect double subscription
            for (i=0; i<subscribers.length; i+=1) {
                if ((subscribers[i].subscriber === subscriber) &&
                    (subscribers[i].memberId === memberId)) {
                    break;
                }
            }
            if (i < subscribers.length) {
                // already subscribed
                runtime.log("double subscription request for "+memberId+" in MemberModel::getMemberDetailsAndUpdates");
            } else {
                // subscribe
                subscribers.push({memberId: memberId, subscriber: subscriber});
                // query data from server, if not done yet
                if (subscribers.length === 1) {
                    // TODO we should start considering security at some point
                    nowObject.subscribeUserDetailsUpdates(userId);
                }
            }

            if (userData) {
                // data available from cache
                subscriber(memberId, userData);
            } else {
                // pass temporary data
                subscriber(memberId, {
                    memberid: memberId,
                    fullname: "Unknown",
                    color:    "black",
                    imageurl: "avatar-joe.png"
                });
            }
        };

        /**
        * getMemberDetailsAndUpdates subscribes a callback for updates on user details.
        * this function undoes this subscription.
        *
        * @param {!string} memberId
        * @param {!function(!string, ?Object)} subscriber
        * @return {undefined}
        */
        this.unsubscribeMemberDetailsUpdates = function (memberId, subscriber) {
            var i,
                userId = userIdFromMemberId(memberId),
                subscribers = memberDataSubscribers[userId];

            runtime.assert(subscriber!==undefined, "missing subscriber parameter or null");
            runtime.assert(subscribers,
                "tried to unsubscribe when no one is subscribed ('" + memberId + "')");
            if (subscribers) {
                for (i=0; i<subscribers.length; i+=1) {
                    if ((subscribers[i].subscriber === subscriber) &&
                        (subscribers[i].memberId === memberId)) {
                        break;
                    }
                }

                runtime.assert((i < subscribers.length),
                            "tried to unsubscribe when not subscribed for memberId '" + memberId + "'");

                subscribers.splice(i,1);

                // clean up
                if (subscribers.length === 0) {
                    runtime.log("no more subscribers for: "+memberId);
                    delete memberDataSubscribers[userId];
                    delete cachedUserData[userId];
                    nowObject.unsubscribeUserDetailsUpdates(userId);
                }
            }
        };

    /*jslint emptyblock: true*/
        this.close = function (cb) {
            // TODO: stop timers...
            // (or in other words: implement this thing...)
            cb();
        };
    /*jslint emptyblock: false*/

        nowObject.updateUserDetails = function (userId, udata) {
            // this will call all subscribers
            cacheUserDatum(userId, udata?{
                userid:   udata.uid,
                fullname: udata.fullname,
                imageurl: "/user/" + udata.avatarId + "/avatar.png",
                color:    udata.color
            }:null);
        };

        runtime.assert(nowObject.networkStatus === "ready", "network not ready");
    };
});
