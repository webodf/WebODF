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

/*global runtime*/

function main(args) {
    "use strict";
    function loadCSS(pos, text) {
        var data;
        if (pos === args.length - 1) {
            text = runtime.byteArrayFromString(text, "utf8");
            runtime.writeFile(args[pos], text, function (err) {
                if (err) {
                    runtime.log(err);
                }
            });
        } else {
            data = runtime.readFileSync(args[pos], "utf8");
            data = data.replace(/\/\*([\r\n]|.)*?\*\//g, ""); // remove comments (no /* & */ expected with normal CSS)
            data = data.replace(/(^\s*)|(\s*$)/gm, ""); // remove leading & trailing whitespace
            data = data.replace(/\r{0,1}\n/g, ""); // remove line breaks
            data = data.replace(/\\/g, "\\\\"); // escape escape char
            data = data.replace(/'/g, "\\\'"); // escape single-quotes
            text += "var " + args[pos].replace(".", "_") + " = '" +
                        data + "';\n";
            loadCSS(pos + 1, text);
        }
    }
    if (args.length < 3) {
        runtime.log("Usage: css2js.js <cssfiles> <jsfile>");
        return runtime.exit(1);
    }
    var jsfile = args[args.length - 1];
    loadCSS(1, "");
}

main(arguments);
