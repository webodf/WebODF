/*global runtime dom*/

/**
 * RelaxNG can check a DOM tree against a Relax NG schema
 * The RelaxNG implementation is currently not complete. Relax NG should not
 * report errors on valid DOM trees, but it will not check all constraints that
 * a Relax NG file can define. The current implementation does not load external
 * parts of a Relax NG file.
 * The main purpose of this Relax NG engine is to validate runtime ODF
 * documents. The DOM tree is traversed via a TreeWalker. A custom TreeWalker
 * implementation can hide parts of a DOM tree. This is useful in WebODF, where
 * special elements and attributes in the runtime DOM tree.
 * @constructor
 * @param {!string} url path to the Relax NG schema
 */
dom.RelaxNG = function RelaxNG(url) {
    var rngns = "http://relaxng.org/ns/structure/1.0",
        xmlns = "http://www.w3.org/2000/xmlns/",
        loaded = false,
        errormessage,
        queue = [],
        start,
        validateNonEmptyPattern,
        nsmap = {},
        depth = 0,
        p = "                                                                ",
        
/*== implementation according to
 *   http://www.thaiopensource.com/relaxng/derivative.html */
        patterncache = {},
        createUnique = function createUnique(object) {
            // find an object with the same hash and return that object
            var hash, o;
            if (object.hash) {
                hash = object.hash();
            } else {
                try {
                    hash = JSON.stringify(object);
                } catch (e) {
                }
            }
            if (hash !== undefined) {
                o = patterncache[hash];
                if (o === undefined) {
                    o = patterncache[hash] = object;
                } else {
                    object = o;
                }
            }
            return object;
        },
        notAllowed = {
            type: "notAllowed",
            nullable: false,
            textDeriv: function () { return notAllowed; },
            startTagOpenDeriv: function () { return notAllowed; },
            attDeriv: function () { return notAllowed; },
            startTagCloseDeriv: function () { return notAllowed; },
            endTagDeriv: function () { return notAllowed; }
        },
        empty = {
            type: "empty",
            nullable: true,
            textDeriv: function () { return notAllowed; },
            startTagOpenDeriv: function () { return notAllowed; },
            attDeriv: function (context, attribute) { return notAllowed; },
            startTagCloseDeriv: function () { return empty; },
            endTagDeriv: function () { return notAllowed; }
        },
        text = {
            type: "text",
            nullable: true,
            textDeriv: function () {
                return text;
            },
            startTagOpenDeriv: function () { return notAllowed; },
            attDeriv: function () { return notAllowed; },
            startTagCloseDeriv: function () { return text; },
            endTagDeriv: function () { return notAllowed; }
        },
        applyAfter,
        childDeriv,
        rootPattern;

    function createChoice(p1, p2) {
        if (p1 === notAllowed) { return p2; }
        if (p2 === notAllowed) { return p1; }
        return createUnique({
            type: "choice",
            p1: p1,
            p2: p2,
            nullable: p1.nullable || p2.nullable,
            textDeriv: function (context, text) {
                return createChoice(p1.textDeriv(context, text),
                    p2.textDeriv(context, text));
            },
            startTagOpenDeriv: function (node) {
                return createChoice(p1.startTagOpenDeriv(node),
                    p2.startTagOpenDeriv(node));
            },
            attDeriv: function (context, attribute) {
                return createChoice(p1.attDeriv(context, attribute),
                    p2.attDeriv(context, attribute));
            },
            startTagCloseDeriv: function () {
                return createChoice(p1.startTagCloseDeriv(),
                    p2.startTagCloseDeriv());
            },
            endTagDeriv: function () {
                return createChoice(p1.endTagDeriv(), p2.endTagDeriv());
            },
            valueMatch: function (context, text) {
                return p1.valueMatch(context, text) || p2.valueMatch(context, text);
            }
        });
    }
    function createInterleave(p1, p2) {
        if (p1 === notAllowed || p2 === notAllowed) { return notAllowed; }
        if (p1 === empty) { return p2; }
        if (p2 === empty) { return p1; }
        return createUnique({
            type: "interleave",
            p1: p1,
            p2: p2,
            nullable: p1.nullable && p2.nullable,
            textDeriv: function (context, text) {
                return createChoice(
                    createInterleave(p1.textDeriv(context, text), p2),
                    createInterleave(p1, p2.textDeriv(context, text))
                );
            },
            startTagOpenDeriv: function (node) {
                return createChoice(
                    applyAfter(function (p) { return createInterleave(p, p2); },
                               p1.startTagOpenDeriv(node)),
                    applyAfter(function (p) { return createInterleave(p1, p); },
                               p2.startTagOpenDeriv(node)));
            },
            attDeriv: function (context, attribute) {
                return createChoice(
                    createInterleave(p1.attDeriv(context, attribute), p2),
                    createInterleave(p1, p2.attDeriv(context, attribute)));
            },
            startTagCloseDeriv: function () {
                return createInterleave(p1.startTagCloseDeriv(),
                    p2.startTagCloseDeriv());
            }
        });
    }
    function createGroup(p1, p2) {
        if (p1 === notAllowed || p2 === notAllowed) { return notAllowed; }
        if (p1 === empty) { return p2; }
        if (p2 === empty) { return p1; }
        return createUnique({
            type: "group",
            p1: p1,
            p2: p2,
            nullable: p1.nullable && p2.nullable,
            textDeriv: function (context, text) {
                var p = createGroup(p1.textDeriv(context, text), p2);
                if (p1.nullable) {
                    return createChoice(p, p2.textDeriv(context, text));
                }
                return p;
            },
            startTagOpenDeriv: function (node) {
                var x = applyAfter(function (p) { return createGroup(p, p2); },
                        p1.startTagOpenDeriv(node));
                if (p1.nullable) {
//runtime.log("IUO " + JSON.stringify(p2,0,"    "));
//runtime.log("IU " + JSON.stringify(p2.startTagOpenDeriv(node),0,"    "));
                    return createChoice(x, p2.startTagOpenDeriv(node));
                }
                return x;
            },
            attDeriv: function (context, attribute) {
                return createChoice(
                    createGroup(p1.attDeriv(context, attribute), p2),
                    createGroup(p1, p2.attDeriv(context, attribute)));
            },
            startTagCloseDeriv: function () {
                return createGroup(p1.startTagCloseDeriv(),
                    p2.startTagCloseDeriv());
            }
        });
    }
    function createAfter(p1, p2) {
        if (p1 === notAllowed || p2 === notAllowed) { return notAllowed; }
        return createUnique({
            type: "after",
            p1: p1,
            p2: p2,
            nullable: false,
            textDeriv: function (context, text) {
                return createAfter(p1.textDeriv(context, text), p2);
            },
            startTagOpenDeriv: function (node) {
                return applyAfter(function (p) { return createAfter(p, p2); },
                    p1.startTagOpenDeriv(node));
            },
            attDeriv: function (context, attribute) {
                return createAfter(p1.attDeriv(context, attribute), p2);
            },
            startTagCloseDeriv: function () {
                return createAfter(p1.startTagCloseDeriv(), p2);
            },
            endTagDeriv: function () {
                return (p1.nullable) ? p2 : notAllowed;
            }
        });
    }
    function createOneOrMore(p) {
        if (p === notAllowed) { return notAllowed; }
        return createUnique({
            type: "oneOrMore",
            p: p,
            nullable: p.nullable,
            textDeriv: function (context, text) {
                return createGroup(p.textDeriv(context, text),
                            createChoice(this, empty));
            },
            startTagOpenDeriv: function (node) {
                var oneOrMore = this;
                return applyAfter(function (pf) {
                    return createGroup(pf, createChoice(oneOrMore, empty));
                }, p.startTagOpenDeriv(node));
            },
            attDeriv: function (context, attribute) {
                return createGroup(p.attDeriv(context, attribute),
                    createChoice(p, empty));
            },
            startTagCloseDeriv: function () {
                return createOneOrMore(p.startTagCloseDeriv());
            }
        });
    }
    function createElement(nc, p) {
        return createUnique({
            type: "element",
            nc: nc,
            p: p,
            nullable: false,
            textDeriv: function () { return notAllowed; },
            startTagOpenDeriv: function (node) {
                if (nc.contains(node)) {
                    return createAfter(p, empty);
                }
                return notAllowed;
            },
            attDeriv: function (context, attribute) { return notAllowed; },
            startTagCloseDeriv: function () { return this; }
        });
    }
    function createAttribute(nc, p) {
        return createUnique({
            type: "attribute",
            nullable: false,
            nc: nc,
            p: p,
            attDeriv: function (context, attribute) {
                //runtime.log(p.type);
                if (nc.contains(attribute) && p.valueMatch(context,
                        attribute.nodeValue)) {
                    return empty;
                }
                return notAllowed;
            },
            startTagCloseDeriv: function () { return notAllowed; }
        });
    }
    function createList() {
        return createUnique({
            type: "list",
            nullable: false,
            valueMatch: function (context, text) { return true; }
        });
    }
    function createValue(value) {
        return createUnique({
            type: "value",
            nullable: false,
            value: value,
            textDeriv: function (context, text) {
                return (text === value) ? empty : notAllowed;
            },
            attDeriv: function () { return notAllowed; },
            startTagCloseDeriv: function () { return this; },
            valueMatch: function (context, text) {
                return (text === value) ? empty : notAllowed;
            }
        });
    }
    function createData(type) {
        return createUnique({
            type: "data",
            nullable: false,
            dataType: type,
            textDeriv: function () { return empty; },
            attDeriv: function () { return notAllowed; },
            startTagCloseDeriv: function () { return this; },
            valueMatch: function (context, text) { return true; }
        });
    }
    function createDataExcept() {
        return createUnique({
            type: "dataExcept",
            nullable: false
        });
    }
    applyAfter = function applyAfter(f, p) {
        if (p.type === "after") {
            return createAfter(p.p1, f(p.p2));
        } else if (p.type === "choice") {
            return createChoice(applyAfter(f, p.p1), applyAfter(f, p.p2));
        }
        return p;
    };
    function attsDeriv(context, pattern, attributes, position) {
        if (pattern === notAllowed) {
            return notAllowed;
        }
        if (position >= attributes.length) {
            return pattern;
        }
        if (position === 0) {
            // TODO: loop over attributes to update namespace mapping
            position = 0;
        }
        var a = attributes.item(position);
        while (a.namespaceURI === xmlns) { // always ok
            position += 1;
            if (position >= attributes.length) {
                return pattern;
            }
            a = attributes.item(position);
        }
        a = attsDeriv(context, pattern.attDeriv(context, attributes.item(position)),
            attributes, position + 1);
        return a;
    }
    function childrenDeriv(context, pattern, walker) {
        var element = walker.currentNode,
            childNode = walker.firstChild(),
            numberOfTextNodes = 0,
            childNodes = [], i, p;
        // simple incomplete implementation: only use non-empty text nodes
        while (childNode) {
            if (childNode.nodeType === 1) {
                childNodes.push(childNode);
            } else if (childNode.nodeType === 3 && !/^\s*$/.test(childNode.nodeValue)) {
                childNodes.push(childNode.nodeValue);
                numberOfTextNodes += 1;
            }
            childNode = walker.nextSibling();
        }
        // if there is no nodes at all, add an empty text node
        if (childNodes.length === 0) {
            childNodes = [""];
        }
        p = pattern;
        for (i = 0; p !== notAllowed && i < childNodes.length; i += 1) {
            childNode = childNodes[i];
//runtime.log(i + " " + p.type + " " + (childNode.nodeName || childNode));
//runtime.log("A " + JSON.stringify(p,0,"    "));
            if (typeof childNode === "string") {
                if (/^\s*$/.test(childNode)) {
//runtime.log("C");
                    p = createChoice(p, p.textDeriv(context, childNode));
                } else {
//runtime.log("E");
                    p = p.textDeriv(context, childNode);
                }
            } else {
//runtime.log("D");
                walker.currentNode = childNode;
                p = childDeriv(context, p, walker);
            }
//runtime.log("B " + JSON.stringify(p,0,"    "));
//runtime.log(i + "_" + p.type + " " + (childNode.nodeName || childNode));
        }
        walker.currentNode = element;
        return p;
    }
    childDeriv = function childDeriv(context, pattern, walker) {
        var childNode = walker.currentNode, p;
//runtime.log("0> " + pattern.type + " " + childNode.nodeType + " " + childNode.nodeName);
//runtime.log("> " + JSON.stringify(pattern, 0,"    "));
        p = pattern.startTagOpenDeriv(childNode);
//runtime.log("1> " + p.type + " " + childNode.nodeName);
//runtime.log("> " + JSON.stringify(p,0,"    "));
        p = attsDeriv(context, p, childNode.attributes, 0);
//runtime.log("2> " + p.type + " " + childNode.nodeName);
//runtime.log("> " + JSON.stringify(p,0,"    "));
        p = p.startTagCloseDeriv();
//runtime.log("3> " + p.type + " " + childNode.nodeName);
//runtime.log("> " + JSON.stringify(p,0,"    "));
        p = childrenDeriv(context, p, walker);
//runtime.log("4> " + p.type + " " + childNode.nodeName);
//runtime.log("> " + JSON.stringify(p,0,"    "));
        p = p.endTagDeriv();
//runtime.log("5> " + p.type + " " + childNode.nodeName);
//runtime.log("> " + JSON.stringify(p,0,"    "));
        return p;
    };
    function createNameClass(pattern) {
        var name, ns;
        if (pattern.name === "name") {
            name = pattern.text;
            ns = pattern.a.ns;
            return {
                name: pattern.text,
                ns: pattern.a.ns,
                contains: function (node) {
                    return node.namespaceURI === ns && node.localName === name;
                }
            };
        } else if (pattern.name === "choice") {
            return {
                contains: function (node) {
                    var i;
                    for (i = 0; i < pattern.e.length; i += 1) {
                        if (pattern.e[0].text === node.localName &&
                                pattern.e[0].a.ns === node.namespaceURI) {
                            return true;
                        }
                    }
                    return false;
                }
            };
        }
    }
    function makePattern(pattern, defines) {
        var p, i;
        if (pattern.name === "ref") {
            p = pattern.a.name;
            pattern = defines[p];
            if (pattern.name !== undefined) {
                // create an empty object in the store to enable circular dependencies
                defines[p] = {};
                pattern = makePattern(pattern.e[0], defines);
                // copy the properties of the new object into the predefined one
                for (i in pattern) {
                    if (pattern.hasOwnProperty(i)) {
                        defines[p][i] = pattern[i];
                    }
                }
                pattern = defines[p];
            }
            return pattern;
        }
        switch (pattern.name) {
            case 'empty':
                return empty;
            case 'notAllowed':
                return notAllowed;
            case 'text':
                return text;
            case 'choice':
                return createChoice(makePattern(pattern.e[0], defines),
                    makePattern(pattern.e[1], defines));
            case 'interleave':
                return createInterleave(makePattern(pattern.e[0], defines),
                    makePattern(pattern.e[1], defines));
            case 'group':
                return createGroup(makePattern(pattern.e[0], defines),
                    makePattern(pattern.e[1], defines));
            case 'oneOrMore':
                return createOneOrMore(makePattern(pattern.e[0], defines));
            case 'element':
                return createElement(createNameClass(pattern.e[0]),
                    makePattern(pattern.e[1], defines));
            case 'attribute':
                return createAttribute(createNameClass(pattern.e[0]),
                    makePattern(pattern.e[1], defines));
            case 'value':
                return createValue(pattern.text);
            case 'data':
                return createData(pattern.a.type);
            case 'list':
                return createList();
        }
        throw "No support for " + pattern.name;
    }

/*== */

    /**
     * @constructor
     * @param {!string} error
     * @param {Node=} context
     */
    function RelaxNGParseError(error, context) {
        this.message = function () {
            if (context) {
                error += (context.nodeType === 1) ? " Element " : " Node ";
                error += context.nodeName;
                if (context.nodeValue) {
                    error += " with value '" + context.nodeValue + "'";
                }
                error += ".";
            }
            return error;
        };
//        runtime.log("[" + p.slice(0, depth) + this.message() + "]");
    }
    /**
     * handle validation requests that were added while schema was loading
     * @return {undefined}
     */
    function handleQueue() {
        if (!queue) {
            return;
        }
        var i;
        for (i = 0; i < queue.length; i += 1) {
            queue[i]();
        }
        queue = undefined;
    }
    /**
     * @param {!Document} dom
     * @return {?string}
     */
    function parseRelaxNGDOM(dom) {
        function splitToDuos(e) {
            if (e.e.length <= 2) {
                return e;
            }
            var o = { name: e.name, e: e.e.slice(0, 2) };
            return splitToDuos({
                name: e.name,
                e: [ o ].concat(e.e.slice(2))
            });
        }

        function splitQName(name) {
            var r = name.split(":", 2),
                prefix = "", i;
            if (r.length === 1) {
                r = ["", r[0]];
            } else {
                prefix = r[0];
            }
            for (i in nsmap) {
                if (nsmap[i] === prefix) {
                    r[0] = i;
                }
            }
            return r;
        }

        function splitQNames(def) {
            var i, l = (def.names) ? def.names.length : 0, name,
                localnames = def.localnames = new Array(l),
                namespaces = def.namespaces = new Array(l);
            for (i = 0; i < l; i += 1) {
                name = splitQName(def.names[i]);
                namespaces[i] = name[0];
                localnames[i] = name[1];
            }
        }
   
        function parse(element, elements) {
            // parse all elements from the Relax NG namespace into JavaScript
            // objects
            var e = [], a = {}, c = element.firstChild,
                atts = element.attributes,
                att, i, text = "", name = element.localName, names = [], ce;
            for (i = 0; i < atts.length; i += 1) {
                att = atts.item(i);
                if (!att.namespaceURI) {
                    if (att.localName === "name" &&
                            (name === "element" || name === "attribute")) {
                        names.push(att.value);
                        a[att.localName] = att.value;
                    } else {
                        a[att.localName] = att.value;
                    }
                } else if (att.namespaceURI === xmlns) {
                    nsmap[att.value] = att.localName;
                }
            }
            while (c) {
                if (c.nodeType === 1 && c.namespaceURI === rngns) {
                    ce = parse(c, elements);
                    if (ce.name === "name") {
                        names.push(nsmap[ce.a.ns] + ":" + ce.text);
                        e.push(ce);
                    } else if (ce.name === "choice" && ce.names && ce.names.length) {
                        names = names.concat(ce.names);
                        delete ce.names;
                        e.push(ce);
                    } else {
                        e.push(ce);
                    }
                } else if (c.nodeType === 3) {
                    text += c.nodeValue;
                }
                c = c.nextSibling;
            }
            // 4.2 strip leading and trailing whitespace
            if (name !== "value" && name !== "param") {
                text = /^\s*([\s\S]*\S)?\s*$/.exec(text)[1];
            }
            // 4.3 datatypeLibrary attribute
            // 4.4 type attribute of value element
            if (name === "value" && a.type === undefined) {
                a.type = "token";
                a.datatypeLibrary = "";
            }
            // 4.5 href attribute
            // 4.6 externalRef element
            // 4.7 include element
            // 4.8 name attribute of element and attribute elements
            if ((name === "attribute" || name === "element") &&
                    a.name !== undefined) {
               i = splitQName(a.name);
               e = [{name: "name", text: i[1], a: {ns: i[0]}}].concat(e);
               delete a.name;
            }
            // 4.9 ns attribute
            if (name === "name" || name === "nsName" || name === "value") {
                if (a.ns === undefined) {
                    a.ns = ""; // TODO
                }
            } else {
                delete a.ns;
            }
            // 4.10 QNames
            if (name === "name") {
                i = splitQName(text);
                a.ns = i[0];
                text = i[1];
            }
            // 4.11 div element
            // 4.12 Number of child elements
            if (e.length > 1 && (name === "define" || name === "oneOrMore" ||
                    name === "zeroOrMore" || name === "optional" ||
                    name === "list" || name === "mixed")) {
                e = [{name: "group", e: splitToDuos({name: "group", e: e}).e}];
            }
            if (e.length > 2 && name === "element") {
                e = [e[0]].concat(
                    {name: "group", e: splitToDuos(
                        {name: "group", e: e.slice(1)}).e});
            }
            if (e.length === 1 && name === "attribute") {
                e.push({name: "text", text: text});
            }
            // if node has only one child, replace node with child
            if (e.length === 1 && (name === "choice" || name === "group" ||
                    name === "interleave")) {
                name = e[0].name;
                names = e[0].names;
                a = e[0].a;
                text = e[0].text;
                e = e[0].e;
            } else if (e.length > 2 && (name === "choice" || name === "group" ||
                    name === "interleave")) {
                e = splitToDuos({name: name, e: e}).e;
            }
            // 4.13 mixed element
            if (name === "mixed") {
                name = "interleave";
                e = [ e[0], { name: "text" } ];
            }
            // 4.14 optional element
            if (name === "optional") {
                name = "choice";
                e = [ e[0], { name: "empty" } ];
            }
            // 4.15 zeroOrMore element
            if (name === "zeroOrMore") {
                name = "choice";
                e = [ {name: "oneOrMore", e: [ e[0] ] }, { name: "empty" } ];
            }
            // create the definition
            ce = { name: name };
            if (e && e.length > 0) { ce.e = e; }
            for (i in a) {
                if (a.hasOwnProperty(i)) {
                    ce.a = a;
                    break;
                }
            }
            if (text !== undefined) { ce.text = text; }
            if (names && names.length > 0) { ce.names = names; }

            // part one of 4.19
            if (name === "element") {
                ce.id = elements.length;
                elements.push(ce);
                ce = { name: "elementref", id: ce.id };
            }
            return ce;
        }
    
        function resolveDefines(def, defines) {
            var i = 0, e, defs, end, name = def.name;
            while (def.e && i < def.e.length) {
                e = def.e[i];
                if (e.name === "ref") {
                    defs = defines[e.a.name];
                    if (!defs) {
                        throw e.a.name + " was not defined.";
                    }
                    end = def.e.slice(i + 1);
                    def.e = def.e.slice(0, i);
                    def.e = def.e.concat(defs.e);
                    def.e = def.e.concat(end);
                } else {
                    i += 1;
                    resolveDefines(e, defines);
                }
            }
            e = def.e;
            // 4.20 notAllowed element
            // 4.21 emtpy element
            if (name === "choice") {
                if (!e || !e[1] || e[1].name === "empty") {
                    if (!e || !e[0] || e[0].name === "empty") {
                        delete def.e;
                        def.name = "empty";
                    } else {
                        e[1] = e[0];
                        e[0] = { name: "empty" };
                    }
                }
            }
            if (name === "group" || name === "interleave") {
                if (e[0].name === "empty") {
                    if (e[1].name === "empty") {
                        delete def.e;
                        def.name = "empty";
                    } else {
                        name = def.name = e[1].name;
                        def.names = e[1].names;
                        e = def.e = e[1].e;
                    }
                } else if (e[1].name === "empty") {
                    name = def.name = e[0].name;
                    def.names = e[0].names;
                    e = def.e = e[0].e;
                }
            }
            if (name === "oneOrMore" && e[0].name === "empty") {
                delete def.e;
                def.name = "empty";
            }
            // for attributes we need to have the list of namespaces and
            // localnames readily available, so we split up the qnames
            if (name === "attribute") {
                splitQNames(def);
            }
            // for interleaving validation, it is convenient to join all
            // interleave elements that touch into one element
            if (name === "interleave") {
                // at this point the interleave will have two child elements,
                // but the child interleave elements may have a different number
                if (e[0].name === "interleave") {
                    if (e[1].name === "interleave") {
                        e = def.e = e[0].e.concat(e[1].e);
                    } else {
                        e = def.e = [e[1]].concat(e[0].e);
                    }
                } else if (e[1].name === "interleave") {
                    e = def.e = [e[0]].concat(e[1].e);
                }
            }
        }

        function resolveElements(def, elements) {
            var i = 0, e, name;
            while (def.e && i < def.e.length) {
                e = def.e[i];
                if (e.name === "elementref") {
                    if (e.id === undefined) {
                        e.id = 0;
                    }
                    def.e[i] = elements[e.id];
                } else if (e.name !== "element") {
                    resolveElements(e, elements);
                }
                i += 1;
            }
        }

        function newMakePattern(pattern, defines) {
            var copy = {}, i;
            for (i in defines) {
                if (defines.hasOwnProperty(i)) {
                    copy[i] = defines[i];
                }
            }
            i = makePattern(pattern, copy);
            return i;
        }

        function main() {
            var elements = [],
                grammar = parse(dom && dom.documentElement, elements),
                i, e, defines = {};

            for (i = 0; i < grammar.e.length; i += 1) {
                e = grammar.e[i];
                if (e.name === "define") {
                    defines[e.a.name] = e;
                } else if (e.name === "start") {
                    start = e;
                }
            }
            if (!start) {
                return [new RelaxNGParseError("No Relax NG start element was found.")];
            }
//            rootPattern = newMakePattern(start.e[0], defines);
            resolveDefines(start, defines);
            for (i in defines) {
                if (defines.hasOwnProperty(i)) {
                    resolveDefines(defines[i], defines);
                }
            }
            for (i = 0; i < elements.length; i += 1) {
                resolveDefines(elements[i], defines);
            }
            resolveElements(start, elements);
            for (i = 0; i < elements.length; i += 1) {
                resolveElements(elements[i], elements);
            }
            //runtime.log(JSON.stringify(start, null, "  "));
            return null;
        }
        return main();
    }
    /**
     * @param elementdef
     * @param walker
     * @param {Element} element
     * @return {Array.<RelaxNGParseError>}
     */
    function validateOneOrMore(elementdef, walker, element) {
        // The list of definitions in the elements list should be completely traversed
        // at least once
        // If a second or later round fails, the walker should go back to the start of
        // the last successful traversal
        var node, i = 0, err;
        do {
            node = walker.currentNode;
            err = validateNonEmptyPattern(elementdef.e[0], walker, element);
            i += 1;
        } while (!err && node !== walker.currentNode);
        if (i > 1) { // at least one round was without error
            // set position back to position of before last failed round
            walker.currentNode = node;
            return null;
        }
        return err;
    }
    /**
     * @param {!Node} node
     * @return {!string}
     */
    function qName(node) {
        return nsmap[node.namespaceURI] + ":" + node.localName;
    }
    /**
     * @param {!Node} node
     * @return {!boolean}
     */
    function isWhitespace(node) {
        return node && node.nodeType === 3 && /^\s+$/.test(node.nodeValue);
    }
    /**
     * @param elementdef
     * @param walker
     * @param {Element} element
     * @param {string=} data
     * @return {Array.<RelaxNGParseError>}
     */
    function validatePattern(elementdef, walker, element, data) {
        if (elementdef.name === "empty") {
            return null;
        }
        return validateNonEmptyPattern(elementdef, walker, element, data);
    }
    /**
     * @param elementdef
     * @param walker
     * @param {Element} element
     * @return {Array.<RelaxNGParseError>}
     */
    function validateAttribute(elementdef, walker, element) {
        if (elementdef.e.length !== 2) {
            throw "Attribute with wrong # of elements: " + elementdef.e.length;
        }
        var att, a, l = elementdef.localnames.length, i;
        for (i = 0; i < l; i += 1) {
            a = element.getAttributeNS(elementdef.namespaces[i],
                    elementdef.localnames[i]);
            // if an element is not present, getAttributeNS will return an empty string
            // but an empty string is possible attribute value, so an extra check is
            // needed
            if (a === "" && !element.hasAttributeNS(elementdef.namespaces[i],
                    elementdef.localnames[i])) {
                a = undefined;
            }
            if (att !== undefined && a !== undefined) {
                return [new RelaxNGParseError("Attribute defined too often.", element)];
            }
            att = a;
        }
        if (att === undefined) {
            return [new RelaxNGParseError("Attribute not found: " + elementdef.names,
                    element)];
        }
        return validatePattern(elementdef.e[1], walker, element, att);
    }
    /**
     * @param elementdef
     * @param walker
     * @param {Element} element
     * @return {Array.<RelaxNGParseError>}
     */
    function validateTop(elementdef, walker, element) {
        // notAllowed not implemented atm
        return validatePattern(elementdef, walker, element);
    }
    /**
     * Validate an element.
     * Function forwards the walker until an element is met.
     * If element if of the right type, it is entered and the validation continues
     * inside the element. After validation, regardless of whether an error occurred,
     * the walker is at the same depth in the dom tree.
     * @param elementdef
     * @param walker
     * @param {Element} element
     * @return {Array.<RelaxNGParseError>}
     */
    function validateElement(elementdef, walker, element) {
        if (elementdef.e.length !== 2) {
            throw "Element with wrong # of elements: " + elementdef.e.length;
        }
        depth += 1;
        // forward until an element is seen, then check the name
        var /**@type{Node}*/ node = walker.currentNode,
            /**@type{number}*/ type = node ? node.nodeType : 0,
            error = null;
        // find the next element, skip text nodes with only whitespace
        while (type > 1) {
            if (type !== 8 &&
                    (type !== 3 ||
                     !/^\s+$/.test(walker.currentNode.nodeValue))) {// TEXT_NODE
                depth -= 1;
                return [new RelaxNGParseError("Not allowed node of type " + type +
                        ".")];
            }
            node = walker.nextSibling();
            type = node ? node.nodeType : 0;
        }
        if (!node) {
            depth -= 1;
            return [new RelaxNGParseError("Missing element " + elementdef.names)];
        }
        if (elementdef.names && elementdef.names.indexOf(qName(node)) === -1) {
            depth -= 1;
            return [new RelaxNGParseError("Found " + node.nodeName +
                    " instead of " + elementdef.names + ".", node)];
        }
        // the right element was found, now parse the contents
        if (walker.firstChild()) {
            // currentNode now points to the first child node of this element
            error = validateTop(elementdef.e[1], walker, node);
            // there should be no content left
            while (walker.nextSibling()) {
                type = walker.currentNode.nodeType;
                if (!isWhitespace(walker.currentNode) && type !== 8) {
                    depth -= 1;
                    return [new RelaxNGParseError("Spurious content.",
                            walker.currentNode)];
                }
            }
            if (walker.parentNode() !== node) {
                depth -= 1;
                return [new RelaxNGParseError("Implementation error.")];
            }
        } else {
            error = validateTop(elementdef.e[1], walker, node);
        }
        depth -= 1;
        // move to the next node
        node = walker.nextSibling();
        return error;
    }
    /**
     * @param elementdef
     * @param walker
     * @param {Element} element
     * @param {string=} data
     * @return {Array.<RelaxNGParseError>}
     */
    function validateChoice(elementdef, walker, element, data) {
        // loop through child definitions and return if a match is found
        if (elementdef.e.length !== 2) {
            throw "Choice with wrong # of options: " + elementdef.e.length;
        }
        var node = walker.currentNode, err;
        // if the first option is empty, just check the second one for debugging
        // but the total choice is alwasy ok
        if (elementdef.e[0].name === "empty") {
            err = validateNonEmptyPattern(elementdef.e[1], walker, element, data);
            if (err) {
                walker.currentNode = node;
            }
            return null;
        }
        err = validatePattern(elementdef.e[0], walker, element, data);
        if (err) {
            walker.currentNode = node;
            err = validateNonEmptyPattern(elementdef.e[1], walker, element, data);
        }
        return err;
    }
    /**
     * @param elementdef
     * @param walker
     * @param {Element} element
     * @return {Array.<RelaxNGParseError>}
     */
    function validateInterleave(elementdef, walker, element) {
        var l = elementdef.e.length, n = new Array(l), err, i, todo = l, donethisround,
            node, subnode, e;
        // the interleave is done when all items are 'true' and no 
        while (todo > 0) {
            donethisround = 0;
            node = walker.currentNode;
            for (i = 0; i < l; i += 1) {
                subnode = walker.currentNode;
                if (n[i] !== true && n[i] !== subnode) {
                    e = elementdef.e[i];
                    err = validateNonEmptyPattern(e, walker, element);
                    if (err) {
                        walker.currentNode = subnode;
                        if (n[i] === undefined) {
                            n[i] = false;
                        }
                    } else if (subnode === walker.currentNode ||
                            // this is a bit dodgy, there should be a rule to see
                            // if multiple elements are allowed
                            e.name === "oneOrMore" ||
                            (e.name === "choice" && (e.e[0].name === "oneOrMore" ||
                                                     e.e[1].name === "oneOrMore"))) {
                        donethisround += 1;
                        n[i] = subnode; // no error and try this one again later
                    } else {
                        donethisround += 1;
                        n[i] = true; // no error and progress
                    }
                }
            }
            if (node === walker.currentNode && donethisround === todo) {
                return null;
            }
            if (donethisround === 0) {
                for (i = 0; i < l; i += 1) {
                    if (n[i] === false) {
                        return [new RelaxNGParseError("Interleave does not match.", element)];
                    }
                }
                return null;
            }
            todo = 0;
            for (i = 0; i < l; i += 1) {
                if (n[i] !== true) {
                    todo += 1;
                }
            }
        }
        return null;
    }
    /**
     * @param elementdef
     * @param walker
     * @param {Element} element
     * @return {Array.<RelaxNGParseError>}
     */
    function validateGroup(elementdef, walker, element) {
        if (elementdef.e.length !== 2) {
            throw "Group with wrong # of members: " + elementdef.e.length;
        }
        //runtime.log(elementdef.e[0].name + " " + elementdef.e[1].name);
        return validateNonEmptyPattern(elementdef.e[0], walker, element) ||
                validateNonEmptyPattern(elementdef.e[1], walker, element);
    }
    /**
     * @param elementdef
     * @param walker
     * @param {Element} element
     * @return {Array.<RelaxNGParseError>}
     */
    function validateText(elementdef, walker, element) {
        var /**@type{Node}*/ node = walker.currentNode,
            /**@type{number}*/ type = node ? node.nodeType : 0,
            error = null;
        // find the next element, skip text nodes with only whitespace
        while (node !== element && type !== 3) {
            if (type === 1) {
                return [new RelaxNGParseError("Element not allowed here.", node)];
            }
            node = walker.nextSibling();
            type = node ? node.nodeType : 0;
        }
        walker.nextSibling();
        return null;
    }
    /**
     * @param elementdef
     * @param walker
     * @param {Element} element
     * @param {string=} data
     * @return {Array.<RelaxNGParseError>}
     */
    validateNonEmptyPattern = function validateNonEmptyPattern(elementdef,
                walker, element, data) {
        var name = elementdef.name, err = null;
        if (name === "text") {
            err = validateText(elementdef, walker, element);
        } else if (name === "data") {
            err = null; // data not implemented
        } else if (name === "value") {
            if (data !== elementdef.text) {
                err = [new RelaxNGParseError("Wrong value, should be '" +
                        elementdef.text + "', not '" + data + "'", element)];
            }
        } else if (name === "list") {
            err = null; // list not implemented
        } else if (name === "attribute") {
            err = validateAttribute(elementdef, walker, element);
        } else if (name === "element") {
            err = validateElement(elementdef, walker, element);
        } else if (name === "oneOrMore") {
            err = validateOneOrMore(elementdef, walker, element);
        } else if (name === "choice") {
            err = validateChoice(elementdef, walker, element, data);
        } else if (name === "group") {
            err = validateGroup(elementdef, walker, element);
        } else if (name === "interleave") {
            err = validateInterleave(elementdef, walker, element);
        } else {
            throw name + " not allowed in nonEmptyPattern.";
        }
        return err;
    };
    /**
     * Validate the elements pointed to by the TreeWalker
     * @param {!TreeWalker} walker
     * @param {!function(Array.<RelaxNGParseError>):undefined} callback
     * @return {undefined}
     */
    function validateXML(walker, callback) {
        if (!loaded) {
            queue.push(function () {
                validateXML(walker, callback);
            });
            return;
        }
        if (errormessage) {
            callback(errormessage);
            return;
        }
        walker.currentNode = walker.root;
        var errors = validatePattern(start.e[0], walker, walker.root);
        callback(errors);

        if (rootPattern) {
//            runtime.log("new validation");
            walker.currentNode = walker.root;
            errors = childDeriv(null, rootPattern, walker);
            if (!errors.nullable) {
                runtime.log("Error parsing.");
            }
        }
    }
    this.validate = validateXML;

    // load and parse the Relax NG
    runtime.loadXML(url, function (err, dom) {
        loaded = true;
        if (err) {
            errormessage = err;
        } else {
            errormessage = parseRelaxNGDOM(dom);
        }
        handleQueue();
    });
};
