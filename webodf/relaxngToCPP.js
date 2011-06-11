/**
 * Copyright (C) 2011 KO GmbH <jos.van.den.oever@kogmbh.com>
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * As additional permission under GNU AGPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * As a special exception to the AGPL, any HTML file which merely makes function
 * calls to this code, and for that purpose includes it by reference shall be
 * deemed a separate work for copyright law purposes. In addition, the copyright
 * holders of this code give you permission to combine this code with free
 * software libraries that are released under the GNU LGPL. You may copy and
 * distribute such a system following the terms of the GNU AGPL for this code
 * and the LGPL for the libraries. If you modify this code, you may extend this
 * exception to your version of the code, but you are not obligated to do so.
 * If you do not wish to do so, delete this exception statement from your
 * version.
 *
 * This license applies to this entire compilation.
 * @licend
 * @source: http://www.webodf.org/
 * @source: http://gitorious.org/odfkit/webodf/
 */
/*global runtime xmldom*/
runtime.loadClass("xmldom.RelaxNGParser");

var nsmap = {
        "http://purl.org/dc/elements/1.1/": "purl",
        "http://www.w3.org/1998/Math/MathML": "mathml",
        "http://www.w3.org/1999/xhtml": "xhtml",
        "http://www.w3.org/1999/xlink": "xlink",
        "http://www.w3.org/2002/xforms": "xforms",
        "http://www.w3.org/2003/g/data-view#": "dv",
        "http://www.w3.org/XML/1998/namespace": "xmlns",
        "urn:oasis:names:tc:opendocument:xmlns:animation:1.0": "animation",
        "urn:oasis:names:tc:opendocument:xmlns:chart:1.0": "chart",
        "urn:oasis:names:tc:opendocument:xmlns:config:1.0": "config",
        "urn:oasis:names:tc:opendocument:xmlns:database:1.0": "database",
        "urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0": "datastyle",
        "urn:oasis:names:tc:opendocument:xmlns:dr3d:1.0": "dr3d",
        "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0": "drawing",
        "urn:oasis:names:tc:opendocument:xmlns:form:1.0": "form",
        "urn:oasis:names:tc:opendocument:xmlns:meta:1.0": "meta",
        "urn:oasis:names:tc:opendocument:xmlns:office:1.0": "office",
        "urn:oasis:names:tc:opendocument:xmlns:presentation:1.0": "presentation",
        "urn:oasis:names:tc:opendocument:xmlns:script:1.0": "script",
        "urn:oasis:names:tc:opendocument:xmlns:smil-compatible:1.0": "smilc",
        "urn:oasis:names:tc:opendocument:xmlns:style:1.0": "style",
        "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0": "svgc",
        "urn:oasis:names:tc:opendocument:xmlns:table:1.0": "table",
        "urn:oasis:names:tc:opendocument:xmlns:text:1.0": "text",
        "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0": "xslfoc"
    },
    relaxngurl = arguments[1],
    parser = new xmldom.RelaxNGParser(relaxngurl),
    definedAttributes = {};

function out(string) {
    runtime.log(string);
}

function toCamelCase(s) {
    var str = "", i, up = true;
    for (i = 0; i < s.length; i += 1) {
        if (up) {
            str += s.substr(i, 1).toUpperCase();
        } else {
            str += s.substr(i, 1);
        }
        up = false;
        while (/\W/.test(s.substr(i + 1, 1))) {
            up = true;
            i += 1;
        }
    }
    return str;
}
function getName(e) {
    return toCamelCase(nsmap[e.a.ns]) + toCamelCase(e.text);
}
function getNames(e, names) {
    if (e.name === "name") {
        names.push(e);
    } else if (e.name === "choice") {
        getNames(e.e[0], names);
        getNames(e.e[1], names);
    }
}
function writeMembers(className, e) {
    var ne,
        nsname,
        name;
    if (e.name === "element") {
        name = null;
    } else if (e.name === "attribute") {
        if (e.e[0].name === "name") {
            name = getName(e.e[0]);
            ne = className + "_" + name;
            if (!(ne in definedAttributes)) {
                definedAttributes[ne] = 1;
                ne = e.e[0];
                nsname = nsmap[ne.a.ns] + ":" + ne.text;
                out("    /**");
                out("     * Set attribute " + nsname + ".");
                out("     */");
                out("    inline void write" + name + "(const QString& value) {");
                out("        xml->addAttribute(\"" + nsname + "\", value);");
                out("    }");
            }
        }
    } else if (e.name === "choice" || e.name === "interleave"
            || e.name === "group") {
        writeMembers(className, e.e[0]);
        writeMembers(className, e.e[1]);
    } else if (e.name === "oneOrMore") {
        writeMembers(className, e.e[0]);
    } else if (e.name === "value") {
        name = null; // todo 
    } else if (e.name === "data") {
        name = null; // todo 
    } else if (e.name === "text") {
        out("    void addTextNode(const QString& str) { xml->addTextNode(str); }");
    } else if (e.name === "empty") {
        name = null; // todo 
    } else {
        runtime.log("OOPS " + e.name);
        throw null;
    }
}

