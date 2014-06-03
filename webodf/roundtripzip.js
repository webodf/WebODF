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

/*global runtime, core*/

runtime.loadClass("core.Zip");

/**
 * Load an ODF document. Report an error if there is a problem.
 */
function roundTripZip(zipfilepath) {
    "use strict";
    var zip = new core.Zip(zipfilepath, function (err, zip) {
        if (err) {
            runtime.log(err);
            runtime.exit(1);
        }
        // the TOC of the zip is loaded at this point
        // now we want to load all parts in memory so we can save them again
        zip.write(function (err) {
            if (err) {
                runtime.log(err);
                runtime.exit(1);
            }
            // at this point a zip file should have been written with the same
            // contents as the one that was read
            runtime.exit(0);
        });
    });
}

// loop over arguments to load ODF
var i;
for (i = 1; i < arguments.length; i += 1) {
    roundTripZip(arguments[i]);
}
