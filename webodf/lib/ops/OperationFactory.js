/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>

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

/*global runtime, ops */

/*
 * create specific operation instances.
 */

runtime.loadClass("ops.OpAddCursor");
runtime.loadClass("ops.OpRemoveCursor");
runtime.loadClass("ops.OpMoveCursor");
runtime.loadClass("ops.OpInsertText");
runtime.loadClass("ops.OpRemoveText");
runtime.loadClass("ops.OpSplitParagraph");
runtime.loadClass("ops.OpSetParagraphStyle");
runtime.loadClass("ops.OpUpdateParagraphStyle");
runtime.loadClass("ops.OpCloneStyle");
runtime.loadClass("ops.OpDeleteStyle");

/**
 * @constructor
 */
ops.OperationFactory = function OperationFactory(session) {
    "use strict";

    var self = this;

    this.create = function (spec) {
        var op = null;
        // TODO: of course the following code can use some better
        // js language and make it more generic.
        if (spec.optype === "AddCursor") {
            op = new ops.OpAddCursor(session);
        } else if (spec.optype === "InsertText") {
            op = new ops.OpInsertText(session);
        } else if (spec.optype === "RemoveText") {
            op = new ops.OpRemoveText(session);
        } else if (spec.optype === "SplitParagraph") {
            op = new ops.OpSplitParagraph(session);
        } else if (spec.optype === "SetParagraphStyle") {
            op = new ops.OpSetParagraphStyle(session);
        } else if (spec.optype === "UpdateParagraphStyle") {
            op = new ops.OpUpdateParagraphStyle(session);
        } else if (spec.optype === "CloneStyle") {
            op = new ops.OpCloneStyle(session);
        } else if (spec.optype === "DeleteStyle") {
            op = new ops.OpDeleteStyle(session);
        } else if (spec.optype === "MoveCursor") {
            op = new ops.OpMoveCursor(session);
        } else if (spec.optype === "RemoveCursor") {
            op = new ops.OpRemoveCursor(session);
        }
        if (op) {
            op.init(spec);
        }
        return op;
    };
};