function defineClass(e, parents, children) {
    var c, p,
        ne = e.e[0],
        nsname = nsmap[ne.a.ns] + ":" + ne.text,
        name = ne.cppname;
    out("/**");
    out(" * Serialize a <" + nsname + "> element.");
    out(" */");
    out("class " + name + "Writer {");
    for (c in children) {
        if (children.hasOwnProperty(c) && c !== name) {
            out("friend class " + c + "Writer;");
        }
    }
    out("private:");
    out("    inline void start() { xml->startElement(\"" + nsname + "\"); }");
    out("public:");
    out("    KoXmlWriter* const xml;");
    for (p in parents) {
        if (parents.hasOwnProperty(p)) {
            out("    inline explicit " + name + "Writer(const " + p +
                    "Writer& p);");
        }
    }
    out("    inline explicit " + name +
            "Writer(KoXmlWriter* xml_) :xml(xml_) { start(); }");
    out("    ~" + name + "Writer() { xml->endElement(); }");
    writeMembers(name, e.e[1]);
    out("};");
}

function defineConstructors(e, parents) {
    var p,
        ne = e.e[0],
        nsname = nsmap[ne.a.ns] + ":" + ne.text,
        name = ne.cppname;
    for (p in parents) {
        if (parents.hasOwnProperty(p)) {
            out(name + "Writer::" + name + "Writer(const " + p + "Writer& p) :xml(p.xml) { start(); }");
        }
    }
}

function getChildren(e, children) {
    var name, i, names;
    if (e.name === "element") {
        names = [];
        getNames(e.e[0], names);
        for (i = 0; i < names.length; i += 1) {
            children[names[i].cppname] = 1;
        }
    } else if (e.name === "choice" || e.name === "interleave"
            || e.name === "group") {
        for (i = 0; i < e.e.length; i += 1) {
            getChildren(e.e[i], children);
        }
    } else if (e.name === "oneOrMore") {
        getChildren(e.e[0], children);
    } else if (e.name === "attribute" || e.name === "value" ||
            e.name === "data" || e.name === "text" || e.name === "empty") {
        name = null; // ignore
    } else {
        runtime.log("OOPS " + e.name);
        throw null;
    }
}

function childrenToParents(childrenmap) {
    var p, children, c, parents = {};
    for (p in childrenmap) {
        if (childrenmap.hasOwnProperty(p)) {
            children = childrenmap[p];
            for (c in children) {
                if (children.hasOwnProperty(c)) {
                    if (!(c in parents)) {
                        parents[c] = {};
                    }
                    parents[c][p] = 1;
                }
            }
        }
    }
    return parents;
}
function copy(e) {
    var ec = {}, i;
    for (i in e) {
        if (e.hasOwnProperty(i)) {
            ec[i] = e[i];
        }
    }
}
function toCPP(elements) {
    out("#include <KoXmlWriter.h>");

    // first get a mapping for all the parents
    var children = {}, parents = {}, i, j, ce, ec, name, names, c,
        elementMap = {}, sortedElementNames = [];
    for (i = 0; i < elements.length; i += 1) {
        ce = elements[i];
        if (ce.name !== "element") {
            runtime.log("Error in parsed data.");
            return;
        }
        names = [];
        getNames(ce.e[0], names);
        for (j = 0; j < names.length; j += 1) {
            name = getName(names[j]);
            while (name in elementMap) {
                name = name + "_";
            }
            names[j].cppname = name;
            ec = {e: [names[j], ce.e[1]]};
            elementMap[name] = ec;
            sortedElementNames.push(name);
        }
    }
    sortedElementNames.sort();

    for (i = 0; i < sortedElementNames.length; i += 1) {
        name = sortedElementNames[i];
        c = {};
        getChildren(elementMap[name].e[1], c);
        children[name] = c;
    }
    parents = childrenToParents(children);

    for (i = 0; i < sortedElementNames.length; i += 1) {
        name = sortedElementNames[i];
        out("class " + name + "Writer;");
    }
    for (i = 0; i < sortedElementNames.length; i += 1) {
        name = sortedElementNames[i];
        defineClass(elementMap[name], parents[name], children[name]);
    }
    for (i = 0; i < sortedElementNames.length; i += 1) {
        name = sortedElementNames[i];
        defineConstructors(elementMap[name], parents[name]);
    }
}

// load and parse the Relax NG
runtime.loadXML(relaxngurl, function (err, dom) {
    var parser = new xmldom.RelaxNGParser();
    if (err) {
        runtime.log(err);
    } else {
        err = parser.parseRelaxNGDOM(dom);
        if (err) {
            runtime.log(err);
        } else {
            toCPP(parser.elements);
        }
    }
});
