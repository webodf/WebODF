/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
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

/*global Packages HTMLStyleElement window XMLHttpRequest HTMLStyleElement Document*/

/*jslint nomen: false */

var Ext = {};
Ext.data = {};
/**
 * @constructor
 */
Ext.data.Model = function (settings) {};
/**
 * @param {!string} fieldName
 * @return {!string}
 */
Ext.data.Model.prototype.get = function (fieldName) {};
/**
 * @return {!boolean}
 */
Ext.data.Model.isExpanded = function () {};
/**
 * @constructor
 */
Ext.data.NodeInterface = function () {};
/**
 * @param {!string} attribute
 * @param {*} value
 * @param {boolean=} deep
 * @return {Ext.data.NodeInterface}
 */
Ext.data.NodeInterface.prototype.findChild = function (attribute, value, deep) {};
/**
 * @param {!Ext.data.NodeInterface|!Object} node
 * @return {!Ext.data.NodeInterface}
 */
Ext.data.NodeInterface.prototype.appendChild = function (node) {};
/**
 * @param {!string} id
 * @return {Ext.Component}
 */
Ext.getCmp = function (id) {};
Ext.tree = {};
/**
 * @constructor
 */
Ext.tree.Panel = function (settings) {};
/**
 * @return {!Ext.data.NodeInterface}
 */
Ext.tree.Panel.prototype.getRootNode = function () {};
Ext.component = {};
/**
 * @constructor
 * @extends {Ext.Component}
 */
Ext.component.Component = function (settings) {};
/**
 * @return {!Ext.Element}
 */
Ext.component.Component.prototype.getEl = function () {};
/**
 * @constructor
 */
Ext.Button = function (settings) {};
/**
 * @constructor
 */
Ext.Component = function (settings) {};
/**
 * @type {Object}
 */
Ext.Component.prototype.superclass = {};
/**
 * @type {!Ext.Element}
 */
Ext.Component.prototype.el;
/**
 * @constructor
 */
Ext.Element = function (settings) {};
/**
 * @constructor
 */
Ext.Panel = function (settings) {};
/**
 * @type {!Element}
 */
Ext.Element.prototype.dom;
Ext.QuickTips = {};
/**
 * @return {undefined}
 */
Ext.QuickTips.init = function () {};
/**
 * @constructor
 */
Ext.Slider = function (settings) {};
Ext.util = {};
/**
 * @constructor
 */
Ext.util.MixedCollection = function () {};
/**
 * @param {!Function} f
 */
Ext.util.MixedCollection.prototype.findBy = function (f) {};
Ext.tab = {};
/**
 * @constructor
 */
Ext.tab.Panel = function (settings) {};
/**
 * @param {!Object} component
 * @return {undefined}
 */
Ext.tab.Panel.prototype.add = function (component) {};
/**
 * @return {!Ext.Component}
 */
Ext.tab.Panel.prototype.getActiveTab = function () {};
/**
 * @param {!Ext.Component} tab
 * @return {undefined}
 */
Ext.tab.Panel.prototype.setActiveTab = function (tab) {};
/**
 * @type {!Ext.util.MixedCollection}
 */
Ext.tab.Panel.prototype.items;
/**
 * @constructor
 */
Ext.Toolbar = function (settings) {};
/**
 * @constructor
 */
Ext.Toolbar.TextItem = function (text) {};
/**
 * @constructor
 */
Ext.Viewport = function (settings) {};
Ext.onReady = function (callback) {};
