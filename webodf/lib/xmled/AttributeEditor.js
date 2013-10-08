/**
 * @license
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
 *
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

/*global runtime, xmled */

/**
 * @constructor
 * @param {!Element} element element to put the editor in
 * @return {?}
 **/
xmled.AttributeEditor = function AttributeEditor(element) {
    "use strict";
    var doc = element.ownerDocument,
        htmlns = element.namespaceURI;
    /**
     * @param {!function(!Object=)} callback, passing an error object in case of
     *                              error
     * @return {undefined}
     */
    this.destroy = function (callback) {
        callback();
    };
    function clear() {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
    function createAttributeToggle() {
        var toggle = doc.createElementNS(htmlns, "input");
        toggle.setAttribute("type", "checkbox");
        return toggle;
    }
    function createComboBox(type) {
        var txt = doc.createElementNS(htmlns, "select"),
            value,
            i,
            option;
        for (i = 0; i < type.values.length; i += 1) {
            value = type.values[i];
            option = doc.createElementNS(htmlns, "option");
            option.setAttribute("value", value);
            option.appendChild(doc.createTextNode(value));
            txt.appendChild(option);
        }
        return txt;
    }
    function createAttributeEditor(att, target) {
        var span = doc.createElementNS(htmlns, "span"),
            field,
            toggle = createAttributeToggle();
        span.style.whiteSpace = "nowrap";
        if (att.type && att.type.name === "enumeration") {
            field = createComboBox(att.type);
        } else {
            field = doc.createElementNS(htmlns, "input");
        }
        toggle.checked = target.hasAttribute(att.localName);
        field.disabled = !toggle.checked;
        toggle.onchange = field.onchange = function () {
            var has = target.hasAttribute(att.localName);
            field.disabled = !toggle.checked;
            if (has && !toggle.checked) {
                target.removeAttribute(att.localName);
            } else if (toggle.checked) {
                target.setAttribute(att.localName, field.value);
            }
        };
        span.appendChild(toggle);
        span.appendChild(field);
        field.value = att.value;
        return span;
    }
    /**
     * @param {!Array} attributesDefinitions
     * @param {!Element} target
     */
    this.setAttributeDefinitions = function (attributesDefinitions, target) {
        clear();
        var i, e, a, att, j, table, tr, td, t = target;
        for (i = 0; i < attributesDefinitions.length; i += 1) {
            e = doc.createElementNS(htmlns, "b");
            e.appendChild(doc.createTextNode(attributesDefinitions[i].name));
            element.appendChild(e);
            a = attributesDefinitions[i];
            table = doc.createElementNS(htmlns, "table");
            element.appendChild(table);
            for (j = 0; j < a.atts.length; j += 1) {
                att = a.atts[j];
                tr = doc.createElementNS(htmlns, "tr");
                td = doc.createElementNS(htmlns, "td");
                td.appendChild(doc.createTextNode(att.localName));
                tr.appendChild(td);
                td = doc.createElementNS(htmlns, "td");
                td.appendChild(createAttributeEditor(att, t));
                tr.appendChild(td);
                if (att.localName) {
                    table.appendChild(tr);
                }
            }
            t = t.parentNode;
        }
    };
};
