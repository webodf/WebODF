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
/*jslint sub: true*/
/*global runtime, odf, core, document, xmldom*/
runtime.loadClass("core.Base64");
runtime.loadClass("xmldom.XPath");
runtime.loadClass("odf.OdfContainer");
(function () {
    "use strict";
    var xpath = xmldom.XPath,
        base64 = new core.Base64();
    /**
     * @param {!Element} fontFaceDecls
     * @return {!Object.<string,{href:string,family:string}>}
     */
    function getEmbeddedFontDeclarations(fontFaceDecls) {
        var decls = {}, fonts, i, font, name, uris, href, family;
        if (!fontFaceDecls) {
            return decls;
        }
        fonts = xpath.getODFElementsWithXPath(fontFaceDecls,
                    "style:font-face[svg:font-face-src]",
                    odf.Namespaces.lookupNamespaceURI);
        for (i = 0; i < fonts.length; i += 1) {
            font = fonts[i];
            name = font.getAttributeNS(odf.Namespaces.stylens, "name");
            family = font.getAttributeNS(odf.Namespaces.svgns, "font-family");
            uris = xpath.getODFElementsWithXPath(font,
                "svg:font-face-src/svg:font-face-uri",
                odf.Namespaces.lookupNamespaceURI);
            if (uris.length > 0) {
                href = uris[0].getAttributeNS(odf.Namespaces.xlinkns, "href");
                decls[name] = {href: href, family: family};
            }
        }
        return decls;
    }
    /**
     * @param {!string} name
     * @param {!{href:string,family:string}} font
     * @param {!Uint8Array} fontdata
     * @param {!CSSStyleSheet} stylesheet
     * @return {undefined}
     */
    function addFontToCSS(name, font, fontdata, stylesheet) {
        var cssFamily = font.family || name,
            rule = "@font-face { font-family: '" + cssFamily + "'; src: " +
                "url(data:application/x-font-ttf;charset=binary;base64," +
                base64.convertUTF8ArrayToBase64(fontdata) +
                ") format(\"truetype\"); }";
        try {
            stylesheet.insertRule(rule, stylesheet.cssRules.length);
        } catch (/**@type{!DOMException}*/e) {
            runtime.log("Problem inserting rule in CSS: " + runtime.toJson(e) + "\nRule: " + rule);
        }
    }
    /**
     * @param {!Object.<string,{href:string,family:string}>} embeddedFontDeclarations
     * @param {!odf.OdfContainer} odfContainer
     * @param {!number} pos
     * @param {!CSSStyleSheet} stylesheet
     * @param {!function():undefined=} callback
     * @return {undefined}
     */
    function loadFontIntoCSS(embeddedFontDeclarations, odfContainer, pos,
            stylesheet, callback) {
        var name, i = 0,
            /**@type{string}*/
            n;
        for (n in embeddedFontDeclarations) {
            if (embeddedFontDeclarations.hasOwnProperty(n)) {
                if (i === pos) {
                    name = n;
                    break;
                }
                i += 1;
            }
        }
        if (!name) {
            if (callback) {
                callback();
            }
            return;
        }
        odfContainer.getPartData(embeddedFontDeclarations[name].href, function (err, fontdata) {
            if (err) {
                runtime.log(err);
            } else if (!fontdata) {
                runtime.log("missing font data for "
                    + embeddedFontDeclarations[name].href);
            } else {
                addFontToCSS(name, embeddedFontDeclarations[name], fontdata,
                    stylesheet);
            }
            loadFontIntoCSS(embeddedFontDeclarations, odfContainer, pos + 1,
                    stylesheet, callback);
        });
    }
    /**
     * @param {!Object.<string,{href:string,family:string}>} embeddedFontDeclarations
     * @param {!odf.OdfContainer} odfContainer
     * @param {!CSSStyleSheet} stylesheet
     * @return {undefined}
     */
    function loadFontsIntoCSS(embeddedFontDeclarations, odfContainer,
            stylesheet) {
        loadFontIntoCSS(embeddedFontDeclarations, odfContainer, 0, stylesheet);
    }
    /**
     * This class loads embedded fonts into the CSS
     * @constructor
     * @return {?}
     */
    odf.FontLoader = function FontLoader() {
        /**
         * @param {!odf.OdfContainer} odfContainer
         * @param {!CSSStyleSheet} stylesheet Will be cleaned and filled with rules for the fonts
         * @return {undefined}
         */
        this.loadFonts = function (odfContainer, stylesheet) {
            var embeddedFontDeclarations,
                /** @type {?Element}*/fontFaceDecls = odfContainer.rootElement.fontFaceDecls;

            // make stylesheet empty
            while (stylesheet.cssRules.length) {
                stylesheet.deleteRule(stylesheet.cssRules.length - 1);
            }

            if (fontFaceDecls) {
                embeddedFontDeclarations = getEmbeddedFontDeclarations(
                    fontFaceDecls
                );
                loadFontsIntoCSS(embeddedFontDeclarations, odfContainer, stylesheet);
            }
        };
    };
    return odf.FontLoader;
}());
