/**
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
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

/*global Node, core, ops, runtime, NodeFilter, Range*/

(function () {
    "use strict";
    var /**@type{!{rangeBCRIgnoresElementBCR: boolean, unscaledRangeClientRects: boolean, elementBCRIgnoresBodyScroll: !boolean}}*/
        browserQuirks;

    /**
     * Detect various browser quirks
     * unscaledRangeClientRects - Firefox doesn't apply parent css transforms to any range client rectangles
     * rangeBCRIgnoresElementBCR - Internet explorer returns 0 client rects for an empty element that has fixed dimensions
     * elementBCRIgnoresBodyScroll - iOS safari returns false client rects for an element that do not correlate with a scrolled body
     * @return {!{unscaledRangeClientRects: !boolean, rangeBCRIgnoresElementBCR: !boolean, elementBCRIgnoresBodyScroll: !boolean}}
     */
    function getBrowserQuirks() {
        var range,
            directBoundingRect,
            rangeBoundingRect,
            testContainer,
            testElement,
            detectedQuirks,
            window,
            document,
            docElement,
            body,
            docOverflow,
            bodyOverflow,
            bodyHeight,
            bodyScroll;

        if (browserQuirks === undefined) {
            window = runtime.getWindow();
            document = window && window.document;
            docElement = document.documentElement;
            body = document.body;
            browserQuirks = {
                rangeBCRIgnoresElementBCR: false,
                unscaledRangeClientRects: false,
                elementBCRIgnoresBodyScroll: false
            };
            if (document) {
                testContainer = document.createElement("div");
                testContainer.style.position = "absolute";
                testContainer.style.left = "-99999px";
                testContainer.style.transform = "scale(2)";
                testContainer.style["-webkit-transform"] = "scale(2)";

                testElement = document.createElement("div");
                testContainer.appendChild(testElement);
                body.appendChild(testContainer);
                range = document.createRange();
                range.selectNode(testElement);
                // Internet explorer (v10 and others?) will omit the element's own client rect from
                // the returned client rects list for the range
                browserQuirks.rangeBCRIgnoresElementBCR = range.getClientRects().length === 0;

                testElement.appendChild(document.createTextNode("Rect transform test"));
                directBoundingRect = testElement.getBoundingClientRect();
                rangeBoundingRect = range.getBoundingClientRect();
                // Firefox doesn't apply parent css transforms to any range client rectangles
                // See https://bugzilla.mozilla.org/show_bug.cgi?id=863618
                // Depending on the browser, client rects can sometimes have sub-pixel rounding effects, so
                // add some wiggle room for this. The scale is 200%, so there is no issues with false positives here
                browserQuirks.unscaledRangeClientRects = Math.abs(directBoundingRect.height - rangeBoundingRect.height) > 2;

                testContainer.style.transform = "";
                testContainer.style["-webkit-transform"] = "";
                // Backup current values for documentElement and body's overflows, body height, and body scroll.
                docOverflow = docElement.style.overflow;
                bodyOverflow = body.style.overflow;
                bodyHeight = body.style.height;
                bodyScroll = body.scrollTop;
                // Set new values for the backed up properties
                docElement.style.overflow = "visible";
                body.style.overflow = "visible";
                body.style.height = "200%";
                body.scrollTop = body.scrollHeight;
                // After extending the body's height to twice and scrolling by that amount,
                // if the element's new BCR is not the same as the range's BCR, then
                // Houston we have a Quirk! This problem has been seen on iOS7, which
                // seems to report the correct BCR for a range but ignores body scroll
                // effects on an element...
                browserQuirks.elementBCRIgnoresBodyScroll = (range.getBoundingClientRect().top !== testElement.getBoundingClientRect().top);
                // Restore backed up property values
                body.scrollTop = bodyScroll;
                body.style.height = bodyHeight;
                body.style.overflow = bodyOverflow;
                docElement.style.overflow = docOverflow;

                range.detach();
                body.removeChild(testContainer);
                detectedQuirks = Object.keys(browserQuirks).map(
                    /**
                     * @param {!string} quirk
                     * @return {!string}
                     */
                    function (quirk) {
                        return quirk + ":" + String(browserQuirks[quirk]);
                    }
                ).join(", ");
                runtime.log("Detected browser quirks - " + detectedQuirks);
            }
        }
        return browserQuirks;
    }

    /**
     * Return the first child element with the given namespace and name.
     * If the parent is null, or if there is no child with the given name and
     * namespace, null is returned.
     * @param {?Element} parent
     * @param {!string} ns
     * @param {!string} name
     * @return {?Element}
     */
    function getDirectChild(parent, ns, name) {
        var node = parent ? parent.firstElementChild : null;
        while (node) {
            if (node.localName === name && node.namespaceURI === ns) {
                return /**@type{!Element}*/(node);
            }
            node = node.nextElementSibling;
        }
        return null;
    }

    /**
     * A collection of Dom utilities
     * @constructor
     */
    core.DomUtilsImpl = function DomUtilsImpl() {
        var /**@type{?Range}*/
            sharedRange = null;

        /**
         * @param {!Document} doc
         * @return {!Range}
         */
        function getSharedRange(doc) {
            var range;
            if (sharedRange) {
                range = sharedRange;
            } else {
                sharedRange = range = /**@type{!Range}*/(doc.createRange());
            }
            return range;
        }

        /**
         * Find the inner-most child point that is equivalent
         * to the provided container and offset.
         * @param {!Node} container
         * @param {!number} offset
         * @return {{container: Node, offset: !number}}
         */
        function findStablePoint(container, offset) {
            var c = container;
            if (offset < c.childNodes.length) {
                c = c.childNodes.item(offset);
                offset = 0;
                while (c.firstChild) {
                    c = c.firstChild;
                }
            } else {
                while (c.lastChild) {
                    c = c.lastChild;
                    offset = c.nodeType === Node.TEXT_NODE
                        ? c.textContent.length
                        : c.childNodes.length;
                }
            }
            return {container: c, offset: offset};
        }

        /**
         * Gets the unfiltered DOM 'offset' of a node within a container that may not be it's direct parent.
         * @param {!Node} node
         * @param {!Node} container
         * @return {!number}
         */
        function getPositionInContainingNode(node, container) {
            var offset = 0,
                n;
            while (node.parentNode !== container) {
                runtime.assert(node.parentNode !== null, "parent is null");
                node = /**@type{!Node}*/(node.parentNode);
            }
            n = container.firstChild;
            while (n !== node) {
                offset += 1;
                n = n.nextSibling;
            }
            return offset;
        }

        /**
         * If either the start or end boundaries of a range start within a text
         * node, this function will split these text nodes and reset the range
         * boundaries to select the new nodes. The end result is that there are
         * no partially contained text nodes within the resulting range.
         * E.g., the text node with selection:
         *  "A|BCD|E"
         * would be split into 3 text nodes, with the range modified to maintain
         * only the completely selected text node:
         *  "A" "|BCD|" "E"
         * @param {!Range} range
         * @return {!Array.<!Node>} Return a list of nodes modified as a result
         *                           of this split operation. These are often
         *                           processed through
         *                           DomUtils.normalizeTextNodes after all
         *                           processing has been complete.
         */
        function splitBoundaries(range) {
            var modifiedNodes = [],
                originalEndContainer,
                resetToContainerLength,
                end,
                splitStart,
                node,
                text,
                offset;

            if (range.startContainer.nodeType === Node.TEXT_NODE
                    || range.endContainer.nodeType === Node.TEXT_NODE) {
                originalEndContainer = range.endContainer;
                resetToContainerLength = range.endContainer.nodeType !== Node.TEXT_NODE ?
                        range.endOffset === range.endContainer.childNodes.length : false;

                end = findStablePoint(range.endContainer, range.endOffset);
                if (end.container === originalEndContainer) {
                    originalEndContainer = null;
                }
                // Stable points need to be found to ensure splitting the text
                // node doesn't inadvertently modify the other end of the range
                range.setEnd(end.container, end.offset);

                // Must split end first to stop the start point from being lost
                node = range.endContainer;
                if (range.endOffset !== 0 && node.nodeType === Node.TEXT_NODE) {
                    text = /**@type{!Text}*/(node);
                    if (range.endOffset !== text.length) {
                        modifiedNodes.push(text.splitText(range.endOffset));
                        modifiedNodes.push(text);
                        // The end doesn't need to be reset as endContainer &
                        // endOffset are still valid after the modification
                    }
                }

                node = range.startContainer;
                if (range.startOffset !== 0 && node.nodeType === Node.TEXT_NODE) {
                    text = /**@type{!Text}*/(node);
                    if (range.startOffset !== text.length) {
                        splitStart = text.splitText(range.startOffset);
                        modifiedNodes.push(text);
                        modifiedNodes.push(splitStart);
                        range.setStart(splitStart, 0);
                    }
                }

                if (originalEndContainer !== null) {
                    node = range.endContainer;
                    while (node.parentNode && node.parentNode !== originalEndContainer) {
                        node = node.parentNode;
                    }
                    if (resetToContainerLength) {
                        offset = originalEndContainer.childNodes.length;
                    } else {
                        offset = getPositionInContainingNode(node, originalEndContainer);
                    }
                    range.setEnd(originalEndContainer, offset);
                }
            }
            return modifiedNodes;
        }
        this.splitBoundaries = splitBoundaries;

        /**
         * Returns true if the container range completely contains the insideRange.
         * Aligned boundaries are counted as inclusion
         * @param {!Range} container
         * @param {!Range} insideRange
         * @return {boolean}
         */
        function containsRange(container, insideRange) {
            return container.compareBoundaryPoints(Range.START_TO_START, insideRange) <= 0
                && container.compareBoundaryPoints(Range.END_TO_END, insideRange) >= 0;
        }
        this.containsRange = containsRange;

        /**
         * Returns true if there is any intersection between range1 and range2
         * @param {!Range} range1
         * @param {!Range} range2
         * @return {boolean}
         */
        function rangesIntersect(range1, range2) {
            return range1.compareBoundaryPoints(Range.END_TO_START, range2) <= 0
                && range1.compareBoundaryPoints(Range.START_TO_END, range2) >= 0;
        }
        this.rangesIntersect = rangesIntersect;

        /**
         * Returns the intersection of two ranges. If there is no intersection, this
         * will return undefined.
         *
         * @param {!Range} range1
         * @param {!Range} range2
         * @return {!Range|undefined}
         */
        function rangeIntersection(range1, range2) {
            var newRange;

            if (rangesIntersect(range1, range2)) {
                newRange = /**@type{!Range}*/(range1.cloneRange());
                if (range1.compareBoundaryPoints(Range.START_TO_START, range2) === -1) {
                    // If range1's start is before range2's start, use range2's start
                    newRange.setStart(range2.startContainer, range2.startOffset);
                }

                if (range1.compareBoundaryPoints(Range.END_TO_END, range2) === 1) {
                    // if range1's end is after range2's end, use range2's end
                    newRange.setEnd(range2.endContainer, range2.endOffset);
                }
            }
            return newRange;
        }
        this.rangeIntersection = rangeIntersection;

        /**
         * Returns the maximum available offset for the node. If this is a text
         * node, this will be node.length, or for an element node, childNodes.length
         * @param {!Node} node
         * @return {!number}
         */
        function maximumOffset(node) {
            return node.nodeType === Node.TEXT_NODE ? /**@type{!Text}*/(node).length : node.childNodes.length;
        }

        /**
         * Checks all nodes between the tree walker's current node and the defined
         * root. If any nodes are rejected, the tree walker is moved to the
         * highest rejected node below the root. Note, the root is excluded from
         * this check.
         *
         * This logic is similar to PositionIterator.moveToAcceptedNode
         * @param {!TreeWalker} walker
         * @param {!Node} root
         * @param {!function(!Node) : number} nodeFilter
         *
         * @return {!Node} Returns the current node the walker is on
         */
        function moveToNonRejectedNode(walker, root, nodeFilter) {
            var node = walker.currentNode;

            // Ensure currentNode is not within a rejected subtree by crawling each parent node
            // up to the root and verifying it is either accepted or skipped by the nodeFilter.
            // NOTE: The root is deliberately not checked as it is the container iteration happens within.
            if (node !== root) {
                node = node.parentNode;
                while (node && node !== root) {
                    if (nodeFilter(node) === NodeFilter.FILTER_REJECT) {
                        walker.currentNode = node;
                    }
                    node = node.parentNode;
                }
            }
            return walker.currentNode;
        }

        /**
         * Fetches all nodes within a supplied range that pass the required filter
         * @param {!Range} range
         * @param {!function(!Node) : number} nodeFilter
         * @param {!number} whatToShow
         * @return {!Array.<!Node>}
         */
        /*jslint bitwise:true*/
        function getNodesInRange(range, nodeFilter, whatToShow) {
            var document = range.startContainer.ownerDocument,
                elements = [],
                rangeRoot = range.commonAncestorContainer,
                root = /**@type{!Node}*/(rangeRoot.nodeType === Node.TEXT_NODE ? rangeRoot.parentNode : rangeRoot),
                treeWalker = document.createTreeWalker(root, whatToShow, nodeFilter, false),
                currentNode,
                lastNodeInRange,
                endNodeCompareFlags,
                comparePositionResult;

            if (range.endContainer.childNodes[range.endOffset - 1]) {
                // This is the last node completely contained in the range
                lastNodeInRange = /**@type{!Node}*/(range.endContainer.childNodes[range.endOffset - 1]);
                // Accept anything preceding or contained by this node.
                endNodeCompareFlags = Node.DOCUMENT_POSITION_PRECEDING | Node.DOCUMENT_POSITION_CONTAINED_BY;
            } else {
                // Either no child nodes (e.g., TEXT_NODE) or endOffset = 0
                lastNodeInRange = /**@type{!Node}*/(range.endContainer);
                // Don't accept things contained within this node, as the range ends before this node's children.
                // This is the last node touching the range though, so the node is still accepted into the results.
                endNodeCompareFlags = Node.DOCUMENT_POSITION_PRECEDING;
            }

            if (range.startContainer.childNodes[range.startOffset]) {
                // The range starts within startContainer, so this child node is the first node in the range
                currentNode = /**@type{!Node}*/(range.startContainer.childNodes[range.startOffset]);
                treeWalker.currentNode = currentNode;
            } else if (range.startOffset === maximumOffset(range.startContainer)) {
                // This condition will be true if the range starts beyond the last position of a node
                // E.g., (text, text.length) or (div, div.childNodes.length)
                currentNode = /**@type{!Node}*/(range.startContainer);
                treeWalker.currentNode = currentNode;
                // In this case, move to the last child (if the node has children)
                treeWalker.lastChild(); // May return null if the current node has no children
                // And navigate onto the next node in sequence
                currentNode = treeWalker.nextNode();
            } else {
                // This will only be hit for a text node that is partially overlapped by the range start
                currentNode = /**@type{!Node}*/(range.startContainer);
                treeWalker.currentNode = currentNode;
            }

            if (currentNode) {
                // If the treeWalker hit the end of the sequence in the treeWalker.nextNode line just above,
                // currentNode will be null.
                currentNode = moveToNonRejectedNode(treeWalker, root, nodeFilter);
                switch (nodeFilter(/**@type{!Node}*/(currentNode))) {
                    case NodeFilter.FILTER_REJECT:
                        // If started on a rejected node, calling nextNode will incorrectly
                        // dive down into the rejected node's children. Instead, advance to
                        // the next sibling or parent node's sibling and resume walking from
                        // there.
                        currentNode = treeWalker.nextSibling();
                        while (!currentNode && treeWalker.parentNode()) {
                            currentNode = treeWalker.nextSibling();
                        }
                        break;
                    case NodeFilter.FILTER_SKIP:
                        // Immediately advance to the next node without giving an opportunity for the current one to
                        // be stored.
                        currentNode = treeWalker.nextNode();
                        break;
                    default:
                    // case NodeFilter.FILTER_ACCEPT:
                        // Proceed into the following loop. The current node will be stored at the end of the loop
                        // if it is contained within the requested range.
                        break;
                }

                while (currentNode) {
                    comparePositionResult = lastNodeInRange.compareDocumentPosition(currentNode);
                    if (comparePositionResult !== 0 && (comparePositionResult & endNodeCompareFlags) === 0) {
                        // comparePositionResult === 0 if currentNode === lastNodeInRange. This is considered within the range
                        // comparePositionResult & endNodeCompareFlags would be non-zero if n precedes lastNodeInRange
                        // If either of these statements are false, currentNode is past the end of the range
                        break;
                    }
                    elements.push(currentNode);
                    currentNode = treeWalker.nextNode();
                }
            }

            return elements;
        }
        /*jslint bitwise:false*/
        this.getNodesInRange = getNodesInRange;

        /**
         * Merges the content of node with nextNode.
         * If node is an empty text node, it will be removed in any case.
         * If nextNode is an empty text node, it will be only removed if node is a text node.
         * @param {!Node} node
         * @param {!Node} nextNode
         * @return {?Node} merged text node or null if there is no text node as result
         */
        function mergeTextNodes(node, nextNode) {
            var mergedNode = null, text, nextText;

            if (node.nodeType === Node.TEXT_NODE) {
                text = /**@type{!Text}*/(node);
                if (text.length === 0) {
                    text.parentNode.removeChild(text);
                    if (nextNode.nodeType === Node.TEXT_NODE) {
                        mergedNode = nextNode;
                    }
                } else {
                    if (nextNode.nodeType === Node.TEXT_NODE) {
                        // in chrome it is important to add nextNode to node.
                        // doing it the other way around causes random
                        // whitespace to appear
                        nextText = /**@type{!Text}*/(nextNode);
                        text.appendData(nextText.data);
                        nextNode.parentNode.removeChild(nextNode);
                    }
                    mergedNode = node;
                }
            }

            return mergedNode;
        }

        /**
         * Attempts to normalize the node with any surrounding text nodes. No
         * actions are performed if the node is undefined, has no siblings, or
         * is not a text node
         * @param {Node} node
         * @return {undefined}
         */
        function normalizeTextNodes(node) {
            if (node && node.nextSibling) {
                node = mergeTextNodes(node, node.nextSibling);
            }
            if (node && node.previousSibling) {
                mergeTextNodes(node.previousSibling, node);
            }
        }
        this.normalizeTextNodes = normalizeTextNodes;

        /**
         * Checks if the provided limits fully encompass the passed in node
         * @param {!Range|{startContainer: Node, startOffset: !number, endContainer: Node, endOffset: !number}} limits
         * @param {!Node} node
         * @return {boolean} Returns true if the node is fully contained within
         *                    the range
         */
        function rangeContainsNode(limits, node) {
            var range = node.ownerDocument.createRange(),
                nodeRange = node.ownerDocument.createRange(),
                result;

            range.setStart(limits.startContainer, limits.startOffset);
            range.setEnd(limits.endContainer, limits.endOffset);
            nodeRange.selectNodeContents(node);

            result = containsRange(range, nodeRange);

            range.detach();
            nodeRange.detach();
            return result;
        }
        this.rangeContainsNode = rangeContainsNode;

        /**
         * Merge all child nodes into the targetNode's parent and remove the targetNode entirely
         * @param {!Node} targetNode
         * @return {!Node} parent of targetNode
         */
        function mergeIntoParent(targetNode) {
            var parent = targetNode.parentNode;
            while (targetNode.firstChild) {
                parent.insertBefore(targetNode.firstChild, targetNode);
            }
            parent.removeChild(targetNode);
            return parent;
        }
        this.mergeIntoParent = mergeIntoParent;

        /**
         * Removes all unwanted nodes from targetNode includes itself.
         * The nodeFilter defines which nodes should be removed (NodeFilter.FILTER_REJECT),
         * should be skipped including the subtree (NodeFilter.FILTER_SKIP) or should be kept
         * and their subtree checked further (NodeFilter.FILTER_ACCEPT).
         * @param {!Node} targetNode
         * @param {!function(!Node) : !number} nodeFilter
         * @return {?Node} parent of targetNode
         */
        function removeUnwantedNodes(targetNode, nodeFilter) {
            var parent = targetNode.parentNode,
                node = targetNode.firstChild,
                filterResult = nodeFilter(targetNode),
                next;

            if (filterResult === NodeFilter.FILTER_SKIP) {
                return parent;
            }

            while (node) {
                next = node.nextSibling;
                removeUnwantedNodes(node, nodeFilter);
                node = next;
            }
            if (parent && (filterResult === NodeFilter.FILTER_REJECT)) {
                mergeIntoParent(targetNode);
            }
            return parent;
        }
        this.removeUnwantedNodes = removeUnwantedNodes;

        /**
         * Removes all child nodes from the given node.
         * To be used instead of e.g. `node.innerHTML = "";`
         * @param {!Node} node
         * @return {undefined}
         */
        this.removeAllChildNodes = function (node) {
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
        };

        /**
         * Get an array of nodes below the specified node with the specific namespace and tag name.
         *
         * Use this function instead of node.getElementsByTagNameNS when modifications are going to be made
         * to the document content during iteration. For read-only uses, node.getElementsByTagNameNS will perform
         * faster and use less memory. See https://github.com/kogmbh/WebODF/issues/736 for further discussion.
         *
         * @param {!Element|!Document} node
         * @param {!string} namespace
         * @param {!string} tagName
         * @return {!Array.<!Element>}
         */
        function getElementsByTagNameNS(node, namespace, tagName) {
            var e = [], list, i, l;
            list = node.getElementsByTagNameNS(namespace, tagName);
            e.length = l = list.length;
            for (i = 0; i < l; i += 1) {
                e[i] = /**@type{!Element}*/(list.item(i));
            }
            return e;
        }
        this.getElementsByTagNameNS = getElementsByTagNameNS;

        /**
         * Get an array of nodes below the specified node with the specific name tag name.
         *
         * Use this function instead of node.getElementsByTagName when modifications are going to be made
         * to the document content during iteration. For read-only uses, node.getElementsByTagName will perform
         * faster and use less memory. See https://github.com/kogmbh/WebODF/issues/736 for further discussion.
         *
         * @param {!Element|!Document} node
         * @param {!string} tagName
         * @return {!Array.<!Element>}
         */
        function getElementsByTagName(node, tagName) {
            var e = [], list, i, l;
            list = node.getElementsByTagName(tagName);
            e.length = l = list.length;
            for (i = 0; i < l; i += 1) {
                e[i] = /**@type{!Element}*/(list.item(i));
            }
            return e;
        }
        this.getElementsByTagName = getElementsByTagName;

        /**
         * Whether a node contains another node
         * Wrapper around Node.contains
         * http://www.w3.org/TR/domcore/#dom-node-contains
         * @param {!Node} parent The node that should contain the other node
         * @param {?Node} descendant The node to test presence of
         * @return {!boolean}
         */
        function containsNode(parent, descendant) {
            return parent === descendant
                // the casts to Element are a workaround due to a different
                // contains() definition in the Closure Compiler externs file.
                || /**@type{!Element}*/(parent).contains(/**@type{!Element}*/(descendant));
        }
        this.containsNode = containsNode;

        /**
         * Whether a node contains another node
         * @param {!Node} parent The node that should contain the other node
         * @param {?Node} descendant The node to test presence of
         * @return {!boolean}
         */
        /*jslint bitwise:true*/
        function containsNodeForBrokenWebKit(parent, descendant) {
            // the contains function is not reliable on safari/webkit so use
            // compareDocumentPosition instead
            return parent === descendant ||
                Boolean(parent.compareDocumentPosition(descendant) & Node.DOCUMENT_POSITION_CONTAINED_BY);
        }
        /*jslint bitwise:false*/

        /**
         * Return a number > 0 when point 1 precedes point 2. Return 0 if the points
         * are equal. Return < 0 when point 2 precedes point 1.
         * @param {!Node} c1 container of point 1
         * @param {!number} o1  offset in unfiltered DOM world of point 1
         * @param {!Node} c2 container of point 2
         * @param {!number} o2  offset in unfiltered DOM world of point 2
         * @return {!number}
         */
        function comparePoints(c1, o1, c2, o2) {
            if (c1 === c2) {
                return o2 - o1;
            }
            var comparison = c1.compareDocumentPosition(c2);
            if (comparison === 2) { // DOCUMENT_POSITION_PRECEDING
                comparison = -1;
            } else if (comparison === 4) { // DOCUMENT_POSITION_FOLLOWING
                comparison = 1;
            } else if (comparison === 10) { // DOCUMENT_POSITION_CONTAINS
                // c0 contains c2
                o1 = getPositionInContainingNode(c1, c2);
                comparison = (o1 < o2) ? 1 : -1;
            } else { // DOCUMENT_POSITION_CONTAINED_BY
                o2 = getPositionInContainingNode(c2, c1);
                comparison = (o2 < o1) ? -1 : 1;
            }
            return comparison;
        }
        this.comparePoints = comparePoints;

        /**
         * Scale the supplied number by the specified zoom transformation if the
         * bowser does not transform range client rectangles correctly.
         * In firefox, the span rectangle will be affected by the zoom, but the
         * range is not. In most all other browsers, the range number is
         * affected zoom.
         *
         * See http://dev.w3.org/csswg/cssom-view/#extensions-to-the-range-interface
         * Section 10, getClientRects,
         * "The transforms that apply to the ancestors are applied."
         * @param {!number} inputNumber An input number to be scaled. This is
         *                              expected to be the difference between
         *                              a property on two range-sourced client
         *                              rectangles (e.g., rect1.top - rect2.top)
         * @param {!number} zoomLevel   Current canvas zoom level
         * @return {!number}
         */
        function adaptRangeDifferenceToZoomLevel(inputNumber, zoomLevel) {
            if (getBrowserQuirks().unscaledRangeClientRects) {
                return inputNumber;
            }
            return inputNumber / zoomLevel;
        }
        this.adaptRangeDifferenceToZoomLevel = adaptRangeDifferenceToZoomLevel;

        /**
         * Translate a given child client rectangle to be relative to the parent's rectangle.
         * Adapt to the provided zoom level as per adaptRangeDifferenceToZoomLevel.
         *
         * IMPORTANT: due to browser quirks, any element bounding client rect used with this function
         * MUST be retrieved using DomUtils.getBoundingClientRect.
         *
         * @param {!ClientRect|!Object.<!string, !number>} child
         * @param {!ClientRect|!Object.<!string, !number>} parent
         * @param {!number} zoomLevel
         * @return {!ClientRect|{top: !number, left: !number,  bottom: !number, right: !number, width: !number, height: !number}}
         */
        this.translateRect = function(child, parent, zoomLevel) {
            return {
                top: adaptRangeDifferenceToZoomLevel(child.top - parent.top, zoomLevel),
                left: adaptRangeDifferenceToZoomLevel(child.left - parent.left, zoomLevel),
                bottom: adaptRangeDifferenceToZoomLevel(child.bottom - parent.top, zoomLevel),
                right: adaptRangeDifferenceToZoomLevel(child.right - parent.left, zoomLevel),
                width: adaptRangeDifferenceToZoomLevel(child.width, zoomLevel),
                height: adaptRangeDifferenceToZoomLevel(child.height, zoomLevel)
            };
        };

        /**
         * Get the bounding client rect for the specified node.
         * This function attempts to cope with various browser quirks, ideally
         * returning a rectangle that can be used in conjunction with rectangles
         * retrieved from ranges.
         *
         * Range & element client rectangles can only be mixed if both are
         * transformed in the same way.
         * See https://bugzilla.mozilla.org/show_bug.cgi?id=863618
         * @param {!Node} node
         * @return {?ClientRect}
         */
        function getBoundingClientRect(node) {
            var doc = /**@type{!Document}*/(node.ownerDocument),
                quirks = getBrowserQuirks(),
                range,
                element,
                rect,
                body = doc.body;

            if (quirks.unscaledRangeClientRects === false
                    || quirks.rangeBCRIgnoresElementBCR) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    element = /**@type{!Element}*/(node);
                    rect = element.getBoundingClientRect();
                    if (quirks.elementBCRIgnoresBodyScroll) {
                        return /**@type{?ClientRect}*/({
                            left: rect.left + body.scrollLeft,
                            right: rect.right + body.scrollLeft,
                            top: rect.top + body.scrollTop,
                            bottom: rect.bottom + body.scrollTop,
                            width: rect.width,
                            height: rect.height
                        });
                    }
                    return rect;
                }
            }
            range = getSharedRange(doc);
            range.selectNode(node);
            return range.getBoundingClientRect();
        }
        this.getBoundingClientRect = getBoundingClientRect;

        /**
         * Takes a flat object which is a key-value
         * map of strings, and populates/modifies
         * the node with child elements which have
         * the key name as the node name (namespace
         * prefix required in the key name)
         * and the value as the text content. 
         * Example: mapKeyValObjOntoNode(node, {"dc:creator": "Bob"}, nsResolver);
         * If a namespace prefix is unresolved with the
         * nsResolver, that key will be ignored and not written to the node.
         * @param {!Element} node
         * @param {!Object.<!string, !string>} properties
         * @param {!function(!string):?string} nsResolver
         */
        function mapKeyValObjOntoNode(node, properties, nsResolver) {
            Object.keys(properties).forEach(function (key) {
                var parts = key.split(":"),
                    prefix = parts[0],
                    localName = parts[1],
                    ns = nsResolver(prefix),
                    value = properties[key],
                    element;

                // Ignore if the prefix is unsupported,
                // otherwise set the textContent of the
                // element to the value.
                if (ns) {
                    element = /**@type{!Element|undefined}*/(node.getElementsByTagNameNS(ns, localName)[0]);
                    if (!element) {
                        element = node.ownerDocument.createElementNS(ns, key);
                        node.appendChild(element);
                    }
                    element.textContent = value;
                } else {
                    runtime.log("Key ignored: " + key);
                }
            });
        }
        this.mapKeyValObjOntoNode = mapKeyValObjOntoNode;

        /**
         * Takes an array of strings, which is a listing of
         * properties to be removed (namespace required),
         * and deletes the corresponding top-level child elements
         * that represent those properties, from the
         * supplied node.
         * Example: removeKeyElementsFromNode(node, ["dc:creator"], nsResolver);
         * If a namespace is not resolved with the nsResolver,
         * that key element will be not removed.
         * If a key element does not exist, it will be ignored.
         * @param {!Element} node
         * @param {!Array.<!string>} propertyNames
         * @param {!function(!string):?string} nsResolver
         */
        function removeKeyElementsFromNode(node, propertyNames, nsResolver) {
            propertyNames.forEach(function (propertyName) {
                var parts = propertyName.split(":"),
                    prefix = parts[0],
                    localName = parts[1],
                    ns = nsResolver(prefix),
                    element;

                // Ignore if the prefix is unsupported,
                // otherwise delete the element if found
                if (ns) {
                    element = /**@type{!Element|undefined}*/(node.getElementsByTagNameNS(ns, localName)[0]);
                    if (element) {
                        element.parentNode.removeChild(element);
                    } else {
                         runtime.log("Element for " + propertyName + " not found.");
                    }
                } else {
                    runtime.log("Property Name ignored: " + propertyName);
                }
            });
        }
        this.removeKeyElementsFromNode = removeKeyElementsFromNode;
 
        /**
         * Looks at an element's direct children, and generates an object which is a
         * flat key-value map from the child's ns:localName to it's text content.
         * Only those children that have a resolvable prefixed name will be taken into
         * account for generating this map.
         * @param {!Element} node
         * @param {function(!string):?string} prefixResolver 
         * @return {!Object.<!string,!string>}
         */
        function getKeyValRepresentationOfNode(node, prefixResolver) {
            var properties = {},
                currentSibling = node.firstElementChild,
                prefix;

            while (currentSibling) {
                prefix = prefixResolver(currentSibling.namespaceURI);
                if (prefix) {
                    properties[prefix + ':' + currentSibling.localName] = currentSibling.textContent;
                }
                currentSibling = currentSibling.nextElementSibling;
            }

            return properties;
        }
        this.getKeyValRepresentationOfNode = getKeyValRepresentationOfNode;

        /**
         * Maps attributes and elements in the properties object over top of the node.
         * Supports recursion and deep mapping.
         *
         * Supported value types are:
         * - string (mapped to an attribute string on node)
         * - number (mapped to an attribute string on node)
         * - object (deep mapped to a new child node on node)
         *
         * @param {!Element} node
         * @param {!Object.<string,*>} properties
         * @param {!function(!string):?string} nsResolver
         */
        function mapObjOntoNode(node, properties, nsResolver) {
            Object.keys(properties).forEach(function(key) {
                var parts = key.split(":"),
                    prefix = parts[0],
                    localName = parts[1],
                    ns = nsResolver(prefix),
                    value = properties[key],
                    valueType = typeof value,
                    element;

                if (valueType === "object") {
                    // Only create the destination sub-element if there are values to populate it with
                    if (Object.keys(/**@type{!Object}*/(value)).length) {
                        if (ns) {
                            element = /**@type{!Element|undefined}*/(node.getElementsByTagNameNS(ns, localName)[0])
                                || node.ownerDocument.createElementNS(ns, key);
                        } else {
                            element = /**@type{!Element|undefined}*/(node.getElementsByTagName(localName)[0])
                                || node.ownerDocument.createElement(key);
                        }
                        node.appendChild(element);
                        mapObjOntoNode(element, /**@type{!Object}*/(value), nsResolver);
                    }
                } else if (ns) {
                    runtime.assert(valueType === "number" || valueType === "string",
                        "attempting to map unsupported type '" + valueType + "' (key: " + key + ")");
                    node.setAttributeNS(ns, key, String(value));
                    // If the prefix is unknown or unsupported, simply ignore it for now
                }
            });
        }
        this.mapObjOntoNode = mapObjOntoNode;

        /**
         * Clones an event object.
         * IE10 destructs event objects once the event handler is done:
         * "The event object is only available during an event; that is, you can use it in event handlers but not in other code"
         * (from http://msdn.microsoft.com/en-us/library/ie/aa703876(v=vs.85).aspx)
         * This method can be used to create a copy of the event object, to work around that.
         * @param {!Event} event
         * @return {!Event}
         */
        function cloneEvent(event) {
            var e = Object.create(null);

            // copy over all direct properties
            Object.keys(event.constructor.prototype).forEach(function (x) {
                e[x] = event[x];
            });
            // only now set the prototype (might set properties read-only)
            e.prototype = event.constructor.prototype;

            return /**@type{!Event}*/(e);
        }
        this.cloneEvent = cloneEvent;

        this.getDirectChild = getDirectChild;

        /**
         * @param {!core.DomUtilsImpl} self
         */
        function init(self) {
            var appVersion, webKitOrSafari, ie,
                /**@type{?Window}*/
                window = runtime.getWindow();

            if (window === null) {
                return;
            }

            appVersion = window.navigator.appVersion.toLowerCase();
            webKitOrSafari = appVersion.indexOf('chrome') === -1
                && (appVersion.indexOf('applewebkit') !== -1
                    || appVersion.indexOf('safari') !== -1);
            // See http://connect.microsoft.com/IE/feedback/details/780874/node-contains-is-incorrect
            // Also, IE cleverly removed the MSIE tag without fixing the bug we're attempting to sniff here...
            // http://msdn.microsoft.com/en-us/library/ie/bg182625%28v=vs.110%29.aspx
            ie = appVersion.indexOf('msie') !== -1 || appVersion.indexOf('trident') !== -1;
            if (webKitOrSafari || ie) {
                self.containsNode = containsNodeForBrokenWebKit;
            }
        }
        init(this);
    };

    /**
     * @type {!core.DomUtilsImpl}
     */
    core.DomUtils = new core.DomUtilsImpl();
}());
