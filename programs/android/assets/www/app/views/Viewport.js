/*global Ext, app*/
app.views.Viewport = Ext.extend(Ext.Panel, (function () {
    "use strict";
    return {
        fullscreen: true,
        layout: 'card',
        cardSwitchAnimation: 'slide',
        initComponent: function () {

            //put instances of cards into app.views namespace
            Ext.apply(app.views, {
                filesList: new app.views.FilesList(),
                fileDetail: new app.views.FileDetail(),
                odfView: new app.views.OdfView()
            });
            //put instances of cards into viewport
            Ext.apply(this, {
                items: [
                    app.views.filesList,
                    app.views.fileDetail,
                    app.views.odfView
                ]
            });
            app.views.Viewport.superclass.initComponent.apply(this, arguments);
        },
        listeners: {
            afterlayout: function () {
                if (app.stores.filesystem.initialUrl) {
                    app.openUrl(app.stores.filesystem.initialUrl);
                    app.stores.filesystem.initialUrl = undefined;
                }
            }
        }
    };
}()));
