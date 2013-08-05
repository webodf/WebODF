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
/*jslint sub: true*/
/*global runtime, gui, core, odf, Node*/

/**
 * TODO: There is currently brokenness in how annotations which overlap are handled.
 * This needs to be fixed soon.
 */

/**
 * A GUI class for wrapping Annotation nodes inside html wrappers, positioning
 * them on the sidebar, drawing connectors, and highlighting comments.
 * @constructor
 */
gui.AnnotationViewManager = function AnnotationViewManager(odfFragment, annotationsPane) {
    "use strict";
    var annotations = [],
        doc = odfFragment.ownerDocument,
        odfUtils = new odf.OdfUtils(),
        /**@const*/CONNECTOR_MARGIN = 30,
        /**@const*/NOTE_MARGIN = 20,
        window = runtime.getWindow();

    runtime.assert(Boolean(window),
                   "Expected to be run in an environment which has a global window, like a browser.");
    /**
     * Wraps an annotation with various HTML elements for styling, including connectors
     * @param {!{node: !Node, end: ?Node}} annotation
     * @return {undefined}
     */
    function wrapAnnotation(annotation) {
        var annotationWrapper = doc.createElement('div'),
            annotationNote = doc.createElement('div'),
            connectorHorizontal = doc.createElement('div'),
            connectorAngular = doc.createElement('div'),
            annotationNode = annotation.node;

        annotationWrapper.className = 'annotationWrapper';
        annotationNode.parentNode.insertBefore(annotationWrapper, annotationNode);

        annotationNote.className = 'annotationNote';
        annotationNote.appendChild(annotationNode);

        connectorHorizontal.className = 'annotationConnector horizontal';
        connectorAngular.className = 'annotationConnector angular';

        annotationWrapper.appendChild(annotationNote);
        annotationWrapper.appendChild(connectorHorizontal);
        annotationWrapper.appendChild(connectorAngular);
    }

    /**
     * Unwraps an annotation
     * @param {!{node: !Node, end: ?Node}} annotation
     * @return {undefined}
     */
    function unwrapAnnotation(annotation) {
        var annotationNode = annotation.node,
            annotationWrapper = annotationNode.parentNode.parentNode;

        if (annotationWrapper.localName === 'div') {
            annotationWrapper.parentNode.insertBefore(annotationNode, annotationWrapper);
            annotationWrapper.parentNode.removeChild(annotationWrapper);
        }
    }

    /**
     * Highlights the text between the annotation node and it's end
     * @param {!{node: !Node, end: ?Node}} annotation
     * @return {undefined}
     */
    function highlightAnnotation(annotation) {
        var annotationNode = annotation.node,
            annotationEnd = annotation.end,
            range = doc.createRange(),
            textNodes;

        if (annotationEnd) {
            range.setStart(annotationNode, annotationNode.childNodes.length);
            range.setEnd(annotationEnd, 0);

            textNodes = odfUtils.getTextNodes(range, false);

            textNodes.forEach(function (n) {
                var container = doc.createElement('span');
                container.className = 'annotationHighlight';
                container.setAttribute('annotation', annotationNode.getAttributeNS(odf.Namespaces.officens, 'name'));

                n.parentNode.insertBefore(container, n);
                container.appendChild(n);
            });
        }

        range.detach();
    }

    /**
     * Unhighlights the text between the annotation node and it's end
     * @param {!{node: !Node, end: ?Node}} annotation
     * @return {undefined}
     */
    function unhighlightAnnotation(annotation) {
        var annotationName = annotation.node.getAttributeNS(odf.Namespaces.officens, 'name'),
            highlightSpans = doc.querySelectorAll('span.annotationHighlight[annotation="' + annotationName + '"]'),
            i,
            j,
            container,
            children;

        for (i = 0; i < highlightSpans.length; i += 1) {
            container = highlightSpans[i];
            children = container.childNodes;
            for (j = 0; j < children.length; j += 1) {
                container.parentNode.insertBefore(children[j], container);
            }
            container.parentNode.removeChild(container);
        }
    }

    function lineDistance(point1, point2) {
        var xs = 0,
            ys = 0;
     
        xs = point2.x - point1.x;
        xs = xs * xs;
     
        ys = point2.y - point1.y;
        ys = ys * ys;
     
        return Math.sqrt(xs + ys);
    }

    /**
     * Recalculates the positions, widths, and rotation angles of things like the annotation note and it's
     * connectors. Can and should be called frequently to update the UI
     * @param {!{node: !Node, end: ?Node}} annotation
     * @return {undefined}
     */
    function renderAnnotation(annotation) {
        var annotationNote = annotation.node.parentNode,
            connectorHorizontal = annotationNote.nextSibling,
            connectorAngular = connectorHorizontal.nextSibling,
            annotationWrapper = annotationNote.parentNode,
            connectorAngle = 0,
            previousAnnotation = annotations[annotations.indexOf(annotation) - 1],
            previousRect,
            creatorNode = annotation.node.getElementsByTagNameNS(odf.Namespaces.dcns, 'creator')[0],
            creatorName;

        annotationNote.style.left =
            annotationsPane.getBoundingClientRect().left
            - annotationWrapper.getBoundingClientRect().left + 'px';
        annotationNote.style.width = annotationsPane.getBoundingClientRect().width + 'px';


        connectorHorizontal.style.width = parseFloat(annotationNote.style.left)
                                          - CONNECTOR_MARGIN + 'px';

        if (previousAnnotation) {
            previousRect = previousAnnotation.node.parentNode.getBoundingClientRect();
            if ((annotationWrapper.getBoundingClientRect().top - previousRect.bottom) <= NOTE_MARGIN) {
                annotationNote.style.top = Math.abs(annotationWrapper.getBoundingClientRect().top - previousRect.bottom) + NOTE_MARGIN + 'px';
            } else {
                annotationNote.style.top = '0px';
            }
        }

        connectorAngular.style.left = connectorHorizontal.getBoundingClientRect().width + 'px';
        connectorAngular.style.width =
            lineDistance({
                x: connectorAngular.getBoundingClientRect().left,
                y: connectorAngular.getBoundingClientRect().top
            }, {
                x: annotationNote.getBoundingClientRect().left,
                y: annotationNote.getBoundingClientRect().top
            }) + 'px';

        connectorAngle = Math.asin(
            (annotationNote.getBoundingClientRect().top - connectorAngular.getBoundingClientRect().top)
                / parseFloat(connectorAngular.style.width)
        );
        connectorAngular.style.transform = 'rotate(' + connectorAngle + 'rad)';
        connectorAngular.style.MozTransform = 'rotate(' + connectorAngle + 'rad)';
        connectorAngular.style.WebkitTransform = 'rotate(' + connectorAngle + 'rad)';
        connectorAngular.style.msTransform = 'rotate(' + connectorAngle + 'rad)';

        // Bad hack: Since we do not have a straightforward way to access user data here, we will read the computed style
        // of dc:creator[editinfo|memberid]:before, always applied by SessionView, because that contains the creator name
        // as the content, when an annotation is created by OpAddAnnotation.
        if (creatorNode) {
            creatorName = window.getComputedStyle(/**@type{!Element}*/(creatorNode), ':before').content;
            if (creatorName) {
                creatorName = creatorName.substring(1, creatorName.length - 1);
                if (creatorNode.firstChild) {
                    creatorNode.firstChild.nodeValue = creatorName;
                } else {
                    creatorNode.appendChild(doc.createTextNode(creatorName));
                }
            }
        }

    }
    
    /**
     * Sorts the internal annotations array by order of occurence in the document.
     * Useful for calculating the order of annotations in the sidebar, and positioning them
     * accordingly
     * @return {undefined}
     */
    function sortAnnotations() {
        annotations.sort(function (a, b) {
            if (a.node.compareDocumentPosition(b.node) === Node.DOCUMENT_POSITION_FOLLOWING) {
                return -1;
            }
            return 1;
        });
    }

    /**
     * Recalculates the rendering - positions, rotation angles for connectors, etc - 
     * for all tracked annotations
     * @return {undefined}
     */
    function rerenderAnnotations() {
        var i;

        for (i = 0; i < annotations.length; i += 1) {
            renderAnnotation(annotations[i]);
        }
    }
    this.rerenderAnnotations = rerenderAnnotations;

    /**
     * Adds an annotation to track, and wraps and highlights it
     * @param {!{node: !Node, end: ?Node}} annotation
     * @return {undefined}
     */
    function addAnnotation(annotation) {
        annotations.push({
            node: annotation.node,
            end: annotation.end
        });

        sortAnnotations();

        wrapAnnotation(annotation);
        if (annotation.end) {
            highlightAnnotation(annotation);
        }
        rerenderAnnotations();
    }
    this.addAnnotation = addAnnotation;

    /**
     * Unhighlights, unwraps, and ejects an annotation from the tracking
     * @param {!{node: !Node, end: ?Node}} annotation
     * @return {undefined}
     */
    function forgetAnnotation(annotation) {
        unwrapAnnotation(annotation);
        unhighlightAnnotation(annotation);
        annotations.splice(annotations.indexOf(annotation), 1);
    }

    /**
     * Untracks, unwraps, and unhighlights all annotations
     * @return {undefined}
     */
    function forgetAnnotations() {
        while (annotations.length) {
            forgetAnnotation(annotations[0]);
        }
    }
    this.forgetAnnotations = forgetAnnotations;
};
