/**
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

/*global runtime, xmled */

/**
 * @constructor
 * @param {!Element} element element to put the editor in
 * @return {?}
 **/
xmled.AttributeEditor = function AttributeEditor(element) {
    "use strict";
    var doc = element.ownerDocument,
        htmlns = element.namespaceURI,
        cursorns = "urn:webodf:names:cursor";
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
    /**
     * @return {!HTMLInputElement}
     */
    function createAttributeToggle() {
        var toggle = /**@type{!HTMLInputElement}*/(doc.createElementNS(htmlns, "input"));
        toggle.setAttribute("type", "checkbox");
        return toggle;
    }
    /**
     * @param {!{values:!Array.<string>,name:string}} type
     * @return {!HTMLSelectElement}
     */
    function createComboBox(type) {
        var txt = /**@type{!HTMLSelectElement}*/(doc.createElementNS(htmlns, "select")),
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
    /**
     * param {!{name:string,type:{values:!Array.<string>,name:string}}} att
     * @param {!xmled.AttributeDefinition} att
     * @param {!Element} target
     * @return {!HTMLSpanElement}
     */
    function createAttributeEditor(att, target) {
        var span = /**@type{!HTMLSpanElement}*/(doc.createElementNS(htmlns, "span")),
            /**@type{!HTMLSelectElement|!HTMLInputElement}*/
            field,
            toggle = createAttributeToggle();
        span.style.whiteSpace = "nowrap";
        if (att.type && att.type.name === "enumeration") {
            field = createComboBox(att.type);
        } else {
            field = /**@type{!HTMLInputElement}*/(doc.createElementNS(htmlns, "input"));
        }
        toggle.checked = target.hasAttribute(att.name);
        field.disabled = !toggle.checked;
        toggle.onchange = field.onchange = function () {
            var has = target.hasAttribute(att.name);
            field.disabled = !toggle.checked;
            if (has && !toggle.checked) {
                target.removeAttribute(att.name);
            } else if (toggle.checked) {
                target.setAttribute(att.name, field.value);
            }
        };
        if (att.use === xmled.AttributeUse.OPTIONAL) {
            span.appendChild(toggle);
        }
        span.appendChild(field);
        field.value = target.getAttribute(att.name);
        return span;
    }
    /**
     * @param {!Element} e
     * @param {!Element} element
     */
    function addHoverBehaviour(e, element) {
        e.onmouseover = function () {
            element.setAttributeNS(cursorns, "hover", "1");
        };
        e.onmouseout = function () {
            element.removeAttributeNS(cursorns, "hover");
        };
    }
    /**
     * @param {!Array.<!{name:string,atts:!Array.<!xmled.AttributeDefinition>}>} attributesDefinitions
     * @param {!Element} target
     */
    this.setAttributeDefinitions = function (attributesDefinitions, target) {
        clear();
        var i, e, a, att, j, table, tr, td, t = target;
        for (i = 0; t && i < attributesDefinitions.length; i += 1) {
            e = doc.createElementNS(htmlns, "b");
            a = attributesDefinitions[i];
            e.appendChild(doc.createTextNode(a.name));
            a = a.atts;
            element.appendChild(e);
            table = doc.createElementNS(htmlns, "table");
            addHoverBehaviour(e, t);
            addHoverBehaviour(table, t);
            element.appendChild(table);
            for (j = 0; j < a.length; j += 1) {
                att = a[j];
                if (att.use !== xmled.AttributeUse.PROHIBITED) {
                    tr = doc.createElementNS(htmlns, "tr");
                    td = doc.createElementNS(htmlns, "td");
                    td.appendChild(doc.createTextNode(att.name));
                    tr.appendChild(td);
                    td = doc.createElementNS(htmlns, "td");
                    td.appendChild(createAttributeEditor(att, t));
                    tr.appendChild(td);
                    table.appendChild(tr);
                }
            }
            t = t.parentElement;
        }
    };
};
