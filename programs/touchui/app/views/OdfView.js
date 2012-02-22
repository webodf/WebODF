/*global Ext, runtime, core, odf, window, FileReader, console*/
runtime.loadClass('odf.OdfCanvas');
Ext.define('WebODFApp.view.OdfView', (function () {
    "use strict";
    var record,
        currentPath,
        overridePath,
        overridePathPrefix = "ODFVIEWINTERNALFILE",
        data,
        globalreadfunction,
        globalfilesizefunction,
        odfcanvas,
        zoom = 1,
        dom;
    function initCanvas() {
        var cmp;
        if (globalreadfunction === undefined) {
            // overload the global read function with one that only reads
            // the data from this canvas
            globalreadfunction = runtime.read;
            globalfilesizefunction = runtime.getFileSize;
            runtime.read = function (path, offset, length, callback) {
                if (path !== overridePath) {
                    globalreadfunction.apply(runtime,
                        [path, offset, length, callback]);
                } else {
                    callback(null, data.slice(offset, offset + length));
                }
            };
            runtime.getFileSize = function (path, callback) {
                if (path !== overridePath) {
                    globalfilesizefunction.apply(runtime, [path, callback]);
                } else {
                    callback(data.length);
                }
            };
            dom = Ext.getCmp('webodf').element.dom;
            odfcanvas = new odf.OdfCanvas(dom);
        }
    }
    function setRecord(r) {
        record = r;
        initCanvas();
    }
    function load(path) {
        initCanvas();
/*
        function initCanvasAndLoad() {
            if (app.views.OdfCanvas) {
                app.views.OdfCanvas.addListener("statereadychange",
                    callback);
                app.views.OdfCanvas.load(path);
            } else {
                initCanvas();
                window.setTimeout(initCanvasAndLoad, 100);
            }
        }
        if (app.views.OdfCanvas) {
            app.views.OdfCanvas.addListener("statereadychange", callback);
        }*/
        if (path === currentPath) {
            return;
        }
        currentPath = path;
        overridePath = overridePathPrefix + String(Math.random()).substring(2);
        data = null;
        window.resolveLocalFileSystemURI("file://" + path, function (file) {
            var reader = new FileReader();
            if (reader.readAsArrayBuffer) {
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
                // so far phonegap is very limited, ideally it would implement
                // readAsArrayBuffer and slice() on the File object
                reader.readAsDataURL(file);
            }
        }, function () {
            console.log("COULD NOT RESOLVE " + path);
        });
    }
    function tapHandler(button) {
        var id = button.getId();
        if (id === 'zoomin') {
            odfcanvas.setZoomLevel(odfcanvas.getZoomLevel() * 1.25);
        } else if (id === 'zoomout') {
            odfcanvas.setZoomLevel(odfcanvas.getZoomLevel() * 0.8);
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
                    { id: 'zoomin', icon: 'ZoomIn.png'},
                    { id: 'zoomout', icon: 'ZoomOut.png' }
                ],
                layout: {
                    pack : 'center',
                    align: 'center'
                }
            }]
        },
/*
        constructor: function (config) {
            this.on({
                scope: this,
                delegate: 'button',
                tap: 'tapHandler'
            });
            this.initConfig(config);
            this.callParent();
        },
*/
        updateRecord: function (record) {
            setRecord(record);
            load(record.get('fullPath'));
        }
    };
}()));
