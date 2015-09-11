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

/*global runtime, core, odf, xmldom*/


/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
odf.OdfContainerTests = function OdfContainerTests(runner) {
    "use strict";
    var t, r = runner;
    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };

    function serialize(element) {
        var serializer = new xmldom.LSSerializer();
        return serializer.writeToString(element, odf.Namespaces.namespaceMap);
    }

    function appendXmlsToNode(node, xmlFragments) {
        if (!xmlFragments) {
            return;
        }

        xmlFragments.forEach(function(xmlFragment) {
            var doc, rootNode;

            doc = core.UnitTest.createXmlDocument("dummy", xmlFragment, odf.Namespaces.namespaceMap);
            rootNode = node.ownerDocument.importNode(doc.documentElement, true);
            while (rootNode.firstChild) {
                node.appendChild(rootNode.firstChild);
            }
        });
    }

    /**
     * @param {!boolean} isTemplate
     * @return {undefined}
     */
    function testEmptyDocument(isTemplate) {
        r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
        r.shouldBeNonNull(t, "t.odf.rootElement");
        r.shouldBeNonNull(t, "t.odf.rootElement.meta");
        r.shouldBeNonNull(t, "t.odf.rootElement.settings");
        r.shouldBeNonNull(t, "t.odf.rootElement.scripts");
        r.shouldBeNonNull(t, "t.odf.rootElement.fontFaceDecls");
        r.shouldBeNonNull(t, "t.odf.rootElement.styles");
        r.shouldBeNonNull(t, "t.odf.rootElement.automaticStyles");
        r.shouldBeNonNull(t, "t.odf.rootElement.masterStyles");
        r.shouldBeNonNull(t, "t.odf.rootElement.body");
        t.isTemplate = isTemplate;
        r.shouldBe(t, "t.odf.isTemplate()", "t.isTemplate");
    }

    function createNewText() {
        t.odf = new odf.OdfContainer(odf.OdfContainer.DocumentType.TEXT, null);
        testEmptyDocument(false);
        r.shouldBeNonNull(t, "t.odf.rootElement.text");
    }

    function createNewTextTemplate() {
        t.odf = new odf.OdfContainer(odf.OdfContainer.DocumentType.TEXT_TEMPLATE, null);
        testEmptyDocument(true);
        r.shouldBeNonNull(t, "t.odf.rootElement.text");
    }

    function createNewPresentation() {
        t.odf = new odf.OdfContainer(odf.OdfContainer.DocumentType.PRESENTATION, null);
        testEmptyDocument(false);
        r.shouldBeNonNull(t, "t.odf.rootElement.presentation");
    }

    function createNewPresentationTemplate() {
        t.odf = new odf.OdfContainer(odf.OdfContainer.DocumentType.PRESENTATION_TEMPLATE, null);
        testEmptyDocument(true);
        r.shouldBeNonNull(t, "t.odf.rootElement.presentation");
    }

    function createNewSpreadsheet() {
        t.odf = new odf.OdfContainer(odf.OdfContainer.DocumentType.SPREADSHEET, null);
        testEmptyDocument(false);
        r.shouldBeNonNull(t, "t.odf.rootElement.spreadsheet");
    }

    function createNewSpreadsheetTemplate() {
        t.odf = new odf.OdfContainer(odf.OdfContainer.DocumentType.SPREADSHEET_TEMPLATE, null);
        testEmptyDocument(true);
        r.shouldBeNonNull(t, "t.odf.rootElement.spreadsheet");
    }

     function setToTemplateAndBack() {
        t.odf = new odf.OdfContainer(odf.OdfContainer.DocumentType.TEXT, null);
        r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
        r.shouldBe(t, "t.odf.isTemplate()", "false");
        t.odf.setIsTemplate(true);
        r.shouldBe(t, "t.odf.isTemplate()", "true");
        t.odf.setIsTemplate(false);
        r.shouldBe(t, "t.odf.isTemplate()", "false");
    }


    function setRootElement_OverwritesAllDocumentElements() {
        var originalProperties = {};
        t.odf = new odf.OdfContainer(odf.OdfContainer.DocumentType.TEXT, null);
        r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
        t.originalRoot = t.odf.rootElement;
        // The properties values for the original root will change when it is disconnected from the document
        // so need to snapshot these beforehand
        Object.keys(t.originalRoot).forEach(function(k) {
            // This isn't 100% accurate of course, but at least helps find un-assigned values!
            originalProperties[k] = String(t.originalRoot[k]);
        });
        t.cloneRoot = /**@type{!Element}*/(t.odf.rootElement.cloneNode(true));

        t.odf.setRootElement(t.cloneRoot);

        r.shouldBe(t, "t.odf.rootElement", "t.cloneRoot");
        t.expected = {};
        t.actual = {};
        Object.keys(originalProperties).forEach(function(propertyName) {
            // Make test output nice and readable by using properties on objects. This will show
            // nice error messages if an unexpected value is encountered
            t.expected[propertyName] = originalProperties[propertyName];
            t.actual[propertyName] = String(t.odf.rootElement[propertyName]);
            r.shouldBe(t, "t.actual." + propertyName, "t.expected." + propertyName);
        });
    }

    /**
     * Check that the first part of the ODF container has the mimetype stored
     * correctly.
     */
    function checkMimeType(t, path, callback) {
        runtime.readFile(path, "binary", function (err, bytes) {
            t.err = err;
            r.shouldBeNull(t, "t.err");
            t.mimetype = runtime.byteArrayToString(bytes.subarray(30, 73), "utf8");
            r.shouldBe(t, "t.mimetype", "'mimetypeapplication/vnd.oasis.opendocument.'");
            callback();
        });
    }

    function createNewSaveAsAndLoad(callback) {
        t.odf = new odf.OdfContainer(odf.OdfContainer.DocumentType.TEXT, null);
        r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
        var path = "test.odt";
        t.odf.saveAs(path, function (err) {
            t.err = err;
            r.shouldBeNull(t, "t.err");
            t.odf = new odf.OdfContainer(path, function (odf) {
                t.odf = odf;
                r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
                checkMimeType(t, path, callback);
            });
        });
    }

    function createNewSaveAsAndLoad_OptionalElement_SettingsXml(callback) {
        t.odf = new odf.OdfContainer(odf.OdfContainer.DocumentType.TEXT, null);
        r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
        t.odf.rootElement.settings = null;
        var path = "test.odt";
        t.odf.saveAs("test.odt", function (err) {
            t.err = err;
            r.shouldBeNull(t, "t.err");
            r.shouldBeNull(t, "t.odf.rootElement.settings");
            t.odf = new odf.OdfContainer(path, function (odf) {
                t.odf = odf;
                r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
                r.shouldBe(t, "t.odf.rootElement.settings", "null");
                checkMimeType(t, path, callback);
            });
        });
    }

    function createNewSaveAsAndLoad_OptionalElement_MetaXml(callback) {
        t.odf = new odf.OdfContainer(odf.OdfContainer.DocumentType.TEXT, null);
        r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
        t.odf.rootElement.meta = null;
        var path = "test.odt";
        t.odf.saveAs(path, function (err) {
            t.err = err;
            r.shouldBeNull(t, "t.err");
            // Metadata is always created when the generator string is updated to webodf
            r.shouldBeNonNull(t, "t.odf.rootElement.meta");
            t.odf = new odf.OdfContainer(path, function (odf) {
                t.odf = odf;
                r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
                r.shouldBeNonNull(t, "t.odf.rootElement.meta");
                checkMimeType(t, path, callback);
            });
        });
    }

    function doFontFaceDeclsSaveAsAndLoadRoundTrip(args, callback) {
        t.odf = new odf.OdfContainer(odf.OdfContainer.DocumentType.TEXT, null);
        appendXmlsToNode(t.odf.rootElement.fontFaceDecls,   args.keptFontFaceDecls);
        appendXmlsToNode(t.odf.rootElement.fontFaceDecls,   args.droppedFontFaceDecls);
        appendXmlsToNode(t.odf.rootElement.styles,          args.styles);
        appendXmlsToNode(t.odf.rootElement.automaticStyles, args.automaticStyles);

        var path = r.resourcePrefix() + "fontFaceDeclsTest.odt";
        t.odf.saveAs(path, function (err) {
            t.err = err;
            r.shouldBeNull(t, "t.err");
            t.odf = new odf.OdfContainer(path, function (odf) {
                t.odf = odf;
                t.fontFaceDecls = "<office:font-face-decls>" + args.keptFontFaceDecls.join('') + "</office:font-face-decls>";
                t.fontFaceDeclsAfter = serialize(odf.rootElement.fontFaceDecls);

                r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
                r.shouldBeNonNull(t, "t.odf.rootElement.fontFaceDecls");
                r.shouldBe(t, "t.fontFaceDecls", "t.fontFaceDeclsAfter");

                checkMimeType(t, path, callback);
            });
        });
    }

    function testStyleOnlyFontFaceDeclsSaveAsAndLoadRoundTrip(callback) {
        doFontFaceDeclsSaveAsAndLoadRoundTrip({
            keptFontFaceDecls: [
                '<style:font-face style:name="OpenSymbol" svg:font-family="OpenSymbol"></style:font-face>'
            ],
            droppedFontFaceDecls: [
                '<style:font-face style:name="Arial" svg:font-family="Arial" style:font-family-generic="swiss"></style:font-face>',
                '<style:font-face style:name="Arial1" svg:font-family="Arial" style:font-family-generic="system" style:font-pitch="variable"></style:font-face>',
                '<style:font-face style:name="Times New Roman" svg:font-family="&apos;Times New Roman&apos;" style:font-family-generic="roman" style:font-pitch="variable"></style:font-face>',
                '<style:font-face style:name="Droid Sans Fallback" svg:font-family="&apos;Droid Sans Fallback&apos;" style:font-family-generic="system" style:font-pitch="variable"></style:font-face>'
            ],
            styles: [
                '<style:style style:name="BulletSymbols" style:family="text"><style:text-properties style:font-name="OpenSymbol" style:font-name-asian="OpenSymbol" style:font-name-complex="OpenSymbol"/></style:style>'
            ]},
            callback
        );
    }

    function testDefaultStyleOnlyFontFaceDeclsSaveAsAndLoadRoundTrip(callback) {
        doFontFaceDeclsSaveAsAndLoadRoundTrip({
            keptFontFaceDecls: [
                '<style:font-face style:name="Arial1" svg:font-family="Arial" style:font-family-generic="system" style:font-pitch="variable"></style:font-face>',
                '<style:font-face style:name="Times New Roman" svg:font-family="&apos;Times New Roman&apos;" style:font-family-generic="roman" style:font-pitch="variable"></style:font-face>',
                '<style:font-face style:name="Droid Sans Fallback" svg:font-family="&apos;Droid Sans Fallback&apos;" style:font-family-generic="system" style:font-pitch="variable"></style:font-face>'
            ],
            droppedFontFaceDecls: [
                '<style:font-face style:name="Arial" svg:font-family="Arial" style:font-family-generic="swiss"></style:font-face>',
                '<style:font-face style:name="OpenSymbol" svg:font-family="OpenSymbol"></style:font-face>'
            ],
            styles: [
                '<style:default-style style:family="paragraph"><style:text-properties style:font-name="Times New Roman" style:font-name-asian="Droid Sans Fallback" style:font-name-complex="Arial1"/></style:default-style>'
            ]},
            callback
        );
    }

    function testAutomaticStyleOnlyFontFaceDeclsSaveAsAndLoadRoundTrip(callback) {
        doFontFaceDeclsSaveAsAndLoadRoundTrip({
            keptFontFaceDecls: [
                '<style:font-face style:name="Arial" svg:font-family="Arial" style:font-family-generic="swiss"></style:font-face>',
                '<style:font-face style:name="Arial1" svg:font-family="Arial" style:font-family-generic="system" style:font-pitch="variable"></style:font-face>'
            ],
            droppedFontFaceDecls: [
                '<style:font-face style:name="Times New Roman" svg:font-family="&apos;Times New Roman&apos;" style:font-family-generic="roman" style:font-pitch="variable"></style:font-face>',
                '<style:font-face style:name="OpenSymbol" svg:font-family="OpenSymbol"></style:font-face>',
                '<style:font-face style:name="Droid Sans Fallback" svg:font-family="&apos;Droid Sans Fallback&apos;" style:font-family-generic="system" style:font-pitch="variable"></style:font-face>'
            ],
            automaticStyles: [
                '<style:style style:name="T1" style:family="text"><style:text-properties style:font-name="Arial" style:font-name-complex="Arial1"/></style:style>'
            ]},
            callback
        );
    }

    function testMultiStylesFontFaceDeclsSaveAsAndLoadRoundTrip(callback) {
        doFontFaceDeclsSaveAsAndLoadRoundTrip({
            keptFontFaceDecls: [
                '<style:font-face style:name="Arial" svg:font-family="Arial" style:font-family-generic="swiss"></style:font-face>',
                '<style:font-face style:name="Arial1" svg:font-family="Arial" style:font-family-generic="system" style:font-pitch="variable"></style:font-face>',
                '<style:font-face style:name="Times New Roman" svg:font-family="&apos;Times New Roman&apos;" style:font-family-generic="roman" style:font-pitch="variable"></style:font-face>',
                '<style:font-face style:name="OpenSymbol" svg:font-family="OpenSymbol"></style:font-face>',
                '<style:font-face style:name="Droid Sans Fallback" svg:font-family="&apos;Droid Sans Fallback&apos;" style:font-family-generic="system" style:font-pitch="variable"></style:font-face>'
            ],
            droppedFontFaceDecls: [
                '<style:font-face style:name="Unused" svg:font-family="Arial" style:font-family-generic="swiss" style:font-pitch="variable"></style:font-face>'
            ],
            styles: [
                '<style:default-style style:family="paragraph"><style:text-properties style:font-name="Times New Roman" style:font-name-asian="Droid Sans Fallback" style:font-name-complex="Arial1"/></style:default-style>',
                '<style:style style:name="BulletSymbols" style:family="text"><style:text-properties style:font-name="OpenSymbol" style:font-name-asian="OpenSymbol" style:font-name-complex="OpenSymbol"/></style:style>'
            ],
            automaticStyles: [
                '<style:style style:name="T1" style:family="text"><style:text-properties style:font-name="Arial" style:font-name-complex="Arial1"/></style:style>'
            ]},
            callback
        );
    }

    function compareZipEntryList(odf1path, odf2path, callback) {
        var dummy = new core.Zip(odf1path, function (err, z1) {
            t.err = err;
            r.shouldBeNull(t, "t.err");
            dummy = new core.Zip(odf2path, function (err, z2) {
                t.err = err;
                r.shouldBeNull(t, "t.err");
                t.e1 = z1.getEntries();
                t.e2 = z2.getEntries();
                r.shouldBe(t, "t.e1.length", "t.e2.length");
                var i, j, f1;
                t.allPresent = true;
                for (i = 0; t.allPresent && i < t.e1.length; i += 1) {
                    f1 = t.e1[i].filename;
                    j = 0;
                    while (t.e2[j].filename !== f1 && j < t.e2.length) {
                        j += 1;
                    }
                    if (j === t.e2.length) {
                        runtime.log("Not present: " + f1);
                    } else {
                        t.date1 = t.e1[i].date;
                        t.date2 = t.e2[j].date;
                        // new date should be newer but not more than 3 years
                        r.shouldBe(t, "t.date2.getTime() - t.date1.getTime() >= 0", "true");
                        r.shouldBe(t, "t.date2.getTime() - t.date1.getTime() < 100000000000", "true");
                    }
                    t.allPresent = j !== t.e2.length;
                }
                r.shouldBe(t, "t.allPresent", "true");
                checkMimeType(t, odf2path, callback);
            });
        });
        return dummy;
    }
    function compare(odf1path, odf2path, callback) {
        compareZipEntryList(odf1path, odf2path, callback);
    }
    function loadAndSave(callback) {
        var path = "odf/loadsave.odt",
            newpath = "odf/newloadsave.odt";
        t.odf = new odf.OdfContainer(path, function (o1) {
            t.odf = o1;
            r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
            t.odf.saveAs(newpath, function (err) {
                t.err = err;
                r.shouldBeNull(t, "t.err");
                t.odf2 = new odf.OdfContainer(newpath, function (o2) {
                    t.odf2 = o2;
                    r.shouldBe(t, "t.odf2.state", "odf.OdfContainer.DONE");
                    compare(path, newpath, callback);
                });
            });
        });
    }

    this.tests = function () {
        return r.name([
            createNewText,
            createNewTextTemplate,
            createNewPresentation,
            createNewPresentationTemplate,
            createNewSpreadsheet,
            createNewSpreadsheetTemplate,
            setToTemplateAndBack,
            setRootElement_OverwritesAllDocumentElements
        ]);
    };
    this.asyncTests = function () {
        return r.name([
            createNewSaveAsAndLoad,
            createNewSaveAsAndLoad_OptionalElement_SettingsXml,
            createNewSaveAsAndLoad_OptionalElement_MetaXml,
            testDefaultStyleOnlyFontFaceDeclsSaveAsAndLoadRoundTrip,
            testStyleOnlyFontFaceDeclsSaveAsAndLoadRoundTrip,
            testAutomaticStyleOnlyFontFaceDeclsSaveAsAndLoadRoundTrip,
            testMultiStylesFontFaceDeclsSaveAsAndLoadRoundTrip,
            loadAndSave
        ]);
    };
};
odf.OdfContainerTests.prototype.description = function () {
    "use strict";
    return "Test the OdfContainer class.";
};
