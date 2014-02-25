/**
 * @license
 * Copyright (C) 2010-2014 KO GmbH <copyright@kogmbh.com>
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


/*global runtime, core, ops, odf, Node*/

(function() {
    "use strict";
    // Multiple cached translators may exist in the same runtime. Therefore, each node id should
    // be globally unique, so they can be safely re-used by multiple translators
    var /**@type{number}*/
        nextNodeId = 0;

    /**
     * Implementation of a step to DOM point lookup cache.
     *
     * A cache point is created for each passed paragraph, saving the number of steps from the root node to the first
     * walkable position in the paragraph. This cached point is linked to the paragraph node via a unique identifier
     * per node.
     *
     * This cache depends on StepsTranslator.handleStepsInserted & handleStepsRemoved is called at the step of change,
     * along with information about how many steps have been changed. The cache is able to cope with paragraph nodes being
     * cloned, as long as the position of change and reported number of steps changed is correctly reported.
     *
     * However, this implementation will NOT cope with paragraphs being re-ordered, even if a change event is reported.
     * This is because the cache relies on the paragraph order remaining fixed as long as they are in the DOM.
     * If paragraph reordering is desired, it can be achieved through either:
     * a) cloning the paragraph into the new position and removing the original paragraph (the clone will be detected and rectified)
     * b) removing the original paragraph from the DOM, calling updateCache (to purge the original bookmark) then re-adding
     *      the paragraph into the new position and calling updateCache a second time (add a brand new bookmark for the paragraph)
     *
     * When updateCacheAtPoint is called, the cache will refresh all bookmarks trailing the removal/insertion step. Note,
     * the exact step of change is not affected. For example, inserting 2 steps after position 9 results in the following
     * changes to existing points:
     * 9 => 9
     * 10 => 12
     * 11 => 13
     * ...
     *
     * Removing 2 steps from after position 9 results in the following:
     * 9 => 9
     * 10 => x
     * 11 => x
     * 12 => 10
     * 13 => 11
     * ...
     *
     * @param {!Node} rootNode
     * @param {!core.PositionFilter} filter
     * @param {!number} bucketSize  Minimum number of steps between cache points
     * @constructor
     */
    ops.StepsCache = function StepsCache(rootNode, filter, bucketSize) {
        var coordinatens = "urn:webodf:names:steps",
            /**@type{!Object.<(!string|!number), !ParagraphBookmark>}*/
            stepToDomPoint = {},
            /**@type{!Object.<!string, !ParagraphBookmark>}*/
            nodeToBookmark = {},
            odfUtils = new odf.OdfUtils(),
            domUtils = new core.DomUtils(),
            /**@type{!RootBookmark}*/
            basePoint,
            /**@const*/
            FILTER_ACCEPT = core.PositionFilter.FilterResult.FILTER_ACCEPT;

        /**
         * Bookmark indicating the first walkable position in a paragraph
         * @constructor
         * @param {!number} steps
         * @param {!Element} paragraphNode
         */
        function ParagraphBookmark(steps, paragraphNode) {
            this.steps = steps;
            this.node = paragraphNode;

            /**
             * @type {?ParagraphBookmark}
             */
            this.nextBookmark = null;

            /**
             * @type {?ParagraphBookmark|?RootBookmark}
             */
            this.previousBookmark = null;

            /**
             * @param {!core.PositionIterator} iterator
             * @return {undefined}
             */
            this.setIteratorPosition = function(iterator) {
                iterator.setPositionBeforeElement(paragraphNode);
                do {
                    if (filter.acceptPosition(iterator) === FILTER_ACCEPT) {
                        break;
                    }
                } while (iterator.nextPosition());
            };
        }

        /**
         * Bookmark indicating the first walkable position in the document
         * @param {!number} steps
         * @param {!Node} rootNode
         * @constructor
         */
        function RootBookmark(steps, rootNode) {
            this.steps = steps;
            this.node = rootNode;

            /**
             * @type {?ParagraphBookmark}
             */
            this.nextBookmark = null;

            /**
             * @type {null}
             */
            this.previousBookmark = null;

            /**
             * @param {!core.PositionIterator} iterator
             * @return {undefined}
             */
            this.setIteratorPosition = function (iterator) {
                iterator.setUnfilteredPosition(rootNode, 0);
                do {
                    if (filter.acceptPosition(iterator) === FILTER_ACCEPT) {
                        break;
                    }
                } while (iterator.nextPosition());
            };
        }

        /**
         * Returns the closest quantized step at or before the requested step
         * @param {!number} steps
         * @return {!number}
         */
        function getBucket(steps) {
            return Math.floor(steps / bucketSize) * bucketSize;
        }

        /**
         * Returns the closest quantized step at or just after the requested step
         * @param {!number} steps
         * @return {!number}
         */
        function getDestinationBucket(steps) {
            return Math.ceil(steps / bucketSize) * bucketSize;
        }

        /**
         * @param {!Element} node
         * @return {undefined}
         */
        function clearNodeId(node) {
            node.removeAttributeNS(coordinatens, "nodeId");
        }

        /**
         * @param {!Node} node
         * @return {string}
         */
        function getNodeId(node) {
            var id = "";
            if (node.nodeType === Node.ELEMENT_NODE) {
                id = /**@type{!Element}*/(node).getAttributeNS(coordinatens, "nodeId");
            }
            return id;
        }

        /**
         * @param {!Element} node
         * @return {!string}
         */
        function setNodeId(node) {
            var nodeId = nextNodeId.toString();
            node.setAttributeNS(coordinatens, "nodeId", nodeId);
            nextNodeId += 1;
            return nodeId;
        }

        /**
         * The element might have been cloned from another part of the document and have a stale or duplicate
         * nodeId
         * @param {!Node} node
         * @param {!ParagraphBookmark|!RootBookmark} bookmark
         * @return {!boolean} True if the bookmark is actually for the supplied node
         */
        function isValidBookmarkForNode(node, bookmark) {
            return bookmark.node === node;
        }

        /**
         * Fetches (or creates) a bookmark for the specified node. The bookmark's steps
         * are updated to the specified number of steps
         * @param {!Element} node
         * @param {!number} steps
         * @return {!ParagraphBookmark}
         */
        function getNodeBookmark(node, steps) {
            var nodeId = getNodeId(node) || setNodeId(node),
                existingBookmark;
            existingBookmark = nodeToBookmark[nodeId];
            if (!existingBookmark) {
                existingBookmark = nodeToBookmark[nodeId] = new ParagraphBookmark(steps, node);
            } else if (!isValidBookmarkForNode(node, existingBookmark)) {
                runtime.log("Cloned node detected. Creating new bookmark");
                nodeId = setNodeId(node);
                existingBookmark = nodeToBookmark[nodeId] = new ParagraphBookmark(steps, node);
            } else {
                existingBookmark.steps = steps;
            }
            return existingBookmark;
        }

        /**
         * Finds the closest bookmark before or at the specified steps count
         * @param {!number} steps
         * @return {!RootBookmark|!ParagraphBookmark}
         */
        function getClosestBookmark(steps) {
            var cacheBucket = getBucket(steps),
                cachePoint,
                loopGuard = new core.LoopWatchDog(0, 10000);

            while (!cachePoint && cacheBucket !== 0) {
                cachePoint = stepToDomPoint[cacheBucket];
                cacheBucket -= bucketSize;
            }

            cachePoint = cachePoint || basePoint;
            while (cachePoint.nextBookmark && cachePoint.nextBookmark.steps <= steps) {
                loopGuard.check();
                cachePoint = cachePoint.nextBookmark;
            }
            return cachePoint;
        }

        /**
         * Remove a bookmark from the cache chain
         * @param {!ParagraphBookmark} currentBookmark
         * @return {undefined}
         */
        function removeBookmark(currentBookmark) {
            if (currentBookmark.previousBookmark) {
                currentBookmark.previousBookmark.nextBookmark = currentBookmark.nextBookmark;
            }

            if (currentBookmark.nextBookmark) {
                currentBookmark.nextBookmark.previousBookmark = currentBookmark.previousBookmark;
            }
        }

        /**
         * Insert a bookmark into the cache chain just after the previous bookmark
         * @param {!RootBookmark|!ParagraphBookmark} previousBookmark
         * @param {!ParagraphBookmark} newBookmark
         * @return {undefined}
         */
        function insertBookmark(previousBookmark, newBookmark) {
            // Check if the newBookmark is already in the chain at the correct location. Don't bother updating
            // if it is in place.
            if (previousBookmark !== newBookmark && previousBookmark.nextBookmark !== newBookmark) {
                // Removing the existing item first helps prevent infinite-loops from being created in the cache if
                // multiple bookmarks somehow end up sharing the same step. This is NOT expected to happen in practice,
                // but could be caused by an undiscovered bug.
                removeBookmark(newBookmark);
                newBookmark.nextBookmark = previousBookmark.nextBookmark;
                newBookmark.previousBookmark = previousBookmark;
                previousBookmark.nextBookmark = newBookmark;
            }
        }

        /**
         * Process known step to DOM position points for possible caching
         * @param {!number} steps Current steps offset from position 0
         * @param {!core.PositionIterator} iterator
         * @param {!boolean} isStep True if the current node and offset is accepted by the position filter
         * @return {undefined}
         */
        this.updateCache = function(steps, iterator, isStep) {
            var stablePoint,
                cacheBucket,
                existingCachePoint,
                bookmark,
                node = iterator.getCurrentNode();

            if (iterator.isBeforeNode() && odfUtils.isParagraph(node)) {
                stablePoint = true;
                if (!isStep) {
                    // Paragraph bookmarks indicate "first position in the paragraph"
                    // If the current stable point is before the first walkable position (as often happens)
                    // simply increase the step number by 1 to move to within the paragraph node
                    steps += 1;
                }
            }

            if (stablePoint) {
                // E.g., steps <= 500 are valid for a request starting at 500 and counting forward
                bookmark = getNodeBookmark(/**@type{!Element}*/(node), steps);
                insertBookmark(getClosestBookmark(steps), bookmark);
                cacheBucket = getDestinationBucket(bookmark.steps);
                existingCachePoint = stepToDomPoint[cacheBucket];
                if (!existingCachePoint || bookmark.steps > existingCachePoint.steps) {
                    // The current node & offset are closer to the cache bucket boundary than the existing entry is
                    stepToDomPoint[cacheBucket] = bookmark;
                }
            }
        };

        /**
         * Set the iterator to the closest known position before or at the requested step, returning the number of steps
         * from position 0.
         * @param {!number} steps
         * @param {!core.PositionIterator} iterator
         * @return {!number} Corresponding step for the current iterator position
         */
        this.setToClosestStep = function (steps, iterator) {
            var cachePoint = getClosestBookmark(steps);
            cachePoint.setIteratorPosition(iterator);
            return cachePoint.steps;
        };

        /**
         * Finds the nearest ancestor node that has an associated bookmark
         * @param {!Node} node
         * @return {?ParagraphBookmark}
         */
        function findBookmarkedAncestor(node) {
            var currentNode = node,
                nodeId,
                bookmark = null;

            while (!bookmark && currentNode && currentNode !== rootNode) {
                nodeId = getNodeId(currentNode);
                if (nodeId) {
                    // Take care as a nodeId may be bookmarked in another translator, but not this particular instance
                    // Keep crawling up the hierarchy until a node is found with a node id AND bookmark in this translator
                    bookmark = nodeToBookmark[nodeId];
                    if (bookmark && !isValidBookmarkForNode(currentNode, bookmark)) {
                        runtime.log("Cloned node detected. Creating new bookmark");
                        bookmark = null;
                        clearNodeId(/**@type{!Element}*/(currentNode));
                    }
                }
                currentNode = currentNode.parentNode;
            }
            return bookmark;
        }

        /**
         * Set the iterator to the closest known position before or at the requested node & offset, returning the number
         * of steps from position 0.
         * @param {!Node} node
         * @param {!number} offset
         * @param {!core.PositionIterator} iterator
         * @return {!number} Corresponding step for the current iterator position
         */
        this.setToClosestDomPoint = function (node, offset, iterator) {
            var /**@type{!RootBookmark|?ParagraphBookmark}*/
                bookmark,
                b,
                /**@type{string|number}*/
                key;

            if (node === rootNode && offset === 0) {
                bookmark = basePoint;
            } else if (node === rootNode && offset === rootNode.childNodes.length) {
                bookmark = basePoint;
                for (key in stepToDomPoint) {
                    if (stepToDomPoint.hasOwnProperty(key)) {
                        b = stepToDomPoint[key];
                        if (b.steps > bookmark.steps) {
                            bookmark = b;
                        }
                    }
                }
            } else {
                bookmark = findBookmarkedAncestor(node.childNodes.item(offset) || node);
                if (!bookmark) {
                    // No immediate bookmark was found, so crawl backwards using the iterator and try and find a known position
                    iterator.setUnfilteredPosition(node, offset);
                    while (!bookmark && iterator.previousNode()) {
                        bookmark = findBookmarkedAncestor(iterator.getCurrentNode());
                    }
                }
            }

            bookmark = bookmark || basePoint;
            bookmark.setIteratorPosition(iterator);
            return bookmark.steps;
        };

        /**
         * Update all cached bookmarks starting just beyond the specified step
         * @param {!number} inflectionStep Step beyond which the changes occurs. Bookmarks beyond step+1 will be updated
         * @param {!function(number):number} getUpdatedSteps Callback to get an updated number of bookmark steps
         * @return {undefined}
         */
        this.updateCacheAtPoint = function (inflectionStep, getUpdatedSteps) {
            var /**@type{!Object.<(string|number),!ParagraphBookmark>}*/
                updatedBuckets = {},
                inflectionBookmark = getClosestBookmark(inflectionStep),
                /**@type{?ParagraphBookmark}*/
                bookmark,
                nextBookmark;

            if (inflectionBookmark !== basePoint) {
                bookmark = /**@type{!ParagraphBookmark}*/(inflectionBookmark);
            } else {
                // The base bookmark should never be updated
                bookmark = basePoint.nextBookmark;
            }

            // Key concept: on step removal, the inflectionStep is replaced by the following step.
            // In the case of paragraph removal, this means the bookmark at exactly the point of inflection might be replaced.
            /**
             * @param {!ParagraphBookmark} bookmark
             * @return {undefined}
             */
            function updateBookmark(bookmark) {
                var originalCacheBucket = getDestinationBucket(bookmark.steps),
                    newCacheBucket,
                    existingBookmark;

                if (!domUtils.containsNode(rootNode, bookmark.node)) {
                    // Node is no longer present in the document
                    removeBookmark(bookmark);
                    delete nodeToBookmark[getNodeId(bookmark.node)];
                } else if (bookmark !== inflectionBookmark) {
                    // The inflection bookmark does not have steps updated because it is the last unchanged step
                    bookmark.steps = getUpdatedSteps(bookmark.steps);
                    // The destination cache bucket might have updated as a result of the bookmark update
                    newCacheBucket = getDestinationBucket(bookmark.steps);
                    existingBookmark = updatedBuckets[newCacheBucket];
                    if (!existingBookmark || bookmark.steps > existingBookmark.steps) {
                        // Use this bookmark if it is either the only one in the cache bucket, or the closest
                        updatedBuckets[newCacheBucket] = bookmark;
                    }
                }

                if (stepToDomPoint[originalCacheBucket] === bookmark) {
                    // The new cache entry will be added in the subsequent update
                    delete stepToDomPoint[originalCacheBucket];
                }
            }

            while (bookmark) {
                // Save a copy now because nextBookmark might be unlinked during the update
                nextBookmark = bookmark.nextBookmark;
                updateBookmark(/**@type{!ParagraphBookmark}*/(bookmark));
                bookmark = nextBookmark;
            }

            Object.keys(updatedBuckets).forEach(function (cacheBucket) {
                stepToDomPoint[cacheBucket] = updatedBuckets[cacheBucket];
            });
        };

        function init() {
            basePoint = new RootBookmark(0, rootNode);
        }
        init();
    };
}());