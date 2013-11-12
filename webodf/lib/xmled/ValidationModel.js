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
 * @enum {number}
 */
xmled.ParticleType = {
    SEQUENCE: 1,
    CHOICE:   2,
    ALL:      3,
    ANY:      4,
    ELEMENT:  5
};
/**
 * @constructor
 * @struct
 */
xmled.ParticleDefinition = function ParticleDefinition() {
    "use strict";
    /**@type{!xmled.ParticleType}*/
    this.type = xmled.ParticleType.SEQUENCE;
    /**@type{!number}*/
    this.minOccurs = 1;
    /**@type{!number}*/
    this.maxOccurs = 1;
};
/**
 * @constructor
 * @extends xmled.ParticleDefinition
 * @struct
 */
xmled.Sequence = function Sequence() {
    "use strict";
    /**@const@type{!xmled.ParticleType}*/
    this.type = xmled.ParticleType.SEQUENCE;
    /**@type{!number}*/
    this.minOccurs = 1;
    /**@type{!number}*/
    this.maxOccurs = 1;
    /**@type{!Array.<!xmled.ParticleDefinition>}*/
    this.seq = [];
};
/**
 * @constructor
 * @extends xmled.ParticleDefinition
 * @struct
 * @param {!Object.<!string,!number>} map
 */
xmled.Choice = function Choice(map) {
    "use strict";
    /**@const@type{!xmled.ParticleType}*/
    this.type = xmled.ParticleType.CHOICE;
    /**@type{!number}*/
    this.minOccurs = 1;
    /**@type{!number}*/
    this.maxOccurs = 1;
    /**@type{!Array.<!xmled.ParticleDefinition>}*/
    this.choices = [];
    /**
     * @param {?string} ns
     * @param {!string} name
     * @return {!number}
     */
    this.getParticleDefinitionOffset = function (ns, name) {
        var n = map[ns || ""] || name;
        n = name;
        return map.hasOwnProperty(n) ? map[n] : -1;
    };
};
/**
 * @constructor
 * @extends xmled.ParticleDefinition
 * @struct
 */
xmled.All = function All() {
    "use strict";
    /**@const@type{!xmled.ParticleType}*/
    this.type = xmled.ParticleType.ALL;
    /**@type{!number}*/
    this.minOccurs = 1;
    /**@type{!number}*/
    this.maxOccurs = 1;
};
/**
 * @constructor
 * @extends xmled.ParticleDefinition
 * @struct
 */
xmled.Any = function Any() {
    "use strict";
    /**@const@type{!xmled.ParticleType}*/
    this.type = xmled.ParticleType.ANY;
    /**@type{!number}*/
    this.minOccurs = 1;
    /**@type{!number}*/
    this.maxOccurs = 1;
};
/**
 * @constructor
 * @extends xmled.ParticleDefinition
 * @struct
 * @param {!xmled.Element} element
 */
xmled.ElementRef = function ElementRef(element) {
    "use strict";
    /**@const@type{!xmled.ParticleType}*/
    this.type = xmled.ParticleType.ELEMENT;
    /**@type{!number}*/
    this.minOccurs = 1;
    /**@type{!number}*/
    this.maxOccurs = 1;
    /**@type{!xmled.Element}*/
    this.element = element;
};

/**
 * @constructor
 * @struct
 */
xmled.Type = function Type() {
    "use strict";
    /**@type{!boolean}*/
    this.mixed = false;
    /**@type{!boolean}*/
    this.simple = false;
    /**@type{?xmled.Sequence|?xmled.Choice|?xmled.All}*/
    this.particle = null;
};
/**
 * @constructor
 * @struct
 * @param {?string} ns
 * @param {!string} name
 */
xmled.Element = function Element(ns, name) {
    "use strict";
    /**@type{?string}*/
    this.ns = ns;
    /**@type{!string}*/
    this.name = name;
    /**@type{!boolean}*/
    this.mixed = false;
    /**@type{!boolean}*/
    this.simple = false;
    /**@type{?Element}*/
    this.annotation = null;
    /**@type{?xmled.Sequence|?xmled.Choice|?xmled.All}*/
    this.particle = null;
};
/**
 * @constructor
 * @struct
 */
xmled.QName = function QName(ns, name) {
    "use strict";
    /**@type{?string}*/
    this.ns = ns;
    /**@type{!string}*/
    this.name = name;
};
/**
 * @constructor
 * @struct
 * @param {!Object.<?string,!Object.<!string,!xmled.ElementRef>>} elements
 */
