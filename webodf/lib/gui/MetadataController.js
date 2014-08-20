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

/*global gui, runtime, core, ops, odf*/

/**
 * @constructor
 * @implements {core.Destroyable}
 * @param {!ops.Session} session
 * @param {!string} inputMemberId
 */
gui.MetadataController = function MetadataController(session, inputMemberId) {
    "use strict";

    var odtDocument = session.getOdtDocument(),
        eventNotifier = new core.EventNotifier([gui.MetadataController.signalMetadataChanged]),
        /** @const @type {!Array.<!string>} */
        readonlyProperties = [
            "dc:creator",
            "dc:date",
            "meta:editing-cycles",
            "meta:editing-duration",
            "meta:document-statistic"
        ];

    /**
     * @param {!Object} changes
     * @return {undefined}
     */
    function onMetadataUpdated(changes) {
        eventNotifier.emit(gui.MetadataController.signalMetadataChanged, changes);
    }

    /**
     * @param {!string} property
     * @return {!boolean}
     */
    function isWriteableMetadata(property) {
        var isWriteable = (readonlyProperties.indexOf(property) === -1);
        if (! isWriteable) {
            runtime.log("Setting " + property + " is restricted.");
        }
        return isWriteable;
    }

    /**
     * Sets the metadata fields from the given properties map.
     * Avoid setting certain fields since they are automatically set:
     *     dc:creator
     *     dc:date
     *     meta:editing-cycles
     * If you do wish to externally set these fields, try getting
     * the master session to inject operations into the timeline
     * with the relevant properties.
     *
     * The following properties are never used and will be removed for semantic
     * consistency from the document:
     *     meta:editing-duration
     *     meta:document-statistic
     *
     * Setting any of the above mentioned fields using this method will have no effect.
     *
     * @param {?Object.<!string, !string>} setProperties A flat object that is a string->string map of field name -> value.
     * @param {?Array.<!string>|undefined=} removedProperties An array of metadata field names (prefixed).
     * @return {undefined}
     */
    this.setMetadata = function (setProperties, removedProperties) {
        var /** @type {!Object.<!string,!string>} */
            filteredSetProperties = {},
            /** @type {!string} */
            filteredRemovedProperties = "",
            op;

        if (setProperties) {
            Object.keys(setProperties).filter(isWriteableMetadata).forEach(function (property) {
                filteredSetProperties[property] = setProperties[property];
            });
        }
        if (removedProperties) {
            filteredRemovedProperties = removedProperties.filter(isWriteableMetadata).join(",");
        }

        if (filteredRemovedProperties.length > 0
                || Object.keys(filteredSetProperties).length > 0) {
            op = new ops.OpUpdateMetadata();
            op.init({
                memberid: inputMemberId,
                setProperties: filteredSetProperties,
                removedProperties: filteredRemovedProperties.length > 0 ? { attributes: filteredRemovedProperties } : null
            });
            session.enqueue([op]);
        }
    };

    /**
     * Returns the value of the requested document metadata field
     * @param {!string} property A namespace-prefixed field name, for example
     * dc:creator
     * @return {?string}
     */
    this.getMetadata = function (property) {
        var namespaceUri, parts;

        runtime.assert(typeof property === "string", "Property must be a string");
        parts = property.split(':');
        runtime.assert(parts.length === 2, "Property must be a namespace-prefixed string");
        namespaceUri = odf.Namespaces.lookupNamespaceURI(parts[0]);
        // TODO: support other namespaces
        runtime.assert(Boolean(namespaceUri), "Prefix must be for an ODF namespace.");
        return odtDocument.getOdfCanvas().odfContainer().getMetadata(/**@type{!string}*/(namespaceUri), parts[1]);
    };

    /**
     * @param {!string} eventid
     * @param {!Function} cb
     * @return {undefined}
     */
    this.subscribe = function (eventid, cb) {
        eventNotifier.subscribe(eventid, cb);
    };

    /**
     * @param {!string} eventid
     * @param {!Function} cb
     * @return {undefined}
     */
    this.unsubscribe = function (eventid, cb) {
        eventNotifier.unsubscribe(eventid, cb);
    };

    /**
     * @param {!function(!Error=):undefined} callback, passing an error object in case of error
     * @return {undefined}
     */
    this.destroy = function(callback) {
        odtDocument.unsubscribe(ops.OdtDocument.signalMetadataUpdated, onMetadataUpdated);
        callback();
    };

    function init() {
        odtDocument.subscribe(ops.OdtDocument.signalMetadataUpdated, onMetadataUpdated);
    }

    init();
};

/**@const*/gui.MetadataController.signalMetadataChanged = "metadata/changed";
