/**
 * Copyright (C) 2014 KO GmbH <copyright@kogmbh.com>
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

var Wodo = Wodo || (function () {
    "use strict";

    var installationPath = (function() {
        var path = ".",
            a, pathname, pos;

        if (document.currentScript && document.currentScript.src) {
            a = document.createElement('a');
            a.href = document.currentScript.src;
            pathname = a.pathname;

            pos = pathname.lastIndexOf("/");
            if (pos !== -1) {
                path = pathname.substr(0, pos);
            }
        }
        return path;
    }());

    window.dojoConfig = (function() {
        var WebODFEditorDojoLocale = "C";

        if (navigator && navigator.language.match(/^(de)/)) {
            WebODFEditorDojoLocale = navigator.language.substr(0, 2);
        }

        return {
            locale: WebODFEditorDojoLocale,
            paths: {
                "webodf/editor": installationPath,
                "dijit":         installationPath + "/dijit",
                "dojox":         installationPath + "/dojox",
                "dojo":          installationPath + "/dojo",
                "resources":     installationPath + "/resources"
            }
        };
    }());

    var /** @type{!boolean} */
        isInitalized = false,
        /** @type{!Array.<!function():undefined>} */
        pendingInstanceCreationCalls = [],
        /** @type{!number} */
        instanceCounter = 0,
        // TODO: avatar image url needs base-url setting.
        // so far Wodo itself does not have a setup call,
        // but then the avatar is also not used yet here
        defaultUserData = {
            fullName: "",
            color:    "black",
            imageUrl: "avatar-joe.png"
        },
        /** @const
            @type{!Array.<!string>} */
        userDataFieldNames = ["fullName", "color", "imageUrl"],
        /** @const
            @type{!string} */
        memberId = "localuser",
        // constructors
        BorderContainer, ContentPane, EditorSession, Tools,
        /** @const
            @type{!string} */
        EVENT_UNKNOWNERROR = "unknownError",
        /** @const
            @type {!string} */
        EVENT_METADATACHANGED = "metadataChanged";


    /**
     * @return {undefined}
     */
    function initTextEditor() {
        require([
            "dijit/layout/BorderContainer",
            "dijit/layout/ContentPane",
            "webodf/editor/EditorSession",
            "webodf/editor/Tools",
            "webodf/editor/Translator"],
            function (BC, CP, ES, T, Translator) {
                var locale = navigator.language || "en-US",
                    editorBase = dojo.config && dojo.config.paths && dojo.config.paths["webodf/editor"],
                    translationsDir = editorBase + '/translations',
                    t;

                BorderContainer = BC;
                ContentPane = CP;
                EditorSession = ES;
                Tools = T;

                // TODO: locale cannot be set by the user, also different for different editors
                t = new Translator(translationsDir, locale, function (editorTranslator) {
                    runtime.setTranslator(editorTranslator.translate);
                    // Extend runtime with a convenient translation function
                    runtime.translateContent = function (node) {
                        var i,
                            element,
                            tag,
                            placeholder,
                            translatable = node.querySelectorAll("*[text-i18n]");

                        for (i = 0; i < translatable.length; i += 1) {
                            element = translatable[i];
                            tag = element.localName;
                            placeholder = element.getAttribute('text-i18n');
                            if (tag === "label"
                                    || tag === "span"
                                    || /h\d/i.test(tag)) {
                                element.textContent = runtime.tr(placeholder);
                            }
                        }
                    };

                    defaultUserData.fullName = runtime.tr("Unknown Author");

                    isInitalized = true;
                    pendingInstanceCreationCalls.forEach(function (create) { create(); });
                });
            }
        );
    }

    /**
     * Creates a new record with userdata, and for all official fields
     * copies over the value from the original or, if not present there,
     * sets it to the default value.
     * @param {?Object.<!string,!string>|undefined} original, defaults to {}
     * @return {!Object.<!string,!string>}
     */
    function cloneUserData(original) {
        var result = {};

        if (!original) {
            original = {};
        }

        userDataFieldNames.forEach(function (fieldName) {
            result[fieldName] = original[fieldName] || defaultUserData[fieldName];
        });

        return result;
    }

    /**
     * @constructor
     * @param {!string} mainContainerElementId
     * @param {!Object.<!string,!*>} editorOptions
     */
    function TextEditor(mainContainerElementId, editorOptions) {
        instanceCounter = instanceCounter + 1;

        /**
        * Returns true if either all features are wanted and this one is not explicitely disabled
        * or if not all features are wanted by default and it is explicitely enabled
        * @param {?boolean|undefined} isFeatureEnabled explicit flag which enables a feature
        * @return {!boolean}
        */
        function isEnabled(isFeatureEnabled) {
            return editorOptions.allFeaturesEnabled ? (isFeatureEnabled !== false) : isFeatureEnabled;
        }

        var self = this,
            userData,
            //
            mainContainerElement = document.getElementById(mainContainerElementId),
            canvasElement,
            canvasContainerElement,
            toolbarElement,
            toolbarContainerElement, // needed because dijit toolbar overwrites direct classList
            editorElement,
            /** @const
                @type{!string} */
            canvasElementId = "webodfeditor-canvas" + instanceCounter,
            /** @const
                @type{!string} */
            canvasContainerElementId = "webodfeditor-canvascontainer" + instanceCounter,
            /** @const
                @type{!string} */
            toolbarElementId = "webodfeditor-toolbar" + instanceCounter,
            /** @const
                @type{!string} */
            editorElementId = "webodfeditor-editor" + instanceCounter,
            //
            mainContainer,
            tools,
            odfCanvas,
            //
            editorSession,
            session,
            //
            loadOdtFile = editorOptions.loadCallback,
            saveOdtFile = editorOptions.saveCallback,
            close =       editorOptions.closeCallback,
            //
            directTextStylingEnabled = isEnabled(editorOptions.directTextStylingEnabled),
            directParagraphStylingEnabled = isEnabled(editorOptions.directParagraphStylingEnabled),
            paragraphStyleSelectingEnabled = isEnabled(editorOptions.paragraphStyleSelectingEnabled),
            paragraphStyleEditingEnabled = isEnabled(editorOptions.paragraphStyleEditingEnabled),
            imageEditingEnabled = isEnabled(editorOptions.imageEditingEnabled),
            hyperlinkEditingEnabled = isEnabled(editorOptions.hyperlinkEditingEnabled),
            reviewModeEnabled = Boolean(editorOptions.reviewModeEnabled), // needs to be explicitly enabled
            annotationsEnabled = reviewModeEnabled || isEnabled(editorOptions.annotationsEnabled),
            undoRedoEnabled = isEnabled(editorOptions.undoRedoEnabled),
            zoomingEnabled = isEnabled(editorOptions.zoomingEnabled),
            //
            pendingMemberId,
            pendingEditorReadyCallback,
            //
            eventNotifier = new core.EventNotifier([
                EVENT_UNKNOWNERROR,
                EVENT_METADATACHANGED
            ]);

        runtime.assert(Boolean(mainContainerElement), "No id of an existing element passed to Wodo.createTextEditor(): "+mainContainerElementId);

        /**
         * @param {!Object} changes
         * @return {undefined}
         */
        function relayMetadataSignal(changes) {
            eventNotifier.emit(EVENT_METADATACHANGED, changes);
        }

        /**
         * @return {undefined}
         */
        function createSession() {
            var viewOptions = {
                    editInfoMarkersInitiallyVisible: false,
                    caretAvatarsInitiallyVisible: false,
                    caretBlinksOnRangeSelect: true
                };

            // create session around loaded document
            session = new ops.Session(odfCanvas);
            editorSession = new EditorSession(session, pendingMemberId, {
                viewOptions: viewOptions,
                directTextStylingEnabled: directTextStylingEnabled,
                directParagraphStylingEnabled: directParagraphStylingEnabled,
                paragraphStyleSelectingEnabled: paragraphStyleSelectingEnabled,
                paragraphStyleEditingEnabled: paragraphStyleEditingEnabled,
                imageEditingEnabled: imageEditingEnabled,
                hyperlinkEditingEnabled: hyperlinkEditingEnabled,
                annotationsEnabled: annotationsEnabled,
                zoomingEnabled: zoomingEnabled,
                reviewModeEnabled: reviewModeEnabled
            });
            if (undoRedoEnabled) {
                editorSession.sessionController.setUndoManager(new gui.TrivialUndoManager());
            }

            // Relay any metadata changes to the Editor's consumer as an event
            editorSession.sessionController.getMetadataController().subscribe(gui.MetadataController.signalMetadataChanged, relayMetadataSignal);

            // and report back to caller
            pendingEditorReadyCallback();
            // reset
            pendingEditorReadyCallback = null;
            pendingMemberId = null;
        }

        /**
         * @return {undefined}
         */
        function startEditing() {
            runtime.assert(editorSession, "editorSession should exist here.");

            tools.setEditorSession(editorSession);
            editorSession.sessionController.insertLocalCursor();
            editorSession.sessionController.startEditing();
        }

        /**
         * @return {undefined}
         */
        function endEditing() {
            runtime.assert(editorSession, "editorSession should exist here.");

            tools.setEditorSession(undefined);
            editorSession.sessionController.endEditing();
            editorSession.sessionController.removeLocalCursor();
        }

        /**
         * @param {!string} docUrl
         * @param {!function(!Error=):undefined} callback, passing an error object in case of error
         * @return {undefined}
         */
        function openDocumentFromUrl(docUrl, editorReadyCallback) {
            runtime.assert(docUrl, "document should be defined here.");
            runtime.assert(!pendingEditorReadyCallback, "pendingEditorReadyCallback should not exist here.");
            runtime.assert(!editorSession, "editorSession should not exist here.");
            runtime.assert(!session, "session should not exist here.");

            pendingMemberId = memberId;
            pendingEditorReadyCallback = function () {
                var op = new ops.OpAddMember();
                op.init({
                    memberid: memberId,
                    setProperties: userData
                });
                session.enqueue([op]);
                startEditing();
                if (editorReadyCallback) {
                    editorReadyCallback();
                }
            };

            odfCanvas.load(docUrl);
        }

        /**
         * Closes a single-user document, and does cleanup.
         * @param {!function(!Error=):undefined} callback, passing an error object in case of error
         * @return {undefined}
         */
        function closeDocument (callback) {
            runtime.assert(session, "session should exist here.");

            endEditing();

            var op = new ops.OpRemoveMember();
            op.init({
                memberid: memberId
            });
            session.enqueue([op]);

            session.close(function (err) {
                if (err) {
                    callback(err);
                } else {
                    editorSession.sessionController.getMetadataController().unsubscribe(gui.MetadataController.signalMetadataChanged, relayMetadataSignal);
                    editorSession.destroy(function (err) {
                        if (err) {
                            callback(err);
                        } else {
                            editorSession = undefined;
                            session.destroy(function (err) {
                                if (err) {
                                    callback(err);
                                } else {
                                    session = undefined;
                                    callback();
                                }
                            });
                        }
                    });
                }
            });
        }

        /**
         * @param {!function(err:?Error, !Uint8Array=):undefined} cb receiving zip as bytearray
         * @return {undefined}
         */
        function getDocumentAsByteArray(cb) {
            var odfContainer = odfCanvas.odfContainer();

            if (odfContainer) {
                odfContainer.createByteArray(function(ba) {
                    cb(null, ba);
                }, function(errorString) {
                    cb(new Error(errorString ? errorString : "Could not create bytearray from OdfContainer."));
                });
            } else {
                cb(new Error("No odfContainer set!"));
            }
        }

        /**
         * Sets the metadata fields from the given properties map.
         * Avoid setting certain fields since they are automatically set:
         *     dc:creator
         *     dc:date
         *     meta:editing-cycles
         * If you do wish to externally set these fields, try getting
         * the server backend (if any) to inject operations into the timeline
         * with the relevant properties.
         *
         * The following properties are never used and will be removed for semantic
         * consistency from the document:
         *     meta:editing-duration
         *     meta:document-statistic
         *
         * Setting any of the above mentioned fields using this method will have no effect.
         *
         * @param {?Object.<!string, !string>} setProperties A flat object that is a string->string map of field name -> value.
         * @param {?Array.<!string>} removedProperties An array of metadata field names (prefixed).
         * @return {undefined}
         */
        function setMetadata(setProperties, removedProperties) {
            runtime.assert(editorSession, "editorSession should exist here.");

            editorSession.sessionController.getMetadataController().setMetadata(setProperties, removedProperties);
        };

        /**
         * Returns the value of the requested document metadata field
         * @param {!string} property A namespace-prefixed field name, for example
         * dc:creator
         * @return {?string}
         */
        function getMetadata(property) {
            runtime.assert(editorSession, "editorSession should exist here.");

            return editorSession.sessionController.getMetadataController().getMetadata(property);
        };

        /**
         * @param {?Object.<!string,!string>|undefined} data
         * @return {undefined}
         */
        function setUserData(data) {
            userData = cloneUserData(data);
        }

        /**
         * @return {!Object.<!string,!string>}
         */
        function getUserData() {
            return cloneUserData(userData);
        }

        function translateToolbar() {
            var y = document.body.scrollTop;

            toolbarContainerElement.style.WebkitTransformOrigin = "center top";
            toolbarContainerElement.style.WebkitTransform = 'translateY(' + y + 'px)';
        }

        function repositionContainer() {
            canvasContainerElement.style.top = toolbarContainerElement.getBoundingClientRect().height + 'px';
        }

        /**
         * @return {undefined}
         */
        function setFocusToOdfCanvas() {
            editorSession.sessionController.getEventManager().focus();
        }

        /**
         * @param {!function(!Error=):undefined} callback, passing an error object in case of error
         * @return {undefined}
         */
        function destroyInternal(callback) {
            mainContainerElement.removeChild(editorElement);

            callback();
        }

        /**
         * @param {!function(!Error=):undefined} callback, passing an error object in case of error
         * @return {undefined}
         */
        function destroy(callback) {
            var destroyCallbacks = [];

            window.removeEventListener('scroll', translateToolbar);
            window.removeEventListener('focusout', translateToolbar);
            window.removeEventListener('touchmove', translateToolbar);
            window.removeEventListener('resize', repositionContainer);

            // TODO: decide if some forced close should be done here instead of enforcing proper API usage
            runtime.assert(!session, "session should not exist here.");

            // TODO: investigate what else needs to be done
            mainContainer.destroyRecursive(true);

            destroyCallbacks = destroyCallbacks.concat([
                tools.destroy,
                odfCanvas.destroy,
                destroyInternal
            ]);

            core.Async.destroyAll(destroyCallbacks, callback);
        }

        /////////////////////////////////////////////////////////////////////
        // Exposed API
        // make sure no data structures are shared, copy as needed
        //

        this.openDocumentFromUrl = openDocumentFromUrl;
        // this.openDocumentFromByteArray = openDocumentFromByteArray; see also https://github.com/kogmbh/WebODF/issues/375
        this.closeDocument = closeDocument;

        this.getDocumentAsByteArray = getDocumentAsByteArray;

        // setReadOnly: setReadOnly,

        this.setMetadata = setMetadata;
        this.getMetadata = getMetadata;

        this.setUserData = setUserData;
        this.getUserData = getUserData;

        this.addEventListener = eventNotifier.subscribe;
        this.removeEventListener = eventNotifier.unsubscribe;

        this.destroy = destroy;


        /**
         * @return {undefined}
         */
        function init() {
            var editorPane,
                /** @const
                    @type{!string} */
                documentns = document.documentElement.namespaceURI;

            /**
             * @param {!string} tagLocalName
             * @param {!string|undefined} id
             * @param {!string} className
             * @return {!Element}
             */
            function createElement(tagLocalName, id, className) {
                var element;
                element = document.createElementNS(documentns, tagLocalName);
                if (id) {
                    element.id = id;
                }
                element.classList.add(className);
                return element;
            }

            // create needed tree structure
            canvasElement = createElement('div', canvasElementId, "webodfeditor-canvas");
            canvasContainerElement = createElement('div', canvasContainerElementId, "webodfeditor-canvascontainer");
            toolbarElement = createElement('span', toolbarElementId, "webodfeditor-toolbar");
            toolbarContainerElement = createElement('span', undefined, "webodfeditor-toolbarcontainer");
            editorElement = createElement('div', editorElementId, "webodfeditor-editor");

            // put into tree
            canvasContainerElement.appendChild(canvasElement);
            toolbarContainerElement.appendChild(toolbarElement);
            editorElement.appendChild(toolbarContainerElement);
            editorElement.appendChild(canvasContainerElement);
            mainContainerElement.appendChild(editorElement);

            // style all elements with Dojo's claro.
            // Not nice to do this on body, but then there is no other way known
            // to style also all dialogs, which are attached directly to body
            document.body.classList.add("claro");

            // create widgets
            mainContainer = new BorderContainer({}, mainContainerElementId);

            editorPane = new ContentPane({
                region: 'center'
            }, editorElementId);
            mainContainer.addChild(editorPane);

            mainContainer.startup();

            tools = new Tools(toolbarElementId, {
                onToolDone: setFocusToOdfCanvas,
                loadOdtFile: loadOdtFile,
                saveOdtFile: saveOdtFile,
                close: close,
                directTextStylingEnabled: directTextStylingEnabled,
                directParagraphStylingEnabled: directParagraphStylingEnabled,
                paragraphStyleSelectingEnabled: paragraphStyleSelectingEnabled,
                paragraphStyleEditingEnabled: paragraphStyleEditingEnabled,
                imageInsertingEnabled: imageEditingEnabled,
                hyperlinkEditingEnabled: hyperlinkEditingEnabled,
                annotationsEnabled: annotationsEnabled,
                undoRedoEnabled: undoRedoEnabled,
                zoomingEnabled: zoomingEnabled,
                aboutEnabled: true
            });

            odfCanvas = new odf.OdfCanvas(canvasElement);
            odfCanvas.enableAnnotations(annotationsEnabled, true);

            odfCanvas.addListener("statereadychange", createSession);

            // fullscreen pinch-zoom adaption TODO: turn this into a helper class
            repositionContainer();

            window.addEventListener('scroll', translateToolbar);
            window.addEventListener('focusout', translateToolbar);
            window.addEventListener('touchmove', translateToolbar);
            window.addEventListener('resize', repositionContainer);

            setUserData(editorOptions.userData);
        }

        init();
    }

    function loadDojoAndStuff(callback) {
        var head = document.getElementsByTagName("head")[0],
            link;

        link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = installationPath + "/app/resources/app.css";
        link.type = "text/css";
        link.async = false;
        link.onload = function() {
            var link;
            link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = installationPath + "/wodotexteditor.css";
            link.type = "text/css";
            link.async = false;
            link.onload = function() {
                var script;
                script = document.createElement("script");
                script.src = installationPath + "/dojo-amalgamation.js";
                script["data-dojo-config"] = "async: true";
                script.charset = "utf-8";
                script.type = "text/javascript";
                script.async = false;
                script.onload = function() {
                    var script;
                    script = document.createElement("script");
                    script.src = installationPath + "/webodf.js";
                    script.charset = "utf-8";
                    script.type = "text/javascript";
                    script.async = false;
                    script.onload = callback;
                    head.appendChild(script);
                };
                head.appendChild(script);
            };
            head.appendChild(link);
        };
        head.appendChild(link);
    }

    /**
     * @param {!string} mainContainerElementId
     * @param {!Object.<!string,!*>} editorOptions
     * @param {!function(err:?Error, editor:!TextEditor=):undefined} onEditorCreated
     * @return {undefined}
     */
    function createTextEditor(mainContainerElementId, editorOptions, onEditorCreated) {
        /**
         * @return {undefined}
         */
        function create() {
            var editor = new TextEditor(mainContainerElementId, editorOptions);
            onEditorCreated(null, editor);
        }

        if (!isInitalized) {
            pendingInstanceCreationCalls.push(create);
            // first request?
            if (pendingInstanceCreationCalls.length === 1) {
                if (String(typeof WodoFromSource) === "undefined") {
                    loadDojoAndStuff(initTextEditor);
                } else {
                    initTextEditor();
                }
            }
        } else {
            create();
        }
    }

    // exposed API
    return {
        createTextEditor: createTextEditor,
        // flags
        EVENT_UNKNOWNERROR: EVENT_UNKNOWNERROR,
        EVENT_METADATACHANGED: EVENT_METADATACHANGED
    };
}());
