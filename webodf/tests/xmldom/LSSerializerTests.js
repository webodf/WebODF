/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
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

/*global runtime, core, xmldom, odf, XMLSerializer*/

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
xmldom.LSSerializerTests = function LSSerializerTests(runner) {
    "use strict";
    var r = runner,
        node,
        t,
        serializer;

    function testEscapeCharactersInNodeValue() {
        node = t.doc.createElementNS('text', 'p');
        node.appendChild(t.doc.createTextNode('< & > \' " "'));

        t.result = serializer.writeToString(node, {});

        r.shouldBe(t, "t.result", "'<ns0:p xmlns:ns0=\"text\">&lt; &amp; &gt; &apos; &quot; &quot;</ns0:p>'");
    }
    function testEscapeCharactersInAttributeValue() {
        node = t.doc.createElementNS('text', 'p');
        node.setAttributeNS('mynamespace', 'myattribute', '< & > \' " "');

        t.result = serializer.writeToString(node, {});

        r.shouldBe(t, "t.result", "'<ns0:p xmlns:ns0=\"text\" xmlns:ns1=\"mynamespace\" ns1:myattribute=\"&lt; &amp; &gt; &apos; &quot; &quot;\"></ns0:p>'");
    }
    this.setUp = function () {
        serializer = new xmldom.LSSerializer();
        t = {};
        t.doc = runtime.getDOMImplementation().createDocument("", "a", null);
    };
    this.tearDown = function () {
        serializer = undefined;
        t = {};
    };
    this.tests = function () {
        return r.name([
            testEscapeCharactersInNodeValue,
            testEscapeCharactersInAttributeValue
        ]);
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
xmldom.LSSerializerTests.prototype.description = function () {
    "use strict";
    return "Test the LSSerializer class.";
};
(function () {
    "use strict";
    return xmldom.LSSerializerTests;
}());
