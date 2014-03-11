/**
 * @license
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
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
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global runtime, ops */

/*
 * create specific operation instances.
 */


/**
 * @constructor
 */
ops.OperationFactory = function OperationFactory() {
    "use strict";
    var /**@type{!Object.<!string, !ops.OperationFactory.SpecConstructor>}*/
        specs;

    /**
     * @param {!function(new:ops.Operation)} Constructor
     * @return {!ops.OperationFactory.SpecConstructor}
     */
    /*jslint unparam:true*/
    function construct(Constructor) {
        return function(spec) {
            return new Constructor();
        };
    }
    /*jslint unparam:false*/

    /**
     * Registers an operation constructor with this operation factory
     * @param {!string} specName
     * @param {!ops.OperationFactory.SpecConstructor} specConstructor
     * @return {undefined}
     */
    this.register = function (specName, specConstructor) {
        specs[specName] = specConstructor;
    };

    /**
     * Create an instance of an operation based on the provided spec
     * @param {!{optype:string}} spec
     * @return {ops.Operation}
     */
    this.create = function (spec) {
        var /**@type{ops.Operation}*/
            op = null,
            constructor = specs[spec.optype];
        if (constructor) {
            op = constructor(spec);
            op.init(spec);
        }
        return op;
    };

    function init() {
        specs = {
            AddMember: construct(ops.OpAddMember),
            UpdateMember: construct(ops.OpUpdateMember),
            RemoveMember: construct(ops.OpRemoveMember),
            AddCursor: construct(ops.OpAddCursor),
            ApplyDirectStyling: construct(ops.OpApplyDirectStyling),
            SetBlob: construct(ops.OpSetBlob),
            RemoveBlob: construct(ops.OpRemoveBlob),
            InsertImage: construct(ops.OpInsertImage),
            InsertTable: construct(ops.OpInsertTable),
            InsertText: construct(ops.OpInsertText),
            RemoveText: construct(ops.OpRemoveText),
            SplitParagraph: construct(ops.OpSplitParagraph),
            SetParagraphStyle: construct(ops.OpSetParagraphStyle),
            UpdateParagraphStyle: construct(ops.OpUpdateParagraphStyle),
            AddStyle: construct(ops.OpAddStyle),
            RemoveStyle: construct(ops.OpRemoveStyle),
            MoveCursor: construct(ops.OpMoveCursor),
            RemoveCursor: construct(ops.OpRemoveCursor),
            AddAnnotation: construct(ops.OpAddAnnotation),
            RemoveAnnotation: construct(ops.OpRemoveAnnotation),
            UpdateMetadata: construct(ops.OpUpdateMetadata),
            ApplyHyperlink: construct(ops.OpApplyHyperlink),
            RemoveHyperlink: construct(ops.OpRemoveHyperlink)
        };
    }

    init();
};


/**
 * @typedef {!function(!{optype:!string}):!ops.Operation}
 */
ops.OperationFactory.SpecConstructor;