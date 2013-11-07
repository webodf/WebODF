/**
 * @license
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global runtime, ops*/

define("webodf/editor/server/pullbox/MemberModel", [], function () {
    "use strict";

    /**
     * @constructor
     * @implements ops.MemberModel
     */
    return function PullBoxMemberModel(sessionId, server) {

        var cachedMemberData = {},
            memberDataSubscribers = {},
            isServerPullingActivated = false,
            isServerPullingOpen = true,
            serverPullingTimeoutId = null,
            isInstantPullingRequested = false,
            isPulling = false,
            /**@const*/pullingIntervall = 20000;


        /**
         * @param {!Object} memberData
         */
        function cacheMemberDatum(memberData) {
            var subscribers,
                i;

            // notify all subscribers who are interested in this data
            subscribers = memberDataSubscribers[memberData.memberid];
            if (subscribers) {
                // cache
                cachedMemberData[memberData.memberid] = memberData;

                for (i = 0; i < subscribers.length; i += 1) {
                    subscribers[i](memberData.memberid, memberData);
                }
            }
        }

        function pullMemberData() {
            var i,
                memberIds = Object.keys(memberDataSubscribers);

            if (!isServerPullingOpen || isPulling) {
                return;
            }

            // no more timeout  or instant pull request in any case
            serverPullingTimeoutId = null;
            isInstantPullingRequested = false;
            // set lock
            isPulling = true;

            runtime.log("member-list request for : " + memberIds.join(","));

            server.call({
                command: 'query_memberdata_list',
                args: {
                    es_id: sessionId,
                    member_ids: memberIds
                }
            }, function(responseData) {
                var response = /**@type {{memberdata_list:Array.<{uid,member_id,display_name,avatar_url,color}>}}*/(runtime.fromJson(responseData)),
                    memberDataList,
                    newMemberData, oldMemberData;

                // unlock
                isPulling = false;

                // meanwhile closed/disactivated?
                if (!isServerPullingOpen || !isServerPullingActivated) {
                    return;
                }

                runtime.log("member-list reply: " + responseData);

                if (response.hasOwnProperty("memberdata_list")) {

                    // add/update with all delivered memberdata
                    memberDataList = response.memberdata_list;
                    for (i = 0; i < memberDataList.length; i+=1) {
                        newMemberData = {
                            memberid: memberDataList[i].member_id,
                            fullname: memberDataList[i].display_name,
                            imageurl: memberDataList[i].avatar_url,
                            color:    memberDataList[i].color
                        };

                        oldMemberData = cachedMemberData.hasOwnProperty(newMemberData.memberid) ? cachedMemberData[newMemberData.memberid] : null;
                        if (!oldMemberData ||
                            oldMemberData.fullname !== newMemberData.fullname ||
                            oldMemberData.imageurl !== newMemberData.imageurl ||
                            oldMemberData.color !== newMemberData.color) {
                            cacheMemberDatum(newMemberData);
                        }
                    }
                } else {
                    runtime.log("Meh, memberdata list broken: " + responseData);
                }

                // trigger the next pulling
                if (isInstantPullingRequested) {
                    pullMemberData();
                } else {
                    serverPullingTimeoutId = runtime.setTimeout(pullMemberData, pullingIntervall);
                }
            });
        }

        /**
         * Activates the pulling
         * @return {undefined}
         */
        function pullNewMemberData() {
            // cancel any running pulling timeout
            if (serverPullingTimeoutId !== null) {
                runtime.clearTimeout(serverPullingTimeoutId);
            }

            isInstantPullingRequested = true;
            isServerPullingActivated = true;

            pullMemberData();
        }

        /**
         * Deactivates the pulling if there are no more subscribers
         * @return {undefined}
         */
        function deactivatePeriodicMemberDataPulling() {
            var key;

            if (!isServerPullingActivated) {
                return;
            }

            // check if there is no more subscription
            for(key in memberDataSubscribers) {
                if (memberDataSubscribers.hasOwnProperty(key)) {
                    // still subscribers, cannot deactivate yet
                    return;
                }
            }

            isServerPullingActivated = false;
            // cancel any running pulling timeout
            if (serverPullingTimeoutId !== null) {
                runtime.clearTimeout(serverPullingTimeoutId);
            }
        }

        /**
         * callback is called as soon as the memberdata is available and after that
         * on every memberdata update.
         * a parameter `null` passed to the callback means that the member is finally
         * not known.
         *
         * @param {!string} memberId
         * @param {!function(!string, ?Object)} subscriber
         * @return {undefined}
         */
        this.getMemberDetailsAndUpdates = function (memberId, subscriber) {
            var /**@type{Object}*/
                memberData = cachedMemberData[memberId],
                subscribers = memberDataSubscribers[memberId] || [],
                i;
            memberDataSubscribers[memberId] = subscribers;

            runtime.assert(subscriber !== undefined, "missing callback");

            // detect double subscription
            for (i=0; i<subscribers.length; i+=1) {
                if (subscribers[i] === subscriber) {
                    break;
                }
            }
            if (i < subscribers.length) {
                // already subscribed
                runtime.log("double subscription request for "+memberId+" in PullBoxMemberModel::getMemberDetailsAndUpdates");
            } else {
                // subscribe
                subscribers.push(subscriber);
                // query data from server, if not done yet
                if (subscribers.length === 1) {
                    // TODO: only fetch data for memberId here
                    pullNewMemberData();
                }
            }

            if (memberData) {
                // data available from cache
                subscriber(memberId, memberData);
            } else {
                // pass temporary data
                subscriber(memberId, {
                    memberid: memberId,
                    fullname: "Unknown",
                    color:    "black",
                    imageurl: ""
                });
            }
        };

        /**
         * getMemberDetailsAndUpdates subscribes a callback for updates on member details.
         * this function undoes this subscription.
         *
         * @param {!string} memberId
         * @param {!function(!string, ?Object)} subscriber
         * @return {undefined}
         */
        this.unsubscribeMemberDetailsUpdates = function (memberId, subscriber) {
            var i,
                subscribers = memberDataSubscribers[memberId];

            runtime.assert(subscriber!==undefined, "missing subscriber parameter or null");
            runtime.assert(subscribers,
                "tried to unsubscribe when no one is subscribed ('" + memberId + "')");
            if (subscribers) {
                for (i=0; i<subscribers.length; i+=1) {
                    if (subscribers[i] === subscriber) {
                        break;
                    }
                }

                runtime.assert((i < subscribers.length),
                            "tried to unsubscribe when not subscribed for memberId '" + memberId + "'");

                subscribers.splice(i,1);

                // clean up
                if (subscribers.length === 0) {
                    runtime.log("no more subscribers for: "+memberId);
                    delete memberDataSubscribers[memberId];
                    delete cachedMemberData[memberId];
                    deactivatePeriodicMemberDataPulling();
                }
            }
        };


        /**
         * Requests a gracefull shutdown of the Member Model
         * No more network activity is necessary.
         */
        this.close = function (cb) {
            isServerPullingOpen = false;
            cb();
        };

        runtime.assert(server.networkStatus() === "ready", "network not ready");
    };
});
