/**
 * Copyright (C) 2014 KO GmbH <copyright@kogmbh.com>
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

/*global runtime, core, odf, NodeFilter, Node, xmldom*/

/**
 * @constructor
 * @param {!core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
odf.StyleCacheTests = function StyleTests(runner) {
    "use strict";
    var r = runner, t;
    function simple(callback) {
        var path = r.resourcePrefix() + "odf/stylefodt/simple.fodt";
        t.doc = new odf.OdfContainer(path, function (o) {
            t.doc = o;
            var styles = new odf.StyleCache(o.rootElement),
                text = o.rootElement.body.firstElementChild,
                p = /**@type{!Element}*/(text.firstElementChild),
                gstyle,
                pstyle,
                masterPage;
            styles.update();

            masterPage = styles.getDefaultMasterPage();
            t.pageHeight = masterPage.pageLayout.pageLayout.pageHeight();
            r.shouldBe(t, "t.pageHeight", "960");
            t.pageWidth = masterPage.pageLayout.pageLayout.pageWidth();
            r.shouldBe(t, "t.pageWidth", "10/2.54*96");

            gstyle = styles.getComputedGraphicStyle(p);
            t.verticalPos = gstyle.graphic.verticalPos();
            r.shouldBe(t, "t.verticalPos", "'from-top'");
            t.verticalRel = gstyle.graphic.verticalRel();
            r.shouldBe(t, "t.verticalRel", "'page'");
            t.horizontalPos = gstyle.graphic.horizontalPos();
            r.shouldBe(t, "t.horizontalPos", "'from-left'");
            t.horizontalRel = gstyle.graphic.horizontalRel();
            r.shouldBe(t, "t.horizontalRel", "'paragraph'");

            p = /**@type{!Element}*/(p.nextElementSibling);
            pstyle = styles.getComputedParagraphStyle(p);
            t.marginTop = pstyle.paragraph.marginTop();
            r.shouldBe(t, "t.marginTop", "96");
            t.fontSize = pstyle.text.fontSize();
            r.shouldBe(t, "t.fontSize", "11*4/3");

            p = /**@type{!Element}*/(p.nextElementSibling);
            pstyle = styles.getComputedParagraphStyle(p);
            t.marginTop = pstyle.paragraph.marginTop();
            r.shouldBe(t, "t.marginTop", "0");
            t.fontSize = pstyle.text.fontSize();
            r.shouldBe(t, "t.fontSize", "12*4/3");

            p = /**@type{!Element}*/(p.nextElementSibling);
            pstyle = styles.getComputedParagraphStyle(p);
            t.marginTop = pstyle.paragraph.marginTop();
            r.shouldBe(t, "t.marginTop", "96/2.54");
            t.fontSize = pstyle.text.fontSize();
            r.shouldBe(t, "t.fontSize", "10*4/3");
            callback();
        });
    }

    this.setUp = function () {
        t = {};
    };
    this.tearDown = function () {
        t = {};
    };
    this.tests = function () {
        return [];
    };
    this.asyncTests = function () {
        return r.name([
            simple
        ]);
    };
};
odf.StyleCacheTests.prototype.description = function () {
    "use strict";
    return "Test that the styles of the odf documents are calculated correctly.";
};
