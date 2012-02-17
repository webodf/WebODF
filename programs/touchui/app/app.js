/*global Ext */
Ext.application({
    name : 'WebODFApp',
    models: ['FileSystem'],
    views: ['Viewport', 'FilesList', 'FileDetail', 'OdfView'],
    controllers: ['Files'],
    stores: ['FileStore'],
    launch: function () {
        'use strict';
        Ext.create('WebODFApp.view.Viewport');
    }
});
