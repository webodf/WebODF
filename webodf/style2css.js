function style2css(stylesheet, styles, autostyles) {

  // helper constants
  var xlinkns = 'http://www.w3.org/1999/xlink';

  var drawns="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0";
  var fons="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0";
  var officens = "urn:oasis:names:tc:opendocument:xmlns:office:1.0";
  var presentationns="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0";
  var stylens = "urn:oasis:names:tc:opendocument:xmlns:style:1.0";
  var svgns = "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0";
  var tablens="urn:oasis:names:tc:opendocument:xmlns:table:1.0";
  var textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";
  var namespaces = {
    draw: drawns,
    fo: fons,
    office: officens,
    presentation: presentationns,
    style: stylens,
    table: tablens,
    text: textns,
  };

  var familynamespaceprefixes = {
    graphic: 'draw',
    paragraph: 'text',
    presentation: 'presentation',
    ruby: 'text',
    section: 'text',
    table: 'table',
    'table-cell': 'table',
    'table-column': 'table',
    'table-row': 'table',
    text: 'text'
  };

  var familytagnames = {
    graphic: ['frame'],
    paragraph: ['alphabetical-index-entry-template', 'h',
        'illustration-index-entry-template', 'index-source-style',
        'object-index-entry-template', 'p', 'table-index-entry-template',
        'table-of-content-entry-template', 'user-index-entry-template'],
    presentation: ['caption', 'circle', 'connector', 'control', 'custom-shape',
        'ellipse', 'frame', 'g', 'line', 'measure', 'page-thumbnail', 'path',
        'polygon', 'polyline', 'rect', 'regular-polygon'],
    ruby: ['ruby', 'ruby-text'],
    section: ['alphabetical-index', 'bibliography', 'illustration-index',
        'index-title', 'object-index', 'section', 'table-of-content',
        'table-index', 'user-index'],
    table: ['background', 'table'],
    'table-cell': ['body', 'covered-table-cell', 'even-columns', 'even-rows',
        'first-column', 'first-row', 'last-column', 'last-row', 'odd-columns',
        'odd-rows', 'table-cell'],
    'table-column': ['table-column'],
    'table-row': ['table-row'],
    text: ['a', 'index-entry-chapter', 'index-entry-link-end',
        'index-entry-link-start', 'index-entry-page-number', 'index-entry-span',
        'index-entry-tab-stop', 'index-entry-text', 'index-title-template',
        'linenumbering-configuration', 'list-level-style-number',
        'list-level-style-bullet', 'outline-level-style', 'span']
  };

  var textPropertySimpleMapping = [
    [ fons, 'color', 'color' ],
    // this sets the element background, not just the text background
    [ fons, 'background-color', 'background-color' ],
    [ fons, 'font-weight', 'font-weight' ],
    [ fons, 'font-style', 'font-style' ],
    [ fons, 'font-size', 'font-size' ]
  ];

  var bgImageSimpleMapping = [
    [ stylens, 'repeat', 'background-repeat' ]
  ];

  var paragraphPropertySimpleMapping = [
    [ fons, 'background-color', 'background-color' ],
    [ fons, 'text-align', 'text-align' ],
    [ fons, 'padding-left', 'padding-left' ],
    [ fons, 'padding-right', 'padding-right' ],
    [ fons, 'padding-top', 'padding-top' ],
    [ fons, 'padding-bottom', 'padding-bottom' ],
    [ fons, 'border-left', 'border-left' ],
    [ fons, 'border-right', 'border-right' ],
    [ fons, 'border-top', 'border-top' ],
    [ fons, 'border-bottom', 'border-bottom' ],
    [ fons, 'margin-left', 'margin-left' ],
    [ fons, 'margin-right', 'margin-right' ],
    [ fons, 'margin-top', 'margin-top' ],
    [ fons, 'margin-bottom', 'margin-bottom' ],
    [ fons, 'border', 'border' ],
  ];
  
  var graphicPropertySimpleMapping = [
    [ drawns, 'fill-color', 'background-color' ],
    [ fons, 'min-height', 'min-height' ],
    [ drawns, 'stroke', 'border' ],
    [ svgns, 'stroke-color', 'border-color' ],
  ];


  var tablecellPropertySimpleMapping = [
    [ fons, 'background-color', 'background-color' ],
    [ fons, 'border-left', 'border-left' ],
    [ fons, 'border-right', 'border-right' ],
    [ fons, 'border-top', 'border-top' ],
    [ fons, 'border-bottom', 'border-bottom' ],
  ];

  // make stylesheet empty
  while (stylesheet.cssRules.length) {
    stylesheet.deleteRule(stylesheet.cssRules.length-1);
  }
  var doc = styles.ownerDocument;
  // add @namespace rules
  for (var prefix in namespaces) {
    var rule = '@namespace ' + prefix + ' url(' + namespaces[prefix] + ')';
    try {
      stylesheet.insertRule(rule, stylesheet.cssRules.length);
    } catch (e) {
      // WebKit can throw an exception here, but it will have retained the
      // namespace declarations anyway.
    }
  }
  var namespaceResolver = function(prefix) {
    return namespaces[prefix];
  }
  
  // add the various styles
  stylenodes = getStyleMap(styles);
  styleautnodes = getStyleMap(autostyles);
  
  var styletree = {};
  for (var family in familynamespaceprefixes) {
    var tree = styletree[family] = {};
    addStyleMapToStyleTree(stylenodes[family], tree);
    addStyleMapToStyleTree(styleautnodes[family], tree);

    for (var name in tree) {
      addRules(stylesheet, family, name, tree[name]);
    }
  }
  return;
  
  // helper functions
  
  function getStyleMap(stylesnode) {
    // put all style elements in a hash map by family and name
    var stylemap = {};
    var iter = doc.evaluate("style:style", stylesnode, namespaceResolver, XPathResult.ANY_TYPE, null);
    var node = iter.iterateNext();
    while (node) {
      var name = node.getAttributeNS(stylens, 'name');
      var family = node.getAttributeNS(stylens, 'family');
      if (!stylemap[family]) {
        stylemap[family] = {};
      }
      stylemap[family][name] = node;
      node = iter.iterateNext();
    }
    return stylemap;
  }
  
  function findStyle(stylestree, name) {
    if (!name || !stylestree) return null;
    if (stylestree[name]) return stylestree[name];
    var derivedStyles = stylestree.derivedStyles;
    for (var n in stylestree) {
      var style = findStyle(stylestree[n].derivedStyles, name);
      if (style) {
        return style;
      }
    }
    return null;
  }
  
  function addStyleToStyleTree(stylename, stylesmap, stylestree) {
    var style = stylesmap[stylename];
    if (!style) {
      return;
    }
    var parentname = style.getAttributeNS(stylens, 'parent-style-name');
    var parentstyle = null;
    if (parentname) {
      parentstyle = findStyle(stylestree, parentname);
      if (!parentstyle && stylesmap[parentname]) {
        // parent style has not been handled yet, do that now
        addStyleToStyleTree(parentname, stylesmap, stylestree);
        parentstyle = stylesmap[parentname];
        stylesmap[parentname] = null;
      }
    }
    if (parentstyle) {
      if (!parentstyle.derivedStyles) {
        parentstyle.derivedStyles = {};
      }
      parentstyle.derivedStyles[stylename] = style;
    } else {
      // no parent so add the root
      stylestree[stylename] = style;      
    }
  }
  
  function addStyleMapToStyleTree(stylesmap, stylestree) {
    for (var name in stylesmap) {
      addStyleToStyleTree(name, stylesmap, stylestree);
      stylesmap[name] = null;
    }
  }
  
  function getSelectors(family, name, node) {
    var selectors = [];
    selectors.push(createSelector(family, name));
    for (var n in node.derivedStyles) {
      var ss = getSelectors(family, n, node.derivedStyles[n]);
      for (var s in ss) {
        selectors.push(ss[s]);
      }
    }
    return selectors;
  }
  
  function createSelector(family, name) {
    var prefix = familynamespaceprefixes[family];
    if (prefix == null) return null;
    var namepart = '['+prefix+'|style-name="'+name+'"]';
    if (prefix == 'presentation') {
		prefix = 'draw';
		namepart = '[presentation|style-name="'+name+'"]';
	}
    var selector = '';
    var first = true;
    return prefix+'|'+familytagnames[family].join(namepart+','+prefix+'|')
        + namepart;
  }
  
  function getDirectChild(node, ns, name) {
    if (!node) return null;
    var c = node.firstChild;
	while (c) {
      if (c.namespaceURI == ns && c.localName == name) {
		  return c;
	  }
	  c = c.nextSibling;
	}
  }
  
  function addRule(sheet, family, name, node) {
    var selectors = getSelectors(family, name, node);
    var selector = selectors.join(',');
    
    var rule = '';
    var properties = getDirectChild(node, stylens, 'text-properties');
    if (properties) {
      rule += getTextProperties(properties);
    }
    properties = getDirectChild(node, stylens, 'paragraph-properties');
    if (properties) {
      rule += getParagraphProperties(properties);
    }
    properties = getDirectChild(node, stylens, 'graphic-properties');
    if (properties) {
      rule += getGraphicProperties(properties);
    }
    properties = getDirectChild(node, stylens, 'table-cell-properties');
    if (properties) {
      rule += getTableCellProperties(properties);
    }
    if (rule.length == 0) {
      return;
    }
    rule = selector + '{' + rule + '}';
	try {
      stylesheet.insertRule(rule, stylesheet.cssRules.length);
	} catch (e) {
	  alert(rule);
	  throw e;
	}
	//if (rule.indexOf('presentation')!=-1){alert(rule);throw rule;}
  }
  
  function addRules(sheet, family, name, node) {
    addRule(sheet, family, name, node);
    for (var n in node.derivedStyles) {
      addRules(sheet, family, n, node.derivedStyles[n]);
    }
  }

  function applySimpleMapping(props, mapping) {
    var rule = '';
    for (var r in mapping) {
      r = mapping[r];
      var value = props.getAttributeNS(r[0], r[1]);
      if (value) {
        rule += r[2] + ':' + value + ';';
      }
    }
    return rule;
  }

  function getTextProperties(props) {
    var rule = '';
    rule += applySimpleMapping(props, textPropertySimpleMapping);
    var value;
    value = props.getAttributeNS(stylens, 'text-underline-style');
    if (value == 'solid') {
      rule += 'text-decoration: underline;';
    }
    value = props.getAttributeNS(stylens, 'font-name');
    if (value) {
      value = getFontDeclaration(value);
      if (value) {
        rule += 'font-family: ' + value + ';';
      }
    }
    return rule;
  }

  function getParagraphProperties(props) {
    var rule = '';
    rule += applySimpleMapping(props, paragraphPropertySimpleMapping);
    var imageProps = props.getElementsByTagNameNS(stylens, 'background-image');
    if (imageProps.length > 0) {
        var url = imageProps.item(0).getAttributeNS(xlinkns, 'href');
        if (url) {
            rule += "background-image: url('odfkit:" + url + "');";
            //rule += "background-repeat: repeat;"; //FIXME test
            rule += applySimpleMapping(imageProps.item(0), bgImageSimpleMapping);
        }
    }
    return rule;
  }

  function getGraphicProperties(props) {
    var rule = '';
    rule += applySimpleMapping(props, graphicPropertySimpleMapping);
    return rule;
  }
  
  function getTableCellProperties(props) {
    var rule = '';
    rule += applySimpleMapping(props, tablecellPropertySimpleMapping);
    return rule;
  }

  function getFontDeclaration(name) {
    return '"'+name+'"';
  }

  // css vs odf styles
  // ODF styles occur in families. A family is a group of odf elements to
  // which an element applies. ODF families can be mapped to a group of css elements

}
