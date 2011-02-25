/*global runtime core odf*/
runtime.loadClass("odf.OdfContainer");

/**
 * If the state of the OdfContainer is invalid, exit with an error message.
 */
function exitOnInvalid(odffilepath, odfcontainer) {
    if (odfcontainer.state === odf.OdfContainer.INVALID) {
        runtime.log("Document " + odffilepath + " is invalid.");
        runtime.exit(1);
    }
    if (odfcontainer.state === odf.OdfContainer.DONE) {
        odfcontainer.save(function (err) {
            if (err) {
                runtime.log(err);
                runtime.exit(1);
            }
        });
    }
}

/**
 * Load an ODF document. Report an error if there is a problem.
 */
function loadODF(odffilepath) {
    var odfcontainer = new odf.OdfContainer(odffilepath);
    odfcontainer.onstatereadychange = function () {
        exitOnInvalid(odffilepath, odfcontainer);
    };
    exitOnInvalid(odffilepath, odfcontainer);
}

// loop over arguments to load ODF
var i;
for (i = 1; i < arguments.length; i += 1) {
    loadODF(arguments[i]);
}
