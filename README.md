## WebODF

WebODF is a JavaScript library created by [KO GmbH](http://kogmbh.com).

It makes it easy to add Open Document Format (ODF) support to your website and to your mobile or desktop application. It uses HTML and CSS to display ODF documents.

* Visit the project homepage at: [WebODF](http://webodf.org)
* Want some live demos? Visit: [WebODF Demos](http://webodf.org/demos/)
* Get in contact, by the [mailing list](https://lists.opendocsociety.org/mailman/listinfo/webodf) or IRC (#webodf auf freenode, [Web access](http://webchat.freenode.net/?nick=webodfcurious_gh&channels=webodf))

### License

WebODF is a Free Software project. All code is available under the AGPL.

If you are interested in using WebODF in your commercial product
(and do not want to disclose your sources / obey AGPL),
contact [KO GmbH](http://kogmbh.com) for a commercial license.


### Creating webodf.js

webodf.js is compiled by using the Closure Compiler. This compiler concatenates and compacts all JavaScript files, so that they are smaller and execute faster. CMake is used to setup the buildsystem, so webodf.js can be created:

    git clone https://github.com/kogmbh/WebODF.git webodf
    mkdir build
    cd build
    cmake ../webodf
    make webodf.js-target

A successfull run will yield the file "webodf.js" in the subfolder "build/webodf/" (among other things), from where you can then copy it and use for your website.

For building webodf.js on Windows please study "README-Windows.md".
