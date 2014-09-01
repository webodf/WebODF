/**
 * Copyright (C) 2014 KO GmbH <copyright@kogmbh.com>
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

/*global runtime, core*/

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
core.EventSubscriptionsTests = function EventSubscriptionsTests(runner) {
    "use strict";
    var r = runner,
        t;

    function createCallback(key) {
        t.calls[key] = 0;
        return function() {
            t.calls[key] += 1;
        };
    }

    this.setUp = function () {
        t = {
            subscriptions: new core.EventSubscriptions(),
            calls: {}
        };
    };

    this.tearDown = function () {
        t = {};
    };

    function addSubscription_RegistersNewDirectSubscription() {
        var source1 = new core.EventNotifier(["event1"]),
            source2 = new core.EventNotifier(["event2"]);
        t.subscriptions.addSubscription(source1, "event1", createCallback("event1"));
        t.subscriptions.addSubscription(source2, "event2", createCallback("event2"));

        source1.emit("event1", {});

        r.shouldBe(t, "t.calls.event1", "1");
        r.shouldBe(t, "t.calls.event2", "0");
    }

    function unsubscribeAll_CleansUpDirectSubscriptions() {
        var source1 = new core.EventNotifier(["event1"]),
            source2 = new core.EventNotifier(["event2"]);
        t.subscriptions.addSubscription(source1, "event1", createCallback("event1"));
        t.subscriptions.addSubscription(source2, "event2", createCallback("event2"));

        t.subscriptions.unsubscribeAll();

        source1.emit("event1", {});
        source2.emit("event2", {});

        r.shouldBe(t, "t.calls.event1", "0");
        r.shouldBe(t, "t.calls.event2", "0");
    }

    function addFrameSubscription_RegistersNewFrameSubscription() {
        var source1 = new core.EventNotifier(["event1"]),
            source2 = new core.EventNotifier(["event2"]);
        t.subscriptions.addFrameSubscription(source1, "event1", createCallback("event1"));
        t.subscriptions.addFrameSubscription(source2, "event2", createCallback("event2"));

        source1.emit("event1", {});
        source1.emit("event1", {});
        source1.emit("event1", {});

        core.Task.processTasks(); // Force redraw tasks to execute

        r.shouldBe(t, "t.calls.event1", "1");
        r.shouldBe(t, "t.calls.event2", "0");
    }

    function addFrameSubscription_DifferentControllersWithSameEventId_RegistersNewFrameSubscription() {
        var source1 = new core.EventNotifier(["event"]),
            source2 = new core.EventNotifier(["event"]);
        t.subscriptions.addFrameSubscription(source1, "event", createCallback("source1Event"));
        t.subscriptions.addFrameSubscription(source2, "event", createCallback("source2Event"));

        source1.emit("event", {});
        core.Task.processTasks(); // Force redraw tasks to execute

        r.shouldBe(t, "t.calls.source1Event", "1");
        r.shouldBe(t, "t.calls.source2Event", "0");

        source2.emit("event", {});
        core.Task.processTasks(); // Force redraw tasks to execute

        r.shouldBe(t, "t.calls.source1Event", "1");
        r.shouldBe(t, "t.calls.source2Event", "1");
    }

    function unsubscribeAll_CleansUpFrameSubscriptions() {
        var source1 = new core.EventNotifier(["event1"]),
            source2 = new core.EventNotifier(["event2"]);
        t.subscriptions.addFrameSubscription(source1, "event1", createCallback("event1"));
        t.subscriptions.addFrameSubscription(source2, "event2", createCallback("event2"));

        t.subscriptions.unsubscribeAll();

        source1.emit("event1", {});
        source2.emit("event2", {});

        r.shouldBe(t, "t.calls.event1", "0");
        r.shouldBe(t, "t.calls.event2", "0");
    }

    function destroy_UnsubscribesSignals() {
        var source1 = new core.EventNotifier(["event1"]),
            source2 = new core.EventNotifier(["event2"]);
        t.subscriptions.addSubscription(source1, "event1", createCallback("event1"));
        t.subscriptions.addFrameSubscription(source2, "event2", createCallback("event2"));

        t.subscriptions.destroy(function() {
            t.destroyCallbackCalled = true;
        });

        source1.emit("event1", {});
        source2.emit("event2", {});

        core.Task.processTasks(); // Force redraw tasks to execute
        r.shouldBe(t, "t.calls.event1", "0");
        r.shouldBe(t, "t.calls.event2", "0");
        r.shouldBe(t, "t.destroyCallbackCalled", "true");
    }

    this.tests = function () {
        return r.name([
            addSubscription_RegistersNewDirectSubscription,
            unsubscribeAll_CleansUpDirectSubscriptions,
            addFrameSubscription_RegistersNewFrameSubscription,
            addFrameSubscription_DifferentControllersWithSameEventId_RegistersNewFrameSubscription,
            unsubscribeAll_CleansUpFrameSubscriptions,
            destroy_UnsubscribesSignals
        ]);
    };

    this.asyncTests = function () {
        return [
        ];
    };
};
core.EventSubscriptionsTests.prototype.description = function () {
    "use strict";
    return "Test the EventSubscriptions class.";
};
