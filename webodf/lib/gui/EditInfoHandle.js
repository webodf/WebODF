/**
 * Copyright (C) 2012 KO GmbH <aditya.bhatt@kogmbh.com>
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
/*global gui*/
/**
 * @constructor
 */
gui.EditInfoHandle = function EditInfoHandle(parentElement) {
    "use strict";

    var edits = [],
        handle,
        document = /**@type{!Document}*/(parentElement.ownerDocument),
        htmlns = document.documentElement.namespaceURI,
        editinfons = 'urn:webodf:names:editinfo';
    
    function renderEdits() {
        var i, infoDiv, colorSpan, authorSpan, timeSpan;
        handle.innerHTML = '';
        for (i = 0; i < edits.length; i += 1) {
            infoDiv = document.createElementNS(htmlns, 'div');
            infoDiv.className = "editInfo";

            colorSpan = document.createElementNS(htmlns, 'span');
            colorSpan.className = "editInfoColor";
            colorSpan.setAttributeNS(editinfons, 'editinfo:memberid', edits[i].memberid);

            authorSpan = document.createElementNS(htmlns, 'span');
            authorSpan.className = "editInfoAuthor";
            authorSpan.setAttributeNS(editinfons, 'editinfo:memberid', edits[i].memberid);

            timeSpan = document.createElementNS(htmlns, 'span');
            timeSpan.className = "editInfoTime";
            timeSpan.setAttributeNS(editinfons, 'editinfo:memberid', edits[i].memberid);
            timeSpan.innerHTML = edits[i].time;

            infoDiv.appendChild(colorSpan);
            infoDiv.appendChild(authorSpan);
            infoDiv.appendChild(timeSpan);
            handle.appendChild(infoDiv);
        }
    }

    this.setEdits = function (editArray) {
        edits = editArray;
        renderEdits();
    };

    this.show = function () {
        handle.style.display = 'block';
    };

    this.hide = function () {
        handle.style.display = 'none';
    };

    function init() {
        handle = document.createElementNS(htmlns, "div");
        handle.setAttribute('class', 'editInfoHandle');
        
        handle.style.display = 'none';
        parentElement.appendChild(handle);
    }

    init();
};
