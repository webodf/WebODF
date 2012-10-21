/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
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
 * @source: http://gitorious.org/webodf/webodf/
 */
/*global runtime, ops*/

runtime.loadClass("ops.Session");

function compareSessionOperationWithDefinition(operation, definition) {
    "use strict";
    var args = operation.toString().match(/function\s+\w*\s*\((.*?)\)/)[1]
                      .split(/\s*,\s*/),
        o,
        i,
        hasErrors = false;
    for (i = 0; i < definition.args.length; i += 1) {
        if (args.length <= i
                || args[i] !== definition.args[i].name) {
            hasErrors = true;
            runtime.log("Argument at position " + i + " of operation "
                + definition.name + " is not " + definition.args[i].name);
        }
    }
    for (i = definition.args.length; i < args.length; i += 1) {
        hasErrors = true;
        runtime.log("Argument at position " + i + " of operation "
            + definition.name + " is not supposed to be there.");
    }
    return hasErrors;
}

function checkOperationsOnSession(session, operations) {
    "use strict";
    var i, operation, hasErrors = false;
    for (i = 0; i < operations.length; i += 1) {
        operation = operations[i];
        if (session.hasOwnProperty(operation.name)) {
            hasErrors |= compareSessionOperationWithDefinition(
                session[operation.name],
                operation
            );
        } else {
            runtime.log("operation " + operation.name + " is missing.");
            hasErrors = true;
        }
            
    }
    return hasErrors;
}

function parseOperation(element) {
    "use strict";
    var name = element.getAttribute("name"),
        args = [],
        c = element.firstChild;
    while (c) {
        if (c.nodeType === 1) {
            if (c.localName === "argument") {
                args.push({
                    name: c.getAttribute("name"),
                    type: c.getAttribute("type")
                });
            }
        }
        c = c.nextSibling;
    }
    return {
        name: name,
        args: args
    };
}

function parseOperations(dom) {
    "use strict";
    var e = dom.documentElement.firstChild,
        operations = [];
    while (e) {
        if (e.nodeType === 1) {
            if (e.localName === "operation") {
                operations.push(parseOperation(e));
            } else {
                runtime.log("Unknown element " + e.localName);
            }
        }
        e = e.nextSibling;
    }
    return operations;
}

function main(args) {
    "use strict";
    if (args.length !== 1) {
        runtime.log("Usage: checkCollaborationObject.js");
        return runtime.exit(1);
    }
    runtime.loadXML("../collaborate.xml", function (err, dom) {
        if (err) {
            return runtime.log(err);
        }
        var operations = parseOperations(dom),
            session = new ops.Session(),
            foundErrors;
        foundErrors = checkOperationsOnSession(session, operations);
        if (foundErrors) {
            runtime.log("Errors were found.");
        }
    });
}

main(arguments);
