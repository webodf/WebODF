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
/*global Ext, app, runtime, xmldom, odf*/
runtime.loadClass("xmldom.XPath");
runtime.loadClass("odf.Namespaces");
Ext.define('WebODFApp.view.FileDetail', (function () {
    "use strict";
    var panel,
        xpath = xmldom.XPath,
        fileDetail,
        title,
        image,
        list,
        emptyImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAAXNSR0IArs4c6QAAAAtJREFUCB1jYGAAAAADAAFPSAqvAAAAAElFTkSuQmCC";
    function getTitle(body) {
        var ps,
            title;
        ps = xpath.getODFElementsWithXPath(body,
                ".//text:h", odf.Namespaces.resolvePrefix);
        title = "";
        if (ps && ps.length) {
            title = ps[0].nodeValue;
        } else {
            ps = xpath.getODFElementsWithXPath(body,
                ".//text:p", odf.Namespaces.resolvePrefix);
            if (ps && ps.length) {
                title = ps[0].nodeValue;
            }
        }
        return title;
    }
    function metaToJSON(body, meta) {
        var json = [],
            title = body && getTitle(body),
            e = meta && meta.firstChild,
            name;
        if (title) {
            json.push({name: "title", value: title});
        }
        while (e) {
            if (e.nodeType === 1 && e.textContent) {
                if (e.localName === "user-defined") {
                    name = e.getAttributeNS(
                        "urn:oasis:names:tc:opendocument:xmlns:meta:1.0",
                        "name"
                    );
                } else {
                    name = e.localName;
                }
                json.push({
                    name: name,
                    value: e.textContent
                });
            }
            e = e.nextSibling;
        }
        return json;
    }
    return {
        extend: 'Ext.Panel',
        xtype: 'filedetail',
        config: {
            title: 'File details',
            layout: 'vbox',
            items: [{
                id: "title",
                dock: 'top',
                xtype: 'toolbar'
            }, {
                id: 'details',
                xtype: 'container',
                layout: 'hbox',
                flex: 1,
                items: [{
                    id: 'thumbnail',
                    xtype: 'image',
                    width: 256,
                    maxWidth: "50%"
                }, {
                    id: 'metalist',
                    xtype: 'list',
                    store: {
                        fields: ["name", "value"],
                        data: []
                    },
                    itemTpl: "{name}: {value}",
                    flex: 1
                }]
            }],
            listeners: {
                initialize: function () {
                    fileDetail = this.query("#details")[0];
                    title = this.query("#title")[0];
                    image = fileDetail.query('#thumbnail')[0];
                    list = fileDetail.query('#metalist')[0];
                }
            }
        },
        updateRecord: function (record) {
            if (record) {
                fileDetail.setMasked({
                    xtype: 'loadmask',
                    message: 'Loading...'
                });
                title.setTitle(record.get('fileName'));
            }
        },
        canvasListener: function (odfcanvas) {
            var view = this,
                odfcontainer = odfcanvas.odfContainer(),
                part = odfcontainer.getPart("Thumbnails/thumbnail.png"),
                metajson = [];
            metajson = metaToJSON(odfcontainer.rootElement.body,
                    odfcontainer.rootElement.meta);
            part.onstatereadychange = function (part) {
                image.setSrc(part.url || emptyImageUrl);
            };
            part.load();
            list.getStore().setData(metajson);
            fileDetail.unmask();
        }
    };
}()));
