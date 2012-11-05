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
ops.NowjsUserModel = function NowjsUserModel (loaded_cb) {
    "use strict";

    var users = {},
        colorIndex = 0,
        colors,
        net = runtime.getNetwork();

    colors = [
        "blue",
        "red",
        "green",
        "yellow",
        "brown"
    ];

    function selectColor() {
        var color = colors[colorIndex];
 
        colorIndex += 1;
        if (colorIndex >= colors.length) {
            colorIndex = 0;
        }
        return color;
    }

    // use this method to add new users as they join the session
    function addUser(memberId, fullName, imageUrl) {
        users[memberId] = {
            memberid:memberId,
            fullname:fullName,
            imageurl: imageUrl,
            color: selectColor()
        };
    }

    this.getUserDetails = function (memberid) {
        // remove tje ___ split.
        // and perhaps create a default "Unknown" user details set if userid is not present
        var userid = memberid.split("___")[0];
        return users[userid];
    };

    // add our current friends for now
    addUser("you", "I, Robot", "avatar-joe.png");
    addUser("alice", "Alice Bee", "avatar-flower.png");
    addUser("bob", "Bob Pigeon", "avatar-pigeon.png");

    runtime.assert(net.networkStatus === "ready", "network not ready");
    // query server for user data
    // TODO we should start considering security at some point
    net.getAllKnownUserData(function(udata) {
        addUser(udata.uid, udata.fullname,
            "http://bogus/src=avatar/"+udata.uid+"/avatar.png");
        runtime.log("user ["+udata.uid+"] added.");
    }, function done(count) {
        runtime.log("done with fetching all ("+count+") user data...");
        if (loaded_cb) {
            loaded_cb();
        }
    });
    runtime.log("NowjsUserModel created. User-data requested.");
};
