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
    simplecss = cssprefix + "*," + cssprefix + ":visited, " + cssprefix + ":link {display:block; margin: 0px; margin-left: 10px; font-size: medium; color: black; background: white; font-variant: normal; font-weight: normal; font-style: normal; font-family: sans-serif; text-decoration: none; white-space: pre-wrap; height: auto; width: auto}\n" +
        cssprefix + ":before {color: blue; content: '<' attr(customns_name) attr(customns_atts) '>';}\n" +
        cssprefix + ":after {color: blue; content: '</' attr(customns_name) '>';}\n" +
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
        var charCode = event.charCode || event.keyCode;
        if (isCaretMoveCommand(charCode)) {
            return;
        }
        cancelEvent(event);
    }

    function handleKeyPress(event) {
        handleKeyDown(event);
    }

    function handleClick(event) {
        var sel = element.ownerDocument.defaultView.getSelection(),
            r = sel.getRangeAt(0),
            n = r.startContainer;
        // if cursor is in customns node, move up to the top one
        if (n.parentNode.namespaceURI === customNS) {
            while (n.parentNode.namespaceURI === customNS) {
                n = n.parentNode;
            }
            r = n.ownerDocument.createRange();
            r.setStart(n.nextSibling, 0);
            r.collapse(true);
            sel.removeAllRanges();
            sel.addRange(r);
        }
    }

    function initElement(element) {
        listenEvent(element, "click", handleClick);
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
            atts, attsv, a, i, d;
        d = node.ownerDocument;
        while (n && n !== node) {
            if (n.nodeType === 1) {
                addExplicitAttributes(n);
            }
            n = n.nextSibling || n.parentNode;
        }
        atts = node.attributes;
        attsv = "";
        for (i = atts.length - 1; i >= 0; i -= 1) {
            a = atts.item(i);
            attsv = attsv + " " + a.nodeName + "=\"" + a.nodeValue + "\"";
        }
        node.setAttribute("customns_name", node.nodeName);
        node.setAttribute("customns_atts", attsv);
    }

    function getNamespacePrefixes(node, prefixes) {
        var n = node.firstChild, atts, att, i;
        while (n && n !== node) {
            if (n.nodeType === 1) {
                getNamespacePrefixes(n, prefixes);
                atts = n.attributes;
                for (i = atts.length - 1; i >= 0; i -= 1) {
                    att = atts.item(i);
                    // record the prefix that the document uses for namespaces
                    if (att.namespaceURI === "http://www.w3.org/2000/xmlns/") {
                        if (!prefixes[att.nodeValue]) {
                            prefixes[att.nodeValue] = att.localName;
                        }
                    }
                }
            }
            n = n.nextSibling || n.parentNode;
        }
    }

    function generateUniquePrefixes(prefixes) {
        var taken = {},
            ns, p, i = 0;
        for (ns in prefixes) {
            if (ns) {
                p = prefixes[ns];
                if (!p || p in taken || p === "xmlns") {
                    do {
                        p = "ns" + i;
                        i += 1;
                    } while (p in taken);
                    prefixes[ns] = p;
                }
                taken[p] = true;
            }
        }
    }

    // the CSS neededed for the XML edit view depends on the prefixes
    function createCssFromXmlInstance(node) {
        // collect all prefixes and elements
        var prefixes = {},    // namespace prefixes as they occur in the XML
            css = "@namespace customns url(customns);\n",
            name, pre, ns, names, csssel;
        getNamespacePrefixes(node, prefixes);
        generateUniquePrefixes(prefixes);
/*
        for (ns in prefixes) {
            if (ns) {
                css = css + "@namepace " + prefixes[ns] + " url(" + ns + ");\n";
            }
        }
        for (ns in prefixes) {
            if (ns) {
                pre = cssprefix + prefixes[ns] + "|";
                css = css + pre + ":before { content: '<" + prefixes[ns] +
                        ":' attr(customns_name); }\n" +
                        pre + ":after { content: '</" + prefixes[ns] +
                        ":' attr(customns_name) '>'; }\n";
            }
        }
*/
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
