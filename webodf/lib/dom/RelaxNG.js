/*global runtime dom*/

/**
 * RelaxNG can check a DOM tree against a Relax NG schema
 * The RelaxNG implementation is currently not complete. Relax NG should not report
 * errors on valid DOM trees, but it will not check all constraints that a Relax NG
 * file can define. The current implementation does not load external parts of a Relax
 * NG file.
 * The main purpose of this Relax NG engine is to validate runtime ODF documents.
 * The DOM tree is traversed via a TreeWalker. A custom TreeWalker implementation can
 * hide parts of a DOM tree. This is useful in WebODF, where special elements and
 * attributes in the runtime DOM tree.
 * @constructor
 * @param {!string} url path to the Relax NG schema
 */
dom.RelaxNG = function RelaxNG(url) {
    var rngns = "http://relaxng.org/ns/structure/1.0",
        loaded = false,
        errormessage,
        queue = [],
        start,
        validateNonEmptyPattern,
        nsmap = {},
        depth = 0,
        p = "                                                                ";

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
        runtime.log("[" + p.slice(0, depth) + this.message() + "]");
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
            var i, l = def.names.length, name,
                localnames = def.localnames = new Array(l),
                namespaces = def.namespaces = new Array(l);
            for (i = 0; i < l; i += 1) {
                name = splitQName(def.names[i]);
                namespaces[i] = name[0];
                localnames[i] = name[1];
            }
        }
   
        function parse(element) {
            // parse all elements from the Relax NG namespace into JavaScript objects
            var e = [], a = {}, c = element.firstChild, atts = element.attributes,
                att, i, text = "", name = element.localName, names = [], ce;
            for (i = 0; i < atts.length; i += 1) {
                att = atts.item(i);
                if (!att.namespaceURI) {
                    if (att.localName === "name" &&
                            (name === "element" || name === "attribute")) {
                        names.push(att.value);
                    } else {
                        a[att.localName] = att.value;
                    }
                } else if (att.namespaceURI === "http://www.w3.org/2000/xmlns/") {
                    nsmap[att.value] = att.localName;
                }
            }
            while (c) {
                if (c.nodeType === 1 && c.namespaceURI === rngns) {
                    ce = parse(c);
                    if (ce.name === "name") {
                        names.push(ce.text);
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
            }
            // 4.5 href attribute
            // 4.6 externalRef element
            // 4.7 include element
            // 4.8 name attribute of element and attribute elements
            // already done earlier in this function
            // 4.9 ns attribute
            // 4.10 QNames
            // 4.11 div element
            // 4.12 Number of child elements
            if (e.length > 1 && (name === "define" || name === "oneOrMore" ||
                    name === "zeroOrMore" || name === "optional" || name === "list" ||
                    name === "mixed" || name === "element")) {
                e = [{name: "group", e: splitToDuos({ name: "group", e: e}).e }];
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
            return { name: name, a: a, e: e, text: text, names: names };
        }
    
        function resolveDefines(def, defines) {
            var i = 0, e, defs, end, name = def.name;
            def.resolved = true;
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
                    if (!e.resolved) {
                        resolveDefines(e, defines);
                    }
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
                        def.name = e[1].name;
                        def.e = e[1].e;
                    }
                } else if (e[1].name === "empty") {
                    def.name = e[0].name;
                    def.e = e[0].e;
                }
            }
            if (name === "oneOrMore" && e[0].name === "empty") {
                delete def.e;
                def.name = "empty";
            }
            // for attributes we need to have the list of namespaces and localnames
            // readily available, so we split up the qnames
            if (name === "attribute") {
                splitQNames(def);
            }
            // for interleaving validation, it is convenient to join all interleave
            // elements that touch into one element
            if (name === "interleave") {
                // at this point the interleave will have two child elements,
                // but the child interleave elements may have a different number
                if (e[0].name === "interleave") {
                    if (e[1].name === "interleave") {
                        def.e = e[0].e.concat(e[1].e);
                    } else {
                        def.e = [e[1]].concat(e[0].e);
                    }
                } else if (e[1].name === "interleave") {
                    def.e = [e[0]].concat(e[1].e);
                }
            }
        }

        function main() {
            var grammar = parse(dom && dom.documentElement),
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
                return "No Relax NG start element was found.";
            }
            try {
                resolveDefines(start, defines);
                for (i in defines) {
                    if (defines.hasOwnProperty(i)) {
                        resolveDefines(defines[i], defines);
                    }
                }
            } catch (err) {
                runtime.log(err);
                return err;
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
        if (elementdef.e.length !== 1) {
            throw "Attribute with wrong # of options: " + elementdef.e.length;
        }
        var att, a, l = elementdef.localnames.length, i;
        for (i = 0; i < l; i += 1) {
            a = element.getAttributeNS(elementdef.namespaces[i],
                    elementdef.localnames[i]);
            if (att && a) {
                return [new RelaxNGParseError("Attribute defined too often.", element)];
            }
            att = a;
        }
        if (!att) {
            return [new RelaxNGParseError("Attribute not found: " + elementdef.names,
                    element)];
        }
        return validatePattern(elementdef.e[0], walker, element, att);
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
        if (elementdef.e.length !== 1) {
            throw "Element with wrong # of options: " + elementdef.e.length;
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
        if (elementdef.names.indexOf(qName(node)) === -1) {
            depth -= 1;
            return [new RelaxNGParseError("Found " + node.nodeName +
                    " instead of " + elementdef.names + ".", node)];
        }
        // the right element was found, now parse the contents
        if (walker.firstChild()) {
            // currentNode now points to the first child node of this element
            error = validateTop(elementdef.e[0], walker, node);
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
            error = validateTop(elementdef.e[0], walker, node);
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
            node, subnode;
        // the interleave is done when all items are 'true' and no 
        while (todo > 0) {
            donethisround = 0;
            node = walker.currentNode;
            for (i = 0; i < l; i += 1) {
                subnode = walker.currentNode;
                if (n[i] !== true && n[i] !== subnode) {
                    err = validateNonEmptyPattern(elementdef.e[i], walker, element);
                    if (err) {
                        walker.currentNode = subnode;
                        if (n[i] === undefined) {
                            n[i] = false;
                        }
                    } else if (subnode === walker.currentNode) {
                        donethisround += 1;
                        n[i] = subnode;
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
            throw "Group with wrong # of options: " + elementdef.e.length;
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
    validateNonEmptyPattern = function validateNonEmptyPattern(elementdef, walker,
                element, data) {
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
