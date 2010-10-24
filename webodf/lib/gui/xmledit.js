/*global exports require*/
function createXMLEdit(element, stylesheet, listener) {
    var that = {},
        simplecss,
        cssprefix,
        originalDocument;

    element.id = "xml" + Math.floor(Math.random() * 10000);
    element.contentEditable = true;
    cssprefix = "#" + element.id + " ";

    function installHandlers() {
    }

    // generic css for doing xml formatting: color tags and do indentation
    simplecss = cssprefix + "* {display:block; margin-left: 10px;}\n" +
        cssprefix + ":before {color: blue;}\n" +
        cssprefix + ":after {color: blue;}\n";

    function getTagNames(node, prefixes, tagnames) {
        var n = node.firstChild,
            localnames, atts, att, i, ns;
        while (n && n !== node) {
            if (n.nodeType === 1) {
                getTagNames(n, prefixes, tagnames);
                ns = n.namespaceURI || "";
                localnames = tagnames[ns];
                if (!localnames) {
                    localnames = {};
                    tagnames[ns] = localnames;
                }
                if (!(n.namespaceURI in prefixes)) {
                    prefixes[ns] = null;
                }
                localnames[n.localName] = null;
                atts = n.attributes;
                for (i = atts.length - 1; i >= 0; i -= 1) {
                    att = atts.item(i);
                    if (att.namespaceURI === "http://www.w3.org/2000/xmlns/") {
                        if (!(att.localName in prefixes)) {
                            prefixes[att.nodeValue] = att.localName;
                        }
                    }
                }
            }
            n = n.nextSibling || n.parentNode;
        }
    }

    function generateMissingOrDoublePrefixes(prefixes) {
        var taken = {},
            p, i = 0;
        for (p in prefixes) {
            if (p && (prefixes[p] in taken || prefixes[p] === null ||
                    prefixes[p] === "xmlns")) {
                prefixes[p] = "ns" + i;
                i += 1;
            } else {
                taken[p] = null;
            }
        }
    }

    function createCssFromXmlInstance(node) {
        // collect all prefixes and elements
        var prefixes = {},
            tagnames = {},
            css = "",
            name, pre, ns, names, csssel;
        getTagNames(node, prefixes, tagnames);
        generateMissingOrDoublePrefixes(prefixes);
        for (name in prefixes) {
            if (name && prefixes.hasOwnProperty(name)) {
                css = css + "@namespace " + prefixes[name] + " url(" + name +
                        ");\n";
            }
        }
        for (ns in tagnames) {
            if (tagnames.hasOwnProperty(ns)) {
                if (ns) {
                    pre = cssprefix + prefixes[ns] + "|";
                } else {
                    pre = cssprefix;
                }
                names = tagnames[ns];
                for (name in names) {
                    if (names.hasOwnProperty(name)) {
                        csssel = pre + name;
                        css = css + csssel + ":before { content: '<" + name +
                                ">';}\n" + csssel + ":after { content: '</" +
                                name + ">';}\n";
                    }
                }
            }
        }
        return css;
    }

    // Adapt the CSS to the current settings.
    function updateCSS() {
        var css = element.ownerDocument.createElement("style"),
            text = createCssFromXmlInstance(element);
        css.type = "text/css";
        text = text + simplecss;
        css.appendChild(element.ownerDocument.createTextNode(text));
        stylesheet = stylesheet.parentNode.replaceChild(css, stylesheet);
    }
    function getXML() {
        return "<a/>";
    }
    function setXML(xml) {
        var node = element.ownerDocument.importNode(xml.documentElement, true);
        originalDocument = xml;
        while (element.lastChild) {
            element.removeChild(element.lastChild);
        }
        element.appendChild(node);

        updateCSS();
    }

    that.updateCSS = updateCSS;
    that.setXML = setXML;
    that.getXML = getXML;
    return that;
}
exports.createXMLEdit = createXMLEdit;