xmled.ParsedSchema = function ParsedSchema(elements) {
    "use strict";
    this.element = function (namespaceURI, localName) {
        var ns = elements[namespaceURI];
        return ns ? ns[localName] : null;
    };
    this.elements = (function () {
        var es = [], i, e, j;
        for (i in elements) {
            if (elements.hasOwnProperty(i)) {
                e = elements[i];
                for (j in e) {
                    if (e.hasOwnProperty(j)) {
                        es.push(e[j]);
                    }
                }
            }
        }
        return es;
    }());
};
/**
 * @param {!Document} dom
 * @param {!Object} doms
 * @return {!Object.<?string,!Object.<!string,!xmled.ElementRef>>}
 */
xmled.parseSchema = function (dom, doms) {
    "use strict";
    var xsd = dom.documentElement,
        targetNamespace = xsd.getAttribute("targetNamespace"),
        xsdns = "http://www.w3.org/2001/XMLSchema",
        /**@type{!Object.<?string,!Object.<!string,!xmled.ElementRef>>}*/
        topElements = {},
        types = {},
        parseChoice,
        parseLocalComplexType,
        parseTopLevelElement,
        parseGroup;
    function unexpected(e) {
        throw "Unexpected element " + e.namespaceURI + " " + e.localName;
    }
    function xsdname(e) {
        if (!e) {
            return null;
        }
        if (e.namespaceURI !== xsdns) {
            unexpected(e);
        }
        return e.localName;
    }
    /**
     * @param {!string} qname
     * @param {!Element} element
     * @return {!xmled.QName}
     */
    function splitName(qname, element) {
        var i = qname.indexOf(':');
        if (i === -1) {
            return new xmled.QName(null, qname);
        }
        return new xmled.QName(
            element.lookupNamespaceURI(qname.substr(0, i)),
            (i === -1) ? qname : qname.substr(i + 1)
        );
    }
    /**
     * @param {?Element} e
     * @return {?Element}
     */
    function skipOptionalAnnotation(e) {
        var name = xsdname(e);
        if (name === "annotation") {
            e = e.nextElementSibling;
        }
        return e;
    }
    /**
     * Return the top level complexType or simpleType definition.
     * @param {!xmled.QName} qname
     * @return {!Element}
     */
    function findType(qname) {
        var e = xsd.firstElementChild,
            name;
        while (e) {
            name = xsdname(e);
            if (name === "simpleType" || name === "complexType") {
                if (e.getAttribute("name") === qname.name) {
                    break;
                }
            }
            e = e.nextElementSibling;
        }
        if (!e) {
            throw "Type not found.";
        }
        return e;
    }
    /**
     * @param {!string} name
     * @return {!Element}
     */
    function findElement(name) {
        var e = xsd.firstElementChild,
            n;
        while (e) {
            n = xsdname(e);
            if (n === "element") {
                if (e.getAttribute("name") === name) {
                    break;
                }
            }
            e = e.nextElementSibling;
        }
        if (!e) {
            throw "Type not found.";
        }
        return e;
    }
    /**
     * @param {!Element} def
     * @return {!xmled.Type}
     */
    function parseComplexType(def) {
        var el = parseLocalComplexType(def);
        el.mixed = def.getAttribute("mixed") === "true";
        return el;
    }
    /**
     * @param {!xmled.QName} qname
     * @return {!xmled.Type}
     */
    function getType(qname) {
        var ns,
            name,
            def,
            e;
        ns = types[qname.ns] = types[qname.ns] || {};
        if (ns.hasOwnProperty(qname.name)) {
            return ns[qname.name];
        }
        def = findType(qname);
        name = def.localName;
        if (name === "simpleType") {
            e = new xmled.Type();
        } else if (name === "complexType") {
            e = parseComplexType(def);
        } else {
            throw unexpected(e);
        }
        ns[qname.name] = e;
        return e;
    }
    function setType(element, type) {
        element.mixed = type.mixed;
        element.particle = type.particle;
    }
    function getMinOccurs(element) {
        var minOccurs = element.getAttribute("minOccurs");
        return (minOccurs !== null) ? parseInt(minOccurs, 10) : 1;
    }
    function getMaxOccurs(element) {
        var maxOccurs = element.getAttribute("maxOccurs");
        if (maxOccurs === null) {
            return 1;
        }
        if (maxOccurs === "unbounded") {
            return 100000;
        }
        return parseInt(maxOccurs, 10);
    }
    /**
     * @param {!Element} def
     * @param {!xmled.ParticleDefinition} particle
     * @return {undefined}
     */
    function parseOccurrance(def, particle) {
        particle.minOccurs = getMinOccurs(def);
        particle.maxOccurs = getMaxOccurs(def);
    }
    /**
     * @param {!string} qname
     * @return {!string}
     */
    function getLocalName(qname) {
        var i = qname.indexOf(':');
        return (i === -1) ? qname : qname.substr(i + 1);
    }
    function getElement(ns, name) {
        var map, e, def, er;
        map = topElements[ns] = topElements[ns] || {};
        if (map.hasOwnProperty(name)) {
            return map[name];
        }
        def = findElement(name);
        e = new xmled.Element(ns, name);
        er = map[name] = new xmled.ElementRef(e);
        parseTopLevelElement(def, e);
        return er;
    }
    /**
     * @param {!Element} def
     * @return {!xmled.ElementRef}
     */
    function parseElementRef(def) {
        var ref = def.getAttribute("ref"),
            name = def.getAttribute("name"),
            el,
            eref;
        ref = ref && getLocalName(ref);
        if (ref) {
            eref = getElement(targetNamespace, ref);
        } else {
            el = new xmled.Element(targetNamespace, name);
            eref = new xmled.ElementRef(el);
        }
        parseOccurrance(def, eref);
        return eref;
    }
    /**
     * @param {!Element} def
     * @return {!xmled.Any}
     */
    function parseAny(def) {
        var a = new xmled.Any();
        parseOccurrance(def, a);
        return a;
    }
    /**
     * @param {!Element} def
     * @return {!xmled.Sequence}
     */
    function parseSequence(def) {
        var seq = new xmled.Sequence(),
            e = def.firstElementChild,
            name = xsdname(e);
        parseOccurrance(def, seq);
        if (name === "annotation") {
            e = e.nextElementSibling;
        }
        while (e) {
            name = xsdname(e);
            if (name === "sequence") {
                seq.seq.push(parseSequence(e));
            } else if (name === "choice") {
                seq.seq.push(parseChoice(e));
            } else if (name === "element") {
                seq.seq.push(parseElementRef(e));
            } else if (name === "any") {
                seq.seq.push(parseAny(e));
            } else if (name === "group") {
                seq.seq.push(parseGroup(e));
            } else {
                unexpected(e);
            }
            e = e.nextElementSibling;
        }
        return seq;
    }
    /**
     * @param {!number} offset
     * @param {!xmled.ParticleDefinition} def
     * @param {!Object.<!string,!number>} els
     * @return {undefined}
     */
    function getPossibleElements(offset, def, els) {
        var e, i;
        if (def.type === xmled.ParticleType.ELEMENT) {
            e = /**@type{!xmled.ElementRef}*/(def);
            els[e.element.name] = offset;
        } else if (def.type === xmled.ParticleType.SEQUENCE) {
            e = /**@type{!xmled.Sequence}*/(def);
            for (i = 0; i < e.seq.length; i += 1) {
                getPossibleElements(offset, e.seq[i], els);
            }
            console.log(def);
        } else if (def.type === xmled.ParticleType.CHOICE) {
            e = /**@type{!xmled.Choice}*/(def);
            for (i = 0; i < e.choices.length; i += 1) {
                getPossibleElements(offset, e.choices[i], els);
            }
        } else {
            console.log(def);
        }
    }
    /**
     * @param {!Element} def
     * @return {!xmled.Choice}
     */
    parseChoice = function parseChoice(def) {
        var ch,
            seq = parseSequence(def).seq,
            i,
            els;
        els = {};
        for (i = 0; i < seq.length; i += 1) {
            getPossibleElements(i, seq[i], els);
        }
        ch = new xmled.Choice(els);
        parseOccurrance(def, ch);
console.log(els);
        ch.choices = seq;
        return ch;
    };
    /**
     * @param {!Element} def
     * @return {!xmled.All}
     */
    function parseAll(def) {
        var all = new xmled.All();
        parseOccurrance(def, all);
        return all;
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
     * @param {!Element} def
     * @return {!xmled.All|!xmled.Choice|!xmled.Sequence}
     */
    parseGroup = function parseGroup(def) {
        var e = findGroupCollection(def),
            name = xsdname(e),
            r;
        if (name === "sequence") {
            r = parseSequence(e);
        } else if (e && name === "choice") {
            r = parseChoice(e);
        } else if (e && name === "all") {
            r = parseAll(e);
        } else {
            throw unexpected(e);
        }
        return r;
    };
    /**
     * @param {!Element} def
     * @return {!xmled.All|!xmled.Choice|!xmled.Sequence}
     */
    function parseDefinitionGroup(def) {
        var e = findGroupCollection(def),
            name = xsdname(e),
            r;
        if (name === "sequence") {
            r = parseSequence(e);
        } else if (e && name === "choice") {
            r = parseChoice(e);
        } else if (e && name === "all") {
            r = parseAll(e);
        } else {
            throw unexpected(e);
        }
        return r;
    }
    /**
     * @param {!Element} def
     * @return {!xmled.Type}
     */
    function parseExtension(def) {
        var base = getType(splitName(def.getAttribute("base"), def)),
            ext = parseLocalComplexType(def);
        if (ext.particle) {
            base.particle = ext.particle;
        }
        return base;
    }
    /**
     * @param {!Element} def
     * @return {!xmled.Type}
     */
    function parseRestriction(def) {
        return parseLocalComplexType(def);
    }
    /**
     * @param {!Element} def
     * @return {!xmled.Type}
     */
    function parseComplexContent(def) {
        var e = skipOptionalAnnotation(def.firstElementChild),
            name = xsdname(e),
            el;
        if (e && name === "extension") {
            el = parseExtension(e);
        } else if (e && name === "restriction") {
            el = parseRestriction(e);
        } else {
            throw unexpected(e);
        }
        return el;
    }
    /**
     * @param {!Element} def
     * @return {!xmled.Type}
     */
    parseLocalComplexType = function parseLocalComplexType(def) {
        var type = new xmled.Type(),
            e = skipOptionalAnnotation(def.firstElementChild),
            name = xsdname(e);
        type.mixed = def.getAttribute("mixed") === "true";
        if (!e) {
            type.particle = null;
        } else if (name === "simpleContent") {
            type.simple = true;
        } else if (name === "complexContent") {
            type = parseComplexContent(e);
        } else if (name === "sequence") {
            type.particle = parseSequence(e);
        } else if (name === "choice") {
            type.particle = parseChoice(e);
        } else if (name === "all") {
            type.particle = parseAll(e);
        } else if (name === "group") {
            type.particle = parseDefinitionGroup(e);
        } else if (name !== "anyAttribute" && name !== "attribute"
                && name !== "attributeGroup") {
            unexpected(e);
        }
        return type;
    };
    function parseLocalSimpleType(def) {
        return def;
    }
    /**
     * @param {?Element} e
     * @return {undefined}
     */
    function parseIdentityConstraint(e) {
        var name;
        while (e) {
            name = xsdname(e);
            if (name !== "unique" && name !== "key" && name !== "keyref") {
                unexpected(e);
            }
            e = e.nextElementSibling;
        }
    }
    parseTopLevelElement = function parseTopLevelElement(def, element) {
        var e = def.firstElementChild,
            name = xsdname(e),
            type;
        if (name === "annotation") {
            element.annotation = e;
            e = e.nextElementSibling;
            name = xsdname(e);
        }
        if (def.hasAttribute("type")) {
            type = getType(splitName(def.getAttribute("type"), def));
            setType(element, type);
            if (e !== null) {
                unexpected(e);
            }
            return;
        }
        if (name === "complexType") {
            type = parseLocalComplexType(e);
            setType(element, type);
            e = e.nextElementSibling;
            parseIdentityConstraint(e);
            return;
        }
        if (name === "simpleType") {
            type = parseLocalSimpleType(e);
            setType(element, type);
            e = e.nextElementSibling;
            parseIdentityConstraint(e);
        } else if (e) {
            unexpected(e);
        }
    };
    function parse() {
        var e = xsd.firstElementChild,
            name,
            schemaLocation;
        // parse header
        while (e) {
            name = xsdname(e);
            schemaLocation = e.getAttribute("schemaLocation");
            if (name === "include" || name === "import" || name === "redefime") {
                if (!doms[schemaLocation]) {
                    throw "Schema " + schemaLocation + " not found.";
                }
            } else if (name !== "annotation") {
                break;
            }
            e = e.nextElementSibling;
        }
        // parse body
        while (e) {
            name = xsdname(e);
            if (name === "element") {
                if (e.getAttribute("abstract") !== "true") {
                    name = e.getAttribute("name");
                    getElement(targetNamespace, e.getAttribute("name"));
                }
            } else if (!(name === "attribute" || name === "annotation" || name === "attribute" || name === "attributeGroup" || name === "complexType" || name === "group" || name === "simpleType" || name === "notation")) {
                throw "Unexpected element " + e.namespaceURI + " " + name;
            }
            e = e.nextElementSibling;
        }
    }
    parse();
    return new xmled.ParsedSchema(topElements);
};

/**
 * @constructor
 * @struct
 * @param {!number} id
 * @param {!xmled.ParticleDefinition} def
 * @param {!number=} offset
 * @param {!xmled.Particle=} parent
 */
xmled.Particle = function Particle(id, def, offset, parent) {
    "use strict";
    this.id = id;
    this.def = def;
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
     * @param {!xmled.ParticleDefinition} def
     * @param {!number=} offset
     * @param {!xmled.Particle=} parent
     * @return {!xmled.Particle}
     */
    this.getParticle = function (def, offset, parent) {
        var e,
            p,
            ps;
        if (!parent) { // asking for a root particle
            e = /**@type{!xmled.ElementRef}*/(def);
            p = rootParticles[e.element.name];
            if (!p) {
                p = new xmled.Particle(particles.length, def);
                particles.push([]);
                rootParticles[e.element.name] = p;
            }
        } else {
            ps = particles[parent.id];
            if (ps.length > offset) {
                p = ps[offset];
            } else {
                p = new xmled.Particle(particles.length, def, offset, parent);
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
        substitutionGroups = {},
        abstractSubstitutionGroups = {},
        fillElementWithDefaults,
        findParticlesInCollection,
        schema;
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
        var minOccurs = element.getAttribute("minOccurs");
        return (minOccurs !== null) ? parseInt(minOccurs, 10) : 1;
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
     * @param {!xmled.ElementRef} definition
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
     * @param {!xmled.ParticleDefinition} def
     * @return {!{desc:!string,range:?Range,dom:!DocumentFragment}}
     */
    function getPossibleElement(doc, def) {
        runtime.assert(def.type === xmled.ParticleType.ELEMENT,
                "The definition is not for an element.");
        var f = doc.createDocumentFragment(),
            edef = /**@type{!xmled.ElementRef}*/(def),
            el = edef.element,
            e;
        if (el.ns) {
            e = doc.createElementNS(el.ns, el.name);
        } else {
            e = doc.createElement(el.name);
        }
        f.appendChild(e);
        fillElementWithDefaults(e, edef);
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
            current = documentElement,
            es = schema.elements,
            i;
        if (!doc) {
            throw "Missing owner document.";
        }
        for (i = 0; i < es.length; i += 1) {
            e = es[i];
            if (e.element.name !== current.localName) {
                r.push(getPossibleElement(doc, e));
            }
        }
        return r;
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
    /**
     * @param {!xmled.ParticleSearchState} state
     * @return {undefined}
     */
    function findParticlesInSequence(state) {
        var particle = state.particle,
            def = /**@type{!xmled.Sequence}*/(particle.def),
            seq = def.seq,
            l = seq.length,
            e,
            offset = 0;
        runtime.assert(def.type === xmled.ParticleType.SEQUENCE,
            "Sequence expected.");
        for (offset = 0; !state.done() && offset < l; offset += 1) {
            e = seq[offset];
            state.particle = particles.getParticle(e, offset, particle);
            findParticlesInCollection(state);
        }
    }
    /**
     * @param {!xmled.ParticleSearchState} state
     * @return {undefined}
     */
    function findParticlesInChoice(state) {
        var particle = state.particle,
            def = /**@type{!xmled.Choice}*/(particle.def),
            e,
            n = state.element,
            offset = 0;
        if (state.done()) {
            return;
        }
        offset = def.getParticleDefinitionOffset(n.namespaceURI, n.localName);
        if (offset === -1) {
            state.error = "No choice option was chosen.";
            return;
        }
        e = def.choices[offset];
        state.particle = particles.getParticle(e, offset, particle);
        findParticlesInCollection(state);
    }
    /**
     * @param {!xmled.ParticleSearchState} state
     * @return {undefined}
     */
    function findParticlesInElement(state) {
        var particle = state.particle,
            e = state.element,
            def = /**@type{!xmled.ElementRef}*/(particle.def).element;
        if (e.localName !== def.name || e.namespaceURI !== def.ns) {
            state.error = "Expected " + def.name + " instead of "
                + e.localName + ".";
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
            def = particle.def,
            minOccurs = def.minOccurs,
            maxOccurs = def.maxOccurs,
            currentElement = state.element,
            lastElement,
            occurrence = 1;
        while (currentElement && occurrence <= maxOccurs) {
            runtime.assert(occurrence < 10000, "looping");
            state.particle = particle;
            state.error = null;
            lastElement = currentElement;
            switch (def.type) {
            case xmled.ParticleType.SEQUENCE:
                findParticlesInSequence(state);
                break;
            case xmled.ParticleType.CHOICE:
                findParticlesInChoice(state);
                break;
            case xmled.ParticleType.ELEMENT:
                findParticlesInElement(state);
                runtime.assert(state.element !== currentElement
                    || state.error === null || state.done(),
                    "No progress after checking element.");
                break;
            case xmled.ParticleType.ANY:
                findParticlesInAny(state);
                runtime.assert(state.element !== currentElement
                    || state.error === null || state.done(),
                    "No progress after checking any element.");
                break;
            case xmled.ParticleType.ALL:
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
     * Create an array with a particles.
     * Each particle corresponds to the element at the same position in the
     * input element.
     * @param {!xmled.ParticleSearchState} state
     * @return {undefined}
     */
    function findParticles(state) {
        var def = /**@type{!xmled.ElementRef}*/(state.particle.def);
        runtime.assert(def.type === xmled.ParticleType.ELEMENT,
                "findParticles requires element.");
        // if the element is simpleType, no child elements are allowed
        if (def.element.simple) {
            if (state.element !== null) {
                throw "Element of simpleType may not contain elements.";
            }
            return;
        }
        if (!def.element.particle) {
            // only attributes
            if (state.element !== null) {
                throw "No child elements allowed.";
            }
            return;
        }
        state.particle = particles.getParticle(def.element.particle, 0,
            state.particle);
        findParticlesInCollection(state);
    }
    /**
     * @param {!Element} element
     * @return {!xmled.Particle}
     */
    function getRootParticle(element) {
        var def = schema.element(targetNamespace, element.localName);
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
            minOccurs = particle.def.minOccurs,
            c,
            e,
            def,
            i;
        // check if the particle instance may be removed
        if (particleInstanceCount > minOccurs) {
            f = doc.createDocumentFragment();
            a.push({desc: 'Remove element', range: {}, dom: f});
        }
        p = p[pos].parent;
        def = /**@type{!xmled.Choice}*/(p.def);
        if (def.type !== xmled.ParticleType.CHOICE || def.choices.length === 1) {
            return a; // there are no other options
        }
        if (particleInstanceCount === 1) {
            for (i = 0; i < def.choices.length; i += 1) {
                c = def.choices[i];
                if (c.type === xmled.ParticleType.ELEMENT) {
                    e = /**@type{!xmled.ElementRef}*/(c);
                    if (e.element.name !== element.localName) {
                        a.push(getPossibleElement(doc, e));
                    }
                }
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
        maxOccurs = particle.def.maxOccurs;
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
    /**
     * @param {!Element} documentElement
     * @param {!Element} element
     * @param {?NodeFilter=} filter
     * @return {!boolean}
     */
    this.allowsText = function (documentElement, element, filter) {
        var ps = findAllParticles(documentElement, element, filter || null),
            i;
        for (i = 0; i < ps.length; i += 1) {
            console.log(ps[i][0].def);
        }
        return ps === null;
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
    function indexSubstitutionGroups() {
        var e = xsd.firstElementChild,
            sg;
        while (e) {
            if (e.localName === "element") {
                sg = e.getAttribute("substitutionGroup");
                if (sg) {
                    if (e.getAttribute("abstract") === "true") {
                        sg = abstractSubstitutionGroups[sg]
                            = abstractSubstitutionGroups[sg] || {};
                    } else {
                        sg = substitutionGroups[sg]
                            = substitutionGroups[sg] || {};
                    }
                    sg[e.getAttribute("name")] = e;
                }
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
            indexSubstitutionGroups();
            schema = xmled.parseSchema(dom, {
                "xml.xsd": 1,
                "http://www.w3.org/2001/xml.xsd": 1
            });
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
