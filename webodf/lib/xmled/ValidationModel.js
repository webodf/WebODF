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
/*global xmled, runtime, console, NodeFilter*/

runtime.loadClass("xmled.XsdChecker");

/**
 * @constructor
 * @param {!Document|!Element} documentNode
 * @param {?Node} targetNode
 */
xmled.ValidationState = function ValidationState(documentNode, targetNode) {
    "use strict";
    var self = this,
        xsdns = "http://www.w3.org/2001/XMLSchema",
        defs = [],
        poss = [],
        occs = [],
        isDone = false;
    /**
     * @const @type {!Node}
     */
    this.documentNode = documentNode;
    /**
     * @const @type {?Node}
     */
    this.targetNode = targetNode;
    /**
     * @type {?Node}
     */
    this.currentNode = null;
    /**
     * @type {?string}
     */
    this.error = null;
    /**
     * @type {!boolean}
     */
    this.mixed = false;
    /**
     * @param {!Element} def
     * @return {undefined}
     */
    this.push = function (def) {
        var name = def.localName;
        runtime.assert(def.namespaceURI === xsdns, "def has wrong namespace");
        runtime.assert(defs.length !== 0
            || (name === "element" && def.parentNode.localName === "schema"),
            "First element should be top level element");
        runtime.assert(name === "sequence" || name === "choice"
            || name === "element" || name === "any",
            "Invalide definition pushed.");
        defs.push(def);
        poss.push(0);
        occs.push(1);
    };
    /**
     * @return {!boolean}
     */
    this.checkDone = function () {
        isDone = isDone || targetNode === self.currentNode;
        return isDone;
    };
    /**
     * @return {!boolean}
     */
    function done() {
        return isDone || self.error !== null;//targetNode === self.currentNode;
    }
    this.done = done;
    /**
     * @return {undefined}
     */
    this.pop = function () {
        if (!done()) {
            defs.pop();
            poss.pop();
            occs.pop();
        }
    };
    /**
     * @return {undefined}
     */
    this.topPosReset = function () {
        poss[poss.length - 1] = 0;
    };
    /**
     * @return {!Array.<!Element>}
     */
    this.defs = function () {
        return defs;
    };
    /**
     * @return {!number}
     */
    this.length = function () {
        return defs.length;
    };
    /**
     * @param {!number} pos
     * @return {!Element}
     */
    this.def = function (pos) {
        return defs[pos];
    };
    /**
     * @param {!number} pos
     * @return {!number}
     */
    this.pos = function (pos) {
        return poss[pos];
    };
    /**
     * @return {!Element}
     */
    this.topDef = function () {
        return defs[defs.length - 1];
    };
    /**
     * @return {!Element}
     */
    this.topPos = function () {
        return poss[poss.length - 1];
    };
    /**
     * Returns the current occurrence of top definition.
     * @return {!number}
     */
    this.topOccurrence = function () {
        return occs[occs.length - 1];
    };
    /**
     * Advance the state to the next occurrence of the current definition.
     * @return {undefined}
     */
    this.topNextOccurrence = function () {
        occs[occs.length - 1] += 1;
    };
};
/**
 * @constructor
 * @param {!number} id
 * @param {!Element} element
 * @param {!number=} offset
 * @param {!xmled.Particle=} parent
 */
xmled.Particle = function Particle(id, element, offset, parent) {
    "use strict";
    this.id = id;
    this.element = element;
    this.offset = offset;
    this.parent = parent;
};
/**
 * @constructor
 */
xmled.ParticleCache = function ParticleCache() {
    "use strict";
    var rootParticles = {},
        particles = [];
    /**
     * @param {!Element} element
     * @param {!number=} offset
     * @param {!xmled.Particle=} parent
     * @return {!xmled.Particle}
     */
    this.getParticle = function (element, offset, parent) {
        var n = element.localName,
            p,
            ps;
        runtime.assert(n === "element" || n === "group" || n === "all"
                || n === "choice" || n === "sequence" || n === "any",
                "Unexpected element '" + n + "'.");
        if (!parent) { // asking for a root particle
            p = rootParticles[element.localName];
            if (!p) {
                p = new xmled.Particle(particles.length, element);
                particles.push([]);
                rootParticles[element.localName] = p;
            }
        } else {
            ps = particles[parent.id];
            if (ps.length > offset) {
                p = ps[offset];
            } else {
                p = new xmled.Particle(particles.length, element, offset,
                        parent);
                particles.push([]);
            }
        }
        return p;
    };
};
/**
 * @constructor
 * @param {!xmled.Particle} particle
 * @param {?NodeFilter} filter
 */
