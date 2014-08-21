# README

## Running the editor from the sources with the sample files

For trying the editor component with the sample files without building first,
serve the sources with an HTTP server and load the "src-*" variants of the HTML files in the "programs/editor" folder.


## Create a ZIP file to install the WebODF editor component Wodo.TextEditor

Make sure you have setup a build directory like described in the toplevel README.md.

Go to the toplevel directory of the build dir and call

    make product-wodotexteditor

If the build exists with success, you will find a file "wodotexteditor-x.y.z.zip"
(with "x.y.z" matching the version) in the toplevel directory of the build dir.

Take this ZIP file and unzip it in your target directories on the server.
Then read the HOWTO.md file included to learn how to use and adjust things.


## Dojo

While the WebODF library itself does not have any external dependency, the WebODF editor currently uses the Dojo Toolkit (http://dojotoolkit.org/)
to implement the toolbar and the dialogs. This requires some additional setup. There are two ways to access the needed parts of Dojo on loading the WebODF editor:
one is to use the "cloud" and get the files from Content Delivery Network (CDN) based on ajax.googleapis.com, the other is to put files with all needed content
on the server yourself.

### CDN solution

To get the Dojo files from the "cloud", put this snippet into the header of the HTML file which embeds the editor, before including any WebODF files:

    <head>
    <!-- ... -->

    <!-- dojo setup: start -->
    <script type="text/javascript" charset="utf-8">
      var basedir = window.location.pathname;
      basedir = basedir.substr(0, basedir.lastIndexOf("/"));
      dojoConfig = {
        paths: {
          "webodf/editor": basedir,
          "resources": basedir + "/resources"
        }
      }
    </script>

    <link rel="stylesheet" type="text/css"
    href="http://ajax.googleapis.com/ajax/libs/dojo/1.8.3/dojo/resources/dojo.css"/>
    <link rel="stylesheet" type="text/css"
    href="http://ajax.googleapis.com/ajax/libs/dojo/1.8.3/dijit/themes/claro/claro.css"/>
    <link rel="stylesheet" type="text/css"
    href="http://ajax.googleapis.com/ajax/libs/dojo/1.8.3/dojox/layout/resources/ExpandoPane.css"/>
    <link rel="stylesheet"
    href="http://ajax.googleapis.com/ajax/libs/dojo/1.8.3/dojox/widget/ColorPicker/ColorPicker.css"/>

    <script src="http://ajax.googleapis.com/ajax/libs/dojo/1.8.3/dojo/dojo.js"
      data-dojo-config="async: true"></script>
    <!-- dojo setup: end -->

    <!-- ... -->
    </head>

The entry for the key "webodf/editor" in the "paths" section of the "dojoConfig" points to the path where all the files of the WebODF editor installation are to be found.
If the HTML file embedding the editor is in a different location, add the relative path to the "basedir" value

    "webodf/editor": basedir + "/../webodfeditor",

The path for the  needs be given as absolute path, not relative. This is the reason for the calculation of the "basedir" from the "window.location.pathname".
If you have other ways to estimate it, just replace the calculation.

Using this solution means that you do not need the following subdirectories and their content: "app", "dijit", "dojox", "dojo".


### Compiled solution

When creating the editor component by calling "make product-wodotexteditor" in the build directory, also all files are collected which are needed to run the component
without needing 3rd-party servers. So instead of including lots of files from ajax.googleapis.com now the created files "dojo-amalgamation.js" and "app/resources/app.css"
are to be included as well as the subdirs "dijit", "dojox", and "dojo" to be registered by the respective keys in the "paths" section of "dojoConfig".

When using the Wodo.TextEditor component this is all automatically done, the following is just a reference what would have to be written:

    <head>
    <!-- ... -->

    <!-- dojo setup: start -->
    <script type="text/javascript" charset="utf-8">
        var usedLocale = "C";
        if (navigator && navigator.language && navigator.language.match(/^(ru|de)/)) {
            usedLocale = navigator.language.substr(0,2);
        }

        dojoConfig = {
            locale: usedLocale,
            // relative paths need to be relative to this html file path
            paths: {
                "webodf/editor": ".",
                "dijit": "dijit",
                "dojox": "dojox",
                "dojo": "dojo",
                "resources": "resources"
            }
        }
    </script>

    <script src="dojo-amalgamation.js" data-dojo-config="async: true"></script>
    <link rel="stylesheet" type="text/css" href="app/resources/app.css"/>
    <!-- dojo setup: end -->

    <!-- ... -->
    </head>

## F.A.Q.

1. How can I use the collab editor?

 The WebODF sources include only client-side files, no code for servers. There are abstraction layers in WebODF to support any server or P2P systems.
 Currently there is one backend support by the files in "programs/editor/backend/pullbox", which implement the client-side part of
 the communication as used for "ownCloud Documents".

2. Is there a Free Software collaboration server for WebODF-based editing?

 There is "ownCloud Documents" (https://github.com/ownCloud/Documents).
 KO GmbH will be happy to get funding to implement other Free Software server or P2P solutions.
