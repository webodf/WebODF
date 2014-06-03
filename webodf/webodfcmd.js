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

/*global document, runtime, core, odf*/

runtime.loadClass("odf.CommandLineTools");

function main(args) {
    "use strict";
    var tools = new odf.CommandLineTools();
    function errHandler(err) {
        if (err) {
            runtime.log(err);
            runtime.exit(1);
        }
    }
    if (args.length === 4 && args[1] === "-roundtrip") {
        tools.roundTrip(args["2"], args["3"], errHandler);
    } else if (args.length === 3 && args[1] === "-render") {
        tools.render(args["2"], document, errHandler);
    } else {
        runtime.log("Usage:");
    }
}
main(arguments);
