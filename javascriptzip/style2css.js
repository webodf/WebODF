function style2css(stylesheet, stylesxmldom) {

  // helper constants

  var stylens = "urn:oasis:names:tc:opendocument:xmlns:style:1.0";
  var officens = "urn:oasis:names:tc:opendocument:xmlns:office:1.0";
  var textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";
  var fons="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0";
  var drawns="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0";
  var tablens="urn:oasis:names:tc:opendocument:xmlns:table:1.0";
  var namespaces = {
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
  ];

  var paragraphPropertySimpleMapping = [
    [ fons, 'text-align', 'text-align' ],
    [ fons, 'padding-left', 'padding-left' ],
    [ fons, 'padding-right', 'padding-right' ],
    [ fons, 'padding-top', 'padding-top' ],
    [ fons, 'padding-bottom', 'padding-bottom' ],
  ];

  // make stylesheet empty
  while (stylesheet.cssRules.length) {
    stylesheet.deleteRule(stylesheet.cssRules.length-1);
  }

  var doc = stylesxmldom.ownerDocument;

  // add @namespace rules
  var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
  for (var prefix in namespaces) {
    var rule = '@namespace ' + prefix + ' url(' + namespaces[prefix] + ')';
    if (!is_chrome) { // TODO find workaround for chrome
      stylesheet.insertRule(rule, stylesheet.cssRules.length);
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
    if (rule.length == 0) {
      return null;
    }
    return selector + '{' + rule + '}';
  }

  function getTextProperties(props) {
    var rule = '';
    rule += applySimpleMapping(props, textPropertySimpleMapping);
    var value;
    value = props.getAttributeNS(stylens, 'text-underline-style');
    if (value == 'solid') {
      rule += 'text-decoration: underline;';
    }
    return rule;
  }

  function applySimpleMapping(props, mapping) {
    var rule = '';
    for (var r in mapping) {
      var value = props.getAttributeNS(r[0], r[1]);
      if (value) {
        rule += r[2] + ':' + value + ';';
      }
    }
    return rule;
  }

  function getParagraphProperties(props) {
    var rule = '';
    rule += applySimpleMapping(props, paragraphPropertySimpleMapping);
    return rule;
  }

  // css vs odf styles
  // ODF styles occur in families. A family is a group of odf elements to
  // which an element applies. ODF families can be mapped to a group of css elements


  // initial implemenation doing just the text family



}
