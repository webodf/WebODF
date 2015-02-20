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

/*global runtime, core, odf*/

/**
 * @constructor
 */
odf.CommandLineTools = function CommandLineTools() {
    "use strict";
    /**
     * @param {!string} inputfilepath
     * @param {!string} outputfilepath
     * @param {!function(string=):undefined} callback
     * @return {!odf.OdfContainer}
     */
    this.roundTrip = function (inputfilepath, outputfilepath, callback) {
        function onready(odfcontainer) {
            if (odfcontainer.state === odf.OdfContainer.INVALID) {
                return callback("Document " + inputfilepath + " is invalid.");
            }
            if (odfcontainer.state === odf.OdfContainer.DONE) {
                odfcontainer.saveAs(outputfilepath, function (err) {
                    callback(err);
                });
            } else {
                callback("Document was not completely loaded.");
            }
        }
        var odfcontainer = new odf.OdfContainer(inputfilepath, onready);
        return odfcontainer;
    };
    /**
     * @param {!string} inputfilepath
     * @param {!Document} document
     * @param {!function(*):undefined} callback
     * @return {undefined}
     */
    this.render = function (inputfilepath, document, callback) {
        var body = document.getElementsByTagName("body")[0],
            odfcanvas;
        core.DomUtils.removeAllChildNodes(body);
        odfcanvas = new odf.OdfCanvas(body);
        odfcanvas.addListener("statereadychange", function (err) {
            callback(err);
        });
        odfcanvas.load(inputfilepath);
    };
};
