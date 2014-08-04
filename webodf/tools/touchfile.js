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

/*global require, process*/

(function() {
    "use strict";

    var fs = require("fs"),
        filePath;

    if (process.argv.length !== 3) {
        process.stderr.write('Usage: touchfile.js file\n');
        process.exit(1);
    }

    function reportErrorAndQuit(err) {
        process.stderr.write('Error on touching file "' + filePath + '": '+err.message+'\n');
        process.exit(1);
    }
 
    filePath = process.argv[2];
    fs.open(filePath, 'a', function(err, fd) {
        var nowTime = Date.now() / 1000; // in secs

        if (err) {
            reportErrorAndQuit(err);
        }
        fs.futimes(fd, nowTime, nowTime, function(err) {
            if (err) {
                reportErrorAndQuit(err);
            }
            fs.close(fd, function(err) {
                if (err) {
                    reportErrorAndQuit(err);
                }
            });
        });
    });
}());
