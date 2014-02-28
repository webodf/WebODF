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
     * A cache point ("bookmark") is created for each passed paragraph, saving the number of steps from the root node to
     * the first step in the paragraph. This cached point is linked to the paragraph node via a unique identifier per
     * node.
     *
     * The cache works by tracking "damage" to it's bookmarks (via steps inserted & removal). As re-iteration over the
     * damaged sections occur, the bookmarks are updated, and the damage repaired.
     *
     * A visual example of the cache during various states is as follows:
     * legend: -=good bookmark, x=damaged bookmark, !=indeterminate bookmark, ?=requested step,
     *          @=current iterator position
     * 
     * [--------------] <-- cache before steps change
     * [----x!!!!!!!!!] <-- damage occurs (e.g., a step is deleted) which means all bookmarks after the damage point are
     *                      now indeterminate as their step location is now outdated
     * [----xxxxxxxxxx] <-- trailing bookmarks now considered "damaged", and will not be used until they can be repaired
     * [---@xxxx?xxxxx] <-- when a bookmark is requested for step in the damaged region, the last undamaged bookmark will
     *                      be returned instead. The consumer of this interface already knows additional iteration may
     *                      be necessary to reach the desired step count, so this case is no different than if the cache
     *                      was unprimed.
     * [------@xxxxxxx] <-- as re-iteration over the doc occurs, bookmark positions are updated and the damage start
     *                      point is moved along to the next damaged node
     *
     * This cache depends on StepsTranslator.handleStepsInserted & handleStepsRemoved being called at the step of change,
     * along with information about the region that has changed. The cache is able to cope with paragraph nodes being
     * cloned, as long as the position of change is correctly reported.
     *
     * However, this implementation will NOT cope with paragraphs being re-ordered, even if a change event is reported.
     * This is because the cache relies on the paragraph order remaining fixed as long as they are in the DOM.
     * If paragraph reordering is desired, it can be achieved through either:
     * a) cloning the paragraph into the new position and removing the original paragraph (the clone will be detected
     *    and rectified)
     * b) removing the original paragraph from the DOM, calling updateCache (to purge the original bookmark) then
     *    re-adding the paragraph into the new position and calling updateCache a second time (add a brand new bookmark
     *    for the paragraph)
     *
     *
     * @constructor
     * @param {!Element} rootElement
     * @param {!core.PositionFilter} filter
     * @param {!number} bucketSize  Minimum number of steps between cache points
     */
    ops.StepsCache = function StepsCache(rootElement, filter, bucketSize) {
        var coordinatens = "urn:webodf:names:steps",
            /**@type{!Object.<(!string|!number), !ops.StepsCache.Bookmark>}*/
            stepToDomPoint = {},
            /**@type{!Object.<!string, !ops.StepsCache.Bookmark>}*/
            nodeToBookmark = {},
            odfUtils = new odf.OdfUtils(),
            domUtils = new core.DomUtils(),
            /**@type{!RootBookmark}*/
            basePoint,
            /**@type{!number|undefined}*/
            lastUndamagedCacheStep,
            /**@const*/
            FILTER_ACCEPT = core.PositionFilter.FilterResult.FILTER_ACCEPT;

        /**
         * Bookmark indicating the first walkable position in a paragraph
         * @constructor
         * @param {!string} nodeId
         * @param {!number} steps
         * @param {!Element} paragraphNode
         *
         * @implements {ops.StepsCache.Bookmark}
         */
        function ParagraphBookmark(nodeId, steps, paragraphNode) {
            this.nodeId = nodeId;
            this.steps = steps;
            this.node = paragraphNode;
            this.nextBookmark = null;
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
         * @constructor
         * @param {!string} nodeId
         * @param {!number} steps
         * @param {!Node} rootNode
         *
         * @implements {ops.StepsCache.Bookmark}
         */
        function RootBookmark(nodeId, steps, rootNode) {
            this.nodeId = nodeId;
            this.steps = steps;
            this.node = rootNode;
            this.nextBookmark = null;
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
         * @param {!ops.StepsCache.Bookmark} bookmark
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
         * @return {!ops.StepsCache.Bookmark}
         */
        function getNodeBookmark(node, steps) {
            var nodeId = getNodeId(node) || setNodeId(node),
                existingBookmark;
            existingBookmark = nodeToBookmark[nodeId];
            if (!existingBookmark) {
                existingBookmark = nodeToBookmark[nodeId] = new ParagraphBookmark(nodeId, steps, node);
            } else if (!isValidBookmarkForNode(node, existingBookmark)) {
                runtime.log("Cloned node detected. Creating new bookmark");
                nodeId = setNodeId(node);
                existingBookmark = nodeToBookmark[nodeId] = new ParagraphBookmark(nodeId, steps, node);
            } else {
                existingBookmark.steps = steps;
            }
            return existingBookmark;
        }

        /**
         * Returns the closest undamaged bookmark to the supplied bookmark
         * @param {!ops.StepsCache.Bookmark} bookmark
         * @returns {!ops.StepsCache.Bookmark}
         */
        function getUndamagedBookmark(bookmark) {
            var undamagedBookmark;

            if (lastUndamagedCacheStep !== undefined) {
                undamagedBookmark = bookmark;
                while (undamagedBookmark.steps > lastUndamagedCacheStep) {
                    undamagedBookmark = undamagedBookmark.previousBookmark;
                }
                bookmark = undamagedBookmark || basePoint;
            }
            return bookmark;
        }

        /**
         * Finds the closest bookmark before or at the specified steps count
         * @param {!number} steps
         * @return {!ops.StepsCache.Bookmark}
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
         * @param {!ops.StepsCache.Bookmark} currentBookmark
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
         * @param {!ops.StepsCache.Bookmark} previousBookmark
         * @param {!ops.StepsCache.Bookmark} newBookmark
         * @return {undefined}
         */
        function insertBookmark(previousBookmark, newBookmark) {
            var nextBookmark;
            // Check if the newBookmark is already in the chain at the correct location. Don't bother updating
            // if it is in place.
            if (previousBookmark !== newBookmark && previousBookmark.nextBookmark !== newBookmark) {
                // Removing the existing item first helps prevent infinite-loops from being created in the cache if
                // multiple bookmarks somehow end up sharing the same step. This is NOT expected to happen in practice,
                // but could be caused by an undiscovered bug.
                removeBookmark(newBookmark);
                // Assign this value before we override it just below
                nextBookmark = previousBookmark.nextBookmark;

                newBookmark.nextBookmark = previousBookmark.nextBookmark;
                newBookmark.previousBookmark = previousBookmark;
                previousBookmark.nextBookmark = newBookmark;
                if (nextBookmark) {
                    nextBookmark.previousBookmark = newBookmark;
                }
            }
        }

        /**
         * Repair any damaged bookmarks up to (and including) the supplied step. Returns the closest
         * undamaged bookmark just prior or equal to the supplied step.
         * @param {!number} step
         * @return {!ops.StepsCache.Bookmark}
         */
        function repairCacheUpToStep(step) {
            var bookmark,
                closestBookmark,
                nextBookmark,
                stepsBucket;

            if (lastUndamagedCacheStep !== undefined && lastUndamagedCacheStep < step) {
                bookmark = getClosestBookmark(lastUndamagedCacheStep); // Get the last undamaged bookmark
                closestBookmark = bookmark;
                bookmark = bookmark.nextBookmark; // Don't need to check the undamaged bookmark however

                while (bookmark && bookmark.steps <= step) {
                    nextBookmark = bookmark.nextBookmark;
                    if (!domUtils.containsNode(rootElement, bookmark.node)) {
                        // The bookmarked node no longer exists in the document. Remove it from all caches
                        stepsBucket = getDestinationBucket(bookmark.steps);
                        if (stepToDomPoint[stepsBucket] === bookmark) {
                            stepToDomPoint[stepsBucket] = /**@type{!ops.StepsCache.Bookmark}*/(bookmark.previousBookmark);
                        }

                        // Don't unlink until after stepsToDomPoint has been relocated otherwise previousBookmark
                        // will be null
                        removeBookmark(bookmark);
                        delete nodeToBookmark[bookmark.nodeId];
                    } else {
                        closestBookmark = bookmark;
                    }
                    bookmark = nextBookmark;
                }

                // Have now recovered the cache up to the supplied step. All bookmarks before this are
                // guaranteed to be up-to-date.
                lastUndamagedCacheStep = step;
            } else {
                closestBookmark = getClosestBookmark(step);
            }
            return closestBookmark || basePoint;
        }

        /**
         * Process known step to DOM position points for possible caching
         * @param {!number} steps Current steps offset from position 0
         * @param {!core.PositionIterator} iterator
         * @param {!boolean} isStep True if the current node and offset is accepted by the position filter
         * @return {undefined}
         */
        this.updateCache = function(steps, iterator, isStep) {
            var cacheBucket,
                existingCachePoint,
                bookmark,
                closestPriorBookmark,
                node = iterator.getCurrentNode();

            if (iterator.isBeforeNode() && odfUtils.isParagraph(node)) {
                if (!isStep) {
                    // Paragraph bookmarks indicate "first position in the paragraph"
                    // If the current stable point is before the first walkable position (as often happens)
                    // simply increase the step number by 1 to move to within the paragraph node
                    steps += 1;
                }

                closestPriorBookmark = repairCacheUpToStep(steps);
                bookmark = getNodeBookmark(/**@type{!Element}*/(node), steps);
                insertBookmark(closestPriorBookmark, bookmark);
                // E.g., steps <= 500 are valid for a request starting at 500 and counting forward
                cacheBucket = getDestinationBucket(bookmark.steps);
                existingCachePoint = stepToDomPoint[cacheBucket];
                if (!existingCachePoint || bookmark.steps > existingCachePoint.steps) {
                    // The current node & offset are closer to the cache bucket boundary than the existing entry was
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
            var cachePoint = getUndamagedBookmark(getClosestBookmark(steps));
            cachePoint.setIteratorPosition(iterator);
            return cachePoint.steps;
        };

        /**
         * Finds the nearest ancestor node that has an associated bookmark
         * @param {!Node} node
         * @return {?ops.StepsCache.Bookmark}
         */
        function findBookmarkedAncestor(node) {
            var currentNode = node,
                nodeId,
                bookmark = null;

            while (!bookmark && currentNode && currentNode !== rootElement) {
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
            var /**@type{?ops.StepsCache.Bookmark}*/
                bookmark,
                b,
                /**@type{string|number}*/
                key;

            if (node === rootElement && offset === 0) {
                bookmark = basePoint;
            } else if (node === rootElement && offset === rootElement.childNodes.length) {
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

            bookmark = getUndamagedBookmark(bookmark || basePoint);
            bookmark.setIteratorPosition(iterator);
            return bookmark.steps;
        };

        /**
         * Mark all steps beyond inflectionStep as no longer accurate
         * @param {!number} inflectionStep
         * @return {undefined}
         */
        this.damageCacheAfterStep = function(inflectionStep) {
            if (lastUndamagedCacheStep === undefined) {
                lastUndamagedCacheStep = inflectionStep;
            } else if (inflectionStep < lastUndamagedCacheStep) {
                lastUndamagedCacheStep = inflectionStep;
            }
        };

        function init() {
            var rootElementId = getNodeId(rootElement) || setNodeId(rootElement);
            basePoint = new RootBookmark(rootElementId, 0, rootElement);
        }
        init();
    };


    /*jslint emptyblock: true, unparam: true*/
    /**
     * @interface
     */
    ops.StepsCache.Bookmark = function Bookmark() { };

    /**
     * @type {!string}
     */
    ops.StepsCache.Bookmark.prototype.nodeId;

    /**
     * @type {!Node}
     */
    ops.StepsCache.Bookmark.prototype.node;

    /**
     * @type {!number}
     */
    ops.StepsCache.Bookmark.prototype.steps;

    /**
     * @type {?ops.StepsCache.Bookmark}
     */
    ops.StepsCache.Bookmark.prototype.previousBookmark;

    /**
     * @type {?ops.StepsCache.Bookmark}
     */
    ops.StepsCache.Bookmark.prototype.nextBookmark;

    /**
     * @param {!core.PositionIterator} iterator
     * @return {undefined}
     */
    ops.StepsCache.Bookmark.prototype.setIteratorPosition = function(iterator) { };
}());