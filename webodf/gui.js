Ext.BLANK_IMAGE_URL = 'extjs/resources/images/default/s.gif';

Ext.onReady(function(){

  Ext.QuickTips.init();

  var slider = new Ext.Slider({
    width: 300,
    minValue: -5,
    maxValue: 5,
    values: [0],
    listeners: { changecomplete: { fn: setZoom } }
  });

  function setZoom(a, zoomlevel, b) {
    var tab = tabpanel.getActiveTab();
    if (!tab) return;
    var body = tab.el.dom.contentDocument.body;
    zoomlevel = Math.pow(10, zoomlevel/10.0);
    body.style.zoom = zoomlevel;
    body.style.MozTransform = 'scale('+zoomlevel+')';
  }

  var editButton = new Ext.Button({
    enableToggle: true,
    text: 'Editable',
    listeners: { toggle: { fn: editToggle } }
  });

  function editToggle(a, pressed) {
    var tab = tabpanel.getActiveTab();
    if (!tab) return;
    tab.el.dom.contentDocument.body.contentEditable = pressed;
  }

  var tabpanel = new Ext.TabPanel({
    tbar: [ 'Zoom: ', slider, editButton ],
    region:'center',
  });

  var tree = new Ext.tree.TreePanel({
    title: 'Documents',
    region: 'west',
    width: 200,
    split: true,
    autoScroll: true,
    collapsible: true,
    rootVisible: false,
    enableTabScroll:true,
    defaults: {autoScroll:true},
    root: { nodeType: 'node' },
  });

  var viewport = new Ext.Viewport({
    layout: 'border',
    items: [ tabpanel, tree ]
  });

  function getParentNode(root, uri) {
    var parts = uri.split('/');
    var node = root;
    var id = parts[0];
    for (var i = 1; i<parts.length-1; ++i) {
      var n = node.findChild('text', parts[i], false);
      id += '/' + parts[i];
      if (!n) {
        n = {
          id: id,
          text: parts[i],
          qtip: uri,
          cls: 'folder',
          editable: false,
          nodeType: 'node',
          singleClickExpand: true,
          listeners: {
            beforechildrenrendered: loadThumbnails
          }
        };
        n = node.appendChild(n);
      }
      node = n;
    }
    return node;
  }

  function listFilesCallback(directories, files) {
    var root = tree.getRootNode();
    for (var i = 0; i < files.length; i += 1) {
      var f = files[i];
      var parentNode = getParentNode(root, f);
      var qtip = f;
      var node = parentNode.appendChild({
        id: f,
        qtip: qtip,
        text: f.substr(f.lastIndexOf('/')+1),
        cls: 'file',
        leaf: true,
        editable: false,
        listeners: {
          click: function(node) { loadODF(node.id, tabpanel, node.text); }
        }
      });
//        addThumbnail(node);
    }
  }
  function listFilesDoneCallback() {
  }

  function loadThumbnails(node) {
    for (var n in node.childNodes) {
      n = node.childNodes[n];
      if (n.leaf) {
        try {
          addThumbnail(n);
        } catch (e) {
        }
      }
    }
  }

  // put data in the tree
  listFiles('./kofficetests/', /\.od[tps]$/i, listFilesCallback,
      listFilesDoneCallback);
});

function addThumbnail(node) {
  var url = node.id;
  var zip = new Zip(url, function(zip) {
    zip.load('Thumbnails/thumbnail.png', function(data) {
      if (data == null) return;
      var url = 'data:;base64,' + Base64.toBase64(data);
      node.attributes.qtip += '<br/><img src="' + url + '"/>';
      var el = node.getUI().getEl();
      var spans = el.getElementsByTagName('span');
      for (var i = 0; i < spans.length; i++) {
        var s = spans.item(i);
        if (s.getAttribute('qtip')) {
          s.setAttribute('qtip', node.attributes.qtip);
        }
      }
    });
  });
}

function loadODF(url, panel, title) {
  var tab = panel.find('url', url);
  if (tab.length) {
    for (var t in tab) {
      if (typeof tab[t] == 'object') {
        panel.setActiveTab(tab[t]);
        return;
      }
    }
  }
  var newTab = new Ext.BoxComponent({
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
