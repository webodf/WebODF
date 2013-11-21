/**
 * @license
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
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

/*global Node, core, odf, runtime, xmldom*/

runtime.loadClass("odf.Namespaces");
runtime.loadClass("core.DomUtils");

/**
 * The MetadataManager class allows easy access to 
 * metadata fields.
 * It stores a cache of metadata fields
 * inside itself. When metadata is set through setMetadata,
 * both this cache and the DOM are updated.
 * When accessing using getMetadata, reading is quick because
 * it does not touch the DOM.
 * @constructor
 */
odf.MetadataManager = function MetadataManager(metaElement) {
    "use strict";
    var domUtils = new core.DomUtils(), 
        metadata = {};

    /**
     * Sets the metadata fields from the given
     * properties map.
     * @param {?Object.<!string, !string>} setProperties A flat object that is a string->string map of field name -> value.
     * @param {?Array.<!string>} removedProperties An array of metadata field names (prefixed).
     * @return {undefined}
     */
    function setMetadata(setProperties, removedProperties) {
        if (setProperties) {
            Object.keys(setProperties).forEach(function (key) {
                metadata[key] = setProperties[key];
            });
            domUtils.mapKeyValObjOntoNode(metaElement, setProperties, odf.Namespaces.resolvePrefix);
        }
        if (removedProperties) {
            removedProperties.forEach(function (name) {
                delete metadata[name];
            });
            domUtils.removeKeyElementsFromNode(metaElement, removedProperties, odf.Namespaces.resolvePrefix);
        }
    }
    this.setMetadata = setMetadata;

    /**
     * Increment the number of times the document
     * has been edited.
     * @return {undefined}
     */
    this.incrementEditingCycles = function () {
        var cycles = parseInt(metadata["meta:editing-cycles"] || 0, 10) + 1;
        setMetadata({"meta:editing-cycles": cycles}, null);
    };

    function init() {
        metadata = domUtils.getKeyValRepresentationOfNode(metaElement, odf.Namespaces.lookupPrefix);
    }
    init();
};
