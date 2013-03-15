/**
 * Copyright (C) 2012 KO GmbH <aditya.bhattkogmbh.com>
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
/*global core, gui, runtime, window*/

runtime.loadClass("core.EditInfo");
runtime.loadClass("gui.EditInfoHandle");

/**
 * @constructor
 */
gui.EditInfoMarker = function EditInfoMarker(editInfo) {
    "use strict";

    var self = this,
        editInfoNode,
        handle,
        marker,
        editinfons = 'urn:webodf:names:editinfo',
        decay1,
        decay2,
        decayTimeStep = 5000;

    /**
     * Runs and returns a timer that sets the marker's opacity
     * to the specified value after the specified delay.
     * @param {!number} opacity
     * @param {!number} delay
     * @return {!Object}
     */
    function applyDecay(opacity, delay) {
        return window.setTimeout(function () {
            marker.style.opacity = opacity;
        }, delay);
    }

    /**
     * Stops the specified timer
     * @param {Object} timer
     */
    function deleteDecay(timer) {
        window.clearTimeout(timer);
    }

    function setLastAuthor(memberid) {
        marker.setAttributeNS(editinfons, 'editinfo:memberid', memberid);
    }

    this.addEdit = function (memberid, timestamp) {
        var age = (Date.now() - timestamp);

        editInfo.addEdit(memberid, timestamp);
        handle.setEdits(editInfo.getSortedEdits());
        setLastAuthor(memberid);

        // Since a new edit has arrived, stop decaying for the old edits
        if (decay1) {
            deleteDecay(decay1);
        }
        if (decay2) {
            deleteDecay(decay2);
        }

        // Decide the decay path:
        // this decides the initial opacity and subsequent decays to apply
        // depending on the age of the edit (for example the edit might have arrived
        // here a long time after it was already processed by the server. We don't want
        // an opaque marker in that case, we would want it to start with a lower opacity
        // and decay accordingly further, if possible.
        if (age < decayTimeStep) {
            applyDecay(1, 0);
            decay1 = applyDecay(0.5, decayTimeStep - age);
            decay2 = applyDecay(0.2, decayTimeStep * 2 - age);
        } else if (age >= decayTimeStep && age < decayTimeStep * 2) {
            applyDecay(0.5, 0);
            decay2 = applyDecay(0.2, decayTimeStep - age);
        } else {
            applyDecay(0.2, 0);
        }
    };
    this.getEdits = function () {
        return editInfo.getEdits();
    };
    this.clearEdits = function () {
        editInfo.clearEdits();
        handle.setEdits([]);
        if (marker.hasAttributeNS(editinfons, 'editinfo:memberid')) {
            marker.removeAttributeNS(editinfons, 'editinfo:memberid');
        }
    };
    this.getEditInfo = function () {
        return editInfo;
    };

    this.showHandle = function () {
        handle.show();
    };
    this.hideHandle = function () {
        handle.hide();
    };

    function init() {
        var dom = editInfo.getOdtDocument().getDOM(),
            htmlns = dom.documentElement.namespaceURI;

        marker = dom.createElementNS(htmlns, "div");
        marker.setAttribute("class", "editInfoMarker");
        
        marker.onmouseover = function () {
            self.showHandle();
        };
        marker.onmouseout = function () {
            self.hideHandle();
        };

        editInfoNode = editInfo.getNode();
        editInfoNode.appendChild(marker);
        handle = new gui.EditInfoHandle(editInfoNode);
    }

    init();
};
