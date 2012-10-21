/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
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
 * @source: http://gitorious.org/webodf/webodf/
 */
/*global Components, Services, dump, XPCOMUtils, APP_SHUTDOWN,
  OdtStreamConverter, OdsStreamConverter, OdpStreamConverter*/
function bootstrap() {
    "use strict";
    var RESOURCE_NAME = "webodf.js",
        EXT_PREFIX = 'extensions.uriloader@webodf.js',
        Ci = Components.interfaces,
        Cm = Components.manager,
        Cr = Components.results,
        Cu = Components.utils,
        Factory,
        odfStreamConverterUrl = null;

    Cu["import"]('resource://gre/modules/XPCOMUtils.jsm');
    Cu["import"]('resource://gre/modules/Services.jsm');

    function log(str) {
        dump(str + '\n');
    }

    // Register/unregister a constructor as a component.
    Factory = {
        QueryInterface: XPCOMUtils.generateQI([Ci.nsIFactory]),
        _targetConstructor: null,
        register: function register(targetConstructor) {
            this._targetConstructor = targetConstructor;
            var proto = targetConstructor.prototype,
                registrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);
            registrar.registerFactory(proto.classID, proto.classDescription,
                              proto.contractID, this);
        },
        unregister: function unregister() {
            var proto = this._targetConstructor.prototype,
                registrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);
            registrar.unregisterFactory(proto.classID, this);
            this._targetConstructor = null;
        },
        // nsIFactory
        createInstance: function createInstance(aOuter, iid) {
            if (aOuter !== null) {
                throw Cr.NS_ERROR_NO_AGGREGATION;
            }
            return (new this._targetConstructor()).QueryInterface(iid);
        },
        // nsIFactory
        lockFactory: function lockFactory(lock) {
            // No longer used as of gecko 1.7.
            throw Cr.NS_ERROR_NOT_IMPLEMENTED;
        }
    };

// As of Firefox 13 bootstrapped add-ons don't support automatic registering and
// unregistering of resource urls and components/contracts. Until then we do
// it programatically. See ManifestDirective ManifestParser.cpp for support.

    function startup(aData, aReason) {
        // Setup the resource url.
        var ioService = Services.io,
            resProt = ioService.getProtocolHandler('resource')
                  .QueryInterface(Ci.nsIResProtocolHandler),
            aliasURI = ioService.newURI('content/', 'UTF-8', aData.resourceURI);
        resProt.setSubstitution(RESOURCE_NAME, aliasURI);

        // Load the component and register it.
        odfStreamConverterUrl = aData.resourceURI.spec
            + 'components/OdfStreamConverter.js';
        Cu["import"](odfStreamConverterUrl);
        Factory.register(OdtStreamConverter);
        Factory.register(OdsStreamConverter);
        Factory.register(OdpStreamConverter);
    }
    function shutdown(aData, aReason) {
        if (aReason === APP_SHUTDOWN) {
            return;
        }
        var ioService = Services.io,
            resProt = ioService.getProtocolHandler('resource')
                  .QueryInterface(Ci.nsIResProtocolHandler);
        // Remove the resource url.
        resProt.setSubstitution(RESOURCE_NAME, null);
        // Remove the contract/component.
        Factory.unregister();
        // Unload the converter
        Cu.unload(odfStreamConverterUrl);
        odfStreamConverterUrl = null;
    }
    function install(aData, aReason) {
    }
    function uninstall(aData, aReason) {
    }
    return {
        install: install,
        uninstall: uninstall,
        startup: startup,
        shutdown: shutdown
    };
}

var b = bootstrap(),
    install = b.install,
    uninstall = b.uninstall,
    startup = b.startup,
    shutdown = b.shutdown;

