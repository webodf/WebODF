/*global Ext, app, runtime, xmldom, odf*/
runtime.loadClass("xmldom.XPath");
runtime.loadClass("odf.Style2CSS");
app.views.FileDetail = Ext.extend(Ext.Panel, (function () {
    "use strict";
    var panel,
        style2CSS = new odf.Style2CSS(),
        xpath = new xmldom.XPath();
    function updatePanel() {
        var canvas = app.views.OdfCanvas,
            odfContainer = canvas && canvas.odfContainer(),
            rootElement = odfContainer && odfContainer.rootElement,
            state,
            title, ps;
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
        dockedItems: [{
            xtype: 'toolbar',
            title: 'View file',
            items: [
                {
                    text: 'Back',
                    ui: 'back',
                    listeners: {
                        'tap': function () {
                            Ext.dispatch({
                                controller: app.controllers.files,
                                action: 'index',
                                animation: {type:'slide', direction:'right'}
                            });
                        }
                    }
                },
                {xtype:'spacer'},
                {
                    id: 'open',
                    text: 'Open',
                    ui: 'action',
                    listeners: {
                        'tap': function () {
                            Ext.dispatch({
                                controller: app.controllers.files,
                                action: 'open',
                                id: this.record.getId()
                            });
                        }
                    }
                }
            ]
        }],
        styleHtmlContent:true,
        scroll: 'vertical',
        tpl:[
            '<h4>Info</h4>',
            '<p>state: {state}</p>',
            '<p>title: {title}</p>'
        ],
        updateWithRecord: function(record) {
            panel = this;
            var toolbar = panel.getDockedItems()[0];
            toolbar.setTitle(record.get('fileName'));
            toolbar.getComponent('open').record = record;
            app.loadDocument(record.get('fullPath'), updatePanel);
            updatePanel();
        }
    };
}()));
