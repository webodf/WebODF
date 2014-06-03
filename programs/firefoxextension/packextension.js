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

/*global require, runtime, core*/

runtime.loadClass("core.Base64");

function addFiles(dirname, pos, files, callback) {
    "use strict";
    if (pos >= files.length) {
        return;
    }
    var path = require("path"),
        fs = require("fs"),
        filepath = files[pos];
    runtime.readFile(filepath, "binary", function (err, data) {
        var base64,
            target = path.join(dirname, filepath),
            dir = dirname,
            reldir = path.relative(dir, path.dirname(target));
        if (err) {
            return callback(err);
        }
        if (filepath === "content/webodf.js") {
            // replace eval() with evil(), since Firefox does not approve of it
            base64 = new core.Base64();
            data = base64.convertUTF8ArrayToUTF16String(data);
            data = data.replace(new RegExp('eval\\(', 'g'), 'evil(');
            data = runtime.byteArrayFromString(data);
        }
        reldir.split(path.sep).forEach(function (part) {
            dir = path.join(dir, part);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
        });
        fs.writeFile(target, new Buffer(data), {encoding: "binary"}, function (err) {
            if (err) {
                throw err;
            }
            addFiles(dirname, pos + 1, files, callback);
        });
    });
}

var args = arguments,
    dirname = args[1],
    members = [],
    i;
for (i = 2; i < arguments.length; i += 1) {
    members.push(arguments[i]);
}

addFiles(dirname, 0, members, function (err) {
    "use strict";
    if (err) {
        runtime.log(err);
    }
});
