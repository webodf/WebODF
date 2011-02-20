/*global runtime core odf*/
runtime.loadClass("odf.OdfContainer");

function exitOnInvalid(odffilepath, odfcontainer) {
    if (odfcontainer.state === odf.OdfContainer.INVALID) {
        runtime.log("Document " + odffilepath + " is invalid.");
        runtime.exit(1);
    }
}

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
