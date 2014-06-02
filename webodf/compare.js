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

/*global runtime, odf*/

/*jslint white: false*/

function getURIParameters(window) {
    "use strict";
    var params = {},
        query = window.location.search.substring(1),
        parms = query.split('&'),
        i,
        pos,
        key,
        val;
    for (i = 0; i < parms.length; i += 1) {
        pos = parms[i].indexOf('=');
        if (pos > 0) {
            key = parms[i].substring(0, pos);
            val = parms[i].substring(pos + 1);
            params[key] = val;
        }
    }
    return params;
}
function init(window, document) {
    "use strict";
    runtime.loadClass("odf.OdfCanvas");
    var params = getURIParameters(window),
        odfelement = document.getElementById("odf"),
        odfcanvas = new odf.OdfCanvas(odfelement);
    if (!params.odf) {
        return;
    }
    odfcanvas.addListener("statereadychange", function () {
        var s = odfelement.style,
            bgzoom = "100% auto",
            pos;
        s.backgroundImage = "url(" + params.bg + ")";
        s.backgroundRepeat = "no-repeat";
        if (params.bgzoom) {
            bgzoom = params.bgzoom + "% auto";
        }
        s.backgroundSize = bgzoom;
        pos = (params.x || "0") + "px " + (params.y || "0") + "px";
        s.backgroundPosition = pos;
    });
    odfcanvas.load(params.odf);
}
