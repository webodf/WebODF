Ext.BLANK_IMAGE_URL = './ext/resources/images/default/s.gif';

Ext.onReady(function(){

  Ext.QuickTips.init();

  var tabpanel = new Ext.TabPanel({
    region:'center',
  });

  var tree = new Ext.tree.TreePanel({
    title: 'Documents',
    region: 'west',
    width: 200,
    split: true,
    collapsible: true,
    rootVisible: false,
    enableTabScroll:true,
    defaults: {autoScroll:true},
    root: { nodeType: 'node' },
  });

  var thumbgrid = new Ext.Panel({
    width: 200,
    split: true,
    collapsible: true,
    region: 'east',
    title: 'Animated DataView',
    layout: 'fit',
    //    items : dataview,
  });

  var viewport = new Ext.Viewport({
    layout: 'border',
    items: [ tabpanel, tree ]
  });

  // put data in the tree
  fillTree(tree.getRootNode(), './a/', tabpanel);
});

function getFileList(url, suffix) {
  var req = new XMLHttpRequest();
  req.open('PROPFIND', url, false);
  req.setRequestHeader('Depth', '1');
  req.send();
  if (req.status < 200 || req.status >= 300) {
    throw new Error(req.status + ' ' + req.statusText + ' ' + req.responseText);
  }
  var xml = req.responseXML;
  if (!xml) {
    throw new Error('No proper XML response.');
  }
  var refs = xml.getElementsByTagNameNS('DAV:', 'href');
  var list = [];
  var len = suffix.length;
  for (var i in refs) {
    if (refs[i].firstChild) {
      var name = refs[i].firstChild.nodeValue;
      if (name.substr(name.length-len) == suffix) {
        list[list.length] = name;
      }
    }
  }
  return list;
}

function getRoot(list) {
  var root = '';
  var minlength = 9999;
  for (var i in list) {
    if (typeof list[i] != 'string') continue;
    if (list[i].length < minlength) {
      root = list[i];
      minlength = root.length;
    }
  }
  for (var i in list) {
    if (typeof list[i] != 'string') continue;
    if (list[i].substr(0, root.length) != root) {
      return '';
    }
  }
  return root;
}

function getDirList(url) {
  return getFileList(url, '/');
}

function getOdtList(url) {
  return getFileList(url, '.odt');
}

function getThumbUrl(url) {
  var data;
  try {
    var zip = new jsodfkit.Zip(url);
    data = zip.load('Thumbnails/thumbnail.png');
  } catch (e) {
  }
  if (data) {
      return 'data:;base64,' + Base64.toBase64(data);
  }
  return null;
}

function getTree(url, tabpanel) {
  var tree = [];
  var list = getDirList(url);
  var root = getRoot(list);
  var foundfile = false;
  for (var i in list) {
    if (typeof list[i] != 'string' || list[i] == root) continue;
    var children = getTree(list[i], tabpanel);
    if (!children) continue;
    var text = list[i].substr(root.length);
    tree[tree.length] = ({
      id: list[i],
      qtip: list[i],
      text: text.substr(0, text.length-1),
      cls: 'folder',
      editable: false,
      children: children
    });
    foundfile = true;
  }
  list = getOdtList(url);
  for (var i in list) {
    if (typeof list[i] != 'string') continue;
    var qtip = list[i];
    var thumbdataurl = getThumbUrl(list[i]);
    if (thumbdataurl) {
      qtip += '<img src="' + thumbdataurl + '"/>';
    }
    tree[tree.length] = ({
      id: list[i],
      qtip: qtip,
      text: list[i].substr(root.length),
      cls: 'file',
      leaf: true,
      editable: false,
      listeners: {
        click: function(node) { loadODF(node.id, tabpanel, node.text); }
      }
    });
    foundfile = true;
  }
  if (foundfile) return tree;
  return null;
}

function fillTree(root, dir, tabpanel) {
  var filetree = getTree('./a/', tabpanel);
  if (filetree) {
    root.appendChild(filetree);
  }
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
