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
/*global Ext, runtime*/
Ext.define('WebODFApp.controller.Files', {
    extend: 'Ext.app.Controller',

    config: {
        refs: {
            mainView: 'mainview',
            filesList: 'fileslist list',
            fileDetail: 'filedetail',
            openButton: '#openButton',
            odfView: 'odfview',
            title: 'titlebar'
        },
        control: {
            mainView: {
                pop: 'pop',
                push: 'push',
                back: 'back'
            },
            filesList: {
                itemtap: 'show'
            },
            openButton: {
                tap: 'open'
            }
        }
    },
    back: function () {
        "use strict";
        this.odfView.hideCanvas();
    },
    push: function (view, item) {
        "use strict";
        if (item.xtype === "filedetail") {
            this.getOpenButton().show();
        } else {
            this.getOpenButton().hide();
        }
    },
    pop: function (view, item) {
        "use strict";
        if (item.xtype === "odfview") { // going to filedetail
            this.getOpenButton().show();
        } else {
            this.getOpenButton().hide();
        }
        this.getFilesList().deselectAll();
    },
    show: function (list, index, target, record, e) {
        "use strict";
        // set the record in the details view and the file view
        // this way, document starts loading in the background
        var c = this;
        if (!this.fileDetail) {
            this.fileDetail = Ext.create('WebODFApp.view.FileDetail');
        }
        if (!this.odfView) {
            this.odfView = Ext.create('WebODFApp.view.OdfView');
            this.odfView.addCanvasListener(this.fileDetail.canvasListener);
        }
        this.odfView.hideCanvas();
        this.fileDetail.odfView = this.odfView;
        this.fileDetail.setRecord(record);
        this.getMainView().push(this.fileDetail);
        runtime.setTimeout(function () {
            c.odfView.setRecord(record);
        }, 300);
    },
    open: function (options) {
        "use strict";
        var c = this;
        if (!this.odfView) {
            this.odfView = Ext.create('WebODFApp.view.OdfView');
        }
        this.odfView.hideCanvas();
        this.odfView.setRecord(this.fileDetail.getRecord());
        this.getMainView().push(this.odfView);
        runtime.setTimeout(function () {
            c.odfView.showCanvas();
        }, 300);
    }
});
