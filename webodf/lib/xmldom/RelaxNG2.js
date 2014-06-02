/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global Node, runtime, xmldom*/

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
 */
/**
 * @constructor
 */
xmldom.RelaxNG2 = function RelaxNG2() {
    "use strict";
    var start,
        validateNonEmptyPattern,
        nsmap;

    /**
     * @constructor
     * @param {!string} error
     * @param {Node=} context
     */
    function RelaxNGParseError(error, context) {
        this.message = function () {
            if (context) {
                error += (context.nodeType === Node.ELEMENT_NODE) ? " Element " : " Node ";
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
     * @param elementdef
     * @param walker
     * @param {Element} element
     * @return {Array.<RelaxNGParseError>}
     */
    function validateOneOrMore(elementdef, walker, element) {
        // The list of definitions in the elements list should be completely
        // traversed at least once. If a second or later round fails, the walker
        // should go back to the start of the last successful traversal
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
        return node && node.nodeType === Node.TEXT_NODE && /^\s+$/.test(node.nodeValue);
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
            // with older browsers getAttributeNS for a non-existing attribute
            // can return an empty string still, so explicitly check before
            // if the attribute is set
            if (element.hasAttributeNS(elementdef.namespaces[i], elementdef.localnames[i])) {
                a = element.getAttributeNS(elementdef.namespaces[i], elementdef.localnames[i]);
            } else {
                a = undefined;
            }

            if (att !== undefined && a !== undefined) {
                return [new RelaxNGParseError("Attribute defined too often.",
                        element)];
            }
            att = a;
        }
        if (att === undefined) {
            return [new RelaxNGParseError("Attribute not found: " +
                    elementdef.names, element)];
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
     * If element if of the right type, it is entered and the validation
     * continues inside the element. After validation, regardless of whether an
     * error occurred, the walker is at the same depth in the dom tree.
     * @param elementdef
     * @param walker
     * @return {Array.<RelaxNGParseError>}
     */
    function validateElement(elementdef, walker) {
        if (elementdef.e.length !== 2) {
            throw "Element with wrong # of elements: " + elementdef.e.length;
        }
        // forward until an element is seen, then check the name
        var /**@type{Node}*/ node = walker.currentNode,
            /**@type{number}*/ type = node ? node.nodeType : 0,
            error = null;
        // find the next element, skip text nodes with only whitespace
        while (type > Node.ELEMENT_NODE) {
            if (type !== Node.COMMENT_NODE &&
                    (type !== Node.TEXT_NODE ||
                     !/^\s+$/.test(walker.currentNode.nodeValue))) {
                return [new RelaxNGParseError("Not allowed node of type " +
                        type + ".")];
            }
            node = walker.nextSibling();
            type = node ? node.nodeType : 0;
        }
        if (!node) {
            return [new RelaxNGParseError("Missing element " +
                    elementdef.names)];
        }
        if (elementdef.names && elementdef.names.indexOf(qName(node)) === -1) {
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
                if (!isWhitespace(walker.currentNode) && type !== Node.COMMENT_NODE) {
                    return [new RelaxNGParseError("Spurious content.",
                            walker.currentNode)];
                }
            }
            if (walker.parentNode() !== node) {
                return [new RelaxNGParseError("Implementation error.")];
            }
        } else {
            error = validateTop(elementdef.e[1], walker, node);
        }
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
            err = validateNonEmptyPattern(elementdef.e[1], walker, element,
                    data);
            if (err) {
                walker.currentNode = node;
            }
            return null;
        }
        err = validatePattern(elementdef.e[0], walker, element, data);
        if (err) {
            walker.currentNode = node;
            err = validateNonEmptyPattern(elementdef.e[1], walker, element,
                    data);
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
        var l = elementdef.e.length, n = [l], err, i, todo = l,
            donethisround, node, subnode, e;
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
                            // this is a bit dodgy, there should be a rule to
                            // see if multiple elements are allowed
                            e.name === "oneOrMore" ||
                            (e.name === "choice" &&
                            (e.e[0].name === "oneOrMore" ||
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
                        return [new RelaxNGParseError(
                                "Interleave does not match.", element
                        )];
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
/*jslint unparam: true*/
    /**
     * @param elementdef
     * @param walker
     * @param {Element} element
     * @return {Array.<RelaxNGParseError>}
     */
    function validateText(elementdef, walker, element) {
        var /**@type{Node}*/ node = walker.currentNode,
            /**@type{number}*/ type = node ? node.nodeType : 0;
        // find the next element, skip text nodes with only whitespace
        while (node !== element && type !== 3) {
            if (type === 1) {
                return [new RelaxNGParseError(
                        "Element not allowed here.", node
                )];
            }
            node = walker.nextSibling();
            type = node ? node.nodeType : 0;
        }
        walker.nextSibling();
        return null;
    }
/*jslint unparam: false*/
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
            err = validateElement(elementdef, walker);
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
    this.validate = function validate(walker, callback) {
        walker.currentNode = walker.root;
        var errors = validatePattern(start.e[0], walker,
                       /**@type{?Element}*/(walker.root));
        callback(errors);
    };
    this.init = function init(start1, nsmap1) {
        start = start1;
        nsmap = nsmap1;
    };
};
