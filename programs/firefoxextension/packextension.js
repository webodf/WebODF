/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
 *
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
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
        fs.writeFile(target, data, {encoding: "binary"}, function (err) {
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
