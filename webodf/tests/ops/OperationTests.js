/**
 * Copyright (C) 2013 KO GmbH <jos.van.den.oever@kogmbh.com>
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
/*global Node, runtime, core, gui, ops, odf, xmldom*/
runtime.loadClass("odf.Namespaces");
runtime.loadClass("xmldom.LSSerializer");

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
ops.OperationTests = function OperationTests(runner) {
    "use strict";
    var r = runner, t, tests;

    function serialize(element) {
        var serializer = new xmldom.LSSerializer();
        return serializer.writeToString(element, odf.Namespaces.namespaceMap);
    }

    function sortChildrenByNSAttribute(element, attrns, attrLocalName) {
        var child = element.firstChild,
            childArray = [],
            i;
        while(child) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                childArray.push(child);
            }
            child = child.nextSibling;
        }
        childArray.sort(function(a, b) {
            var attra = a.getAttributeNS(attrns, attrLocalName),
                attrb = b.getAttributeNS(attrns, attrLocalName);
            return attra === attrb ? 0 :
                  (attra > attrb ?   1 :
                                    -1);
        });

        for(i = 0; i < childArray.length; i += 1) {
            element.appendChild(childArray[i]);
        }
    }

    function parseOperation(node) {
        var op = {},
            child = node.firstChild,
            atts = node.attributes,
            att,
            n = atts.length,
            i,
            value;
        // read plain data by attributes
        for (i = 0; i < n; i += 1) {
            att = atts.item(i);
            value = att.value;
            if (/length|number|position|fontSize|topMargin|bottomMargin|leftMargin|rightMargin/.test(att.localName)) {
                value = parseInt(value, 10);
            }
            op[att.localName] = value;
        }
        // read complex data by childs
        while(child) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                op[child.localName] = parseOperation(child);
            }
            child = child.nextSibling;
        }
        return op;
    }
    function checkWhitespaceTexts(element) {
        var text = element.firstChild;
        return (element.childNodes.length === 1
            && element.hasAttributeNS(odf.Namespaces.textns, "c") === false
            && text.nodeType === Node.TEXT_NODE
            && text.textContent === " ");
    }
    function checkWhitespace(rootElement) {
        var i,
            spaceElements = rootElement.getElementsByTagNameNS(odf.Namespaces.textns, "s");
        for (i = 0; i < spaceElements.length; i+=1) {
            if (!checkWhitespaceTexts(spaceElements[i])) {
                return false;
            }
        }
        return true;
    }
    function parseTest(name, node) {
        var before = node.firstElementChild,
            opsElement = before.nextElementSibling,
            after = opsElement.nextElementSibling,
            ops = [],
            test = {},
            op;
        runtime.assert(before.localName === "before", "Expected <before/> in " + name + ".");
        runtime.assert(checkWhitespace(before), "Unexpanded test:s element or text:c attribute found in " + name + ".");
        runtime.assert(opsElement.localName === "ops", "Expected <ops/> in " + name + ".");
        runtime.assert(after.localName === "after", "Expected <after/> in " + name + ".");
        runtime.assert(checkWhitespace(after), "Unexpanded test:s element or text:c attribute found in " + name + ".");
        op = opsElement.firstElementChild;
        while (op) {
            runtime.assert(op.localName === "op", "Expected <op/> in " + name + ".");
            ops.push(parseOperation(op));
            op = op.nextElementSibling;
        }
        return {
            before: before,
            ops: ops,
            after: after
        };
    }

    function copyChildNodes(a, b) {
        while (b.firstChild) {
            b.removeChild(b.firstChild);
        }
        var n = a.firstChild;
        while (n) {
            if (a.ownerDocument === b.ownerDocument) {
                b.appendChild(n.cloneNode(true));
            } else {
                b.appendChild(b.ownerDocument.importNode(n, true));
            }
            n = n.nextSibling;
        }
    }

    function getOfficeNSElement(node, localName) {
        var e = node.getElementsByTagNameNS(odf.Namespaces.officens, localName);

        if (e.length === 1) {
            return e[0];
        }
        return null;
    }

    function getOfficeTextElement(node) {
        return getOfficeNSElement(node, "text");
    }

    function getOfficeStylesElement(node) {
        return getOfficeNSElement(node, "styles");
    }

    function compareAttributes(a, b, skipReverseCheck) {
        var aatts = a.attributes,
            n = aatts.length,
            i,
            att,
            v;
        for (i = 0; i < n; i += 1) {
            att = aatts.item(i);
            if (att.prefix !== "xmlns") {
                v = b.getAttributeNS(att.namespaceURI, att.localName);
                if (!b.hasAttributeNS(att.namespaceURI, att.localName)
                        || v !== att.value) {
                    return false;
                }
            }
        }
        return skipReverseCheck ? true : compareAttributes(b, a, true);
    }

    function compareNodes(a, b) {
        if (a.nodeType !== b.nodeType) {
            return false;
        }
        if (a.nodeType === Node.TEXT_NODE) {
            return a.data === b.data;
        }
        runtime.assert(a.nodeType === Node.ELEMENT_NODE, "Only textnodes and elements supported.");
        if (a.namespaceURI !== b.namespaceURI || a.localName !== b.localName) {
            return false;
        }
        if (!compareAttributes(a, b, false)) {
            return false;
        }
        var an = a.firstChild,
            bn = b.firstChild;
        while (an) {
            if (!bn) {
                return false;
            }
            if (!compareNodes(an, bn)) {
                return false;
            }
            an = an.nextSibling;
            bn = bn.nextSibling;
        }
        if (bn) {
            return false;
        }
        return true;
    }

    function runTest(test) {
        var text = t.odtDocument.getRootNode(),
            factory = new ops.OperationFactory(),
            i,
            op,
            textbefore = getOfficeTextElement(test.before),
            textafter = getOfficeTextElement(test.after),
            styles = t.odfContainer.rootElement.styles,
            stylesbefore = getOfficeStylesElement(test.before),
            stylesafter = getOfficeStylesElement(test.after);
        // inject test data
        if (stylesbefore) {
            copyChildNodes(stylesbefore, styles);
        }
        copyChildNodes(textbefore, text);

        // execute test ops
        for (i = 0; i < test.ops.length; i += 1) {
            op = factory.create(test.ops[i]);
            op.execute(t.odtDocument);
        }

        // check result
        if (stylesbefore) {
            stylesafter.normalize();
            // for now just normalize the order of the styles to create
            // comparability
            // any possible orderless listing in the style subchilds will be
            // only cared for once it is needed
            sortChildrenByNSAttribute(stylesafter, odf.Namespaces.stylens, "name");
            styles.normalize();
            sortChildrenByNSAttribute(styles, odf.Namespaces.stylens, "name");
            if (!compareNodes(stylesafter, styles)) {
                t.styles = serialize(styles);
                t.stylesafter = serialize(stylesafter);
            } else {
                t.styles = t.stylesafter = "OK";
            }
            r.shouldBe(t, "t.styles", "t.stylesafter");
        }

        textafter.normalize();
        text.normalize();
        if (!compareNodes(textafter, text)) {
            t.text = serialize(text);
            t.after = serialize(textafter);
        } else {
            t.text = t.after = "OK";
        }
        r.shouldBe(t, "t.text", "t.after");
    }

    function makeTestIntoFunction(name, test) {
        var f = function () {
            runTest(test);
        };
        f.testName = name;
        return f;
    }

    function makeTestsIntoFunction(tests) {
        var functions = [], i;
        for (i in tests) {
            if (tests.hasOwnProperty(i)) {
                functions.push(makeTestIntoFunction(i, tests[i]));
            }
        }
        return functions;
    }

    function loadTests(url, tests) {
        var s = runtime.readFileSync(url, "utf-8"),
            xml = runtime.parseXML(s),
            n,
            testName;
        runtime.assert(s.length > 0, "XML file is empty.");
        runtime.assert(xml.documentElement.localName === "tests", "Element is not <tests/>.");
        n = xml.documentElement.firstElementChild;
        while (n) {
            testName = n.getAttribute("name");
            runtime.assert(n.localName === "test", "Element is not <test/>.");
            runtime.assert(!tests.hasOwnProperty(testName), "Test name " + testName + " is not unique.");
            tests[testName] = parseTest(testName, n);
            n = n.nextElementSibling;
        }
    }

    function loadTestFiles(urls) {
        var tests = {}, i;
        for (i = 0; i < urls.length; i += 1) {
            loadTests(urls[i], tests);
        }
        return tests;
    }

    this.setUp = function () {
        var testarea,
            odfcanvas;
        t = {};
        testarea = core.UnitTest.provideTestAreaDiv();
        odfcanvas = new odf.OdfCanvas(testarea);
        t.odfContainer = new odf.OdfContainer("", null);
        odfcanvas.setOdfContainer(t.odfContainer);
        t.odtDocument = new ops.OdtDocument(odfcanvas);
    };
    this.tearDown = function () {
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };
    this.tests = function () {
        if (!tests) {
            tests = makeTestsIntoFunction(loadTestFiles(
                ["ops/operationtests.xml", "ops/allowedpositions.xml"]
            ));
        }
        return tests;
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
ops.OperationTests.prototype.description = function () {
    "use strict";
    return "Test the ODT operations described in an XML file.";
};
(function () {
    "use strict";
    return ops.OperationTests;
}());
