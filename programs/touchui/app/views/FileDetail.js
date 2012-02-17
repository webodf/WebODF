/*global Ext, app, runtime, xmldom, odf*/
runtime.loadClass("xmldom.XPath");
runtime.loadClass("odf.Style2CSS");
Ext.define('WebODFApp.view.FileDetail', (function () {
    "use strict";
    var panel,
        style2CSS = new odf.Style2CSS(),
        xpath = new xmldom.XPath();
    function updatePanel() {
        var canvas = app.views.OdfCanvas,
            odfContainer = canvas && canvas.odfContainer(),
            rootElement = odfContainer && odfContainer.rootElement,
            state,
            title,
            ps;
        if (odfContainer) {
            state = odfContainer.state;
        }
        if (rootElement) {
            ps = xpath.getODFElementsWithXPath(rootElement,
                ".//text:h", style2CSS.namespaceResolver);
            title = "";
            if (ps && ps.length) {
                title = ps[0].nodeValue;
            } else {
                ps = xpath.getODFElementsWithXPath(rootElement,
                    ".//text:p", style2CSS.namespaceResolver);
                if (ps && ps.length) {
                    title = ps[0].nodeValue;
                }
            }
        }
        panel.update({state: state, title: title});
    }
    return {
        extend: 'Ext.Panel',
        xtype: 'filedetail',
        layout: 'vbox',
        config: {
            title: 'File details',
            items: [{
                html: 'in progress'
            }]
        },
        updateRecord: function (record) {
            if (record) {
                this.setTitle(record.get('fileName'));
            }
        }
    };
}()));
