/*global Ext, app*/
app.controllers.files = new Ext.Controller({

    index: function(options) {
        "use strict";
        app.views.viewport.setActiveItem(
            app.views.filesList, options.animation
        );
    },

    show: function(options) {
        "use strict";
        var id = parseInt(options.id, 10),
            store = app.stores.filesystem,
            file = store.getAt(store.findExact('id', id));
        if (file) {
            app.views.fileDetail.updateWithRecord(file);
            app.views.viewport.setActiveItem(
                app.views.fileDetail, options.animation
            );
        }
    },
    
    open: function(options) {
        "use strict";
        var id = parseInt(options.id, 10),
            store = app.stores.filesystem,
            file = store.getAt(store.findExact('id', id));
        if (file) {
            app.views.odfView.updateWithRecord(file);
            app.views.viewport.setActiveItem(
                app.views.odfView, options.animation
            );
        }
    }
});
