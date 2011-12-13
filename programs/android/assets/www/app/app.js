Ext.regApplication({
    name : 'app',
    launch : function() {
        this.launched = true;
        this.mainLaunch();
    },
    mainLaunch : function() {
        if (!this.launched || !device) {return;}
        try {
            app.stores.filesystem.initialUrl = invokeString;
        } catch (e) {
        }
        this.views.viewport = new this.views.Viewport();
    },
    openUrl : function (url) {
        app.models.FileSystem.proxy.getId(url, function (id) {
            if (id === -1) {
                alert("Cannot open file '" + url + "'.");
            } else {
                Ext.dispatch({
                    controller: app.controllers.files,
                    action: 'open',
                    id: id
                });
            }
        });
    }
});
