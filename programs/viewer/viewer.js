/**
 * @license
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
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

/*global document, window*/

function Viewer(viewerPlugin) {
    "use strict";

    var self = this,
        kCssUnits = 96.0 / 72.0,
        kScrollbarPadding = 40,
        kMinScale = 0.25,
        kMaxScale = 4.0,
        kDefaultScaleDelta = 1.1,
        kDefaultScale = 'auto',
        slide_mode = false,
        initialized = false,
        url,
        viewerElement,
        filename,
        pages = [],
        currentPage;

    function isFullScreen() {
    // Note that the browser fullscreen (triggered by short keys) might
    // be considered different from content fullscreen when expecting a boolean
        return document.mozFullScreen || document.webkitIsFullScreen;
    }

    function selectScaleOption(value) {
        var options = document.getElementById('scaleSelect').options,
            option,
            predefinedValueFound = false,
            i;

        for (i = 0; i < options.length; i += 1) {
            option = options[i];
            if (option.value !== value) {
                option.selected = false;
                continue;
            }
            option.selected = true;
            predefinedValueFound = true;
        }
        return predefinedValueFound;
    }

    this.initialize = function () {
        var location = String(document.location),
            pos = location.indexOf('#'),
            element;

        location = location.substr(pos + 1);
        if (pos === -1 || location.length === 0) {
            console.log('Could not parse file path argument.');
            return;
        }

        viewerElement = document.getElementById('viewer');
        url = location;
        filename = url.replace(/^.*[\\\/]/, '');
        document.title = filename;
        document.getElementById('documentName').innerHTML = document.title;

        viewerPlugin.onLoad = function () {
            if (viewerPlugin.slideshow) {
                // No padding for slideshows
                document.getElementById('canvasContainer').style.padding = 0;
                // temporary hack: remove zoom buttons to make way for the navigation controls
                document.getElementById('toolbarMiddleContainer').style.visibility = 'hidden';

                pages = self.getPages();
                document.getElementById('numPages').innerHTML = 'of ' + pages.length;

                self.showPage(1);
            } else {
                document.getElementById('toolbarLeft').style.visibility = 'hidden';
            }
                
            // WTF, but I need to call it thrice to render presentations properly. Need to investigate.
            self.parseScale(kDefaultScale);

            initialized = true;
        };

        viewerPlugin.initialize(viewerElement, location);
    };

    this.getPages = function () {
        return viewerPlugin.getPages();
    };

    this.showPage = function (n) {
        if (n <= 0) {
            n = 1;
        } else if (n > pages.length) {
            n = pages.length;
        }

        viewerPlugin.showPage(n);

        currentPage = n;
        document.getElementById('pageNumber').value = currentPage;
    };

    this.showNextPage = function () {
        self.showPage(currentPage + 1);
    };

    this.showPreviousPage = function () {
        self.showPage(currentPage - 1);
    };

    this.download = function () {
        var documentUrl = url.split('#')[0];
        documentUrl += '#viewer.action=download';
        window.open(documentUrl, '_parent');
    };

    this.toggleFullScreen = function () {
        var elem = viewerElement;
        if (!isFullScreen()) {
            if (elem.requestFullScreen) {
                elem.requestFullScreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullScreen) {
                elem.webkitRequestFullScreen();
            }
        } else {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        }
    };

    this.getZoomLevel = function () {
        return viewerPlugin.getZoomLevel();
    };

    this.setZoomLevel = function (value) {
        viewerPlugin.setZoomLevel(value);
    };

    this.setScale = function (val, resetAutoSettings, noScroll) {
        if (val === self.getZoomLevel()) {
            return;
        }

        self.setZoomLevel(val);

        var event = document.createEvent('UIEvents');
        event.initUIEvent('scalechange', false, false, window, 0);
        event.scale = val;
        event.resetAutoSettings = resetAutoSettings;
        window.dispatchEvent(event);
    };

    this.parseScale = function (value, resetAutoSettings, noScroll) {
        var scale,
            maxWidth,
            maxHeight,
            container = document.getElementById('canvasContainer');

        if (value === 'custom') {
            scale = parseFloat(document.getElementById('customScaleOption').textContent) / 100;
        } else {
            scale = parseFloat(value);
        }

        if (scale) {
            self.setScale(scale, true, noScroll);
            return;
        }

        maxWidth = container.clientWidth - kScrollbarPadding;
        maxHeight = container.clientHeight - kScrollbarPadding;

        switch (value) {
        case 'page-actual':
            self.setScale(1, resetAutoSettings, noScroll);
            break;
        case 'page-width':
            viewerPlugin.fitToWidth(maxWidth);
            break;
        case 'page-height':
            viewerPlugin.fitToHeight(maxHeight);
            break;
        case 'page-fit':
            viewerPlugin.fitToPage(maxWidth, maxHeight);
            break;
        case 'auto':
            if (viewerPlugin.slideshow) {
                viewerPlugin.fitToPage(maxWidth + kScrollbarPadding, maxHeight + kScrollbarPadding);
            } else {
                viewerPlugin.fitSmart(maxWidth);
            }
            break;
        }

        selectScaleOption(value);
    };

    this.zoomOut = function () {
        // 10 % decrement
        var newScale = (self.getZoomLevel() / kDefaultScaleDelta).toFixed(2);
        newScale = Math.max(kMinScale, newScale);
        self.parseScale(newScale, true);
    };

    this.zoomIn = function () {
        // 10 % increment
        var newScale = (self.getZoomLevel() * kDefaultScaleDelta).toFixed(2);
        newScale = Math.min(kMaxScale, newScale);
        self.parseScale(newScale, true);
    };

    function init() {

        self.initialize();

        if (!(document.cancelFullScreen || document.mozCancelFullScreen || document.webkitCancelFullScreen)) {
            document.getElementById('fullscreen').style.visibility = 'hidden';
        }

        document.getElementById('fullscreen').addEventListener('click', function () {
            self.toggleFullScreen();
        });

        document.getElementById('download').addEventListener('click', function () {
            self.download();
        });

        document.getElementById('zoomOut').addEventListener('click', function () {
            self.zoomOut();
        });

        document.getElementById('zoomIn').addEventListener('click', function () {
            self.zoomIn();
        });

        document.getElementById('previous').addEventListener('click', function () {
            self.showPreviousPage();
        });

        document.getElementById('next').addEventListener('click', function () {
            self.showNextPage();
        });

        document.getElementById('pageNumber').addEventListener('change', function () {
            self.showPage(this.value);
        });

        document.getElementById('scaleSelect').addEventListener('change', function () {
            self.parseScale(this.value);
        });

        window.addEventListener('scalechange', function (evt) {
            var customScaleOption = document.getElementById('customScaleOption'),
                predefinedValueFound = selectScaleOption(String(evt.scale));

            customScaleOption.selected = false;

            if (!predefinedValueFound) {
                customScaleOption.textContent = Math.round(evt.scale * 10000) / 100 + '%';
                customScaleOption.selected = true;
            }
        }, true);

        window.addEventListener('resize', function (evt) {
            if (initialized &&
                      (document.getElementById('pageWidthOption').selected ||
                      document.getElementById('pageAutoOption').selected)) {
                self.parseScale(document.getElementById('scaleSelect').value);
            }
        });

        window.addEventListener('keydown', function (evt) {
            var key = evt.keyIdentifier;

            switch (key) {
            case 'Up': // up
            case 'Left': // left
                self.showPreviousPage();
                break;
            case 'Down': // down
            case 'Right': // right
                self.showNextPage();
                break;
            }
        });
    }

    init();
}
