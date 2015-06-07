/**
 * Copyright (C) 2015 KO GmbH <copyright@kogmbh.com>
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

/*global window*/

(function () {
    "use strict";

    function parseSearchParameters(location) {
        var parameters = {},
            search = location.search || "?";

        search.substr(1).split('&').forEach(function (q) {
            // skip empty strings
            if (!q) {
                return;
            }
            // if there is no '=', have it handled as if given key was set to undefined
            var s = q.split('=', 2);
            parameters[decodeURIComponent(s[0])] = decodeURIComponent(s[1]);
        });

        return parameters;
    }

    function parseBellaConfigFromLocation() {
        var queryParams = parseSearchParameters(window.location);
        return {
            allActions: queryParams["bella.allActions"] !== "false",
            typing: queryParams["bella.typing"] !== "false",
            directTextStyling: queryParams["bella.directTextStyling"] !== "false",
            directParagraphStyling: queryParams["bella.directParagraphStyling"] !== "false",
            annotations: queryParams["bella.annotations"] !== "false",
            undo: queryParams["bella.undo"] !== "false",
            seed: queryParams["bella.seed"] || undefined,
            autoDrive: queryParams["bella.mode"] === "exploration",
            debug: queryParams["bella.debug"] === "true",
            actionTime: parseInt(queryParams["bella.actionTime"], 10) || 50, // Sleep time between actions in ms
            lengthCheck: (queryParams["bella.lengthCheck"] && parseInt(queryParams["bella.lengthCheck"], 10)) || 10
        };
    }

    window.wodo_plugins = [{
        id:"webodf/editor/plugins/bella/BellaControl",
        config: parseBellaConfigFromLocation()
    }];
}());
