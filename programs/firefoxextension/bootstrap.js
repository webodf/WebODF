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

/*global Components, Services, dump, XPCOMUtils, APP_SHUTDOWN,
  OdtStreamConverter, FOdtStreamConverter, OttStreamConverter,
  OdsStreamConverter, FOdsStreamConverter, OtsStreamConverter,
  OdpStreamConverter, FOdpStreamConverter, OtpStreamConverter*/

function bootstrap() {
    "use strict";
    var RESOURCE_NAME = "webodf.js",
        EXT_PREFIX = 'extensions.uriloader@webodf.js',
        Ci = Components.interfaces,
        Cm = Components.manager,
        Cr = Components.results,
        Cu = Components.utils,
        ComponentFactory,
        componentFactories = [],
        odfStreamConverterUrl = null;

    Cu["import"]('resource://gre/modules/XPCOMUtils.jsm');
    Cu["import"]('resource://gre/modules/Services.jsm');

    function log(str) {
        dump(str + '\n');
    }

    // Register/unregister a constructor as a component.
    ComponentFactory = function () {
        var self = this,
            targetConstructor = null;

        this.QueryInterface = XPCOMUtils.generateQI([Ci.nsIFactory]);

        this.register = function(tC) {
            var proto = tC.prototype,
                registrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);
            targetConstructor = tC;

            registrar.registerFactory(proto.classID, proto.classDescription,
                            proto.contractID, self);
        };

        this.unregister = function() {
            var proto = targetConstructor.prototype,
                registrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);

            registrar.unregisterFactory(proto.classID, self);
            targetConstructor = null;
        };

        // nsIFactory
        this.createInstance = function(aOuter, iid) {
            if (aOuter !== null) {
                throw Cr.NS_ERROR_NO_AGGREGATION;
            }
            return (new targetConstructor()).QueryInterface(iid);
        };
        // nsIFactory
        this.lockFactory = function(lock) {
            // No longer used as of gecko 1.7.
            throw Cr.NS_ERROR_NOT_IMPLEMENTED;
        };
    };


// As of Firefox 13 bootstrapped add-ons don't support automatic registering and
// unregistering of resource urls and components/contracts. Until then we do
// it programatically. See ManifestDirective ManifestParser.cpp for support.

    function startup(aData, aReason) {
        // Setup the resource url.
        var ioService = Services.io,
            resProt = ioService.getProtocolHandler('resource')
                  .QueryInterface(Ci.nsIResProtocolHandler),
            aliasURI = ioService.newURI('content/', 'UTF-8', aData.resourceURI),
            converters,
            i;
        resProt.setSubstitution(RESOURCE_NAME, aliasURI);

        // Load the component and register it.
        odfStreamConverterUrl = aData.resourceURI.spec
            + 'components/OdfStreamConverter.js';
        Cu["import"](odfStreamConverterUrl);
        converters = [
            OdtStreamConverter, FOdtStreamConverter, OttStreamConverter,
            OdsStreamConverter, FOdsStreamConverter, OtsStreamConverter,
            OdpStreamConverter, FOdpStreamConverter, OtpStreamConverter];

        if (componentFactories.length === 0) {
            for (i = 0; i < converters.length; i += 1) {
                componentFactories.push(new ComponentFactory());
            }
        }
        for (i = 0; i < componentFactories.length; i += 1) {
            componentFactories[i].register(converters[i]);
        }
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
        componentFactories.forEach(function(componentFactory) {
            componentFactory.unregister();
        });
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

