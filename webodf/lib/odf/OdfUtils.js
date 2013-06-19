 /**
 * @license
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
 *
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

/*global Node, runtime, odf*/

/**
 * @constructor
 */
odf.OdfUtils = function OdfUtils() {
    "use strict";

    var self = this,
        textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
        drawns = "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
        whitespaceOnly = /^\s*$/;

   /**
     * Determine if the node is a text:p or a text:h element.
     * @param {?Node} e
     * @return {!boolean}
     */
    function isParagraph(e) {
        var name = e && e.localName;
        return (name === "p" || name === "h") && e.namespaceURI === textns;
    }
    this.isParagraph = isParagraph;

    /**
     * Determine if the node is a text:list-item element.
     * @param {?Node} e
     * @return {!boolean}
     */
    this.isListItem = function (e) {
        var name = e && e.localName;
        return name === "list-item" && e.namespaceURI === textns;
    };

    /**
     * Determine if the text consists entirely of whitespace characters.
     * At least one whitespace is required.
     * @param {!string} text
     * @return {!boolean}
     */
    function isODFWhitespace(text) {
        return (/^[ \t\r\n]+$/).test(text);
    }
    this.isODFWhitespace = isODFWhitespace;

    /**
     * Determine if the node is a grouping element.
     * @param {?Node} e
     * @return {!boolean}
     */
    function isGroupingElement(e) {
        var name = e && e.localName;
        return (name === "span" || name === "p" || name === "h")
            && e.namespaceURI === textns;
    }
    this.isGroupingElement = isGroupingElement;
    /**
     * Determine if the node is a grouping element.
     * @param {?Node} e
     * @return {!boolean}
     */
    function isCharacterElement(e) {
        var n = e && e.localName,
            ns,
            r = false;
        if (n) {
            ns = e.namespaceURI;
            if (ns === textns) {
                r = n === "s" || n === "tab" || n === "line-break";
            } else if (ns === drawns) {
                r = n === "frame" && e.getAttributeNS(textns, "anchor-type") === "as-char";
            }
        }
        return r;
    }
    this.isCharacterElement = isCharacterElement;
    /**
     * @param {!Node} node
     * @return {!Node}
     */
    function lastChild(node) {
        while (node.lastChild !== null && isGroupingElement(node)) {
            node = node.lastChild;
        }
        return node;
    }
    this.lastChild = lastChild;
    /**
     * @param {!Node} node
     * @return {?Node}
     */
    function previousNode(node) {
        while (node.previousSibling === null) {
            node = /**@type{!Node}*/(node.parentNode);
            if (isParagraph(node)) {
                return null;
            }
        }
        return lastChild(node.previousSibling);
    }
    this.previousNode = previousNode;
    /**
     * @param {!Node} node
     * @return {?Node}
     */
    function nextNode(node) {
        if (node.firstChild !== null && isGroupingElement(node)) {
            return node.firstChild;
        }
        while (node.nextSibling === null) {
            node = /**@type{!Node}*/(node.parentNode);
            if (isParagraph(node)) {
                return null;
            }
        }
        return node.nextSibling;
    }
    this.nextNode = nextNode;

    /**
     * Walk to the left along the DOM and return true if the first thing
     * encountered is either a non-whitespace character or a character
     * element. Walking goes through grouping elements.
     * @param {?Node} node the first node to scan
     * @return {!boolean}
     */
    function scanLeftForNonWhitespace(node) {
        var r = false;
        while (node) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.length === 0) {
                    node = previousNode(node);
                } else {
                    return !isODFWhitespace(
                        node.data.substr(node.length - 1, 1)
                    );
                }
            } else if (isCharacterElement(node)) {
                r = true;
                break;
            } else {
                node = previousNode(node);
            }
        }
        return r;
    }
    this.scanLeftForNonWhitespace = scanLeftForNonWhitespace;
    /**
     * Walk to the left along the DOM and return the type of the first
     * thing encountered.
     * 0 none of the below
     * 1 non-whitespace character or a character element
     * 2 whitespace character that is preceded by a non-whitespace character
     *   or a character element
     *
     * @param {!Node} node the first node to scan
     * @return {!number}
     */
    function lookLeftForCharacter(node) {
        var text, r = 0;
        if (node.nodeType === Node.TEXT_NODE && node.length > 0) {
            text = node.data;
            if (!isODFWhitespace(text.substr(text.length - 1, 1))) {
                r = 1; // character found
            } else if (text.length === 1) {
                r = scanLeftForNonWhitespace(previousNode(node)) ? 2 : 0;
            } else {
                r = isODFWhitespace(text.substr(text.length - 2, 1)) ? 0 : 2;
            }
        } else if (isCharacterElement(node)) {
            r = 1;
        }
        return r;
    }
    this.lookLeftForCharacter = lookLeftForCharacter;
    /**
     * Look to the right along the DOM and return true if the first thing
     * encountered is either a non-whitespace character or a character
     * element.
     *
     * @param {?Node} node the first node to scan
     * @return {!boolean}
     */
    function lookRightForCharacter(node) {
        var r = false;
        if (node && node.nodeType === Node.TEXT_NODE && node.length > 0) {
            r = !isODFWhitespace(node.data.substr(0, 1));
        } else if (isCharacterElement(node)) {
            r = true;
        }
        return r;
    }
    this.lookRightForCharacter = lookRightForCharacter;
    /**
     * Walk to the left along the DOM and return true if either a
     * non-whitespace character or a character element is encountered.
     *
     * @param {?Node} node the first node to scan
     * @return {!boolean}
     */
    function scanLeftForAnyCharacter(node) {
        var r = false;
        node = node && lastChild(node);
        while (node) {
            if (node.nodeType === Node.TEXT_NODE && node.length > 0
                    && !isODFWhitespace(node.data)) {
                r = true;
                break;
            } else if (isCharacterElement(node)) {
                r = true;
                break;
            }
            node = previousNode(node);
        }
        return r;
    }
    this.scanLeftForAnyCharacter = scanLeftForAnyCharacter;
    /**
     * Walk to the right along the DOM and return true if either a
     * non-whitespace character or a character element is encountered.
     *
     * @param {?Node} node the first node to scan
     * @return {!boolean}
     */
    function scanRightForAnyCharacter(node) {
        var r = false;
        while (node) {
            if (node.nodeType === Node.TEXT_NODE && node.length > 0
                    && !isODFWhitespace(node.data)) {
                r = true;
                break;
            } else if (isCharacterElement(node)) {
                r = true;
                break;
            }
            node = nextNode(node);
        }
        return r;
    }
    this.scanRightForAnyCharacter = scanRightForAnyCharacter;

    /**
     * check if the node is part of the trailing whitespace
     * @param {!Node} textnode
     * @param {!number} offset
     * @return {!boolean}
     */
    function isTrailingWhitespace(textnode, offset) {
        if (!isODFWhitespace(textnode.data.substr(offset))) {
            return false;
        }
        return !scanRightForAnyCharacter(nextNode(textnode));
    }
    this.isTrailingWhitespace = isTrailingWhitespace;

    function isSignificantWhitespace(textNode, offset) {
        var text = textNode.data,
            leftChar,
            leftNode,
            rightChar,
            rightNode,
            result;

        if (!isODFWhitespace(text[offset])) {
            return false;
        }

        if (offset > 0) {
            if (!isODFWhitespace(text[offset - 1])) {
                return true;
            }

            if (offset > 1) {
                if (!isODFWhitespace(text[offset - 2])) {
                    result = true;
                } else if (!isODFWhitespace(text.substr(0, offset))) {
                    return false;
                }
            } else if (scanLeftForNonWhitespace(previousNode(textNode))) {
                result = true;
            }

            if (result === true) {
                return isTrailingWhitespace(textNode, offset)
                    ? false : true;
            }

            rightChar = text[offset + 1];
            if (isODFWhitespace(rightChar)) {
                return false;
            }
            return scanLeftForAnyCharacter(previousNode(textNode))
                ? false : true;
        }
        return false;
    }
    /** Takes a textNode and an offset, and returns true if the character
     * at that offset is a significant whitespace.
     * @param {!Node} textNode
     * @param {!number} offset
     * @return {!boolean}
     */
    this.isSignificantWhitespace = isSignificantWhitespace;

    /**
     * Returns the first non-whitespace-only child of a given node
     * @param {Node} node
     * @returns {Node|null}
     */
    function getFirstNonWhitespaceChild(node) {
        var child = node.firstChild;
        while (child && child.nodeType === Node.TEXT_NODE && whitespaceOnly.test(child.nodeValue)) {
            child = child.nextSibling;
        }
        return child;
    }
    this.getFirstNonWhitespaceChild = getFirstNonWhitespaceChild;

    /**
     * Returns the font size split as value and unit, from an ODF attribute
     * @param {!string} positiveLength
     * @return {?{value:!number,unit:!string}}
     */
    function parseFontSize(positiveLength) {
        var re = /-?([0-9]*[1-9][0-9]*(\.[0-9]*)?|0+\.[0-9]*[1-9][0-9]*|\.[0-9]*[1-9][0-9]*)((cm)|(mm)|(in)|(pt)|(pc)|(px)|(%))/,
            m = re.exec(positiveLength);
        if (!m) {
            return null;
        }
        return {value: parseFloat(m[1]), unit: m[3]};
    }
    this.parseFontSize = parseFontSize;
};
