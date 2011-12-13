/*global Ext, app, runtime, core, odf, window, FileReader, console*/
app.views.OdfView = Ext.extend(Ext.Panel, (function () {
    "use strict";
    var record,
        odfcanvas,
        currentPath,
        data;
    function setRecord(r) {
        record = r;
    }
    function initCanvas() {
        var cmp;
        if (odfcanvas === undefined) {
            runtime.read = function (path, offset, length, callback) {
                if (path !== currentPath) {
                    return callback("File is not available.");
                }
                callback(null, data.slice(offset, offset + length));
            };
            runtime.getFileSize = function(path, callback) {
                if (path !== currentPath) {
                    return callback("File is not available.");
                }
                callback(data.length);
            };
            odfcanvas = null;
        }
        if (!odfcanvas) {
            cmp = Ext.getCmp('webodf');
            if (cmp && cmp.el && cmp.el.dom) {
                odfcanvas = new odf.OdfCanvas(cmp.el.dom);
            }
        }
    }
    function load(path) {
        function initCanvasAndLoad() {
            if (odfcanvas) {
                odfcanvas.load(path);                
            } else {
                initCanvas();
                window.setTimeout(initCanvasAndLoad, 100);
            }
        }
        window.resolveLocalFileSystemURI("file://" + path, function (file) {
            var reader = new FileReader();
            reader.onloadend = function(evt) {
                var b = new core.Base64();
                currentPath = path;
                data = evt.target.result;
                data = data.substr(data.indexOf(",") + 1);
                data = b.convertBase64ToUTF8Array(data);
                initCanvasAndLoad();
            };
            //reader.readAsBinaryString(file);
            //reader.readAsArrayBuffer(file);
            // so far phonegap is very limited, ideally it would implement
            // readAsArrayBuffer and slice() on the File object
            reader.readAsDataURL(file);
        }, function () {
            console.log("COULD NOT RESOLVE " + path);
        });
    }
    
    return {
        dockedItems: [{
            xtype: 'toolbar',
            title: 'ODF',
            items: [{
                text: 'Back',
                ui: 'back',
                listeners: {
                    'tap': function () {
                        Ext.dispatch({
                            controller: app.controllers.files,
                            action: 'show',
                            id: record.getId(),
                            animation: {type:'slide', direction:'right'}
                        });
                    }
                }
            }]
        }],
        scroll: 'both',
        items: [{
            xtype: 'box',
            autoEl: {
                tag: 'div',
                frameBorder: 0,
                style: {border: '0 none'}
            },
            id: 'webodf'
        }],
        updateWithRecord: function(record) {
            setRecord(record);
            var toolbar = this.getDockedItems()[0];
            toolbar.setTitle(record.get('fileName'));
            load(record.get('fullPath'));
        }
    };
}()));
