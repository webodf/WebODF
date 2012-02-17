/*global Ext, runtime, core, odf, window, FileReader, console*/
Ext.define('WebODFApp.view.OdfView', (function () {
    "use strict";
    var record,
        currentPath,
        overridePath,
        overridePathPrefix = "ODFVIEWINTERNALFILE",
        data,
        globalreadfunction,
        globalfilesizefunction,
        odfcanvas;
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
            odfcanvas = new odf.OdfCanvas(Ext.getCmp('webodf').element.dom);
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
    return {
        extend: 'Ext.Container',
        xtype: 'odfview',
        config: {
            scrollable: 'both',
            items: [{
                id: 'webodf'
            }]
        },
        updateRecord: function (record) {
            setRecord(record);
            load(record.get('fullPath'));
        }
    };
}()));
