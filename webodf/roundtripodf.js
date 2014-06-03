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

/*global runtime, core, odf*/

runtime.loadClass("odf.OdfContainer");

/**
 * If the state of the OdfContainer is invalid, exit with an error message.
 */
function exitOnInvalid(odffilepath, odfcontainer) {
    "use strict";
    if (odfcontainer.state === odf.OdfContainer.INVALID) {
        runtime.log("Document " + odffilepath + " is invalid.");
        runtime.exit(1);
    }
    if (odfcontainer.state === odf.OdfContainer.DONE) {
        odfcontainer.save(function (err) {
            if (err) {
                runtime.log(err);
                runtime.exit(1);
            }
        });
    }
}

/**
 * Load an ODF document. Report an error if there is a problem.
 */
function loadODF(odffilepath) {
    "use strict";
    var odfcontainer = new odf.OdfContainer(odffilepath);
    odfcontainer.onstatereadychange = function () {
        exitOnInvalid(odffilepath, odfcontainer);
    };
    exitOnInvalid(odffilepath, odfcontainer);
}

// loop over arguments to load ODF
var i;
for (i = 1; i < arguments.length; i += 1) {
    loadODF(arguments[i]);
}
