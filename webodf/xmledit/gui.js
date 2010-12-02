/*global Ext runtime gui*/
runtime.loadClass("gui.XMLEdit");

Ext.BLANK_IMAGE_URL = '../extjs/resources/images/default/s.gif';

function createXMLEdit(element, url) {
    var head = element.ownerDocument.getElementsByTagName("head")[0],
        xmlcss = element.ownerDocument.createElement("style"),
        xmledt;

    xmlcss.type = "text/css";
    head.appendChild(xmlcss);
    xmledt = new gui.XMLEdit(element, xmlcss);
    runtime.loadXML(url, function (xml) {
        if (xml.documentElement) {
            xmledt.setXML(xml);
        }
    });
}

function loadXML(url, panel, title) {
    title = title || url;
    var tab = panel.find('url', url),
        t,
        newTab,
        xmledt;
    if (tab.length) {
        for (t in tab) {
            if (typeof tab[t] === 'object') {
                panel.setActiveTab(tab[t]);
                return;
            }
        }
    }
    newTab = new Ext.BoxComponent({
        title: title,
        tabTip: url,
        url: url,
        closable: true,
        autoEl: {
            tag: 'div'
        },
        region: 'center'
    });
    panel.add(newTab);
    panel.setActiveTab(newTab);

    createXMLEdit(newTab.el.dom, url);
}

Ext.onReady(function () {
    var tabpanel, tree, viewport, attributeEditor;

    Ext.QuickTips.init();

    tabpanel = new Ext.TabPanel({
        tbar: [  ],
        region: 'center'
    });

    attributeEditor = new Ext.grid.PropertyGrid({
        title: 'Attributes',
        region: 'east',
        width: 200,
        split: true,
        autoScroll: true,
        collapsible: true,
        rootVisible: false,
        enableTabScroll: true,
        defaults: {autoScroll: true}
    });

    tree = new Ext.tree.TreePanel({
        title: 'Documents',
        region: 'west',
        width: 200,
        split: true,
        autoScroll: true,
        collapsible: true,
        rootVisible: false,
        enableTabScroll: true,
        defaults: {autoScroll: true},
        root: { nodeType: 'node' }
    });

    viewport = new Ext.Viewport({
        layout: 'border',
        items: [ tabpanel, tree, attributeEditor ]
    });

    // load the xml
    loadXML('requirements.xml', tabpanel);
    loadXML('../content.xml', tabpanel);
});
