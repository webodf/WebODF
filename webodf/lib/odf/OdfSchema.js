/**
 * Copyright (C) 2010-2014 KO GmbH <copyright@kogmbh.com>
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

/*global odf, runtime*/

(function() {
    "use strict";

    /**
     * A collection of query interfaces to determine attributes about a node such as whether it
     * can contain text content, or is a field. This should be accessed via the singleton
     * instance "odf.OdfSchema".
     *
     * @constructor
     */
    odf.OdfSchemaImpl = function () {
        var TEXT = "text", // Editable & selectable text
            FIELD = "field", // Non-editable or selectable text
            OBJECT = "object", // Non-text object
            STYLE = "style", // Used only within document style definitions
            DEPRECATED = "deprecated", // Deprecated entity
            UNKNOWN = "uncategorized", // Uncategorized element
            // Basic list of containers originally created using tools/odfRng2Config.js
            // List has been hand-updated however, and should not simply be discarded!
            /**@type{!Array.<!Array.<!string, !string>>}*/
            containers = [
                ["config:config-item"                    , UNKNOWN],
                ["form:item"                             , OBJECT],
                ["form:option"                           , UNKNOWN],
                ["math:math"                             , FIELD],
                ["meta:user-defined"                     , UNKNOWN],
                ["number:currency-symbol"                , UNKNOWN],
                ["number:embedded-text"                  , UNKNOWN],
                ["number:text"                           , UNKNOWN],
                ["presentation:date-time-decl"           , UNKNOWN],
                ["presentation:footer-decl"              , UNKNOWN],
                ["presentation:header-decl"              , UNKNOWN],
                ["svg:desc"                              , TEXT],
                ["svg:title"                             , TEXT],
                ["table:desc"                            , UNKNOWN],
                ["table:title"                           , UNKNOWN],
                ["text:a"                                , TEXT],
                ["text:author-initials"                  , FIELD],
                ["text:author-name"                      , FIELD],
                ["text:bibliography-mark"                , FIELD],
                ["text:bookmark-ref"                     , FIELD],
                ["text:chapter"                          , FIELD],
                ["text:character-count"                  , FIELD],
                ["text:conditional-text"                 , FIELD],
                ["text:creation-date"                    , FIELD],
                ["text:creation-time"                    , FIELD],
                ["text:creator"                          , FIELD],
                ["text:database-display"                 , FIELD],
                ["text:database-name"                    , FIELD],
                ["text:database-row-number"              , FIELD],
                ["text:date"                             , FIELD],
                ["text:dde-connection"                   , FIELD],
                ["text:description"                      , FIELD],
                ["text:editing-cycles"                   , FIELD],
                ["text:editing-duration"                 , FIELD],
                ["text:execute-macro"                    , UNKNOWN],
                ["text:expression"                       , UNKNOWN],
                ["text:file-name"                        , FIELD],
                ["text:h"                                , TEXT],
                ["text:hidden-paragraph"                 , TEXT],
                ["text:hidden-text"                      , TEXT],
                ["text:image-count"                      , FIELD],
                ["text:index-entry-span"                 , UNKNOWN],
                ["text:index-title-template"             , UNKNOWN],
                ["text:initial-creator"                  , FIELD],
                ["text:keywords"                         , FIELD],
                ["text:linenumbering-separator"          , STYLE],
                ["text:measure"                          , UNKNOWN],
                ["text:meta"                             , UNKNOWN],
                ["text:meta-field"                       , UNKNOWN],
                ["text:modification-date"                , FIELD],
                ["text:modification-time"                , FIELD],
                ["text:note-citation"                    , FIELD],
                ["text:note-continuation-notice-backward", STYLE],
                ["text:note-continuation-notice-forward" , STYLE],
                ["text:note-ref"                         , FIELD],
                ["text:object-count"                     , FIELD],
                ["text:p"                                , TEXT],
                ["text:page-continuation"                , UNKNOWN],
                ["text:page-count"                       , FIELD],
                ["text:page-number"                      , FIELD],
                ["text:page-variable-get"                , FIELD],
                ["text:page-variable-set"                , FIELD],
                ["text:paragraph-count"                  , FIELD],
                ["text:placeholder"                      , FIELD],
                ["text:print-date"                       , FIELD],
                ["text:print-time"                       , FIELD],
                ["text:printed-by"                       , FIELD],
                ["text:reference-ref"                    , FIELD],
                ["text:ruby-base"                        , TEXT],
                ["text:ruby-text"                        , TEXT],
                ["text:script"                           , TEXT],
                ["text:sender-city"                      , FIELD],
                ["text:sender-company"                   , FIELD],
                ["text:sender-country"                   , FIELD],
                ["text:sender-email"                     , FIELD],
                ["text:sender-fax"                       , FIELD],
                ["text:sender-firstname"                 , FIELD],
                ["text:sender-initials"                  , FIELD],
                ["text:sender-lastname"                  , FIELD],
                ["text:sender-phone-private"             , FIELD],
                ["text:sender-phone-work"                , FIELD],
                ["text:sender-position"                  , FIELD],
                ["text:sender-postal-code"               , FIELD],
                ["text:sender-state-or-province"         , FIELD],
                ["text:sender-street"                    , FIELD],
                ["text:sender-title"                     , FIELD],
                ["text:sequence"                         , UNKNOWN],
                ["text:sequence-ref"                     , UNKNOWN],
                ["text:sheet-name"                       , UNKNOWN],
                ["text:span"                             , TEXT],
                ["text:subject"                          , FIELD],
                ["text:table-count"                      , FIELD],
                ["text:table-formula"                    , DEPRECATED],
                ["text:template-name"                    , UNKNOWN],
                ["text:text-input"                       , FIELD],
                ["text:time"                             , FIELD],
                ["text:title"                            , FIELD],
                ["text:user-defined"                     , FIELD],
                ["text:user-field-get"                   , FIELD],
                ["text:user-field-input"                 , FIELD],
                ["text:variable-get"                     , FIELD],
                ["text:variable-input"                   , FIELD],
                ["text:variable-set"                     , FIELD],
                ["text:word-count"                       , FIELD],
                ["xforms:model"                          , UNKNOWN]
            ],
            cache = {};

        /**
         * Returns true if the supplied namespace + localName can contain selectable/editable text
         * content.
         *
         * @param {!string} namespaceURI
         * @param {!string} localName
         * @return {!boolean}
         */
        this.isTextContainer = function (namespaceURI, localName) {
            return cache[namespaceURI + ":" + localName] === TEXT;
        };

        /**
         * Returns true if the supplied namespace + localName is an ODT field.
         *
         * @param {!string} namespaceURI
         * @param {!string} localName
         * @return {!boolean}
         */
        this.isField = function (namespaceURI, localName) {
            return cache[namespaceURI + ":" + localName] === FIELD;
        };

        /**
         * Return a list of all known ODF fields. These are prefixed with the standard prefixes.
         * E.g., ["text:author-name"]
         *
         * @return {!Array.<!string>}
         */
        this.getFields = function() {
            return containers.filter(function(containerInfo) { return containerInfo[1] === FIELD; })
                .map(function(containerInfo) { return containerInfo[0]; });
        };

        function init() {
            containers.forEach(function(containerInfo) {
                var name = containerInfo[0],
                    type = containerInfo[1],
                    nameParts = name.split(":"),
                    prefix = nameParts[0],
                    localName = nameParts[1],
                    namespaceURI = odf.Namespaces.lookupNamespaceURI(prefix);

                if (namespaceURI) {
                    cache[namespaceURI + ":" + localName] = type;
                } else {
                    runtime.log("DEBUG: OdfSchema - unknown prefix '" + prefix + "'");
                }
            });
        }
        init();
    };

    /**
     * @type {!odf.OdfSchemaImpl}
     */
    odf.OdfSchema = new odf.OdfSchemaImpl();
}());

