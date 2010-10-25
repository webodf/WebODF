/*global exports require*/
function createXMLEdit(element, stylesheet, listener) {
    var that = {},
        simplecss,
        cssprefix,
        originalDocument,
        customNS = "customns";

    if (!element.id) {
        element.id = "xml" + Math.floor(Math.random() * 10000);
    }
    element.contentEditable = true;
    cssprefix = "#" + element.id + " ";

    function installHandlers() {
    }

    // generic css for doing xml formatting: color tags and do indentation
    simplecss = cssprefix + "*," + cssprefix + ":visited, " + cssprefix + ":link {display:block; margin: 0px; margin-left: 10px; font-size: medium; color: black; background: white; font-variant: normal; font-weight: normal; font-style: normal; font-family: sans-serif; text-decoration: none; white-space: pre;}\n" +
        cssprefix + ":before {color: blue;}\n" +
        cssprefix + ":after {color: blue;}\n" +
        cssprefix + "customns|atts {display:inline; margin: 0px; white-space: normal;}\n" +
        cssprefix + "customns|atts:after {content: '>';}\n" +
        cssprefix + "customns|attn {display:inline; margin: 0px; white-space: pre;}\n" +
        cssprefix + "customns|attn:before {content: '\\A        ';}\n" +
        cssprefix + "customns|attn:first-child:before {content: ' ';}\n" +
        cssprefix + "customns|attv {display:inline; margin: 0px; white-space: pre;}\n" +
        cssprefix + "customns|attv:before {content: '=\"';}\n" +
        cssprefix + "customns|attv:after {content: '\"';}\n" +
        cssprefix + "{overflow: auto;}\n";

    function listenEvent(eventTarget, eventType, eventHandler) {
        if (eventTarget.addEventListener) {
            eventTarget.addEventListener(eventType, eventHandler, false);
        } else if (eventTarget.attachEvent) {
            eventType = "on" + eventType;
            eventTarget.attachEvent(eventType, eventHandler);
        } else {
            eventTarget["on" + eventType] = eventHandler;
        }
    }
    function cancelEvent(event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    }
    
    function isCaretMoveCommand(charCode) {
        if (charCode >= 16 && charCode <= 20) {
            return true;
        }
        if (charCode >= 33 && charCode <= 40) { //arrows,home,end,pgup,pgdown
            return true;
        }
        return false;
    }
    
    function handleKeyDown(event) {
        //event = event || (window && window.event);
        var charCode = event.charCode || event.keyCode;
        if (isCaretMoveCommand(charCode)) {
            return;
        }
        cancelEvent(event);
    }
    
    function handleKeyPress(event) {
        handleKeyDown(event);
    }

    function initElement(element) {
        listenEvent(element, "keydown", handleKeyDown);
        listenEvent(element, "keypress", handleKeyPress);
        // ignore drop events, dragstart, drag, dragenter, dragover are ok for now
        listenEvent(element, "drop", cancelEvent);
        listenEvent(element, "dragend", cancelEvent);
        // pasting is also disallowed for now
        listenEvent(element, "beforepaste", cancelEvent);
        listenEvent(element, "paste", cancelEvent);
    }

    function cleanWhitespace(node) {
        var n = node.firstChild, p,
            re = /^\s*$/;
        while (n && n !== node) {
            cleanWhitespace(n);
            p = n;
            n = n.nextSibling || n.parentNode;
            if (p.nodeType === 3 && re.test(p.nodeValue)) {
                p.parentNode.removeChild(p);
            }
        }
    }

    function addExplicitAttributes(node) {
        var n = node.firstChild,
            atts, attse, a, i, e, d, ref;
        d = node.ownerDocument;
        while (n && n !== node) {
            if (n.nodeType === 1) {
                addExplicitAttributes(n);
            }
            n = n.nextSibling || n.parentNode;
        }
        atts = node.attributes;
        attse = d.createElementNS(customNS, "atts");
        for (i = atts.length - 1; i >= 0; i -= 1) {
            a = atts.item(i);
            e = d.createElementNS(customNS, "attn");
            e.appendChild(d.createTextNode(a.nodeName));
            attse.appendChild(e);
            e = d.createElementNS(customNS, "attv");
            e.appendChild(d.createTextNode(a.nodeValue));
            attse.appendChild(e);
        }
        node.insertBefore(attse, node.firstChild);
    }

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
            css = "@namespace customns url(customns);\n",
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
                                "';}\n" + csssel + ":after { content: '</" +
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

        cleanWhitespace(node);

        originalDocument = xml;
        while (element.lastChild) {
            element.removeChild(element.lastChild);
        }
        element.appendChild(node);

        updateCSS();

        addExplicitAttributes(node);
    }

    initElement(element);

    that.updateCSS = updateCSS;
    that.setXML = setXML;
    that.getXML = getXML;
    return that;
}
exports.createXMLEdit = createXMLEdit;
