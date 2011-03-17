/*global runtime dom*/

/**
 * @constructor
 * @param {!string} url path to the Relax NG schema
 */
dom.RelaxNG = function RelaxNG(url) {
    var rngns = "http://relaxng.org/ns/structure/1.0",
        loaded = false,
        errormessage,
        queue = [],
        start,
        validate;

    /**
     * @constructor
     * @param {!string} error
     * @param {!Node=} context
     */
    function RelaxNGParseError(error, context) {
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
    
        function parse(element) {
            var e = [], a = {}, c = element.firstChild, atts = element.attributes, att,
                i;
            for (i = 0; i < atts.length; i += 1) {
                att = atts.item(i);
                a[att.localName] = att.value;
            }
            while (c) {
                if (c.nodeType === 1 && c.namespaceURI === rngns) {
                    e.push(parse(c));
                }
                c = c.nextSibling;
            }
            return { name: element.localName, a: a, e: e };
        }
    
        function resolveDefines(def, defines) {
            var i, e, l, defs, end;
            l = def.e.length;
            for (i = 0; i < l; i += 1) {
                resolveDefines(def.e[i], defines);
            }
            for (i = 0; i < def.e.length; i += 1) {
                e = def.e[i];
                if (e.name === "ref") {
                    defs = defines[e.a.name];
                    if (!def) {
                        throw e.a.name + " was not defined.";
                    }
                    end = def.e.slice(i + 1);
                    def.e = def.e.slice(0, i);
                    def.e = def.e.concat(defs.e);
                    def.e = def.e.concat(end);
                }
            }
        }

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
            return err;
        }
        return null;
    }

    function validateAttribute(elementdef, walker) {
        // the attribute should be on the parent of the current node
    }

    function validateInterleave(elementdef, walker) {
    }

    function validateOptional(elementdef, walker) {
        // the group of definitions in this list is optional, we try to parse it
        // if there is an error, we stop
        runtime.log(walker.currentNode.nodeName + " " + elementdef.name);
        var start = walker.currentNode,
            errors = validate(elementdef, walker);
        if (errors) {
            walker.currentNode = start;
        }
        // optional elements cannot return errors
        return undefined;
    }

    function validateOneOrMore(elementdef, walker) {
runtime.log("ONEORMORE");
        // The list of definitions in the elements list should be completely traversed
        // at least once
        // If a second or later round fails, the walker should go back to the start of
        // the last successful traversal
        var node, i = 0, allerr, err;
        do {
            node = walker.currentNode;
            err = validate(elementdef, walker);
            i += 1;
        } while (!err);
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
        return node.nodeName;
    }

    /**
     * Validate an element.
     * Function forwards the walker until an element is met.
     * If element if of the right type, it is entered and the validation continues
     * inside the element. After validation, regardless of whether an error occurred,
     * the walker is at the same depth in the dom tree.
     */
    function validateElement(elementdef, walker) {
runtime.log("hi");
        // forward until an element is seen, then check the name
        var /**@type{Node}*/ node = walker.currentNode,
            /**@type{number}*/ type = node ? node.nodeType : 0,
            error;
        // find the next element, skip text nodes with only whitespace
        while (type > 1) {
runtime.log("validateElement " + type);
            if (type !== 3 || !/^\s+$/.test(walker.currentNode.nodeValue)) {// TEXT_NODE
                return [new RelaxNGParseError("Not allowed node of type " + type +
                        ".")];
            }
            node = walker.nextSibling();
            type = node ? node.nodeType : 0;
        }
        if (!node) {
            runtime.log("node was empty!");
            return [new RelaxNGParseError("Missing element " + elementdef.a.name)];
        }
runtime.log("validateElement " + node.nodeName + " " + elementdef.a.name);
        if (qName(node) !== elementdef.a.name) {
            return [new RelaxNGParseError("Found " + node.nodeName +
                    " instead of " + elementdef.a.name + ".", node)];
        }
runtime.log("yo");
        // the right element was found, now parse the contents
        if (walker.firstChild()) {
            // currentNode now points to the first child node of this element
            error = validate(elementdef, walker);
        }
        walker.currentNode = node;
        return error;
    }

    /**
     * @param elementdef
     * @param walker
     * @return {Array.<RelaxNGParseError>}
     */
    function validateChoice(elementdef, walker) {
        // loop through child definitions and return if a match is found
        var i, e, l = elementdef.e.length, name = walker.currentNode.nodeName;
        for (i = 0; i < l; i += 1) {
            e = elementdef.e[i];
            if (e.name !== "element") {
                throw "Choice must only have 'element' children.";
            }
            if (e.a.name === name) {
                return validateElement(e, walker);
            }
        }
        runtime.log("Element " + name + " is not allowed here.");
        return [new RelaxNGParseError("Element " + name + " is not allowed here.")];
    }

    /**
     * Validate the next part
     * @param {!Object} elementdef
     * @param {!TreeWalker} walker
     * @return {undefined}
     */
    validate = function validate(elementdef, walker) {
runtime.log("validate '" + elementdef.name + "'");
        var i, e;
        for (i = 0; i < elementdef.e.length; i += 1) {
            // skip until an element is encountered, then enter it
            e = elementdef.e[i];
runtime.log("vv " + i + "'" + e.name + "'");
            if (e.name === "element") {
                validateElement(e, walker);
            } else if (e.name === "choice") {
                validateChoice(e, walker);
            } else if (e.name === "attribute") {
                validateAttribute(e, walker);
            } else if (e.name === "oneOrMore") {
                validateOneOrMore(e, walker);
                e.name = "attribute"; // ignore attribute
            } else if (e.name === "interleave") {
                validateInterleave(e, walker);
                // skip interleave for now: it's for attributes
                e.name = "interleave";
            } else if (e.name === "optional") {
                validateOptional(e, walker);
            } else {
                runtime.log("unknown type: " + e.name);
            }
        }
    };

    /**
     * Validate the elements pointed to by the TreeWalker
     * @param {!TreeWalker} walker
     * @param {!function(string):undefined} callback
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
        var errors = validate(start, walker);
        callback(errormessage + " number of errors: " + ((errors) ? errors.length : 0));
    }
    this.validate = validateXML;

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
