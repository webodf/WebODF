app.views.FilesList = Ext.extend(Ext.Panel, {
    layout: 'fit',
    dockedItems: [{
        xtype: 'toolbar',
        title: 'Files'
    }],
    items: [{
        xtype: 'list',
        store: app.stores.filesystem,
        itemTpl: '{fileName}<br/><span style="font-size:x-small">{fullPath}</span>',
        listeners: {
            'itemtap': function (view, number, item) {
                var record = app.stores.filesystem.getAt(number);
                if (record) {
                    Ext.dispatch({
                        controller: app.controllers.files,
                        action: 'show',
                        id: record.getId()
                    });
                }
            }
        },
        indexBar: true,
        grouped: true
    }],
    initComponent: function() {
        app.stores.filesystem.load();
        app.views.FilesList.superclass.initComponent.apply(this, arguments);
    }
});
