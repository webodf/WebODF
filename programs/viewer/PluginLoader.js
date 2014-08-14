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

/*global document, window, Viewer, ODFViewerPlugin*/

var viewer;

function loadPlugin(pluginName, callback) {
    "use strict";
    var script, style;

    // Load script
    script = document.createElement('script');
    script.async = false;
    script.onload = callback;
    script.src = pluginName + '.js';
    script.type = 'text/javascript';
    document.getElementsByTagName('head')[0].appendChild(script);
}

function loadDocument(documentUrl) {
    "use strict";

    var Plugin;

    if (documentUrl) {
        var extension = documentUrl.split('.').pop();

        switch (extension) {
        case 'odt':
        case 'fodt':
        case 'ott':
        case 'odp':
        case 'fodp':
        case 'otp':
        case 'ods':
        case 'fods':
        case 'ots':
            loadPlugin('./ODFViewerPlugin', function () {
                Plugin = ODFViewerPlugin;
            });
            break;
        }
    }

    window.onload = function () {
        if (Plugin) {
            viewer = new Viewer(new Plugin());
        } else {
            viewer = new Viewer();
        }
    };
}
