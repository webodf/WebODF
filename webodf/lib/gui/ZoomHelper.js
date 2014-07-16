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

/*global runtime, core, gui*/

(function () {
    "use strict";

    /**
     * @constructor
     * @param {!number} x
     * @param {!number} y
     */
    function Point(x, y) {
        var self = this;
        /**
         * @param {!Point} point
         * @return {!number}
         */
        this.getDistance = function (point) {
            var xOffset = self.x - point.x,
                yOffset = self.y - point.y;
            return Math.sqrt(xOffset * xOffset + yOffset * yOffset);
        };

        /**
         * @param {!Point} point
         * @return {!Point}
         */
        this.getCenter = function (point) {
            return new Point((self.x + point.x) / 2, (self.y + point.y) / 2);
        };

        /**@type{!number}*/
        this.x;
        /**@type{!number}*/
        this.y;
        function init() {
            self.x = x;
            self.y = y;
        }
        init();
    }

    /**
     * ZoomHelper handles touch gestures and provides pinch-to-zoom support
     * on the sizer element. It also provides some methods to set, get, and
     * subscribe to the current zoom level.
     * @constructor
     * @implements {core.Destroyable}
     */
    gui.ZoomHelper = function () {
        var /**@type{!HTMLElement}*/
            zoomableElement,
            /**@type{!Point}*/
            panPoint,
            /**@type{!Point}*/
            previousPanPoint,
            /**@type{!number}*/
            firstPinchDistance,
            /**@type{!number}*/
            zoom,
            /**@type{!number}*/
            previousZoom,
            maxZoom = 4.0,
            /**@type{!HTMLElement}*/
            offsetParent,
            /**@type{!HTMLElement}*/
            parentElement,
            events = new core.EventNotifier([gui.ZoomHelper.signalZoomChanged]),
            /**@const*/
            gestures = {
                NONE: 0,
                SCROLL: 1,
                PINCH: 2
            },
            /**@type{!number}*/
            currentGesture = gestures.NONE,
            /**
             * On webkit, which has the ability to style scrollbars
             * with CSS, `window` has the property 'ontouchstart'.
             * This can be used as a hint of touch event support,
             * and we can take advantage of that to decide to show
             * custom scrollbars (because webkit hides them).
             * @type{!boolean}
             */
            requiresCustomScrollBars = runtime.getWindow().hasOwnProperty('ontouchstart'),
            /**@type{?string}*/
            parentOverflow = "";

        /**
         * Apply a 3D or 2D CSS transform with the given
         * x and y offset, and scale.
         * @param {!number} x
         * @param {!number} y
         * @param {!number} scale
         * @param {!boolean} is3D
         * @return {undefined}
         */
        function applyCSSTransform(x, y, scale, is3D) {
            var transformCommand;

            if (is3D) {
                transformCommand = 'translate3d(' + x + 'px, ' + y + 'px, 0) scale3d(' + scale + ', ' + scale + ', 1)';
            } else {
                transformCommand = 'translate(' + x + 'px, ' + y + 'px) scale(' + scale + ')';
            }

            zoomableElement.style.WebkitTransform = transformCommand;
            zoomableElement.style.MozTransform = transformCommand;
            zoomableElement.style.msTransform = transformCommand;
            zoomableElement.style.OTransform = transformCommand;
            zoomableElement.style.transform = transformCommand;
        }

        /**
         * Apply the current computed transform
         * (including pan and zoom)
         * @param {!boolean} is3D
         * @return {undefined}
         */
        function applyTransform(is3D) {
            if (is3D) {
                applyCSSTransform(-panPoint.x, -panPoint.y, zoom, true);
            } else {
                // It tends to feel smoother (with less flicker)
                // if we apply a fast transform first and then a
                // detailed transform.
                // A detailed (2d) transform is only done 'at rest',
                // therefore ignore the panning value, because
                // the positioning is handled by scrollbars in that case.
                applyCSSTransform(0, 0, zoom, true);
                applyCSSTransform(0, 0, zoom, false);
            }
        }

        /**
         * Applies the current computed zoom & pan
         * as a quick-and-dirty rendering, to be used
         * during a gesture or when a flicker needs
         * to be masked.
         * @return {undefined}
         */
        function applyFastTransform() {
            applyTransform(true);
        }

        /**
         * Applies the current zoom as a detailed
         * rendering. This is a slow call to be done
         * post-gesture.
         * @return {undefined}
         */
        function applyDetailedTransform() {
            applyTransform(false);
        }

        /**
         * Enable or disable virtual scrollbars on the container.
         * @param {!boolean} enable
         * @return {undefined}
         */
        function enableScrollBars(enable) {
            if (!offsetParent || !requiresCustomScrollBars) {
                return;
            }

            var initialOverflow = offsetParent.style.overflow,
                enabled = offsetParent.classList.contains('webodf-customScrollbars');

            if ((enable && enabled) || (!enable && !enabled)) {
                return;
            }

            if (enable) {
                offsetParent.classList.add('webodf-customScrollbars');
                // The custom scrollbar does not appear in webkit unless a full redraw
                // of the scrollable area is forced. Therefore attempt to toggle the
                // overflow stle of the scrolling container across successive animation
                // frames.
                offsetParent.style.overflow = 'hidden';
                runtime.requestAnimationFrame(function () {
                    offsetParent.style.overflow = initialOverflow;
                });
            } else {
                offsetParent.classList.remove('webodf-customScrollbars');
            }
        }


        /**
         * Sets the scrolling of the container to (0,0)
         * so that transforms and event points can be
         * conveniently computed.
         * Applies a quick transform to make it look like
         * this never happened.
         * @return {undefined}
         */
        function removeScroll() {
            applyCSSTransform(-panPoint.x, -panPoint.y, zoom, true);
            offsetParent.scrollLeft = 0;
            offsetParent.scrollTop = 0;
            parentOverflow = parentElement.style.overflow;
            parentElement.style.overflow = "visible";
            enableScrollBars(false);
        }

        /**
         * Restores the scrollTop and scrollLeft of
         * the container to the x and y pan values.
         * Applies a quick transform to make it look like
         * this never happened.
         * @return {undefined}
         */
        function restoreScroll() {
            applyCSSTransform(0, 0, zoom, true);
            offsetParent.scrollLeft = panPoint.x;
            offsetParent.scrollTop = panPoint.y;
            parentElement.style.overflow = parentOverflow || "";
            enableScrollBars(true);
        }

        /**
         * Returns a Point instance for a given touch.
         * @param {!Touch} touch
         * @return {!Point}
         */
        function getPoint(touch) {
            return new Point(touch.pageX - zoomableElement.offsetLeft, touch.pageY - zoomableElement.offsetTop);
        }

        /**
         * Returns the closest point to the given point
         * within the boundaries of the zoomable element,
         * such that it never causes panning outside
         * the viewport.
         * @param {!Point} point
         * @return {!Point}
         */
        function sanitizePointForPan(point) {
            return new Point(
                Math.min(Math.max(point.x, zoomableElement.offsetLeft), (zoomableElement.offsetLeft + zoomableElement.offsetWidth) * zoom - offsetParent.clientWidth),
                Math.min(Math.max(point.y, zoomableElement.offsetTop), (zoomableElement.offsetTop + zoomableElement.offsetHeight) * zoom - offsetParent.clientHeight)
            );
        }

        /**
         * Takes a point in page coordinates and pans towards it
         * @param {!Point} point
         * @return {undefined}
         */
        function processPan(point) {
            if (previousPanPoint) {
                panPoint.x -= point.x - previousPanPoint.x;
                panPoint.y -= point.y - previousPanPoint.y;
                panPoint = sanitizePointForPan(panPoint);
            }
            previousPanPoint = point;
        }

        /**
         * Takes a point and a relative zoom factor,
         * with which the panPoint is accordingly updated
         * to reflect the new zoom center, and the current
         * zoom level is multiplied by the relative factor.
         * Useful for when the zoom is dynamically being changed
         * during a gesture.
         * This does not zoom beyond a minimum reasonable zoom
         * level. Since we assume that gestures are for a
         * mobile device, it makes some sense to not allow
         * shrinking of a document to a width less than the container's
         * width. Also easier for computation of pan coordinates.
         * @param {!Point} zoomPoint
         * @param {!number} incrementalZoom
         * @return {undefined}
         */
        function processZoom(zoomPoint, incrementalZoom) {
            var originalZoom = zoom,
                actuallyIncrementedZoom,
                minZoom = Math.min(maxZoom, zoomableElement.offsetParent.clientWidth / zoomableElement.offsetWidth);

            zoom = previousZoom * incrementalZoom;
            zoom = Math.min(Math.max(zoom, minZoom), maxZoom);
            actuallyIncrementedZoom = zoom / originalZoom;

            panPoint.x += (actuallyIncrementedZoom - 1) * (zoomPoint.x + panPoint.x);
            panPoint.y += (actuallyIncrementedZoom - 1) * (zoomPoint.y + panPoint.y);
        }

        /**
         * @param {!Point} point1
         * @param {!Point} point2
         * @return {undefined}
         */
        function processPinch(point1, point2) {
            var zoomPoint = point1.getCenter(point2),
                pinchDistance = point1.getDistance(point2),
                incrementalZoom = pinchDistance / firstPinchDistance;

            processPan(zoomPoint);
            processZoom(zoomPoint, incrementalZoom);
        }

        /**
         * @param {!TouchEvent} event
         * @return {undefined}
         */
        function prepareGesture(event) {
            var fingers = event.touches.length,
                point1 = fingers > 0 ? getPoint(event.touches[0]) : null,
                point2 = fingers > 1 ? getPoint(event.touches[1]) : null;

            if (point1 && point2) {
                // Compute the first pinch distance for later comparison against
                // fresh pinch distances during gesture processing, the ratio
                // of which represents the relative-to-current zoom level.
                firstPinchDistance = point1.getDistance(point2);
                previousZoom = zoom;
                previousPanPoint = point1.getCenter(point2);
                // Assuming this is the start of a pinch gesture,
                // therefore scroll to (0,0) for easy computing.
                removeScroll();
                currentGesture = gestures.PINCH;
            } else if (point1) {
                previousPanPoint = point1;
                currentGesture = gestures.SCROLL;
            }
        }

        /**
         * @param {!TouchEvent} event
         * @return {undefined}
         */
        function processGesture(event) {
            var fingers = event.touches.length,
                point1 = fingers > 0 ? getPoint(event.touches[0]) : null,
                point2 = fingers > 1 ? getPoint(event.touches[1]) : null;

            if (point1 && point2) {
                // Prevent default behavior of panning when a pinch is detected
                event.preventDefault();
                // If the current gesture is a SCROLL (or pan),
                // switch that to PINCH and scroll to (0,0)
                // for easy computing of transforms
                if (currentGesture === gestures.SCROLL) {
                    currentGesture = gestures.PINCH;
                    removeScroll();
                    firstPinchDistance = point1.getDistance(point2);
                    // Do no more pinch processing for this
                    // event now that we scrolled, because
                    // we still have the old coordinates.
                    // It is fine to waste a couple of events
                    // in a gesture.
                    return;
                }
                processPinch(point1, point2);
                applyFastTransform();
            } else if (point1) {
                // If there is a switch from pinch to
                // scroll mode, restore the scroll position
                // to the current pan coordinates.
                if (currentGesture === gestures.PINCH) {
                    currentGesture = gestures.SCROLL;
                    restoreScroll();
                    // Do no more pan processing for this event because
                    // the scrolling changed the coordinates.
                    return;
                }
                // Even when we are doing native scrolling/panning,
                // keep track and process the pan (but do not apply
                // a transform), so that when there is a switch to
                // pinch mode, the new pan coordinates are taken into
                // account.
                processPan(point1);
            }

        }


        /**
         * Restores scroll to the current pan position
         * after the gesture is over.
         * @return {undefined}
         */
        function sanitizeGesture() {
            if (currentGesture === gestures.PINCH) {
                // Here, signalZoomChanged is emitted before restoring the
                // scroll, because otherwise scrolling and then changing the
                // scroll area's dimensions will cause the view to end up
                // in unexpected places. Scrolling later will ensure that
                // the scrolled view is set by us and not the browser.
                events.emit(gui.ZoomHelper.signalZoomChanged, zoom);
                restoreScroll();
                applyDetailedTransform();
            }
            currentGesture = gestures.NONE;
        }

        /**
         * @param {!string} eventid
         * @param {!Function} cb
         * @return {undefined}
         */
        this.subscribe = function (eventid, cb) {
            events.subscribe(eventid, cb);
        };

        /**
         * @param {!string} eventid
         * @param {!Function} cb
         * @return {undefined}
         */
        this.unsubscribe = function (eventid, cb) {
            events.unsubscribe(eventid, cb);
        };

        /**
         * @return {!number}
         */
        this.getZoomLevel = function () {
            return zoom;
        };

        /**
         * @param {!number} zoomLevel
         * @return {undefined}
         */
        this.setZoomLevel = function (zoomLevel) {
            if (zoomableElement) {
                zoom = zoomLevel;
                applyDetailedTransform();
                events.emit(gui.ZoomHelper.signalZoomChanged, zoom);
            }
        };

        /**
         * Adds touchstart, touchmove, and touchend
         * event listeners to the element's scrollable
         * container.
         * @return {undefined}
         */
        function registerGestureListeners() {
            if (offsetParent) {
                // There is no reliable way of detecting if the browser
                // supports these touch events. Therefore the only thing
                // we can do is simply attach listeners to these events
                // as this seems harmless if the events are not supported
                // anyway.
                offsetParent.addEventListener('touchstart', /**@type{!EventListener}*/(prepareGesture), false);
                offsetParent.addEventListener('touchmove', /**@type{!EventListener}*/(processGesture), false);
                offsetParent.addEventListener('touchend', /**@type{!EventListener}*/(sanitizeGesture), false);
            }
        }

        /**
         * @return {undefined}
         */
        function unregisterGestureListeners() {
            if (offsetParent) {
                offsetParent.removeEventListener('touchstart', /**@type{!EventListener}*/(prepareGesture), false);
                offsetParent.removeEventListener('touchmove', /**@type{!EventListener}*/(processGesture), false);
                offsetParent.removeEventListener('touchend', /**@type{!EventListener}*/(sanitizeGesture), false);
            }
        }

        /**
         * @param {!function(!Error=)} callback, passing an error object in case of error
         * @return {undefined}
         */
        this.destroy = function (callback) {
            unregisterGestureListeners();
            enableScrollBars(false);
            callback();
        };

        /**
         * FIXME: I don't like that we can switch the zoomable
         * element at runtime, but I don't see any other way to
         * keep the zoom helper working after an undo.
         * @param {!HTMLElement} element
         * @return {undefined}
         */
        this.setZoomableElement = function (element) {
            unregisterGestureListeners();
            zoomableElement = element;
            offsetParent = /**@type{!HTMLElement}*/(zoomableElement.offsetParent);
            parentElement = /**@type{!HTMLElement}*/(zoomableElement.parentNode);
            // Write out the current transform to the new element.
            applyDetailedTransform();
            registerGestureListeners();
            enableScrollBars(true);
        };

        function init() {
            zoom = 1;
            previousZoom = 1;
            panPoint = new Point(0, 0);
        }
        init();
    };
    /**@const
     * @type {!string} */
    gui.ZoomHelper.signalZoomChanged = "zoomChanged";
}());
