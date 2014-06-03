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

/*global runtime, core, odf, ops*/

/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
ops.SessionTests = function SessionTests(runner) {
    "use strict";
    var t, r = runner,
        odfcanvas,
        testarea;

    this.setUp = function () {
        t = {};
        testarea = core.UnitTest.provideTestAreaDiv();
        odfcanvas = new odf.OdfCanvas(testarea);
        odfcanvas.setOdfContainer(new odf.OdfContainer(odf.OdfContainer.DocumentType.TEXT, null));
        t.odf = odfcanvas.odfContainer();
    };
    this.tearDown = function () {
        odfcanvas.destroy(function () { return; });
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };
    function newSession() {
        r.shouldBe(t, "t.odf.state", "odf.OdfContainer.DONE");
        t.session = new ops.Session(odfcanvas);
        r.shouldBe(t, "t.session.getOdtDocument().getMemberIds().length", "0");
    }
    this.tests = function () {
        return r.name([
            newSession
        ]);
    };
    this.asyncTests = function () {
        return [
        ];
    };
};
ops.SessionTests.prototype.description = function () {
    "use strict";
    return "Test the Session class.";
};
