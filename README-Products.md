## Products

The WebODF repository not only contains sources for the library webodf.js, but also a few products based on it. This is the complete list of products that can be created ("x.y.z" is a placeholder for the actual version number):


### webodf.js library with API documentation

This product bundles the file webodf.js, the debug version webodf-debug.js and API documentation into one zip file.

With a prepared setup for building, you execute this command:

    make product-library

This creates a file "webodf.js-x.y.z.zip" in the same folder, which can be copied and unzipped on a system where you want to develop using the webodf.js library.

Download the latest officially released version from the [WebODF homepage](http://webodf.org/download).


### Wodo.TextEditor component

For those who want to get an OpenDocument Text editor with just a few lines of JavaScript in their HTML5 app, the component Wodo.TextEditor is the right choice.

This product bundles a [HOWTO](https://github.com/kogmbh/WebODF/blob/master/programs/editor/HOWTO-wodotexteditor.md), example files, API documentation and a subdirectory with all files belonging to the component in one zip file.

With a prepared setup for building, you execute this command:

    make product-wodotexteditor

It creates a file "wodotexteditor-x.y.z.zip", which can be copied and used on a system where you want to develop using the component.
Unzip it there and read the included HOWTO.md file.

See the online demo on [webodf.org/demo](http://webodf.org/demo) and download the latest officially released version from the [WebODF homepage](http://webodf.org/download).


### Wodo.CollabTextEditor component

For those who want to get an OpenDocument Text editor for collaborative editing in their HTML5 app, the component Wodo.CollabTextEditor is a good choice.

There is currently no documentation for it, besides what is in the code. Wodo.CollabTextEditor is not a complete solution itself, but has some abstraction layers which have to be implemented by adapters to the respective server systems. See the demo file ["splitscreeneditor.js"](programs/editor/splitscreeneditor.js) for an example application by a client-side server with an example adapter.
This product bundles a subdirectory with all files belonging to the component in one zip file.

With a prepared setup for building, you execute this command:

    make product-wodocollabtexteditor

It creates a file "wodocollabtexteditor-x.y.z.zip", which can be copied and used on a system where you want to develop using the component.
Unzip it there and move the subdirectory "wodo" to your deployment.

Download the latest officially released version from the [WebODF homepage](http://webodf.org/download).


### Firefox Add-on ODF Viewer

This Firefox add-on enables to view files in the OpenDocument format directly in your Firefox browser, without installing a big office suite.

With a prepared setup for building, you execute this command:

    make product-firefoxextension

This creates a file "firefox-extension-odfviewer-x.y.z.xpi", which can be directly installed as add-on in Firefox browsers.

Download and install the latest officially released version from [Mozilla's Add-on website](https://addons.mozilla.org/firefox/addon/webodf/).
