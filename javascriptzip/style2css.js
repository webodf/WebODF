function style2css(stylesheet, stylesxmldom) {

  // helper constants
  var xlinkns = 'http://www.w3.org/1999/xlink';

  var stylens = "urn:oasis:names:tc:opendocument:xmlns:style:1.0";
  var officens = "urn:oasis:names:tc:opendocument:xmlns:office:1.0";
  var textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";
  var fons="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0";
  var drawns="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0";
  var tablens="urn:oasis:names:tc:opendocument:xmlns:table:1.0";
  var namespaces = {
    xlink: xlinkns,
    draw: drawns,
    fo: fons,
    office: officens,
    style: stylens,
    table: tablens,
    text: textns,
  };

  var familynamespaceprefixes = {
    graphic: 'draw',
    paragraph: 'text',
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
    [ xlinkns, 'href', 'background-image' ]
  ];

  var paragraphPropertySimpleMapping = [
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
    [ fons, 'background-color', 'background-color' ],
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
  var doc = stylesxmldom.ownerDocument;
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
  var iter = doc.evaluate("style:style",
      stylesxmldom, namespaceResolver, XPathResult.ANY_TYPE, null);
  var i = iter.iterateNext();
  while (i) {
    var rule = createRule(i);
    if (rule) {
      try {
        stylesheet.insertRule(rule, stylesheet.cssRules.length);
      } catch (e) {
        throw e + ' ' + rule;
      }
    }
    i = iter.iterateNext();
  }
//  alert(stylesheet.cssRules.length + ' = count');
  return;

  // helper functions

  function createSelector(family, name) {
    var prefix = familynamespaceprefixes[family];
    if (prefix == null) return null;
    var namepart = '['+prefix+'|style-name="'+name+'"]';
    var selector = '';
    var first = true;
    return prefix+'|'+familytagnames[family].join(namepart+','+prefix+'|')
        + namepart;
  }

  function createRule(style) {
    var name = style.getAttributeNS(stylens, 'name');
    if (name == null) return null;
    var family = style.getAttributeNS(stylens, 'family');
    var selector = createSelector(family, name);
    if (selector == null) return null;

    var rule = '';
    var properties = style.getElementsByTagNameNS(stylens, 'text-properties');
    if (properties.length > 0) {
      rule += getTextProperties(properties.item(0));
    }
    properties = style.getElementsByTagNameNS(stylens, 'paragraph-properties');
    if (properties.length > 0) {
      rule += getParagraphProperties(properties.item(0));
    }
    properties = style.getElementsByTagNameNS(stylens, 'table-cell-properties');
    if (properties.length > 0) {
      rule += getTableCellProperties(properties.item(0));
    }
    if (rule.length == 0) {
      return null;
    }
    return selector + '{' + rule + '}';
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
        //var url = imageProps.item(0).getAttributeNS(xlinkns, 'href');
        var url = "http://chani.ca/avatar.png";
        rule += "background-image: url('" + url + "');";
        rule += "background-repeat: repeat;"; //FIXME test
    }
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


  // initial implemenation doing just the text family



}
