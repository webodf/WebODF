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
        validateElement;

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

    function error(string) {
        errormessage = string;
    }

    function parse(element) {
        var e = [], a = {}, c = element.firstChild, atts = element.attributes, att, i;
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

    function parseRelaxNGDOM(dom) {
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
            return error("No Relax NG start element was found.");
        }
        try {
            resolveDefines(start, defines);
            for (i in defines) {
                if (defines.hasOwnProperty(i)) {
                    resolveDefines(defines[i], defines);
                }
            }
        } catch (err) {
            return error(err);
        }
    }

    function validateChoice(elementdef, walker) {
        // loop through child definitions and return if a match is found
        var i, e, l = elementdef.e.length, name = walker.currentNode.nodeName;
        for (i = 0; i < l; i += 1) {
            e = elementdef.e[i];
            if (e.name !== "element") {
                throw "Choice must only have 'element' children.";
            }
            if (e.a.name === name) {
                walker.firstChild();
                validateElement(e, walker);
                return;
            }
        }
        runtime.log("Element " + name + " is not allowed here.");
    }

    function validateInterleave(elementdef, walker) {
    }

    function validateOptional(elementdef, walker) {
    }

    /**
     * Validate one element
     * @param {!Object} elementdef
     * @param {!TreeWalker} walker
     * @return {undefined}
     */
    validateElement = function (elementdef, walker) {
        var i, e;
        for (i = 0; i < elementdef.e.length; i += 1) {
            e = elementdef.e[i];
            if (e.name === "choice") {
                validateChoice(e, walker);
            } else if (e.name === "interleave") {
                validateInterleave(e, walker);
                // skip interleave for now: it's for attributes
                e.name = "interleave";
//            } else if (e.name === "optional") {
//                validateOptional(e, walker);
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
    function validate(walker, callback) {
        if (!loaded) {
            queue.push(function () {
                validate(walker, callback);
            });
            return;
        }
        if (errormessage) {
            callback(errormessage);
        }
        walker.currentNode = walker.root;
        validateElement(start, walker);
    }
    this.validate = validate;

    runtime.loadXML(url, function (err, dom) {
        loaded = true;
        if (err) {
            errormessage = err;
        } else {
            parseRelaxNGDOM(dom);
        }
        handleQueue();
    });
};
