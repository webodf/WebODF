var page = require('webpage').create(),
    fs = require('fs'),
    system = require('system'),
    address,
    outputPath;

/**
 * Return the relative file path.
 * @param {!string} path
 * @param {!string} ref reference path
 * @return {!string}
 */
function relativePath(path, ref) {
    var sep = fs.separator,
        rel = "",
        i,
        j;
    path = path.split(sep);
    ref = ref.split(sep);
    for (i = 0; i < path.length && i < ref.length; i += 1) {
        if (path[i] !== ref[i]) {
            break;
        }
    }
    for (j = i + 1; j < ref.length; j += 1) {
        rel += ".." + sep;
    }
    for (j = i; j < path.length - 1; j += 1) {
        rel += path[j] + sep;
    }
    rel += path[path.length - 1];
    return rel;
}

/**
 * Create a url to the file odf.html for loading an odf document.
 * @param {!string} scriptPath path of this script
 * @param {!string} odfPath path to the odf file
 * @return {!string}
 */
function createUrl(scriptPath, odfPath) {
    var sep = fs.separator,
        scriptDir,
        htmlPath;
    scriptPath = fs.absolute(scriptPath);
    scriptDir = scriptPath.substring(0, scriptPath.lastIndexOf(sep));
    htmlPath = fs.absolute(scriptDir + sep + ".." + sep + "odf.html");
    odfPath = fs.absolute(odfPath);
    odfPath = relativePath(odfPath, htmlPath);
    return "file://" + htmlPath + '#' + odfPath;
}

if (system.args.length !==  3) {
    console.log('Usage: ' + system.args[0] + ' odtfile pdffile');
    phantom.exit(1);
}

address = createUrl(system.args[0], system.args[1]);
console.log("Loading " + address);
outputPath = system.args[2];

page.onConsoleMessage = function (msg) {
    console.log(msg);
};

page.onCallback = function (viewPortPageOne) {
    if (!viewPortPageOne) {
        console.log("Error loading document.");
        phantom.exit(1);
    }
    page.paperSize = viewPortPageOne.page;
    page.render(outputPath);
    phantom.exit();
};

function renderPage() {
    var canvas = page.evaluate(function () {
        return document.odfcanvas;
    });
    if (!canvas) {
        return window.setTimeout(renderPage, 10);
    }
    page.evaluate(function () {
        var fons = "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
            stylens = "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
            officens = "urn:oasis:names:tc:opendocument:xmlns:office:1.0";
        function getPageSize() {
            // this is not pretty or correct, but it works ok for now
            var layout,
                r = { page: {} },
                i,
                layouts;
            layouts = document.getElementsByTagNameNS(stylens,
                "page-layout-properties");
            for (i = 0; i < layouts.length; i += 1) {
                layout = layouts.item(i);
                if (layout.hasAttributeNS(fons, "page-width")
                        && layout.hasAttributeNS(fons, "page-height")) {
                    r.page.width = layout.getAttributeNS(fons, "page-width");
                    r.page.height = layout.getAttributeNS(fons, "page-height");
                }
            }
            return r;
        }
        // at this point, the page may have already loaded fully
        if (document.odfcanvas.odfContainer().state === odf.OdfContainer.DONE
                && document.getElementsByTagNameNS(officens, "body").length) {
            window.callPhantom(getPageSize());
        } else {
            document.odfcanvas.addListener("statereadychange",
                function (container) {
                    if (container.state !== odf.OdfContainer.DONE) {
                        return window.callPhantom();
                    }
                    window.callPhantom(getPageSize());
                });
        }
    });
}

page.open(address, function (status) {
    if (status !== "success") {
        console.log(status);
        return phantom.exit(1);
    }
    // add a callback that returns when the document is loaded
    window.setTimeout(renderPage, 10);
    // set a timeout for when the document fails to load
    window.setTimeout(function () {
        console.log("Timeout loading document.");
        phantom.exit(1);
    }, 3000);
});
