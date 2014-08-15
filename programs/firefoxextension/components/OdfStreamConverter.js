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

/*global Components, XPCOMUtils, Services, NetUtil, dump*/

function makeODFStreamConverters() {
    "use strict";
    var Cc = Components.classes,
        Ci = Components.interfaces,
        Cr = Components.results,
        Cu = Components.utils,
        WEBODF_MESSAGE_EVENT_ID = 'webodf.message';

    Cu["import"]('resource://gre/modules/XPCOMUtils.jsm');
    Cu["import"]('resource://gre/modules/Services.jsm');
    Cu["import"]('resource://gre/modules/NetUtil.jsm');

    function log(aMsg) {
        var msg = 'OdfStreamConverter.js: '
            + (aMsg.join ? aMsg.join('') : aMsg);
        Services.console.logStringMessage(msg);
        dump(msg + '\n');
    }

    function getDOMWindow(aChannel) {
        var requestor = aChannel.notificationCallbacks,
            win = requestor.getInterface(Components.interfaces.nsIDOMWindow);
        return win;
    }

    function getMimetypeByPath(path) {
        var mimetypeLookupTable = [
                {ext: ".odt",  type: "application/vnd.oasis.opendocument.text"},
                {ext: ".fodt", type: "application/vnd.oasis.opendocument.text-flat-xml"},
                {ext: ".ott",  type: "application/vnd.oasis.opendocument.text-template"},
                {ext: ".odp",  type: "application/vnd.oasis.opendocument.presentation"},
                {ext: ".fodp", type: "application/vnd.oasis.opendocument.presentation-flat-xml"},
                {ext: ".otp",  type: "application/vnd.oasis.opendocument.presentation-template"},
                {ext: ".ods",  type: "application/vnd.oasis.opendocument.spreadsheet"},
                {ext: ".fods", type: "application/vnd.oasis.opendocument.spreadsheet-flat-xml"},
                {ext: ".ots",  type: "application/vnd.oasis.opendocument.spreadsheet-template"}
            ],
            mimetype = "application/vnd.oasis.opendocument.text";

        mimetypeLookupTable.some(function (mimetypeEntry) {
            var isMatch = (path.substr(-mimetypeEntry.ext.length) === mimetypeEntry.ext);
            if (isMatch) {
                mimetype = mimetypeEntry.type;
            }
            return isMatch;
        });

        return mimetype;
    }


    // All the priviledged actions.
    function ChromeActions(domWindow) {
        this.domWindow = domWindow;
    }
    ChromeActions.prototype = {
        download: function (data, sendResponse) {
            var originalUrl = data.originalUrl,
                // The data may not be downloaded so we need just retry getting
                // the odf with the original url.
                originalUri = NetUtil.newURI(data.originalUrl),
                blobUri = data.blobUrl ? NetUtil.newURI(data.blobUrl)
                                       : originalUri,
                extHelperAppSvc =
                    Cc['@mozilla.org/uriloader/external-helper-app-service;1'].
                        getService(Ci.nsIExternalHelperAppService),
                frontWindow = Cc['@mozilla.org/embedcomp/window-watcher;1'].
                             getService(Ci.nsIWindowWatcher).activeWindow,
                listener;

            listener = {
                extListener: null,
                onStartRequest: function (aRequest, aContext) {
                    var mimetype = getMimetypeByPath(aRequest.URI.path);

                    this.extListener = extHelperAppSvc.doContent(mimetype,
                                aRequest, frontWindow, false);
                    this.extListener.onStartRequest(aRequest, aContext);
                },
                onStopRequest: function (aRequest, aContext, aStatusCode) {
                    if (this.extListener) {
                        this.extListener.onStopRequest(aRequest, aContext,
                            aStatusCode);
                    }
                    // Notify the content code we're done downloading.
                    if (sendResponse) {
                        sendResponse(false);
                    }
                },
                onDataAvailable: function (aRequest, aContext, aInputStream,
                        aOffset, aCount) {
                    this.extListener.onDataAvailable(aRequest, aContext,
                        aInputStream, aOffset, aCount);
                }
            };

            NetUtil.asyncFetch(blobUri, function (aInputStream, aResult) {
                if (!Components.isSuccessCode(aResult)) {
                    if (sendResponse) {
                        sendResponse(true);
                    }
                    return;
                }
                // Create a nsIInputStreamChannel so we can set the url on the
                // channel so the filename will be correct.
                var channel = Cc['@mozilla.org/network/input-stream-channel;1'].
                    createInstance(Ci.nsIInputStreamChannel);
                channel.setURI(originalUri);
                channel.contentStream = aInputStream;
                channel.QueryInterface(Ci.nsIChannel);
                channel.asyncOpen(listener, null);
            });
        }
    };

    // Event listener to trigger chrome privedged code.
    function RequestListener(actions) {
        this.actions = actions;
    }
    // Receive an event and synchronously or asynchronously responds.
    RequestListener.prototype.receive = function (event) {
        var action = event.detail.action,
            data = event.detail.data,
            actions = this.actions;
        if (!(action in actions)) {
            log('Unknown action: ' + action);
            return;
        }
        actions[action].call(this.actions, data);
    };

    /* common base for ODT/OTT, ODS/OTS and ODP/OTP stream converters */
    var OdfStreamConverter = {

        // properties required for XPCOM registration, except classID
        classDescription: 'webodf.js Component',
        contractID: '@mozilla.org/streamconv;1?from=application/vnd.oasis.opendocument.text&to=*/*',

        QueryInterface: XPCOMUtils.generateQI([
            Ci.nsISupports,
            Ci.nsIStreamConverter,
            Ci.nsIStreamListener,
            Ci.nsIRequestObserver
        ]),

        /*
         * This component works as such:
         * 1. asyncConvertData stores the listener
         * 2. onStartRequest creates a new channel, streams the viewer and
         *    cancels the request so webodf.js can do the request
         * Since the request is cancelled onDataAvailable should not be called.
         * The onStopRequest does nothing. The convert function just returns the
         * stream, it's just the synchronous version of asyncConvertData.
         */

        // nsIStreamConverter::convert
        convert: function (aFromStream, aFromType, aToType, aCtxt) {
            throw Cr.NS_ERROR_NOT_IMPLEMENTED;
        },

        // nsIStreamConverter::asyncConvertData
        asyncConvertData: function (aFromType, aToType, aListener, aCtxt) {
            // Ignoring HTTP POST requests -- webodf.js has to repeat the
            // request.
            var skipConversion = false;
            try {
                var request = aCtxt;
                request.QueryInterface(Ci.nsIHttpChannel);
                skipConversion = (request.requestMethod !== 'GET');
            } catch (e) {
                // Non-HTTP request... continue normally.
            }
            if (skipConversion) {
                throw Cr.NS_ERROR_NOT_IMPLEMENTED;
            }

            // Store the listener passed to us
            this.listener = aListener;
        },

        // nsIStreamListener::onDataAvailable
        onDataAvailable: function (aRequest, aContext, aInputStream, aOffset,
                aCount) {
            // Do nothing since all the data loading is handled by the viewer.
            log('SANITY CHECK: onDataAvailable SHOULD NOT BE CALLED!');
        },

        // nsIRequestObserver::onStartRequest
        onStartRequest: function (aRequest, aContext) {

            // Setup the request so we can use it below.
            aRequest.QueryInterface(Ci.nsIChannel);
            // Cancel the request so the viewer can handle it.
            aRequest.cancel(Cr.NS_BINDING_ABORTED);

            // Create a new channel that is viewer loaded as a resource.
            var ioService = Services.io,
                channel = ioService.newChannel(
                    'resource://webodf.js/web/viewer.html',
                    null,
                    null
                ),
                listener = this.listener,
            // Proxy all the request observer calls, when it gets to
            // onStopRequest we can get the dom window.
                proxy = {
                    onStartRequest: function () {
                        listener.onStartRequest.apply(listener, arguments);
                    },
                    onDataAvailable: function () {
                        listener.onDataAvailable.apply(listener, arguments);
                    },
                    onStopRequest: function () {
                        var domWindow = getDOMWindow(channel),
                            requestListener;
                        // Double check the url is still the correct one.
                        if (domWindow.document.documentURIObject.equals(
                                aRequest.URI
                            )) {
                            requestListener = new RequestListener(
                                new ChromeActions(domWindow)
                            );
                            domWindow.addEventListener(WEBODF_MESSAGE_EVENT_ID,
                                function (event) {
                                    requestListener.receive(event);
                                }, false, true, true);
                        }
                        listener.onStopRequest.apply(listener, arguments);
                    }
                };

            // Keep the URL the same so the browser sees it as the same.
            channel.originalURI = aRequest.URI;
            channel.asyncOpen(proxy, aContext);
        },

        // nsIRequestObserver::onStopRequest
        onStopRequest: function (aRequest, aContext, aStatusCode) {
          // Do nothing.
        }
    };

    function OdtStreamConverter() {
    }
    OdtStreamConverter.prototype = {
        // properties required for XPCOM registration:
        classID: Components.ID('{43d50559-3e72-435e-9526-482b93f05bf1}'),
        classDescription: 'OpenDocument Text converter',
        contractID: '@mozilla.org/streamconv;1?from=application/vnd.oasis.opendocument.text&to=*/*',
        QueryInterface: OdfStreamConverter.QueryInterface,
        convert: OdfStreamConverter.convert,
        asyncConvertData: OdfStreamConverter.asyncConvertData,
        onDataAvailable: OdfStreamConverter.onDataAvailable,
        onStartRequest: OdfStreamConverter.onStartRequest,
        onStopRequest: OdfStreamConverter.onStopRequest
    };

    function FOdtStreamConverter() {
    }
    FOdtStreamConverter.prototype = {
        // properties required for XPCOM registration:
        classID: Components.ID('{44327fea-721f-4f09-beeb-488179e3b308}'),
        classDescription: 'OpenDocument Text Flat converter',
        contractID: '@mozilla.org/streamconv;1?from=application/vnd.oasis.opendocument.text-flat-xml&to=*/*',
        QueryInterface: OdfStreamConverter.QueryInterface,
        convert: OdfStreamConverter.convert,
        asyncConvertData: OdfStreamConverter.asyncConvertData,
        onDataAvailable: OdfStreamConverter.onDataAvailable,
        onStartRequest: OdfStreamConverter.onStartRequest,
        onStopRequest: OdfStreamConverter.onStopRequest
    };

    function OttStreamConverter() {
    }
    OttStreamConverter.prototype = {
        // properties required for XPCOM registration:
        classID: Components.ID('{0600b310-ae8d-4912-b21e-4d0aeef005af}'),
        classDescription: 'OpenDocument Text Template converter',
        contractID: '@mozilla.org/streamconv;1?from=application/vnd.oasis.opendocument.text-template&to=*/*',
        QueryInterface: OdfStreamConverter.QueryInterface,
        convert: OdfStreamConverter.convert,
        asyncConvertData: OdfStreamConverter.asyncConvertData,
        onDataAvailable: OdfStreamConverter.onDataAvailable,
        onStartRequest: OdfStreamConverter.onStartRequest,
        onStopRequest: OdfStreamConverter.onStopRequest
    };

    function OdsStreamConverter() {
    }
    OdsStreamConverter.prototype = {
        // properties required for XPCOM registration:
        classID: Components.ID('{5f0cd28d-cd7a-4c38-8dd9-72135474b9bc}'),
        classDescription: 'OpenDocument Spreadsheet converter',
        contractID: '@mozilla.org/streamconv;1?from=application/vnd.oasis.opendocument.spreadsheet&to=*/*',
        QueryInterface: OdfStreamConverter.QueryInterface,
        convert: OdfStreamConverter.convert,
        asyncConvertData: OdfStreamConverter.asyncConvertData,
        onDataAvailable: OdfStreamConverter.onDataAvailable,
        onStartRequest: OdfStreamConverter.onStartRequest,
        onStopRequest: OdfStreamConverter.onStopRequest
    };

    function FOdsStreamConverter() {
    }
    FOdsStreamConverter.prototype = {
        // properties required for XPCOM registration:
        classID: Components.ID('{03fb3d00-3274-4573-87ab-542e9649a2dc}'),
        classDescription: 'OpenDocument Spreadsheet Flat converter',
        contractID: '@mozilla.org/streamconv;1?from=application/vnd.oasis.opendocument.spreadsheet-flat-xml&to=*/*',
        QueryInterface: OdfStreamConverter.QueryInterface,
        convert: OdfStreamConverter.convert,
        asyncConvertData: OdfStreamConverter.asyncConvertData,
        onDataAvailable: OdfStreamConverter.onDataAvailable,
        onStartRequest: OdfStreamConverter.onStartRequest,
        onStopRequest: OdfStreamConverter.onStopRequest
    };

    function OtsStreamConverter() {
    }
    OtsStreamConverter.prototype = {
        // properties required for XPCOM registration:
        classID: Components.ID('{4f93193f-4dff-40a0-98e7-f96138798dd0}'),
        classDescription: 'OpenDocument Spreadsheet Template converter',
        contractID: '@mozilla.org/streamconv;1?from=application/vnd.oasis.opendocument.spreadsheet-template&to=*/*',
        QueryInterface: OdfStreamConverter.QueryInterface,
        convert: OdfStreamConverter.convert,
        asyncConvertData: OdfStreamConverter.asyncConvertData,
        onDataAvailable: OdfStreamConverter.onDataAvailable,
        onStartRequest: OdfStreamConverter.onStartRequest,
        onStopRequest: OdfStreamConverter.onStopRequest
    };

    function OdpStreamConverter() {
    }
    OdpStreamConverter.prototype = {
      // properties required for XPCOM registration:
        classID: Components.ID('{84492c35-9c3a-41cc-a512-eb8eb06744a0}'),
        classDescription: 'OpenDocument Presentation converter',
        contractID: '@mozilla.org/streamconv;1?from=application/vnd.oasis.opendocument.presentation&to=*/*',
        QueryInterface: OdfStreamConverter.QueryInterface,
        convert: OdfStreamConverter.convert,
        asyncConvertData: OdfStreamConverter.asyncConvertData,
        onDataAvailable: OdfStreamConverter.onDataAvailable,
        onStartRequest: OdfStreamConverter.onStartRequest,
        onStopRequest: OdfStreamConverter.onStopRequest
    };

    function FOdpStreamConverter() {
    }
    FOdpStreamConverter.prototype = {
      // properties required for XPCOM registration:
        classID: Components.ID('{b1daa2e0-886d-41a6-8101-323be49531d3}'),
        classDescription: 'OpenDocument Presentation Flat converter',
        contractID: '@mozilla.org/streamconv;1?from=application/vnd.oasis.opendocument.presentation-flat-xml&to=*/*',
        QueryInterface: OdfStreamConverter.QueryInterface,
        convert: OdfStreamConverter.convert,
        asyncConvertData: OdfStreamConverter.asyncConvertData,
        onDataAvailable: OdfStreamConverter.onDataAvailable,
        onStartRequest: OdfStreamConverter.onStartRequest,
        onStopRequest: OdfStreamConverter.onStopRequest
    };

    function OtpStreamConverter() {
    }
    OtpStreamConverter.prototype = {
      // properties required for XPCOM registration:
        classID: Components.ID('{17192d8d-fc0a-4f15-b752-23652c781fec}'),
        classDescription: 'OpenDocument Presentation Template converter',
        contractID: '@mozilla.org/streamconv;1?from=application/vnd.oasis.opendocument.presentation-template&to=*/*',
        QueryInterface: OdfStreamConverter.QueryInterface,
        convert: OdfStreamConverter.convert,
        asyncConvertData: OdfStreamConverter.asyncConvertData,
        onDataAvailable: OdfStreamConverter.onDataAvailable,
        onStartRequest: OdfStreamConverter.onStartRequest,
        onStopRequest: OdfStreamConverter.onStopRequest
    };

    return {
        EXPORTED_SYMBOLS: [
            'OdtStreamConverter', 'FOdtStreamConverter', 'OttStreamConverter',
            'OdsStreamConverter', 'FOdsStreamConverter', 'OtsStreamConverter',
            'OdpStreamConverter', 'FOdpStreamConverter', 'OtpStreamConverter'],
        OdtStreamConverter:  OdtStreamConverter,
        FOdtStreamConverter: FOdtStreamConverter,
        OttStreamConverter:  OttStreamConverter,
        OdsStreamConverter:  OdsStreamConverter,
        FOdsStreamConverter: FOdsStreamConverter,
        OtsStreamConverter:  OtsStreamConverter,
        OdpStreamConverter:  OdpStreamConverter,
        FOdpStreamConverter: FOdpStreamConverter,
        OtpStreamConverter:  OtpStreamConverter,
        NSGetFactory: XPCOMUtils.generateNSGetFactory([
            OdtStreamConverter, FOdtStreamConverter, OttStreamConverter,
            OdsStreamConverter, FOdsStreamConverter, OtsStreamConverter,
            OdpStreamConverter, FOdpStreamConverter, OtpStreamConverter])
    };
}
var o = makeODFStreamConverters(),
    EXPORTED_SYMBOLS = o.EXPORTED_SYMBOLS,
    OdtStreamConverter =  o.OdtStreamConverter,
    FOdtStreamConverter = o.FOdtStreamConverter,
    OttStreamConverter =  o.OttStreamConverter,
    OdsStreamConverter =  o.OdsStreamConverter,
    FOdsStreamConverter = o.FOdsStreamConverter,
    OtsStreamConverter =  o.OtsStreamConverter,
    OdpStreamConverter =  o.OdpStreamConverter,
    FOdpStreamConverter = o.FOdpStreamConverter,
    OtpStreamConverter =  o.OtpStreamConverter,
    NSGetFactory = o.NSGetFactory;
