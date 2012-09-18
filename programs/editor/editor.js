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
    document.odfCanvas.load(location);
    document.odfCanvas.setEditable(true);

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

    // Editor Widgets
    require(['widgets.js'], function () {
        document.odfCanvas.addListener("statereadychange", loadWidgets(document));
    });
}

window.onload = init;
