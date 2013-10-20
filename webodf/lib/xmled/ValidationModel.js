/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
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
 * @source: http://gitorious.org/webodf/webodf/
 */
/*global xmled, runtime, console*/

/**
 * @constructor
 * @param {!string} grammarurl
 * @param {function(?string):undefined=} onready
 */
xmled.ValidationModel = function ValidationModel(grammarurl, onready) {
    "use strict";
    var state = xmled.ValidationModel.State.LOADING,
        xsdns = "http://www.w3.org/2001/XMLSchema",
        error,
        xsd,
        targetNamespace;
    /**
     * @return {!xmled.ValidationModel.State}
     */
    this.getState = function () {
        return state;
    };
    /**
     * @return {?string}
     */
    this.getError = function () {
        return error;
    };
    function getDocumentation(e) {
        var es = e.getElementsByTagNameNS(xsdns, "documentation"),
            doc = "",
            i;
        for (i = 0; i < es.length; i += 1) {
            doc += es.item(i).textContent + "<br/>";
        }
        return doc;
    }
    /**
     * @param {!string} localName
     * @return {?Element}
     */
    function findElement(localName) {
        var es = xsd.getElementsByTagNameNS(xsdns, "element"),
            e,
            i;
        for (i = 0; i < es.length; i += 1) {
            e = es.item(i);
            if (e.getAttribute("name") === localName) {
                return e;
            }
        }
        return null;
    }
    function findAttributeGroup(name) {
        var es = xsd.getElementsByTagNameNS(xsdns, "attributeGroup"),
            e,
            i;
        for (i = 0; i < es.length; i += 1) {
            e = es.item(i);
            if (e.getAttribute("name") === name) {
                return e;
            }
        }
        return null;
    }
    function findAttribute(name) {
        var es = xsd.getElementsByTagNameNS(xsdns, "attribute"),
            e,
            i;
        for (i = 0; i < es.length; i += 1) {
            e = es.item(i);
            if (e.getAttribute("name") === name) {
                return e;
            }
        }
        return null;
    }
    function getType(attribute) {
        if (!attribute) {
            return null;
        }
        var e = attribute.firstChild,
            enumeration = []; 
        while (e && e.localName !== "simpleType") {
            e = e.nextSibling;
        }
        e = e && e.firstChild;
        while (e && e.localName !== "restriction") {
            e = e.nextSibling;
        }
        if (!e) {
            return null;
        }
        e = e.firstChild;
        while (e) {
            if (e.localName === "enumeration") {
                enumeration.push(e.getAttribute("value"));
            }
            e = e.nextSibling;
        }
        if (enumeration.length) {
            return { name: "enumeration", values: enumeration };
        }
        return null;
    }
    /**
     * Return a description for the given element.
     * @param {!Element} element
     * @return {!string}
     */
    this.getElementInfo = function (element) {
        var e = findElement(element.localName),
            doc = "<i>" + element.localName + "</i>";
        if (e) {
            doc += "<br/>" + getDocumentation(e);
        }
        return doc;
    };
    function collectAttributeDefinitions(e, atts, element) {
        e = e && e.firstChild;
        var localName, value, att;
        while (e) {
            if (e.localName === "attribute") {
                att = e;
                if (!e.hasAttribute("name")) {
                    att = findAttribute(e.getAttribute("ref"));
                }
                localName = att ? att.getAttribute("name") : null;
                value = (element.hasAttribute(localName)) ? element.getAttribute(localName) : null;
                atts.push({
                    localName: localName,
                    value: value,
                    type: getType(att)
                });
            } else if (e.localName === "attributeGroup") {
                collectAttributeDefinitions(
                    findAttributeGroup(e.getAttribute("ref")),
                    atts,
                    element
                );
            }
            e = e.nextSibling;
        }
    }
    function getAttributeDefinitions(element) {
        var e = findElement(element.localName),
            atts = [],
            complexType;
        if (!e) {
            return atts;
        }
        complexType = e.firstChild;
        while (complexType && complexType.localName !== "complexType") {
            complexType = complexType.nextSibling;
        }
        if (!complexType) {
            return atts;
        }
        collectAttributeDefinitions(complexType, atts, element);
        return atts;
    }
    /**
     * @param {!Element} element
     * @return {!Array}
     */
    this.getAttributeDefinitions = function (element) {
        var a = [], e = element, ns = element.namespaceURI, atts;
        while (e && e.namespaceURI === ns && e.parentNode !== e) {
            atts = getAttributeDefinitions(e);
            a.push({name: e.localName, atts: atts});
            e = e.parentNode;
        }
        return a;
    };
    function getAllowedElements(e, allowed) {
        e = e.firstElementChild;
        while (e) {
            if (e.localName === "element") {
                if (e.hasAttribute("name")) {
                    allowed[e.getAttribute("name")] = 1;
                } else if (e.hasAttribute("ref")) {
                    allowed[e.getAttribute("ref")] = 1;
                }
            } else {
                getAllowedElements(e, allowed);
            }
            e = e.nextElementSibling;
        }
    }
    /**
     * Return the localNames of the elements that are allowed at this position.
     * @param {!Element} element
     * @return {!Array.<!string>}
     */
    this.getAllowedElements = function (element) {
        var e = findElement(element.localName),
            allowed = {},
            complexType;
        if (!e) {
            return Object.keys(allowed);
        }
        complexType = e.firstChild;
        while (complexType && complexType.localName !== "complexType") {
            complexType = complexType.nextSibling;
        }
        if (!complexType) {
            return Object.keys(allowed);
        }
        getAllowedElements(complexType, allowed);
        return Object.keys(allowed);
    };
    function forEachElement(element, ns, localName, f) {
        var e = element.firstElementChild;
        while (e) {
            if (e.namespaceURI === ns && e.localName === localName) {
                f(e);
            }
            e = e.nextElementSibling;
        }
    }
    function createDefaultAttributeValue(att) {
        return att ? "1" : "0";
    }
    function getMinOccurs(element) {
        return (element.hasAttribute("minOccurs"))
            ? parseInt(element.getAttribute("minOccurs"), 10) : 1;
    }
    function addGroup(instance, group) {
        if (group.namespaceURI !== xsdns) {
            return;
        }
        var doc = instance.ownerDocument,
            e;
        if (group.localName === "element") {
            e = doc.createElementNS(targetNamespace,
                group.getAttribute("name"));
            instance.appendChild(e);
        }
    }
    function addSequence(instance, sequence) {
        var minOccurs = getMinOccurs(sequence),
            i,
            e;
        for (i = 0; i < minOccurs; i += 1) {
            e = sequence.firstElementChild;
            while (e) {
                addGroup(instance, e);
                e = e.nextElementSibling;
            }
        }
    }
    function fillElementWithDefaults(instance, definition) {
        forEachElement(definition, xsdns, "complexType", function (type) {
            forEachElement(type, xsdns, "attribute", function (att) {
                if (att.getAttribute("use") === "required") {
                    if (att.hasAttribute("name")) {
                        instance.setAttribute(att.getAttribute("name"),
                            createDefaultAttributeValue(att));
                    }
                }
            });
            forEachElement(type, xsdns, "sequence", function (seq) {
                addSequence(instance, seq);
            });
        });
    }
    function getPossibleDocument(documentNode, topLevelElement) {
        var doc = documentNode.ownerDocument || documentNode,
            f = doc.createDocumentFragment(),
            e = doc.createElementNS(targetNamespace,
                topLevelElement.getAttribute("name"));
        f.appendChild(e);
        fillElementWithDefaults(e, topLevelElement);
        return {desc: '', range: {}, dom: f};
    }
    function getPossibleDocuments(documentNode) {
        // for each xsd:element can lead to a document
        var r = [], e;
        e = xsd && xsd.firstElementChild;
        while (e) {
            if (e.namespaceURI === xsdns && e.localName === "element") {
                r.push(getPossibleDocument(documentNode, e));
            }
            e = e.nextElementSibling;
        }
        return r;
    }
    /**
     * Return array of possible replacements.
     * The documentNode is the node that contains the documentElement. It does
     * not have to be a Document node.
     * The range indicates the start and end points of the range that is being
     * replaced.
     * The returned array contains a textual description, a range that contains
     * the corresponding points in the created fragment and the dom fragment
     * that can be the replacement for the input range. This range is owned by
     * the same document as the documentNode.
     *
     * @param {!Node} documentNode
     * @param {!Range=} range
     * @return {!Array.<{desc:!string,range:!Range,dom:!DocumentFragment}>}
     */
    this.getPossibleReplacements = function (documentNode, range) {
        var r;
        if (!range) {
            r = getPossibleDocuments(documentNode);
//        } else if (range.collapsed) {
//            throw "Not implemented";
        } else {
            throw "Not implemented";
        }
        return r;
    };
    function init() {
        runtime.loadXML(grammarurl, function (err, dom) {
            if (err) {
                error = err;
                state = xmled.ValidationModel.State.ERROR;
                return onready && onready(error);
            }
            state = xmled.ValidationModel.State.READY;
            xsd = dom.documentElement;
            targetNamespace = null;
            if (xsd.hasAttribute("targetNamespace")) {
                targetNamespace = xsd.getAttribute("targetNamespace");
            }
            return onready && onready(null);
        });
    }
    init();
};
/**
 * @enum {number}
 */
xmled.ValidationModel.State = {
    LOADING: 1,
    ERROR:   2,
    READY:   3
};
(function () {
    "use strict";
    return xmled.ValidationModel;
}());
