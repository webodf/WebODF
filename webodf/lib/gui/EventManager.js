/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
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

/*global runtime, gui */

/**
 * Event wiring and management abstraction layer
 * This class contains workarounds for various behaviour issues with events cross-browser. Additionally, this
 * class provides a mechanism for returning event focus back to the SessionController when it has been lost to
 * an external source.
 * @param {!ops.OdtDocument} odtDocument
 * @constructor
 */
gui.EventManager = function EventManager(odtDocument) {
    "use strict";
    var window = /**@type{!Window}*/(runtime.getWindow()),
        bindToDirectHandler = {
            // In Safari 6.0.5 (7536.30.1), Using either attachEvent or addEventListener
            // results in the beforecut return value being ignored which prevents cut from being called.
            "beforecut": true,
            // Epiphany 3.6.1 requires this to allow the paste event to fire
            "beforepaste": true
        },
        // Events that should be bound to the global window rather than the canvas element
        bindToWindow,
        eventTrap;

    /**
     * Get the current canvas element. The current trivial undo manager replaces the root element
     * of the ODF container with a clone from a previous state. This results in the root element
     * being changed. As such, it can't be stored, and should be queried on each use.
     * @returns {!Element}
     */
    function getCanvasElement() {
        // TODO Remove when a proper undo manager arrives
        return odtDocument.getOdfCanvas().getElement();
    }

    /**
     * Ensures events that may bubble through multiple sources are only handled once.
     * @constructor
     */
    function EventDelegate() {
        var self = this,
            recentEvents = [];

        /**
         * @type {!Array.<!function(!Event)>}
         */
        this.handlers = [];

        /**
         * @type {!boolean}
         */
        this.isSubscribed = false;

        /**
         * @param {!Event} e
         */
        this.handleEvent = function(e) {
            if (recentEvents.indexOf(e) === -1) {
                recentEvents.push(e); // Track this event as already processed by these handlers
                self.handlers.forEach(function(handler) {
                    // Yes yes... this is not a spec-compliant event processor... sorry!
                    handler(e);
                });
                // Reset the processed events list after this tick is complete. The event won't be
                // processed by any other sources after this
                runtime.setTimeout(function() { recentEvents.splice(recentEvents.indexOf(e), 1); }, 0);
            }
        };
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
        this.restore = function() {
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
        this.restore = function() {
            if (element.scrollTop !== top || element.scrollLeft !== left) {
                element.scrollTop = top;
                element.scrollLeft = left;
            }
        };
    }

    /**
     * @param {!Element|!Window} eventTarget
     * @param {!string} eventType
     * @param {function(!Event)|function()} eventHandler
     * @return {undefined}
     */
    function listenEvent(eventTarget, eventType, eventHandler) {
        var onVariant = "on" + eventType,
            bound = false;
        if (eventTarget.attachEvent) {
            bound = eventTarget.attachEvent(onVariant, eventHandler);
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
        if (eventTarget.detachEvent) {
            eventTarget.detachEvent(onVariant, eventHandler);
        }
        if (eventTarget.removeEventListener) {
            eventTarget.removeEventListener(eventType, eventHandler, false);
        }
        if (eventTarget[onVariant] === eventHandler) {
            eventTarget[onVariant] = null;
        }
    }

    /**
     * @param {!string} eventName
     * @param {function(!Event)|function()} handler
     */
    this.subscribe = function(eventName, handler) {
        var delegate = bindToWindow[eventName],
            canvasElement = getCanvasElement();
        if (delegate) {
            delegate.handlers.push(handler);
            if (!delegate.isSubscribed) {
                delegate.isSubscribed = true;
                // Internet explorer will only supply mouse up & down on the window object
                // For other browser though, listening to both will cause two events to be processed
                listenEvent(/**@type {!Window}*/(window), eventName, delegate.handleEvent);
                listenEvent(canvasElement, eventName, delegate.handleEvent);
                listenEvent(eventTrap, eventName, delegate.handleEvent);
            }
        } else {
            listenEvent(canvasElement, eventName, handler);
        }
    };

    /**
     * @param {!string} eventName
     * @param {function(!Event)|function()} handler
     */
    this.unsubscribe = function(eventName, handler) {
        var delegate = bindToWindow[eventName],
            handlerIndex = delegate && delegate.handlers.indexOf(handler),
            canvasElement = getCanvasElement();
        if (delegate) {
            if (handlerIndex !== -1) {
                delegate.handlers.splice(handlerIndex, 1);
            }
        } else {
            removeEvent(canvasElement, eventName, handler);
        }
    };

    /**
     * Returns true if the event manager is currently receiving events
     * @returns {boolean}
     */
    function hasFocus() {
        return odtDocument.getDOM().activeElement === getCanvasElement();
    }

    /**
     * Find the closest scrolled ancestor to the specified element
     * @param {Element} element
     * @returns {*}
     */
    function findScrollableParent(element) {
        // If a scrollable parent exists with a non-0 top or left scroll then return this as the container to restore
        while (element && !element.scrollTop && !element.scrollLeft) {
            element = /**@type {Element}*/(element.parentNode);
        }
        if (element) {
            return new ElementScrollState(element);
        }
        return new WindowScrollState(window);
    }

    /**
     * Return event focus back to the event manager
     */
    this.focus = function() {
        var scrollParent,
            canvasElement = getCanvasElement(),
            selection = window.getSelection();
        if (!hasFocus()) {
            // http://www.whatwg.org/specs/web-apps/current-work/#focus-management
            // Passing focus back to an element that did not previously have it will also
            // cause the element to attempt to recentre back into scroll view
            scrollParent = findScrollableParent(canvasElement);
            canvasElement.focus();
            if (scrollParent) {
                scrollParent.restore();
            }
        }
        if (selection && selection.extend) {
            if (eventTrap.parentNode !== canvasElement) {
                // The undo manager can replace the root element, discarding the original.
                // The event trap node is still valid, and simply needs to be re-attached
                // after this occurs.
                canvasElement.appendChild(eventTrap);
            }
            // A browser selection in an editable area is necessary to allow cut/copy events to fire
            // It doesn't have to be an accurate selection however as the SessionController will override
            // the default browser handling.
            selection.collapse(eventTrap.firstChild, 0);
            selection.extend(eventTrap, eventTrap.childNodes.length);
        }
    };

    function init() {
        var canvasElement = getCanvasElement(),
            doc = canvasElement.ownerDocument;

        runtime.assert(Boolean(window), "EventManager requires a window object to operate correctly");
        bindToWindow = {
            // Capture selections that start outside the canvas element and end within the canvas element
            "mousedown": new EventDelegate(),
            // Capture selections that start inside the canvas element and end outside of the element or even window
            "mouseup": new EventDelegate(),
            // Focus is a non-bubbling event, and we'll usually pass focus to the event trap
            "focus": new EventDelegate()
        };
        eventTrap = doc.createElement("div");
        eventTrap.id = "eventTrap";
        eventTrap.setAttribute("contenteditable", "true");
        eventTrap.style.position = "absolute";
        eventTrap.style.left = "-10000px";
        // Content is necessary for cut/copy to be enabled
        eventTrap.appendChild(doc.createTextNode("dummy content"));
        canvasElement.appendChild(eventTrap);
    }
    init();
};
