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
(function () {
    "use strict";
    return [
        "core/Async.js",
        "core/Base64.js",
        "core/ByteArray.js",
        "core/ByteArrayWriter.js",
        "core/Cursor.js",
        "core/CSSUnits.js",
        "core/EditInfo.js",
        "core/JSLint.js",
        "core/PositionFilter.js",
        "core/LoopWatchDog.js",
        "core/PositionIterator.js",
        "core/RawDeflate.js",
        "core/RawInflate.js",
        "core/Selection.js",
        "core/UnitTester.js",
        "core/Zip.js",
        "gui/Avatar.js",
        "gui/Caret.js",
        "gui/PresenterUI.js",
        "gui/SessionController.js",
        "gui/CaretFactory.js",
        "gui/EditInfoHandle.js",
        "gui/EditInfoMarker.js",
        "gui/SessionView.js",
        "gui/SelectionManager.js",
        "gui/SelectionMover.js",
        "gui/XMLEdit.js",
        "odf/CommandLineTools.js",
        "odf/FontLoader.js",
        "odf/Formatting.js",
        "odf/OdfCanvas.js",
        "odf/OdfContainer.js",
        "odf/Style2CSS.js",
        "odf/StyleInfo.js",
        "ops/UserModel.js",
        "ops/TrivialUserModel.js",
        "ops/NowjsUserModel.js",
        "ops/Operation.js",
        "ops/TrivialOperationRouter.js",
        "ops/NowjsOperationRouter.js",
        "ops/OdtCursor.js",
        "ops/OdtDocument.js",
        "ops/Session.js",
        "ops/SessionImplementation.js",
        "ops/SessionNodeFilter.js",
        "ops/OpAddCursor.js",
        "ops/OpRemoveCursor.js",
        "ops/OpMoveCursor.js",
        "ops/OpInsertText.js",
        "ops/OpRemoveText.js",
        "ops/OpSplitParagraph.js",
        "ops/OpSetParagraphStyle.js",
        "ops/OpUpdateParagraphStyle.js",
        "ops/OpCloneStyle.js",
        "ops/OpDeleteStyle.js",
        "ops/OperationFactory.js",
        "xmldom/LSSerializer.js",
        "xmldom/LSSerializerFilter.js",
        "xmldom/OperationalTransformDOM.js",
        "xmldom/OperationalTransformInterface.js",
        "xmldom/RelaxNG.js",
        "xmldom/RelaxNG2.js",
        "xmldom/RelaxNGParser.js",
        "xmldom/XPath.js"
    ];
}());
