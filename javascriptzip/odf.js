Ext.BLANK_IMAGE_URL = './ext/resources/images/default/s.gif';

Ext.onReady(function(){

  var tree = new Ext.tree.TreePanel({
    region:'west',
    width:200,
    split:true,
    collapsible:true,
    rootVisible: false,
    root: { nodeType: 'node' },
  });
  var panel = new Ext.Panel({
    layout:'border',
    height:1000,
    //autoHeight:true,
    renderTo:Ext.getBody(),
    items:[
      {region:'center',layout:'fit',frame:true,border:false},
      tree
    ]
  });

  // put data in the tree
  fillTree(tree.getRootNode(), './a/b/');
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

function getTree(url) {
  var tree = [];
  var list = getDirList(url);
  var root = getRoot(list);
  var foundfile = false;
  for (var i in list) {
    if (typeof list[i] != 'string' || list[i] == root) continue;
    var children = getTree(list[i]);
    if (!children) continue;
    foundfile = true;
    var entry = new Object();
    var text = list[i].substr(root.length);
    entry.id = list[i];
    entry.text = text.substr(0, text.length-1);
    entry.cls = 'folder';
    entry.editable = false;
    entry.children = children;
    tree[tree.length] = entry;
  }
  list = getOdtList(url);
  for (var i in list) {
    if (typeof list[i] != 'string') continue;
    var entry = new Object();
    entry.id = list[i];
    entry.text = list[i].substr(root.length);
    entry.cls = 'file';
    entry.leaf = true;
    entry.editable = false;
    entry.listeners = { click: function(node) { loadODF(node.id); } };
    entry.href = 'odf.html#'+list[i]
    tree[tree.length] = entry;
    foundfile = true;
  }
  if (foundfile) return tree;
  return null;
}

function fillTree(root, dir) {
  var filetree = getTree('./a/');
  if (filetree) {
    root.appendChild(filetree);
  }
}

function loadODF(url) {
//  alert(url);
}
