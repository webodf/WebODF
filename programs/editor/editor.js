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
runtime.currentDirectory = function () {
    return "../../webodf/lib";
};
runtime.libraryPaths = function () {
    return [ runtime.currentDirectory() ];
};

function init() {
    runtime.loadClass('odf.OdfCanvas');

    // If the URL has a fragment (#...), try to load the file it represents
    var location = String(document.location),
        pos = location.indexOf('#'),
        odfElement = document.getElementById("canvas");
    document.odfCanvas = new odf.OdfCanvas(odfElement);

    if (pos === -1 || !window) {
        return;
    }

    location = location.substr(pos + 1);

    // Editor Widgets and Avatars
    document.odfCanvas.addListener("statereadychange", function() {
            runtime.setTimeout(function() {
                loadWidgets(document);
                loadAvatars(document, document.getElementById('peopleList'));
            }, 100);
    });

    document.odfCanvas.load(location);
    document.odfCanvas.setEditable(false);

    var filename = location.replace(/^.*[\\\/]/, '');
    document.getElementById('topPane').innerHTML = "<h1> <a href = '" + location + "''>" + filename + "</a></h1>";

    // App Widgets
    require(["dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dojox/layout/ExpandoPane"], function(BorderContainer, ContentPane, ExpandoPane) {
        var mainContainer = new BorderContainer({}, 'mainContainer');
        var collabContainer = new BorderContainer({}, 'collabContainer');

        var topPane = new ContentPane({
            region: 'top'
        }, 'topPane');
        var editorPane = new ContentPane({
            region: 'center'
        }, 'editor');
        var collabPane = new ExpandoPane({
            region: 'trailing',
            splitter: 'true',
            title: 'Collaboration Pane'
        }, 'collaboration');
        var peoplePane = new ContentPane({
            region: 'top',
            splitter: 'true',
            title: 'People'
        }, 'people');
        var chatPane = new ContentPane({
            region: 'center',
            title: 'Chat'
        }, 'chat');

        mainContainer.addChild(topPane);
        mainContainer.addChild(editorPane);
        mainContainer.addChild(collabPane);
        collabContainer.addChild(peoplePane);
        collabContainer.addChild(chatPane);
        collabPane.addChild(collabContainer);

        mainContainer.startup();
        collabContainer.startup();

        require(["dijit/form/TextBox", "dijit/form/Button"], function(TextBox, Button) {
            // People Box

            // User's Editable Name
            var nameBox = new TextBox({
                value: '',
                placeHolder: 'Type your name...',
                style: 'text-align: center;'
            }, 'nameEdit');
            
            var inviteButton = new Button({
                label: 'Invite People',
            }, 'inviteButton');

            // Chat Box

            // Chat Input
            var chatInput = new TextBox({
                value: '',
                placeHolder: 'Start typing to chat...',
                style: 'text-align: center;'
            }, 'chatInput');
        });

    });
}

window.onload = init;
