/**
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

/*global core, odf, runtime, NodeFilter, Node*/

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
odf.MaliciousDocumentTests = function MaliciousDocumentTests(runner) {
    "use strict";

    var r = runner,
        t,
        async = core.Async;

    /*jslint emptyblock:true*/
    function noOp() { }
    /*jslint emptyblock:false*/

    /**
     * Get the security canary injection attacks attempt to set
     * @returns {!string}
     */
    function getCanary() {
        return runtime.getWindow().canary;
    }

    this.setUp = function () {
        var root = core.UnitTest.provideTestAreaDiv();
        t = {
            root: root,
            doc: root.ownerDocument,
            cleanup: []
        };
    };

    this.tearDown = function () {
        async.destroyAll(t.cleanup, noOp);
        core.UnitTest.cleanupTestAreaDiv();
    };

    /**
     * Return elements that have a clickTarget attribute defined on them
     * @param {!Node} node
     * @returns {!number}
     */
    function acceptClickTarget(node) {
        if(node.nodeType === Node.ELEMENT_NODE && /**@type{!Element}*/(node).getAttribute("clickTarget")) {
            return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
    }

    /**
     * Find elements specifically marked for click-based injection attacks
     */
    function activateClickTargets() {
        var window = runtime.getWindow(),
            evObj = t.doc.createEvent('MouseEvents'),
            clickTargetsWalker = t.doc.createTreeWalker(t.root, NodeFilter.SHOW_ALL, acceptClickTarget, false),
            targetNode;
        clickTargetsWalker.currentNode = t.root;

        targetNode = clickTargetsWalker.nextNode();
        while (targetNode) {
            evObj.initMouseEvent('click', true, true, window, 1, 12, 345, 7, 220, false, false, true, false, 0, null );
            targetNode.dispatchEvent(evObj);
            targetNode = clickTargetsWalker.nextNode();
        }
    }

    function loadInjectionDocument(callback) {
        t.odf = new odf.OdfContainer("odf/malicious-js.fodt", function(odf) {
            t.doc.importNode(odf.rootElement, true);
            t.root.appendChild(odf.rootElement);

            activateClickTargets();

            t.canary = getCanary();
            r.shouldBe(t, "t.canary", "undefined");
            callback();
        });
    }

    this.tests = function() {
        return [];
    };

    this.asyncTests = function () {
        return r.name([loadInjectionDocument]);
    };
};

odf.MaliciousDocumentTests.prototype.description = function () {
    "use strict";
    return "Test WebODF handling of malicious documents";
};
(function () {
    "use strict";
    return odf.MaliciousDocumentTests;
}());
