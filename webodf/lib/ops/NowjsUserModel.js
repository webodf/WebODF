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

/*global ops, runtime */

/*
 * this thing might feel a bit more at home in a namespaces
 * called "collab" or "users" or "editing" than here in "ops".
 */

/**
 * @constructor
 * @implements ops.UserModel
 */
ops.NowjsUserModel = function NowjsUserModel() {
    "use strict";

    var cachedUserData = {},
        memberDataSubscribers = {},
        net = runtime.getNetwork();


    function userIdFromMemberId(memberId) {
        return memberId.split("___")[0];
    }

    // use this method to cache
    function cacheUserDatum(userId, fullName, imageUrl, color) {
        var subscribers,
            i,
            userData = {
                userid:   userId,
                fullname: fullName,
                imageurl: imageUrl,
                color:    color
            };

        // cache
        cachedUserData[userId] = userData;

        // notify all subscribers who are interested in this data
        subscribers = memberDataSubscribers[userId];
        if (subscribers) {
            for (i = 0; i < subscribers.length; i += 1) {
                subscribers[i].subscriber(subscribers[i].memberId, userData);
            }
        }
        runtime.log("data for user [" + userId + "] cached.");
    }


    this.getUserDetails = function (memberId, subscriber) {
        // remove tje ___ split.
        // and perhaps create a default "Unknown" user details set if userid is not present
        var userId = userIdFromMemberId(memberId),
            userData = cachedUserData[userId],
            subscribers;

        if (subscriber) {
            subscribers = memberDataSubscribers[userId];

            if (subscribers) {
                subscribers.push({memberId: memberId, subscriber: subscriber});
            } else {
                memberDataSubscribers[userId] = [ {memberId: memberId, subscriber: subscriber} ];
            }
        }

        if (userData === undefined) {
            userData = {
                userid:   userId,
                fullname: "Unknown",
                imageurl: "/user/" + userId + "/avatar.png",
                color:    "#787878"
            };
            // query data from server
            // TODO we should start considering security at some point
            net.getUserData(userId, function (udata) {
                cacheUserDatum(
                    udata.uid,
                    udata.fullname,
                    "/user/" + udata.uid + "/avatar.png",
                    udata.color
                );
            });
        }

        return userData;
    };

    this.unsubscribeForUserDetails = function (memberId, subscriber) {
        var i,
            userId = userIdFromMemberId(memberId),
            subscribers = memberDataSubscribers[userId];

        if (subscribers) {
            for (i=0; i<subscribers.length; i+=1) {
                if (subscribers[i].subscriber === subscriber) {
                    break;
                }
            }

            runtime.assert((i < subscribers.length),
                           "tried to unsubscribe when not subscribed for memberId '" + memberId + "'");

            subscribers.splice(i,1);
        }
    };

    runtime.assert(net.networkStatus === "ready", "network not ready");
};
