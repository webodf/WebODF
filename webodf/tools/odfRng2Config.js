/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
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

function aggregate(callback) {
    return function (collection, individual) {
        return collection.concat(callback(individual));
    };
}

function toArray(nodeList) {
    "use strict";
    return Array.prototype.slice.call(nodeList);
}

function getName(node) {
    return node && node.getAttribute("name");
}

function getNames(node) {
    var name = getName(node);
    return name ? [name] : toArray(node.getElementsByTagName("name")).map(function (node) {
        return node.textContent;
    });
}

function pad(str, length) {
    while (str.length < length) {
        str += " ";
    }
    return str;
}

/**
 * Extract container node information out of the supplied RNG schema document.
 * This only does extremely simplistic parsing.
 *
 * @constructor
 * @param {!Document} document
 */
function ExtractContainerInfo(document) {
    /**
     * @param {!Node} node
     * @return {!Array.<!Node>}
     */
    function findParentElements(node) {
        var refs;

        while (node && /(define|element)/.test(node.localName) === false) {
            node = node.parentNode;
        }

        if (node) {
            if (node.localName === "element") {
                return [node];
            }
            refs = toArray(document.querySelectorAll("ref[name='" + getName(node) + "']"));
            return refs.reduce(aggregate(findParentElements), []);
        }
        return [];
    }

    this.getTextElements = function() {
        return toArray(document.getElementsByTagName("text")).reduce(aggregate(findParentElements), []);
    };
}

function onLoadRng(err, document) {
    if (err) {
        console.log("\nError: " + err + "\n");
        runtime.exit(1);
    } else {
        var containerFinder = new ExtractContainerInfo(document),
            textElements,
            elementNames,
            doc;

        textElements = containerFinder.getTextElements();
        elementNames = textElements.reduce(aggregate(getNames), []).sort();
        doc = elementNames.map(function (elementName) {
            return "[" + pad('"' + elementName + '"', 40) + ", TODO]";
        }).join(",\n");

        console.log(doc + "\n");
        runtime.exit(0);
    }
}

function main(args) {
    "use strict";
    var rngPath = args && args.pop();
    if (!/\.rng$/.test(rngPath)) {
        console.log("\nUsage:");
        console.log("   odfRng2Config.js <OpenDocument-vXX-os-schema>.rng\n");
        runtime.exit(1);
    } else {
        runtime.loadXML(rngPath, onLoadRng);
    }
}
main(String(typeof arguments) !== "undefined" && Array.prototype.slice.call(arguments));