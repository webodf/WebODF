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

