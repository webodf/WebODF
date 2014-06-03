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

/*global runtime, xmldom, NodeFilter*/

runtime.loadClass("xmldom.RelaxNG");
runtime.loadClass("xmldom.RelaxNG2");

function validate(relaxng, relaxng2, url) {
    "use strict";
    runtime.loadXML(url, function (err, dom) {
        var walker;
        if (err) {
            runtime.log("Could not read " + url + ": " + err);
        } else {
            walker = dom.createTreeWalker(dom.firstChild, NodeFilter.SHOW_ALL);
            relaxng.validate(walker, function (err) {
                if (err) {
                    var i;
                    runtime.log("Found " + String(err.length) +
                            " error validating " + url + ":");
                    for (i = 0; i < err.length; i += 1) {
                        runtime.log(err[i].message());
                    }
                }
            });
            relaxng2.validate(walker, function (err) {
                if (err) {
                    var i;
                    runtime.log("Found " + String(err.length) +
                            " error validating " + url + ":");
                    for (i = 0; i < err.length; i += 1) {
                        runtime.log(err[i].message());
                    }
                }
            });
        }
    });
}

var args = arguments,
    relaxngurl = args[1];

// load and parse the Relax NG
runtime.loadXML(relaxngurl, function (err, dom) {
    "use strict";
    var parser, i, relaxng, relaxng2;
    if (err) {
        return;
    }
    parser = new xmldom.RelaxNGParser();
    relaxng = new xmldom.RelaxNG();
    relaxng2 = new xmldom.RelaxNG2();
    err = parser.parseRelaxNGDOM(dom, relaxng.makePattern);
    relaxng.init(parser.rootPattern);
    relaxng2.init(parser.start, parser.nsmap);

    // loop over arguments to load ODF
    for (i = 2; i < args.length; i += 1) {
        runtime.log("Validating " + args[i] + " from " + relaxngurl);
        validate(relaxng, relaxng2, args[i]);
    }
});
