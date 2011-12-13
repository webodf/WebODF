app.views.FileDetail = Ext.extend(Ext.Panel, {
    dockedItems: [{
        xtype: 'toolbar',
        title: 'View file',
        items: [
            {
                text: 'Back',
                ui: 'back',
                listeners: {
                    'tap': function () {
                        Ext.dispatch({
                            controller: app.controllers.files,
                            action: 'index',
                            animation: {type:'slide', direction:'right'}
                        });
                    }
                }
            },
            {xtype:'spacer'},
            {
                id: 'open',
                text: 'Open',
                ui: 'action',
                listeners: {
                    'tap': function () {
                        Ext.dispatch({
                            controller: app.controllers.files,
                            action: 'open',
                            id: this.record.getId()
                        });
                    }
                }
            }
        ]
    }],
    styleHtmlContent:true,
    scroll: 'vertical',
    items: [
        {tpl:[
            '<h4>Phone</h4>',
            '<tpl for="phoneNumbers">',
                '<div class="field"><span class="label">{type}: </span><a href="tel:{value}">{value}</a></div>',
            '</tpl>'
        ]},
        {tpl:[
            '<h4>Email</h4>',
            '<tpl for="emails">',
                '<div class="field"><span class="label">{type}: </span><a href="mailto:{value}">{value}</a></div>',
            '</tpl>'
        ]},
        {xtype:'panel', tpl:[
            '<h4>Search</h4>',
            '<div class="field"><span class="label">Google: </span><a href="http://www.google.com/m/search?q=%22{givenName}+{familyName}%22">\'{givenName} {familyName}\'</a></div>',
            '<div class="field"><span class="label">Bing: </span><a href="http://m.bing.com/search?q=%22{givenName}+{familyName}%22">\'{givenName} {familyName}\'</a></div>',
        ]},
    ],
    updateWithRecord: function(record) {
        Ext.each(this.items.items, function(item) {
            item.update(record.data);
        });
        this.record = record;
        var toolbar = this.getDockedItems()[0];
        toolbar.setTitle(record.get('fileName'));
        toolbar.getComponent('open').record = record;
    }
});

