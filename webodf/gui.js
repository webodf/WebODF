/*global Ext runtime core listFiles*/
runtime.loadClass("core.Zip");
runtime.loadClass("core.Base64");

/**
 * @param {Ext.data.Model} node
 * @return {undefined}
 */
function addThumbnail(node) {
    var url = node.get('id'), zip;
/*
    zip = new core.Zip(url, function (err, zipobject) {
        zip = zipobject;
        if (err) {
            return;
        }
        zip.load('Thumbnails/thumbnail.png', function (err, data) {
            if (data === null) {
                return;
            }
            var url = 'data:;base64,' +
                    (new core.Base64()).convertUTF8ArrayToBase64(data),
                el, spans, i, s;
            el = node.getUI().getEl();
            if (el) {
                spans = el.getElementsByTagName('span');
                for (i = 0; i < spans.length; i += 1) {
                    s = spans.item(i);
                    if (s.getAttribute('qtip')) {
                        s.setAttribute('qtip', node.attributes.qtip);
                    }
                }
            } else {
                node.attributes.qtip += '<br/><img src="' + url + '"/>';
            }
        });
    });
*/
}

/**
 * @param {!string} url
 * @param {!Ext.tab.Panel} panel
 * @param {!string} title
 * @return {undefined}
 */
function loadODF(url, panel, title) {
    var tab = panel.items.findBy(function (item) {
            return item.url === url;
        }),
        newTab;
    if (tab) {
        panel.setActiveTab(tab);
        return;
    }
    newTab = Ext.create('Ext.container.Container', {
        title: title,
        tabTip: url,
        url: url,
        closable: true,
        autoEl: {
            tag: 'iframe',
            name: url,
            src: 'odf.html#' + url,
            frameBorder: 0,
            style: {
                border: '0 none'
            }
        },
        region: 'center'
    });
    panel.add(newTab);
    panel.setActiveTab(newTab);
}

Ext.onReady(function () {
    var editButton, tabpanel, slider, tree, viewport;

    Ext.QuickTips.init();

    /**
     * @param {!Ext.Button} button
     * @param {!boolean} pressed
     * @return {undefined}
     */
    function editToggle(button, pressed) {
        var tab = tabpanel.getActiveTab();
        if (!tab) {
            return;
        }
        tab.el.dom.contentDocument.body.contentEditable = pressed;
    }

    /**
     * @param {!Object} slider
     * @param {!number} zoomlevel
     * @param {!Object} thumb
     * @return {undefined}
     */
    function setZoom(slider, zoomlevel, thumb) {
        var tab = tabpanel.getActiveTab(),
            body;
        if (!tab) {
            return;
        }
        body = tab.el.dom.contentDocument.body;
        zoomlevel = Math.pow(10, zoomlevel / 10.0);
        body.style.zoom = zoomlevel;
        body.style.MozTransform = 'scale(' + zoomlevel + ')';
    }

    /**
     * @param {!Ext.data.NodeInterface} root
     * @param {!string} uri
     * @return {!Ext.data.NodeInterface}
     */
    function getParentNode(root, uri) {
        var parts = uri.split('/'),
            node = root,
            id = parts[0],
            i,
            n;
        for (i = 1; i < parts.length - 1; i += 1) {
            n = node.findChild('text', parts[i], false);
            id += '/' + parts[i];
            if (!n) {
                n = {
                    id: id,
                    text: parts[i],
                    qtip: uri,
                    cls: 'folder'
                };
                n = node.appendChild(n);
            }
            node = n;
        }
        return node;
    }

    /**
     * @param {!Array.<!string>} directories
     * @param {!Array.<!string>} files
     * @return {undefined}
     */
    function listFilesCallback(directories, files) {
        var root = tree.getRootNode(),
            i,
            f,
            parentNode,
            qtip,
            node;
        for (i = 0; i < files.length; i += 1) {
            f = files[i];
            parentNode = getParentNode(root, f);
            qtip = f;
            node = parentNode.appendChild({
                id: f,
                qtip: qtip,
                text: f.substr(f.lastIndexOf('/') + 1),
                cls: 'file',
                leaf: true,
                editable: false
            });
            f = /**@type{!Ext.data.Model}*/(node);
            addThumbnail(f);
        }
    }

    /**
     * @return {undefined}
     */
    function listFilesDoneCallback() {
    }

    editButton = new Ext.Button({
        enableToggle: true,
        text: 'Editable',
        listeners: { toggle: { fn: editToggle } }
    });

    slider = new Ext.Slider({
        width: 300,
        minValue: -5,
        maxValue: 5,
        values: [0],
        listeners: { changecomplete: { fn: setZoom } }
    });

    tabpanel = Ext.create('Ext.tab.Panel', {
        tbar: [ 'Zoom: ', slider, editButton ],
        region: 'center'
    });

    tree = Ext.create('Ext.tree.Panel', {
        title: 'Documents',
        region: 'west',
        width: 200,
        split: true,
        autoScroll: true,
        collapsible: true,
        rootVisible: false,
        enableTabScroll: true,
        defaults: {autoScroll: true},
        listeners: {
            itemclick: function (view, rec) {
                if (rec.get('cls') === 'file') {
                    loadODF(rec.get('id'), tabpanel, rec.get('text'));
                } else if (rec.get('cls') === 'folder') {
                    if (rec.isExpanded()) {
                        rec.collapse();
                    } else {
                        rec.expand();
                    }
                }
            }
        },
        root: { nodeType: 'node' }
    });

    viewport = new Ext.Viewport({
        layout: 'border',
        items: [ tabpanel, tree ]
    });

    // put data in the tree
    listFiles('./DeltaXML-TC4/', /\.od[tps]$/i, listFilesCallback,
            listFilesDoneCallback);
});
