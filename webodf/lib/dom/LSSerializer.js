/*global dom*/
if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        /**
         * @constructor
         */
        var F = function () {};
        F.prototype = o;
        return new F();
    };
}

/**
 * Partial implementation of LSSerializer
 * @constructor
 */
dom.LSSerializer = function LSSerializer() {
    var /**@const@type{!LSSerializer}*/ self = this;

    /**
     * @param {!string} prefix
     * @param {!Attr} attr
     * @return {!string}
     */
    function serializeAttribute(prefix, attr) {
        var /**@type{!string}*/ s = prefix + attr.localName + "=\"" +
            attr.nodeValue + "\"";
        return s;
    }
    /**
     * @param {!Object.<string,string>} nsmap
     * @param {string} prefix
     * @param {string} ns
     * @return {!string}
     */
    function attributePrefix(nsmap, prefix, ns) {
        // TODO: check for double prefix definitions, this needs a special class
        if (nsmap.hasOwnProperty(ns)) {
            return nsmap[ns] + ":";
        }
        if (nsmap[ns] !== prefix) {
            nsmap[ns] = prefix;
        }
        return prefix + ":";
    }
    /**
     * @param {!Object.<string,string>} nsmap
     * @param {!Node} node
     * @return {!string}
     */
    function startNode(nsmap, node) {
        var /**@type{!string}*/ s = "",
            /**@const@type{!NamedNodeMap}*/ atts = node.attributes,
            /**@const@type{!number}*/ length,
            /**@type{!number}*/ i,
            /**@type{!Attr}*/ attr,
            /**@type{!string}*/ attstr = "",
            /**@type{!number}*/ accept,
            /**@type{!string}*/ prefix;
        if (atts) { // ELEMENT
            if (nsmap[node.namespaceURI] !== node.prefix) {
                nsmap[node.namespaceURI] = node.prefix;
            }
            s += "<" + node.nodeName;
            length = atts.length;
            for (i = 0; i < length; i += 1) {
                attr = /**@type{!Attr}*/(atts.item(i));
                accept = (self.filter) ? self.filter.acceptNode(attr) : 1;
                if (accept === 1) {
                    // xml attributes always need a prefix for a namespace
                    if (attr.namespaceURI) {
                       prefix = attributePrefix(nsmap, attr.prefix,
                               attr.namespaceURI);
                    } else {
                       prefix = "";
                    }
                    attstr += " " + serializeAttribute(prefix, attr);
                }
            }
            for (i in nsmap) {
                if (nsmap.hasOwnProperty(i)) {
                    if (nsmap[i]) {
                        s += " xmlns:" + nsmap[i] + "=\"" + i + "\"";
                    } else {
                        s += " xmlns=\"" + i + "\"";
                    }
                }
            }
            s += attstr + ">";
        }
        return s;
    }
    /**
     * @param {!Node} node
     * @return {!string}
     */
    function endNode(node) {
        var /**@type{!string}*/ s = "";
        if (node.nodeType === 1) { // ELEMENT
            s += "</" + node.nodeName + ">";
        }
        return s;
    }
    /**
     * @param {!Object.<string,string>} parentnsmap
     * @param {!Node} node
     * @return {!string}
     */
    function serializeNode(parentnsmap, node) {
        var /**@type{!string}*/ s = "",
            /**@const@type{!Object.<string,string>}*/ nsmap
                = Object.create(parentnsmap),
            /**@const@type{!number}*/ accept
                = (self.filter) ? self.filter.acceptNode(node) : 1,
            /**@type{Node}*/child;
        if (accept === 1) {
            s += startNode(nsmap, node);
        }
        child = node.firstChild;
        while (child) {
            s += serializeNode(nsmap, child);
            child = child.nextSibling;
        }
        if (node.nodeValue) {
            s += node.nodeValue;
        }
        if (accept === 1) {
            s += endNode(node);
        }
        return s;
    }
    function invertMap(map) {
        var m = {}, i;
        for (i in map) {
            if (map.hasOwnProperty(i)) {
                m[map[i]] = i;
            }
        }
        return m;
    }
    /**
     * @type {dom.LSSerializerFilter}
     */
    this.filter = null;
    /**
     * @param {!Node} node
     * @param {!Object.<string,string>} nsmap
     * @return {!string}
     */
    this.writeToString = function (node, nsmap) {
        if (!node) {
            return "";
        }
        nsmap = nsmap ? invertMap(nsmap) : {};
        return serializeNode(nsmap, node);
    };
};
