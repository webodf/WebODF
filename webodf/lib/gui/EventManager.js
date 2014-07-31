/**
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

/*global runtime, gui, core, Node */

/**
 * Event wiring and management abstraction layer
 * This class contains workarounds for various behaviour issues with events cross-browser. Additionally, this
 * class provides a mechanism for returning event focus back to the SessionController when it has been lost to
 * an external source.
 * @constructor
 * @implements {core.Destroyable}
 * @param {!ops.OdtDocument} odtDocument
 */
gui.EventManager = function EventManager(odtDocument) {
    "use strict";
    var window = /**@type{!Window}*/(runtime.getWindow()),
        /**@type{!Object.<string,boolean>}*/
        bindToDirectHandler = {
            // In Safari 6.0.5 (7536.30.1), Using either attachEvent or addEventListener
            // results in the beforecut return value being ignored which prevents cut from being called.
            "beforecut": true,
            // Epiphany 3.6.1 requires this to allow the paste event to fire
            "beforepaste": true,
            // Capture long-press events inside the canvas
            "longpress": true,
            // Capture compound drag events inside the canvas
            "drag": true,
            // Capture compound dragstop events inside the canvas
            "dragstop": true
        },
        // Events that should be bound to the global window rather than the canvas element
        bindToWindow = {
            // Capture selections that start outside the canvas element and end within the canvas element
            "mousedown": true,
            // Capture selections that start inside the canvas element and end outside of the element or even window
            "mouseup": true,
            // Focus is a non-bubbling event, and we'll usually pass focus to the event trap
            "focus": true
        },
       /**@type{!Object.<string,!CompoundEvent>}*/
        compoundEvents = {},
       /**@type{!Object.<string,!EventDelegate>}*/
        eventDelegates = {},
        /**@type{!HTMLInputElement}*/
        eventTrap,
        canvasElement = /**@type{!HTMLElement}*/(odtDocument.getCanvas().getElement()),
        eventManager = this,
        /**@type{!Object.<!number, !boolean>}*/
        longPressTimers = {},
        /**@const*/LONGPRESS_DURATION = 400; // milliseconds

    /**
     * Ensures events that may bubble through multiple sources are only handled once.
     * @constructor
     * @param {!string} eventName Event this delegate is to listen for
     */
    function EventDelegate(eventName) {
        var self = this,
            recentEvents = [],
            subscribers = new core.EventNotifier([eventName]);

        /**
         * @param {!Element|!Window} eventTarget
         * @param {!string} eventType
         * @param {function(!Event)|function()} eventHandler
         * @return {undefined}
         */
        function listenEvent(eventTarget, eventType, eventHandler) {
            var onVariant,
                bound = false;

            onVariant = "on" + eventType;
            if (eventTarget.attachEvent) {
                // attachEvent is only supported in Internet Explorer < 11
                eventTarget.attachEvent(onVariant, eventHandler);
                bound = true; // assume it was bound, missing @return in externs.js
            }
            if (!bound && eventTarget.addEventListener) {
                eventTarget.addEventListener(eventType, eventHandler, false);
                bound = true;
            }

            if ((!bound || bindToDirectHandler[eventType]) && eventTarget.hasOwnProperty(onVariant)) {
                eventTarget[onVariant] = eventHandler;
            }
        }

        /**
         * @param {!Element|!Window} eventTarget
         * @param {!string} eventType
         * @param {function(!Event)|function()} eventHandler
         * @return {undefined}
         */
        function removeEvent(eventTarget, eventType, eventHandler) {
            var onVariant = "on" + eventType;
            if (/**@type{!Element}*/(eventTarget).detachEvent) {
                // detachEvent is only supported in Internet Explorer < 11
                /**@type{!Element}*/(eventTarget).detachEvent(onVariant, eventHandler);
            }
            if (eventTarget.removeEventListener) {
                eventTarget.removeEventListener(eventType, eventHandler, false);
            }
            if (eventTarget[onVariant] === eventHandler) {
                eventTarget[onVariant] = null;
            }
        }

        /**
         * @param {!Event} e
         * @return {undefined}
         */
        function handleEvent(e) {
            if (recentEvents.indexOf(e) === -1) {
                recentEvents.push(e); // Track this event as already processed by these handlers
                if (self.filters.every(function (filter) { return filter(e); })) {
                    // Yes yes... this is not a spec-compliant event processor... sorry!
                    try {
                        subscribers.emit(eventName, e);
                    } catch(/**@type{!Error}*/err) {
                        runtime.log("Error occurred while processing " + eventName + ":\n" + err.message + "\n" + err.stack);
                    }
                }
                // Reset the processed events list after this tick is complete. The event won't be
                // processed by any other sources after this
                runtime.setTimeout(function () { recentEvents.splice(recentEvents.indexOf(e), 1); }, 0);
            }
        }

        /**
         * @type {!Array.<!function(!Event):!boolean>}
         */
        this.filters = [];

        /**
         * @param {!Function} cb
         * @return {undefined}
         */
        this.subscribe = function (cb) {
            subscribers.subscribe(eventName, cb);
        };

        /**
         * @param {!Function} cb
         * @return {undefined}
         */
        this.unsubscribe = function (cb) {
            subscribers.unsubscribe(eventName, cb);
        };

        /**
         * @return {undefined}
         */
        this.destroy = function() {
            removeEvent(window, eventName, handleEvent);
            removeEvent(eventTrap, eventName, handleEvent);
            removeEvent(canvasElement, eventName, handleEvent);
        };

        function init() {
            if (bindToWindow[eventName]) {
                // Internet explorer will only supply mouse up & down on the window object
                // For other browser though, listening to both will cause two events to be processed
                listenEvent(window, eventName, handleEvent);
            }
            listenEvent(eventTrap, eventName, handleEvent);
            listenEvent(canvasElement, eventName, handleEvent);
        }
        init();
    }

    /**
     * A compound event is an event that is not directly supported
     * by any browser APIs but which can be representation as a
     * logical consequence of a combination of several preexisting
     * events. For example: long press, double tap, pinch, etc.
     * @constructor
     * @param {!string} eventName
     * @param {!Array.<!string>} dependencies,
     * @param {!function(!Event, !Object, !function(!Object)):undefined} eventProxy
     */
    function CompoundEvent(eventName, dependencies, eventProxy) {
        var /**@type{!Object}*/
            cachedState = {},
            subscribers = new core.EventNotifier([eventName]);

        /**
         * @param {!Event} event
         * @return {undefined}
         */
        function subscribedProxy(event) {
            eventProxy(event, cachedState, function (compoundEventInstance) {
                compoundEventInstance.type = eventName;
                subscribers.emit(eventName, compoundEventInstance);
            });
        }

        /**
         * @param {!Function} cb
         * @return {undefined}
         */
        this.subscribe = function (cb) {
            subscribers.subscribe(eventName, cb);
        };

        /**
         * @param {!Function} cb
         * @return {undefined}
         */
        this.unsubscribe = function (cb) {
            subscribers.unsubscribe(eventName, cb);
        };

        /**
         * @return {undefined}
         */
        this.destroy = function () {
            dependencies.forEach(function (eventName) {
                eventManager.unsubscribe(eventName, subscribedProxy);
            });
        };

        function init() {
            dependencies.forEach(function (eventName) {
                eventManager.subscribe(eventName, subscribedProxy);
            });
        }
        init();
    }

    /**
     * @param {!number} timer
     * @return {undefined}
     */
    function clearTimeout(timer) {
        runtime.clearTimeout(timer);
        delete longPressTimers[timer];
    }

    /**
     * @param {!Function} fn
     * @param {!number} duration
     * @return {!number}
     */
    function setTimeout(fn, duration) {
        var timer = runtime.setTimeout(function () {
            fn();
            clearTimeout(timer);
        }, duration);
        longPressTimers[timer] = true;
        return timer;
    }

    /**
     * @param {!Event} e
     * @return {Node}
     */
    function getTarget(e) {
        // e.srcElement because IE10 likes to be different...
        return /**@type{Node}*/(e.target) || e.srcElement || null;
    }

    /**
     * A long-press occurs when a finger is placed
     * against the screen and not lifted or moved
     * before a specific short duration (400ms seems
     * approximately the time iOS takes).
     * @param {!Event} event
     * @param {!Object} cachedState
     * @param {!function(!Object):undefined} callback
     * @return {undefined}
     */
    function emitLongPressEvent(event, cachedState, callback) {
        var touchEvent = /**@type{!TouchEvent}*/(event),
            fingers = /**@type{!number}*/(touchEvent.touches.length),
            touch = /**@type{!Touch}*/(touchEvent.touches[0]),
            timer = /**@type{{timer: !number}}*/(cachedState).timer;

        if (event.type === 'touchmove' || event.type === 'touchend') {
            if (timer) {
                clearTimeout(timer);
            }
        } else if (event.type === 'touchstart') {
            if (fingers !== 1) {
                runtime.clearTimeout(timer);
            } else {
                timer = setTimeout(function () {
                    callback({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        pageX: touch.pageX,
                        pageY: touch.pageY,
                        target: getTarget(event),
                        detail: 1
                    });
                }, LONGPRESS_DURATION);
            }
        }
        cachedState.timer = timer;
    }

    /**
     * Drag events are generated whenever an element with class
     * 'webodf-draggable' is touched and subsequent finger movements
     * lie on the same element. This prevents the default
     * action of touchmove, i.e. usually scrolling.
     * @param {!Event} event
     * @param {!Object} cachedState
     * @param {!function(!Object):undefined} callback
     * @return {undefined}
     */
    function emitDragEvent(event, cachedState, callback) {
        var touchEvent = /**@type{!TouchEvent}*/(event),
            fingers = /**@type{!number}*/(touchEvent.touches.length),
            touch = /**@type{!Touch}*/(touchEvent.touches[0]),
            target = /**@type{!Element}*/(getTarget(event)),
            cachedTarget = /**@type{{target: ?Element}}*/(cachedState).target;

        if (fingers !== 1
                || event.type === 'touchend') {
            cachedTarget = null;
        } else if (event.type === 'touchstart' && target.getAttribute('class') === 'webodf-draggable') {
            cachedTarget = target;
        } else if (event.type === 'touchmove' && cachedTarget) {
            // Prevent the default action of 'touchmove', i.e. scrolling.
            event.preventDefault();
            // Stop propagation, so even if there is no native scroll,
            // we can block the pan processing in ZoomHelper as well.
            event.stopPropagation();
            callback({
                clientX: touch.clientX,
                clientY: touch.clientY,
                pageX: touch.pageX,
                pageY: touch.pageY,
                target: cachedTarget,
                detail: 1
            });
        }
        cachedState.target = cachedTarget;
    }

    /**
     * Drag-stop events are generated whenever an touchend
     * is preceded by a drag event.
     * @param {!Event} event
     * @param {!Object} cachedState
     * @param {!function(!Object):undefined} callback
     * @return {undefined}
     */
    function emitDragStopEvent(event, cachedState, callback) {
        var touchEvent = /**@type{!TouchEvent}*/(event),
            target = /**@type{!Element}*/(getTarget(event)),
            /**@type{!Touch}*/
            touch,
            dragging = /**@type{{dragging: ?boolean}}*/(cachedState).dragging;

        if (event.type === 'drag') {
            dragging = true;
        } else if (event.type === 'touchend' && dragging) {
            dragging = false;
            touch = /**@type{!Touch}*/(touchEvent.changedTouches[0]);
            callback({
                clientX: touch.clientX,
                clientY: touch.clientY,
                pageX: touch.pageX,
                pageY: touch.pageY,
                target: target,
                detail: 1
            });
        }
        cachedState.dragging = dragging;
    }

    /**
     * Adds a class 'webodf-touchEnabled' to the canvas
     * @return {undefined}
     */
    function declareTouchEnabled() {
        canvasElement.classList.add('webodf-touchEnabled');
        eventManager.unsubscribe('touchstart', declareTouchEnabled);
    }

    /**
     * @param {!Window} window
     * @constructor
     */
    function WindowScrollState(window) {
        var x = window.scrollX,
            y = window.scrollY;

        /**
         * Restore the scroll state captured on construction
         */
        this.restore = function () {
            if (window.scrollX !== x || window.scrollY !== y) {
                window.scrollTo(x, y);
            }
        };
    }

    /**
     * @param {!Element} element
     * @constructor
     */
    function ElementScrollState(element) {
        var top = element.scrollTop,
            left = element.scrollLeft;

        /**
         * Restore the scroll state captured on construction
         */
        this.restore = function () {
            if (element.scrollTop !== top || element.scrollLeft !== left) {
                element.scrollTop = top;
                element.scrollLeft = left;
            }
        };
    }

    /**
     * Get an event delegate for the requested event name
     * @param {!string} eventName
     * @param {!boolean} shouldCreate Create a delegate for the requested event if it doesn't exist
     * @return {EventDelegate|CompoundEvent}
     */
    function getDelegateForEvent(eventName, shouldCreate) {
        var delegate = eventDelegates[eventName] || compoundEvents[eventName] || null;
        if (!delegate && shouldCreate) {
            delegate = eventDelegates[eventName] = new EventDelegate(eventName);
        }
        return delegate;
    }

    /**
     * Add an event filter that is able to reject events from being processed
     * @param {!string} eventName
     * @param {!function(!Event):!boolean} filter
     */
    this.addFilter = function (eventName, filter) {
        var delegate = getDelegateForEvent(eventName, true);
        delegate.filters.push(filter);
    };

    /**
     * Remove a registered event filter
     * @param {!string} eventName
     * @param {!function(!Event):!boolean} filter
     */
    this.removeFilter = function (eventName, filter) {
        var delegate = getDelegateForEvent(eventName, true),
            index = delegate.filters.indexOf(filter);
        if (index !== -1) {
            delegate.filters.splice(index, 1);
        }
    };

    /**
     * @param {!string} eventName
     * @param {function(!Event)|function()} handler
     * @return {undefined}
     */
    function subscribe(eventName, handler) {
        var delegate = getDelegateForEvent(eventName, true);
        delegate.subscribe(handler);
    }
    this.subscribe = subscribe;

    /**
     * @param {!string} eventName
     * @param {function(!Event)|function()} handler
     * @return {undefined}
     */
    function unsubscribe(eventName, handler) {
        var delegate = getDelegateForEvent(eventName, false);
        if (delegate) {
            delegate.unsubscribe(handler);
        }
    }
    this.unsubscribe = unsubscribe;

    /**
     * Returns true if the event manager is currently receiving events
     * @return {boolean}
     */
    function hasFocus() {
        return odtDocument.getDOMDocument().activeElement === eventTrap;
    }
    this.hasFocus = hasFocus;

    /**
     * Prevent the event trap from receiving focus
     * @return {undefined}
     */
    function disableTrapSelection() {
        if (hasFocus()) {
            // Workaround for a FF bug
            // If the window selection is in the even trap when it is set non-editable,
            // further attempts to modify the window selection will crash
            // https://bugzilla.mozilla.org/show_bug.cgi?id=773137
            // https://bugzilla.mozilla.org/show_bug.cgi?id=787305
            eventTrap.blur();
        }
        eventTrap.setAttribute("disabled", "true");
    }

    /**
     * Allow the event trap to receive focus
     * @return {undefined}
     */
    function enableTrapSelection() {
        // A disabled element can't have received focus, so don't need to blur before updating this flag
        eventTrap.removeAttribute("disabled");
        // Recovering focus here might cause it to be incorrectly stolen from other elements.
        // At the time that this patch was written, the primary external controllers of focus are
        // the SessionController (for mouse related events) and the WebODF editor. Let these restore
        // focus on their own if desired.
    }

    /**
     * Find the all scrollable ancestor for the specified element
     * @param {Element} element
     * @return {!Array.<!WindowScrollState>}
     */
    function findScrollableParents(element) {
        var scrollParents = [];
        while (element) {
            // Find the first scrollable parent and track it's current position
            // This is assumed to be the document scroll pane
            if (element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight) {
                scrollParents.push(new ElementScrollState(element));
            }
            element = /**@type {Element}*/(element.parentNode);
        }
        scrollParents.push(new WindowScrollState(window));
        return scrollParents;
    }

    /**
     * Return event focus back to the event manager
     */
    function focus() {
        var scrollParents;
        if (!hasFocus()) {
            // http://www.whatwg.org/specs/web-apps/current-work/#focus-management
            // Passing focus back to an element that did not previously have it will also
            // cause the element to attempt to recentre back into scroll view
            scrollParents = findScrollableParents(eventTrap);
            enableTrapSelection();
            eventTrap.focus();
            scrollParents.forEach(function (scrollParent) {
                scrollParent.restore();
            });
        }
    }
    this.focus = focus;

    /**
     * Returns the event trap div
     * @return {!HTMLInputElement}
     */
    this.getEventTrap = function () {
        return eventTrap;
    };

    /**
     * Sets to true when in edit mode; otherwise false
     * @param {!boolean} editable
     * @return {undefined}
     */
    this.setEditing = function (editable) {
        var hadFocus = hasFocus();
        if (hadFocus) {
            // Toggling flags while the element is in focus
            // will sometimes stop the browser from allowing the IME to be activated.
            // Blurring the focus and then restoring ensures the browser re-evaluates
            // the IME state after the content editable flag has been updated.
            eventTrap.blur();
        }
        if (editable) {
            eventTrap.removeAttribute("readOnly");
        } else {
            eventTrap.setAttribute("readOnly", "true");
        }
        if (hadFocus) {
            focus();
        }
    };

    /**
      * @param {!function(!Error=)} callback passing an error object in case of error
      * @return {undefined}
      */
    this.destroy = function (callback) {
        unsubscribe("touchstart", declareTouchEnabled);
        // Clear all long press timers, just in case
        Object.keys(longPressTimers).forEach(function (timer) {
            clearTimeout(parseInt(timer, 10));
        });
        longPressTimers.length = 0;

        Object.keys(compoundEvents).forEach(function (compoundEventName) {
            compoundEvents[compoundEventName].destroy();
        });
        compoundEvents = {};

        unsubscribe("mousedown", disableTrapSelection);
        unsubscribe("mouseup", enableTrapSelection);
        unsubscribe("contextmenu", enableTrapSelection);
        Object.keys(eventDelegates).forEach(function (eventName) {
            eventDelegates[eventName].destroy();
        });
        eventDelegates = {};
        // TODO Create warnings for delegates with existing subscriptions. This may indicate leaked event subscribers.

        eventTrap.parentNode.removeChild(eventTrap);
        callback();
    };

    function init() {
        var sizerElement = odtDocument.getOdfCanvas().getSizer(),
            doc = sizerElement.ownerDocument;

        runtime.assert(Boolean(window), "EventManager requires a window object to operate correctly");
        eventTrap = /**@type{!HTMLInputElement}*/(doc.createElement("textarea"));
        eventTrap.id = "eventTrap";
        // Negative tab index still allows focus, but removes accessibility by keyboard
        eventTrap.setAttribute("tabindex", "-1");
        eventTrap.setAttribute("readOnly", "true");
        eventTrap.setAttribute("rows", "1");
        sizerElement.appendChild(eventTrap);

        subscribe("mousedown", disableTrapSelection);
        subscribe("mouseup", enableTrapSelection);
        subscribe("contextmenu", enableTrapSelection);

        compoundEvents.longpress = new CompoundEvent('longpress', ['touchstart', 'touchmove', 'touchend'], emitLongPressEvent);
        compoundEvents.drag = new CompoundEvent('drag', ['touchstart', 'touchmove', 'touchend'], emitDragEvent);
        compoundEvents.dragstop = new CompoundEvent('dragstop', ['drag', 'touchend'], emitDragStopEvent);

        subscribe("touchstart", declareTouchEnabled);
    }
    init();
};
