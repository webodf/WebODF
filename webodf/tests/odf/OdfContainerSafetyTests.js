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
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
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
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global runtime, core, odf, xmldom*/


/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
odf.OdfContainerSafetyTests = function OdfContainerSafetyTests(runner) {
    "use strict";
    var t, r = runner,
        htmlns = "http://www.w3.org/1999/xhtml";

    this.setUp = function () {
        t = {};
    };

    this.tearDown = function () {
        t = {};
    };

    /**
     * In an html context, the element <script/> and <style/> are dangerous,
     * because they may execute code when inserted into the DOM.
     * HTML elements may have html namepace or no namespace.
     * @param {!Element} e
     * @return {!boolean}
     */
    function isDangerousElement(e) {
         var ns = e.namespaceURI,
             name = e.localName;
         if ((ns === htmlns || ns === null)
                 && (name === "style" || name === "script")) {
             return true;
         }
         return false;
    }

    /**
     * An attribute with with a name like 'on...' with no namespace
     * might execute code at some point. This function determines if an
     * attribute is such a dangerous attribute.
     * @param {!Attr} a
     * @return {!boolean}
     */
    function isDangerousAttribute(a) {
         var ns = a.namespaceURI,
             name = a.localName;
         if (ns === null && name.substr(0,2).toLowerCase() === "on") {
             return true;
         }
         return false;
    }

    /**
     * @param {!Element} element
     * @return {!Array.<!Element>}
     */
    function getDangerousElements(element) {
        var d = [], e = element.firstElementChild;
        while (e) {
            if (isDangerousElement(e)) {
                 d.push(e);
            }
            d.push.apply(getDangerousElements(e));
            e = e.nextElementSibling;
        }
        return d;
    }

    /**
     * @param {!Element} element
     * @return {!Array.<!Attr>}
     */
    function getDangerousAttributes(element) {
        var d = [], e = element.firstElementChild, i, a;
        while (e) {
            for (i = 0; i < e.attributes.length; i += 1) {
                 a = /**@type{!Attr}*/(e.attributes.item(i));
                 if (isDangerousAttribute(a)) {
runtime.log(a.localName);
                     d.push(a);
                 }
            }
            d.push.apply(getDangerousAttributes(e));
            e = e.nextElementSibling;
        }
        return d;
    }

    /**
     * Tests that an odt file loads without executing embedded code.
     */
    function loadSafely(callback) {
        var path = r.resourcePrefix() + "odf/unsafe.fodt";
        t.odf = new odf.OdfContainer(path, function (container) {
            t.odf = container;
            r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
            if (t.odf.state !== odf.OdfContainer.DONE) {
                return callback();
            }
            t.dangerousElements = getDangerousElements(t.odf.rootElement);
            r.shouldBe(t, "t.dangerousElements", "[]");
            t.dangerousAttributes = getDangerousAttributes(t.odf.rootElement);
            r.shouldBe(t, "t.dangerousAttributes", "[]");
            callback();
        });
    }

    this.tests = function () {
        return r.name([
        ]);
    };

    this.asyncTests = function () {
        return r.name([
            loadSafely
        ]);
    };
};
odf.OdfContainerSafetyTests.prototype.description = function () {
    "use strict";
    return "Test the safety of the OdfContainer class.";
};
(function () {
    "use strict";
    return odf.OdfContainerSafetyTests;
}());
