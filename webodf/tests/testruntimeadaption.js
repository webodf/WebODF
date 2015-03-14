/**
 * Copyright (C) 2012-2015 KO GmbH <copyright@kogmbh.com>
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

/*global window, runtime*/

runtime.libraryPaths = (function () {
    "use strict";

    return function () {
        return ["../lib", "."];
    };
}());

runtime.log = (function () {
    "use strict";

    var normalLog = runtime.log,
        logoutput = window.document.getElementById("logoutput");

    return function (msgOrCategory, msg) {
        var node, doc, category;

        // do normal log first
        normalLog(msgOrCategory, msg);

        // now output also 
        if (msg !== undefined) {
            category = msgOrCategory;
        } else {
            msg = msgOrCategory;
        }

        doc = logoutput.ownerDocument;
        if (category) {
            node = doc.createElement("span");
            node.className = category;
            node.appendChild(doc.createTextNode(category));
            logoutput.appendChild(node);
            logoutput.appendChild(doc.createTextNode(" "));
        }
        node = doc.createElement("span");
        if (msg.length > 0 && msg[0] === "<") {
            node.innerHTML = msg;
        } else {
            node.appendChild(doc.createTextNode(msg));
        }
        logoutput.appendChild(node);
        logoutput.appendChild(doc.createElement("br"));
    };
}());