xmled.ParticleSearchState = function ParticleSearchState(particle, filter) {
    "use strict";
    var self = this;
    /**@type{!xmled.Particle}*/
    this.particle = particle;
    /**@type{!number}*/
    this.offset = 0;
    /**@type{?Element}*/
    this.element = null;
    /**@type{!Array.<!xmled.Particle>}*/
    this.particles = [];
    /**@type{?string}*/
    this.error = null;
    /**@type{?NodeFilter}*/
    this.filter = filter;
    /**
     * @param {?Element} e
     * @return {?Element}
     */
    function getAcceptableSibling(e) {
        while (e && filter
                && filter.acceptNode(e) !== NodeFilter.FILTER_ACCEPT) {
            e = e.nextElementSibling;
        }
        return e;
    }
    this.getAcceptableSibling = getAcceptableSibling;
    /**
     * @param {!Element} element
     * @return {!number}
     */
    function childElementCount(element) {
        var e = element.firstElementChild,
            count = 0;
        while (e) {
            if (!filter || filter.acceptNode(e) === NodeFilter.FILTER_ACCEPT) {
                count += 1;
            }
            e = e.nextElementSibling;
        }
        return count;
    }
    this.childElementCount = childElementCount;
    /**
     * @param {!xmled.Particle} particle
     * @param {?Element} element
     * @param {!number} offset
     * @return {undefined}
     */
    this.set = function (particle, element, offset) {
        self.offset = offset;
        self.particle = particle;
        self.element = getAcceptableSibling(element.firstElementChild);
        self.particles = [];
        self.particles.length = childElementCount(element);
    };
    /**
     * @return {!boolean}
     */
    this.done = function () {
        return self.offset === self.particles.length || self.error !== null;
    };
    this.nextElementSibling = function () {
        self.particles[self.offset] = self.particle;
        self.offset += 1;
        self.element = getAcceptableSibling(self.element.nextElementSibling);
    };
};
/**
 * @constructor
 * @param {!string} grammarurl
 * @param {function(?string):undefined=} onready
 */
