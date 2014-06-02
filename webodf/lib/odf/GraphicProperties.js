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

/*global runtime, odf*/

/**
 * Convenient access to style attributes for graphic-properties.
 * @constructor
 * @param {!Element} element <style:graphic-properties/> element
 * @param {!odf.StyleParseUtils} styleParseUtils
 * @param {!odf.GraphicProperties|undefined} parent
 */
odf.GraphicProperties = function (element, styleParseUtils, parent) {
    "use strict";
    var self = this,
        stylens = odf.Namespaces.stylens,
        svgns = odf.Namespaces.svgns,
        getter;
    getter = {
        verticalPos: function () {
            var v = element.getAttributeNS(stylens, "vertical-pos");
            return v === "" ? undefined : v;
        },
        verticalRel: function () {
            var v = element.getAttributeNS(stylens, "vertical-rel");
            return v === "" ? undefined : v;
        },
        horizontalPos: function () {
            var v = element.getAttributeNS(stylens, "horizontal-pos");
            return v === "" ? undefined : v;
        },
        horizontalRel: function () {
            var v = element.getAttributeNS(stylens, "horizontal-rel");
            return v === "" ? undefined : v;
        },
        strokeWidth: function () {
            var a = element.getAttributeNS(svgns, "stroke-width");
            return styleParseUtils.parseLength(a);
        }
    };
    /**
     * @return {!string|undefined}
     */
    this.verticalPos = function () {
        return /**@type{!string|undefined}*/(self.data.value("verticalPos"));
    };
    /**
     * @return {!string|undefined}
     */
    this.verticalRel = function () {
        return /**@type{!string|undefined}*/(self.data.value("verticalRel"));
    };
    /**
     * @return {!string|undefined}
     */
    this.horizontalPos = function () {
        return /**@type{!string|undefined}*/(self.data.value("horizontalPos"));
    };
    /**
     * @return {!string|undefined}
     */
    this.horizontalRel = function () {
        return /**@type{!string|undefined}*/(self.data.value("horizontalRel"));
    };
    /**
     * @return {!number|undefined}
     */
    this.strokeWidth = function () {
        return /**@type{!number|undefined}*/(self.data.value("strokeWidth"));
    };
    /**
     * @type {!odf.LazyStyleProperties}
     */
    this.data;
    function init() {
        var p = parent === undefined ? undefined : parent.data;
        self.data = new odf.LazyStyleProperties(p, getter);
    }
    init();
};
/**
 * @constructor
 */
odf.ComputedGraphicProperties = function () {
    "use strict";
    var /**@type{!odf.GraphicProperties|undefined}*/
        g;
    /**
     * @param {!odf.GraphicProperties|undefined} graphicProperties
     * @return {undefined}
     */
    this.setGraphicProperties = function (graphicProperties) {
        g = graphicProperties;
    };
    /**
     * @return {!string}
     */
    this.verticalPos = function () {
        return (g && g.verticalPos()) || "from-top";
    };
    /**
     * @return {!string}
     */
    this.verticalRel = function () {
        return (g && g.verticalRel()) || "page";
    };
    /**
     * @return {!string}
     */
    this.horizontalPos = function () {
        return (g && g.horizontalPos()) || "from-left";
    };
    /**
     * @return {!string}
     */
    this.horizontalRel = function () {
        return (g && g.horizontalRel()) || "page";
    };
};
