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
/*global Ext, runtime, core, odf, window, FileReader, PhoneGap, gui*/
runtime.loadClass('odf.OdfCanvas');

Ext.define('WebODFApp.view.OdfView', (function () {
    "use strict";
    var currentPath,
        overridePath,
        overridePathPrefix = "odf:",
        data,
        globalreadfunction,
        globalfilesizefunction,
        odfcanvas,
        zoom = 1,
        dom,
        canvasListeners = [],
        view;
    function signalCanvasChange() {
        var i;
        for (i = 0; i < canvasListeners.length; i += 1) {
            canvasListeners[i](odfcanvas);
        }
    }
    function initCanvas() {
        if (globalreadfunction === undefined) {
            // overload the global read function with one that only reads
            // the data from this canvas
            globalreadfunction = runtime.readFile;
            runtime.readFile = function (path, encoding, callback) {
                if (path !== overridePath) {
                    globalreadfunction.apply(runtime,
                        [path, encoding, callback]);
                } else {
                    callback(null, data);
                }
            };
            dom = Ext.getCmp('webodf').element.dom;
            odfcanvas = new odf.OdfCanvas(dom);
            odfcanvas.addListener("statereadychange", signalCanvasChange);
        }
    }
    function load(path) {
        if (path === currentPath) {
            return;
        }
        currentPath = path;
        overridePath = overridePathPrefix + path;
        data = null;
        // the url of a file can start with file:// or not depending on the
        // operating system, notably this is different between iOS and android
        var filepath = path;
        if (filepath.substr(0, 7) !== "file://") {
            filepath = "file://" + filepath;
        }
        window.resolveLocalFileSystemURI(filepath, function (file) {
            var reader = new FileReader();
            // so far phonegap is very limited, ideally it would implement
            // readAsArrayBuffer and slice() on the File object
            // right now, it has a dummy function, hence breaking simple
            // detection of which features are implemented
            if (reader.readAsArrayBuffer
                    && (typeof PhoneGap === "undefined")) {
                reader.onloadend = function (evt) {
                    data = evt.target.result;
                    odfcanvas.load(overridePath);
                };
                reader.readAsArrayBuffer(file);
            } else {
                reader.onloadend = function (evt) {
                    var b = new core.Base64();
                    data = evt.target.result;
                    data = data.substr(data.indexOf(",") + 1);
                    data = b.convertBase64ToUTF8Array(data);
                    odfcanvas.load(overridePath);
                };
                reader.readAsDataURL(file);
            }
        }, function () {
            runtime.log("COULD NOT RESOLVE " + path);
        });
    }
    function tapHandler(button) {
        var id = button.getId(),
            dom = Ext.getCmp('odfcontainer').element.dom,
            width = dom.offsetWidth,
            height = dom.offsetHeight;
        if (id === 'zoomin') {
            odfcanvas.setZoomLevel(odfcanvas.getZoomLevel() * 1.25);
        } else if (id === 'zoomout') {
            odfcanvas.setZoomLevel(odfcanvas.getZoomLevel() * 0.8);
        } else if (id === 'fit-best') {
            odfcanvas.fitToContainingElement(width, height);
        } else if (id === 'fit-width') {
            odfcanvas.fitToWidth(width);
        } else if (id === 'fit-height') {
            odfcanvas.fitToHeight(height);
        } else if (id === 'next') {
            odfcanvas.showNextPage();
        } else if (id === 'previous') {
            odfcanvas.showPreviousPage();
        }
    }
    return {
        extend: 'Ext.Container',
        xtype: 'odfview',
        id: 'odfcontainer',
        config: {
            scrollable: 'both',
            items: [{
                id: 'webodf'
            }, {
                xtype : 'toolbar',
                docked: 'bottom',
                scrollable: false,
                defaults: {
                    iconMask: false,
                    ui      : 'plain',
                    handler: tapHandler
                },
                items: [
                    { id: 'previous', icon: 'go-previous.png'},
                    { id: 'next', icon: 'go-next.png' },
                    { id: 'zoomin', icon: 'ZoomIn.png'},
                    { id: 'zoomout', icon: 'ZoomOut.png' },
                    { id: 'fit-best', icon: 'zoom-fit-best.png' },
                    { id: 'fit-height', icon: 'zoom-fit-height.png' },
                    { id: 'fit-width', icon: 'zoom-fit-width.png' }
                ],
                layout: {
                    pack : 'center',
                    align: 'center'
                }
            }],
            listeners: {
                painted: function () {
                    // make sure the viewport is the right size
                    odfcanvas.setZoomLevel(odfcanvas.getZoomLevel());
                }
            }
        },
        updateRecord: function (record) {
            view = this;
            initCanvas();
            load(record.get('fullPath'));
        },
        addCanvasListener: function (listener) {
            canvasListeners.push(listener);
        },
        hideCanvas: function () {
            if (dom) {
                dom.style.display = "none";
            }
            if (view) {
                view.setMasked({
                    xtype: 'loadmask',
                    message: 'Loading...'
                });
            }
        },
        showCanvas: function () {
            if (view) {
                view.unmask();
            }
            dom.style.display = "inline-block";
            odfcanvas.setZoomLevel(odfcanvas.getZoomLevel());
        }
    };
}()));