xmled.ValidationModel = function ValidationModel(grammarurl, onready) {
    "use strict";
    var modelState = xmled.ValidationModel.State.LOADING,
        xsdns = "http://www.w3.org/2001/XMLSchema",
        error,
        xsd,
        targetNamespace = null,
        checker = new xmled.XsdChecker(),
        particles = new xmled.ParticleCache(),
        topLevelElements = {},
        fillElementWithDefaults,
        findParticlesInCollection;
    /**
     * @return {!xmled.ValidationModel.State}
     */
    this.getState = function () {
        return modelState;
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
     * @param {!string} qname
     * @return {!string}
     */
    function getLocalName(qname) {
        var i = qname.indexOf(':');
        return (i === -1) ? qname : qname.substr(i + 1);
    }
    /**
     * @param {!string} qname
     * @return {!Element}
     */
    function findTopLevelElement(qname) {
        var name = getLocalName(qname),
            e;
        if (targetNamespace) {
            name = '{' + targetNamespace + '}' + name;
        }
        e = topLevelElements[name];
        if (!e) {
            throw "Element not found.";
        }
        return e;
    }
    /**
     * Return the top level complexType or simpleType definition.
     * @param {!string} qname
     * @return {!Element}
     */
    function findType(qname) {
        var e = xsd.firstElementChild,
            localName = getLocalName(qname);
        while (e && !((e.localName === "simpleType"
                       || e.localName === "complexType")
                      && e.getAttribute("name") === localName)) {
            e = e.nextElementSibling;
        }
        if (!e) {
            throw "Type not found.";
        }
        return e;
    }
    /**
     * @param {!Element} groupRef
     * @return {!Element}
     */
    function findGroup(groupRef) {
        var e = xsd.firstElementChild,
            qname = groupRef.getAttribute("ref"),
            localName = getLocalName(qname);
        while (e && !(e.localName === "group"
                && e.getAttribute("name") === localName)) {
            e = e.nextElementSibling;
        }
        if (!e) {
            throw "Group not found.";
        }
        return e;
    }
    /**
     * @param {!Element} groupRef
     * @return {!Element}
     */
    function findGroupCollection(groupRef) {
        var e = /**@type{!Element}*/(findGroup(groupRef).lastElementChild);
        return e;
    }
    /**
     * @param {!NodeList} list
     * @param {!string} name
     * @return {?Element}
     */
    function getElementWithName(list, name) {
        var i, e;
        for (i = 0; i < list.length; i += 1) {
            e = /**@type{!Element}*/(list.item(i));
            if (e.getAttribute("name") === name) {
                return e;
            }
        }
        return null;
    }
    /**
     * @param {!string} qname
     * @return {?Element}
     */
    function findElement(qname) {
        var localName = getLocalName(qname),
            es = xsd.getElementsByTagNameNS(xsdns, "element");
        return getElementWithName(es, localName);
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
    function getMaxOccurs(element) {
        if (!element.hasAttribute("maxOccurs")) {
            return 1;
        }
        var maxOccurs = element.getAttribute("maxOccurs");
        if (maxOccurs === "unbounded") {
            return 100000;
        }
        return parseInt(maxOccurs, 10);
    }
    function getInstanceOfSubstitutionGroup(abstrct) {
        var name = abstrct.getAttribute("name"),
            e = xsd.firstElementChild,
            sg;
        while (e) {
            sg = e.getAttribute("substitutionGroup");
            if (sg && getLocalName(sg) === name) {
                return e;
            }
            e = e.nextElementSibling;
        }
        return e;
    }
    /**
     * @param {!string} groupName
     * @param {!string} name
     * @return {?Element}
     */
    function findElementInstance(groupName, name) {
        var e = xsd.firstElementChild,
            sg;
        while (e) {
            sg = e.getAttribute("substitutionGroup");
            if (sg && getLocalName(sg) === groupName) {
                if (e.getAttribute("name") === name) {
                    return e;
                }
                sg = findElementInstance(e.getAttribute("name"), name);
                if (sg) {
                    return sg;
                }
            }
            e = e.nextElementSibling;
        }
        return e;
    }
    /**
     * @param {!Element} instance
     * @param {!Element} coll
     * @return {undefined}
     */
    function addCollection(instance, coll) {
        if (coll.namespaceURI !== xsdns) {
            return;
        }
        var doc = instance.ownerDocument,
            def = coll,
            e;
        if (def.localName === "element") {
            if (!def.hasAttribute("name")) {
                def = findTopLevelElement(def.getAttribute("ref"));
            }
            if (def.getAttribute("abstract") === "true") {
                def = getInstanceOfSubstitutionGroup(def);
            }
            if (targetNamespace) {
                e = doc.createElementNS(targetNamespace,
                    def.getAttribute("name"));
            } else {
                e = doc.createElement(def.getAttribute("name"));
            }
            fillElementWithDefaults(e, def);
            instance.appendChild(e);
        }
    }
    /**
     * @param {!Element} instance
     * @param {!Element} sequence
     * @return {undefined}
     */
    function addSequence(instance, sequence) {
        var minOccurs = getMinOccurs(sequence),
            i,
            e;
        for (i = 0; i < minOccurs; i += 1) {
            e = sequence.firstElementChild;
            while (e) {
                addCollection(instance, e);
                e = e.nextElementSibling;
            }
        }
    }
    /**
     * @param {!Element} instance
     * @param {!Element} choice
     * @return {undefined}
     */
    function addChoice(instance, choice) {
        var minOccurs = getMinOccurs(choice),
            name,
            i,
            e;
        for (i = 0; i < minOccurs; i += 1) {
            e = choice.firstElementChild;
            while (e) {
                // avoid nesting an element in another one with the same name
                name = e.getAttribute("name") || e.getAttribute("ref");
                if (name !== instance.localName) {
                    addCollection(instance, e);
                    break;
                }
                e = e.nextElementSibling;
            }
        }
    }
    /**
     * @param {!Element} instance
     * @param {!Element} group
     * @return {undefined}
     */
    function addGroup(instance, group) {
        group = findGroupCollection(group);
        if (group.localName === "sequence") {
            addSequence(instance, group);
        } else if (group.localName === "choice") {
            addChoice(instance, group);
        } else {
            throw "Not implemented";
        }
    }
    /**
     * @param {!Element} instance
     * @param {!Element} definition
     * @return {undefined}
     */
    fillElementWithDefaults = function (instance, definition) {
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
            forEachElement(type, xsdns, "choice", function (seq) {
                addChoice(instance, seq);
            });
            forEachElement(type, xsdns, "group", function (seq) {
                addGroup(instance, seq);
            });
        });
    };
    /**
     * @param {!Document} doc
     * @param {!Element} elementDef
     * @return {!{desc:!string,range:?Range,dom:!DocumentFragment}}
     */
    function getPossibleElement(doc, elementDef) {
        runtime.assert(elementDef.localName === "element",
                "The definition is not for an element.");
        var f = doc.createDocumentFragment(),
            e = elementDef;
        if (!e.hasAttribute("name")) {
            e = findTopLevelElement(e.getAttribute("ref"));
        }
        if (targetNamespace) {
            e = doc.createElementNS(targetNamespace, e.getAttribute("name"));
        } else {
            e = doc.createElement(e.getAttribute("name"));
        }
        f.appendChild(e);
        fillElementWithDefaults(e, elementDef);
        return {desc: e.localName, range: null, dom: f};
    }
    /**
     * @param {?Node} n
     * @param {?NodeFilter=} filter
     * @return {?Element}
     */
    function firstElementChild(n, filter) {
        n = n && n.firstChild;
        var e = null;
        while (n && !e) {
            if (n.nodeType === 1 &&
                    (!filter
                     || filter.acceptNode(n) === NodeFilter.FILTER_ACCEPT)) {
                e = /**@type{!Element}*/(n);
            }
            n = n.nextSibling;
        }
        return e;
    }
    /**
     * @param {!Element} documentElement
     * @return {!Array.<!{desc:!string,range:?Range,dom:!DocumentFragment}>}
     */
    function getPossibleDocuments(documentElement) {
        // for each xsd:element can lead to a document
        var r = [], e,
            doc = documentElement.ownerDocument,
            current = firstElementChild(doc);
        if (!doc) {
            throw "Missing owner document.";
        }
        e = xsd && xsd.firstElementChild;
        while (e) {
            if (e.namespaceURI === xsdns && e.localName === "element"
                    && e.getAttribute("abstract") !== "true") {
                if (!current || current.localName !== e.getAttribute("name")) {
                    r.push(getPossibleElement(doc, e));
                }
            }
            e = e.nextElementSibling;
        }
        return r;
    }
    /**
     * @param {?Element} parent
     * @return {?Element}
     */
    function firstNonAnnotationChild(parent) {
        var e = parent && parent.firstElementChild;
        if (e && e.localName === "annotation") {
            e = e.nextElementSibling;
        }
        return e;
    }
    /**
     * @param {!Element} element
     * @param {?NodeFilter} filter
     * @return {!number}
     */
    function getPosition(element, filter) {
        var position = 0,
            e = element.parentNode.firstElementChild;
        while (e !== element) {
            if (!filter || filter.acceptNode(e) === NodeFilter.FILTER_ACCEPT) {
                position += 1;
            }
            e = e.nextElementSibling;
        }
        return position;
    }
    function findCollectionDefinition(def) {
        if (def.localName === "complexContent") {
            def = def.firstElementChild.firstElementChild;
        }
        if (def.localName === "group") {
            def = findGroupCollection(def);
        }
        return def;
    }
    /**
     * @param {!xmled.ParticleSearchState} state
     * @return {undefined}
     */
    function findParticlesInSequence(state) {
        var particle = state.particle,
            def = particle.element,
            e,
            offset = 0;
        def = findCollectionDefinition(def);
        e = firstNonAnnotationChild(def);
        runtime.assert(def.localName === "sequence", "Sequence expected.");
        while (e && !state.done()) {
            if (e.localName === "sequence" || e.localName === "choice"
                    || e.localName === "element" || e.localName === "any"
                    || e.localName === "group") {
                state.particle = particles.getParticle(e, offset, particle);
                findParticlesInCollection(state);
            } else {
                throw "Not implemented";
            }
            e = e.nextElementSibling;
            offset += 1;
        }
    }
    /**
     * @param {!xmled.ParticleSearchState} state
     * @return {undefined}
     */
    function findParticlesInChoice(state) {
        var particle = state.particle,
            def = particle.element,
            e,
            n = state.element,
            offset = 0,
            emptyok = false;
        def = findCollectionDefinition(def);
        e = firstNonAnnotationChild(def);
        runtime.assert(def.localName === "choice", "Choice expected.");
        while (e && !state.done()) {
            if (e.localName === "sequence" || e.localName === "choice"
                    || e.localName === "element" || e.localName === "any"
                    || e.localName === "group") {
                state.particle = particles.getParticle(e, offset, particle);
                findParticlesInCollection(state);
                if (!state.error) {
                    if (state.element === n) {
                        emptyok = true;
                    } else {
                        break;
                    }
                }
                state.element = n;
                state.error = null;
            } else {
                throw "Not implemented";
            }
            e = e.nextElementSibling;
            offset += 1;
        }
        if (emptyok) {
            state.error = null;
        }
        if (offset === def.childElementCount) {
            state.error = "No choice option was chosen.";
        }
    }
    /**
     * @param {!xmled.ParticleSearchState} state
     * @return {undefined}
     */
    function findParticlesInElement(state) {
        var particle = state.particle,
            def = particle.element,
            name;
        if (def.hasAttribute("ref")) {
            def = findTopLevelElement(def.getAttribute("ref"));
        }
        name = def.getAttribute("name");
        if (def.getAttribute("abstract") === "true") {
            def = findElementInstance(name, state.element.localName);
            if (!def) {
                state.error = "Instance is not part of substitution group.";
                return;
            }
            state.nextElementSibling();
        } else if (state.element.localName !== name) {
            state.error = "Expected " + name + " instead of "
                + state.element.localName + ".";
        } else {
            state.nextElementSibling();
        }
    }
    /**
     * @param {!xmled.ParticleSearchState} state
     * @return {undefined}
     */
    function findParticlesInAny(state) {
        state.nextElementSibling();
    }
    /**
     * @param {!xmled.ParticleSearchState} state
     * @return {undefined}
     */
    findParticlesInCollection = function findParticlesInCollection(state) {
        var particle = state.particle,
            def = particle.element,
            minOccurs = getMinOccurs(def),
            maxOccurs = getMaxOccurs(def),
            currentElement = state.element,
            lastElement,
            localName,
            occurrence = 1;
        localName = findCollectionDefinition(def).localName;
        while (currentElement && occurrence <= maxOccurs) {
            runtime.assert(occurrence < 200, "looping");
            state.particle = particle;
            state.error = null;
            lastElement = currentElement;
            if (localName === "sequence") {
                findParticlesInSequence(state);
            } else if (localName === "choice") {
                findParticlesInChoice(state);
            } else if (localName === "element") {
                findParticlesInElement(state);
                runtime.assert(state.element !== currentElement
                    || state.error === null || state.done(),
                    "No progress after checking element.");
            } else if (localName === "any") {
                findParticlesInAny(state);
                runtime.assert(state.element !== currentElement
                    || state.error === null || state.done(),
                    "No progress after checking any element.");
            } else {
                throw "Not implemented";
            }
            if (state.error) {
                if (occurrence > minOccurs) {
                    // roll back one loop
                    state.error = null;
                    state.element = lastElement;
                }
                break;
            }
            if (state.done()) {
                break;
            }
            currentElement = state.element;
            occurrence += 1;
        }
        if (occurrence < minOccurs) {
            throw "Not enough elements.";
        }
    };
    /**
     * @param {?Element} element
     * @return {!boolean}
     */
    function isTypeDefParticle(element) {
        if (!element) {
            return false;
        }
        var name = element.localName;
        return name === "all" || name === "sequence" || name === "choice"
            || name === "group";
    }
    function findParticlesInExtensionTypes(types, state) {
        var particle = state.particle,
            type,
            i;
        // now all types are all, sequence, choice or group
        for (i = 0; i < types.length; i += 1) {
            type = types[i];
            runtime.assert(isTypeDefParticle(type), "Unexpected element.");
            state.particle = particles.getParticle(type, i, particle);
            findParticlesInCollection(state);
            if (state.error) {
                break;
            }
        }
    }
    /**
     * @param {!Element} extension
     * @param {!xmled.ParticleSearchState} state
     * @return {undefined}
     */
    function findParticlesInExtension(extension, state) {
        runtime.assert(extension.localName === "extension",
                "Expected extension");
        var types = [],
            base = findType(extension.getAttribute("base")),
            type = firstNonAnnotationChild(extension);
        if (isTypeDefParticle(type)) {
            types.push(type);
        }
        do {
            if (base.localName === "simpleType") {
                break;
            }
            base = firstNonAnnotationChild(base);
            if (base.localName === "simpleContent") {
                break;
            }
            if (base.localName !== "complexContent") {
                if (isTypeDefParticle(base)) {
                    types.push(base);
                }
                break;
            }
            base = firstNonAnnotationChild(base); // extension or restriction
            type = firstNonAnnotationChild(base);
            if (isTypeDefParticle(type)) {
                types.push(type);
            }
            if (base.localName === "extension") {
                base = findType(base.getAttribute("base"));
            } else { // restriction
                break;
            }
        } while (base);
        types.reverse();
        findParticlesInExtensionTypes(types, state);
    }
    /**
     * Create an array with a particles.
     * Each particle corresponds to the element at the same position in the
     * input element.
     * @param {!xmled.ParticleSearchState} state
     * @return {undefined}
     */
    function findParticles(state) {
        var def = state.particle.element,
            type;
        runtime.assert(def.localName === "element",
                "findParticles requires element.");
        // dereference the element definition
        if (def.hasAttribute("ref")) {
            def = findTopLevelElement(def.getAttribute("ref"));
        }
        runtime.assert(def !== null,
                "findParticles requires an element definition.");
        if (def.getAttribute("abstract") === "true") {
            def = findElementInstance(def.getAttribute("name"), state.element.localName);
        }
        // find the type
        if (def.hasAttribute("type")) {
            type = findType(def.getAttribute("type"));
        } else {
            type = firstNonAnnotationChild(def);
        }
        // if the element is simpleType, no child elements are allowed
        if (def.localName === "simpleType") {
            if (state.element !== null) {
                throw "Element of simpleType may not contain elements.";
            }
            return;
        }
        runtime.assert(type.localName === "complexType",
                 "Expected a complexType.");
        // find the collection element of this complex type
        type = firstNonAnnotationChild(type);
        // if the type is simpleContent, no child elements are allowed
        if (type.localName === "simpleContent") {
            if (state.element !== null) {
                throw "Element of simpleType may not contain elements.";
            }
            return;
        }
        // type is now 'complexContent', 'all', 'sequence', 'choice' or 'group'
        if (type.localName === "complexContent") {
            type = firstNonAnnotationChild(type);
            if (type.localName === "restriction") {
                type = firstNonAnnotationChild(type);
            } else { // type.localName === "extension"
                findParticlesInExtension(type, state);
                return;
            }
        }
        if (!type || !isTypeDefParticle(type)) {
            // only attributes
            if (state.element !== null) {
                throw "No child elements allowed.";
            }
            return;
        }
        // type is now 'all', 'sequence', 'choice' or 'group'
        state.particle = particles.getParticle(type, 0, state.particle);
        findParticlesInCollection(state);
    }
    /**
     * @param {!Element} element
     * @return {!xmled.Particle}
     */
    function getRootParticle(element) {
        var def = findTopLevelElement(element.localName);
        if (!def) {
            throw "No definition for " + element.localName;
        }
        return particles.getParticle(def);
    }
    /**
     * @param {!Element} documentElement
     * @param {!Element} element
     * @param {?NodeFilter} filter
     * @return {!Array.<!Array.<!xmled.Particle>>}
     */
    function findAllParticles(documentElement, element, filter) {
        var parents = [element],
            parentParticle,
            e = element,
            ps = [],
            state,
            i;
        while (e && documentElement !== e) {
            e = /**@type{!Element}*/(e.parentNode);
            parents.push(e);
        }
        parents.reverse();
        ps.length = parents.length;
        parentParticle = getRootParticle(documentElement);
        state = new xmled.ParticleSearchState(parentParticle, filter);
        ps[0] = [parentParticle];
        e = documentElement;
        for (i = 1; i < parents.length; i += 1) {
            if (e.firstElementChild.localName === "any") {
                ps[i] = [];
            } else {
                state.set(parentParticle, e, 0);
                findParticles(state);
                ps[i] = state.particles;
            }
            runtime.assert(state.error === null, state.error || "");
            runtime.assert(state.done(), "Not done!");
            e = parents[i];
            parentParticle = ps[i][getPosition(e, filter)];
        }
        return ps;
    }
    /**
     * @param {!Element} element
     * @param {!xmled.ParticleSearchState} state
     * @return {?string}
     */
    function validateElement(element, state) {
        var e,
            ps,
            l = state.childElementCount(element),
            i,
            ec;
        findParticles(state);
        ps = state.particles;
        runtime.assert(state.error === null, state.error || "");
        runtime.assert(state.done(), "Not done!");
        e = state.getAcceptableSibling(element.firstElementChild);
        for (i = 0; i < l; i += 1) {
            runtime.assert((ps[i] || null) !== null, "Particle is missing.");
            ec = state.getAcceptableSibling(e.firstElementChild);
            if (ec && ec.localName !== "any") {
                state.set(ps[i], e, 0);
                validateElement(e, state);
                if (state.error) {
                    return state.error;
                }
                runtime.assert(state.error === null, state.error || "");
                runtime.assert(state.done(), "Not done!");
            }
            e = state.getAcceptableSibling(e.nextElementSibling);
        }
        return null;
    }
    /**
     * @param {!Element} documentElement
     * @param {!NodeFilter=} filter
     * @return {?string}
     */
    this.validate = function (documentElement, filter) {
        var particle = getRootParticle(documentElement),
            state = new xmled.ParticleSearchState(particle, filter || null);
        state.set(particle, documentElement, 0);
        return validateElement(documentElement, state);
    };
    /**
     * Return the number of instance of particlular particle are present
     * @param {!Array.<!xmled.Particle>} particles
     * @param {!number} position
     * @return {!number}
     */
    function countParticleInstances(particles, position) {
        var p = particles[position],
            count = 1,
            i = position - 1;
        while (i >= 0 && particles[i] === p) {
            i -= 1;
            count += 1;
        }
        i = position + 1;
        while (i < particles.length && particles[i] === p) {
            i += 1;
            count += 1;
        }
        return count;
    }
    /**
     * @param {!Array.<!Array.<!xmled.Particle>>} particles
     * @param {!Element} documentElement
     * @param {!Element} element
     * @param {?NodeFilter} filter
     * @return {!Array.<{desc:!string,range:!Range,dom:!DocumentFragment}>}
     */
    function findAlternativeElements(particles, documentElement, element,
            filter) {
        var doc = /**@type{!Document}*/(documentElement.ownerDocument),
            f,
            a = [],
            pos = getPosition(element, filter),
            p = particles[particles.length - 1],
            particle = p[pos],
            particleInstanceCount = countParticleInstances(p, pos),
            minOccurs = getMinOccurs(particle.element),
            e;
        // check if the particle instance may be removed
        if (particleInstanceCount > minOccurs) {
            f = doc.createDocumentFragment();
            a.push({desc: 'Remove element', range: {}, dom: f});
        }
        p = p[pos].parent;
        if (p.element.childElementCount === 1) {
            return a; // there are no other options
        }
        e = findCollectionDefinition(p.element);
        if (e.localName === "choice" && particleInstanceCount === 1) {
            e = e.firstElementChild;
            while (e) {
                if (e.localName === "element" && e !== particle.element) {
                    a.push(getPossibleElement(doc, e));
                }
                e = e.nextElementSibling;
            }
        }
        return a;
    }
    /**
     * @param {!Element} container
     * @param {!number} offset
     * @param {?NodeFilter} filter
     * @return {?Element}
     */
    function getElementAfterPosition(container, offset, filter) {
        var n = container.firstChild,
            e;
        while (offset && n) {
            n = n.nextSibling;
            offset -= 1;
        }
        while (n && (n.nodeType !== 1 || (filter && filter.acceptNode(n) !== NodeFilter.FILTER_ACCEPT))) {
            n = n.nextSibling;
        }
        e = /**@type{?Element}*/(n);
        return e;
    }
    /**
     * @param {!Element} documentElement
     * @param {!Element} container
     * @param {!number} offset
     * @param {?NodeFilter} filter
     * @return {!Array.<{desc:!string,range:!Range,dom:!DocumentFragment}>}
     */
    function getPossibleInsertions(documentElement, container, offset, filter) {
        var doc = documentElement.ownerDocument,
            f,
            is = [],
            ps,
            e = getElementAfterPosition(container, offset, filter),
            particle,
            occurs,
            maxOccurs;
        if (!e) {
            return [];
        }
        ps = findAllParticles(documentElement, e, filter);
        particle = ps[ps.length - 1][0];
        occurs = countParticleInstances(ps[ps.length - 1], 0);
        maxOccurs = getMaxOccurs(particle.element);
        if (occurs < maxOccurs) {
            f = doc.createDocumentFragment();
            e = doc.createElementNS(e.namespaceURI, e.localName);
            f.appendChild(e);
            is.push({ dom: f, desc: e.localName, range: {}});
        }
        return is;
    }
    /**
     * @param {!Element} documentElement
     * @param {!Element} node
     * @param {?NodeFilter} filter
     * @return {!Array.<{desc:!string,range:!Range,dom:!DocumentFragment}>}
     */
    function getPossibleNodeReplacements(documentElement, node, filter) {
        var ps;
        ps = findAllParticles(documentElement, node, filter);
/*
        runtime.assert(state.currentNode !== null, "No element found.");
        runtime.assert(state.length() > 0, "No definitions in state.");
        runtime.assert(state.topDef().localName === "element",
            "Top definition must be an element definition, not "
            + state.topDef().localName + ".");
*/
        return findAlternativeElements(ps, documentElement, node, filter);
    }
    function getNode(container, offset) {
        var n = container.firstChild;
        while (offset > 0) {
            n = n.nextSibling;
            offset -= 1;
        }
        return n;
    }
    /**
     * @param {!Range} range
     * @param {?NodeFilter} filter
     * @return {!number}
     */
    function countElementsInRange(range, filter) {
        if (range.startContainer !== range.endContainer) {
            return 0;
        }
        var n1 = getNode(range.startContainer, range.startOffset),
            n2 = getNode(range.endContainer, range.endOffset),
            c = 0;
        while (n1 !== n2) {
            if (!filter || filter.acceptNode(n1) === NodeFilter.FILTER_ACCEPT) {
                c += 1;
            }
            n1 = n1.nextSibling;
        }
        return c;
    }
    /**
     * @param {!Element} documentElement
     * @param {!Range} range
     * @param {?NodeFilter} filter
     * @return {!Array.<{desc:!string,range:!Range,dom:!DocumentFragment}>}
     */
    function getPossibleReplacements(documentElement, range, filter) {
        var count = countElementsInRange(range, filter),
            node = range.startContainer.childNodes.item(range.startOffset),
            e;
        if (count !== 1) {
            throw "Not implemented";
        }
        while (filter && node
                && filter.acceptNode(node) !== NodeFilter.FILTER_ACCEPT) {
            node = node.nextSibling;
        }
        if (!node || node.nodeType !== 1) {
            throw "Not implemented";
        }
        e = /**@type{!Element}*/(node);
        return getPossibleNodeReplacements(documentElement, e, filter);
    }
    /**
     * Return array of possible replacements.
     * The range indicates the start and end points of the range that is being
     * replaced.
     * The returned array contains a textual description, a range that contains
     * the corresponding points in the created fragment and the dom fragment
     * that can be the replacement for the input range. This range is owned by
     * the same document as the documentElement.
     *
     * @param {!Element} documentElement
     * @param {!Range=} range
     * @param {?NodeFilter=} filter
     * @return {!Array.<{desc:!string,range:?Range,dom:!DocumentFragment}>}
     */
    this.getPossibleReplacements = function (documentElement, range, filter) {
        var r,
            documentNode = documentElement.parentNode,
            count = range && countElementsInRange(range, filter || null);
        if (!range || (count === 1 && range.endContainer === documentNode)) {
            r = getPossibleDocuments(documentElement);
        } else if (!range.collapsed) {
            r = getPossibleReplacements(documentElement, range, filter || null);
        } else {
            r = getPossibleInsertions(
                documentElement,
                /**@type{!Element}*/
                (range.startContainer),
                range.startOffset,
                filter || null
            );
        }
        return r;
    };
    function indexTopLevelElements() {
        var e = xsd.firstElementChild,
            pre = "";
        if (targetNamespace) {
            pre = '{' + targetNamespace + '}';
        }
        while (e) {
            if (e.localName === "element") {
                topLevelElements[pre + e.getAttribute("name")] = e;
            }
            e = e.nextElementSibling;
        }
    }
    function init() {
        runtime.loadXML(grammarurl, function (err, dom) {
            if (dom) {
                err = err || checker.check(dom);
            }
            if (err || !dom) {
                error = err;
                modelState = xmled.ValidationModel.State.ERROR;
                return onready && onready(error);
            }
            modelState = xmled.ValidationModel.State.READY;
            xsd = dom.documentElement;
            if (xsd.hasAttribute("targetNamespace")) {
                targetNamespace = xsd.getAttribute("targetNamespace");
            }
            indexTopLevelElements();
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
