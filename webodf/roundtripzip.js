/*global runtime core*/
runtime.loadClass("core.Zip");

/**
 * Load an ODF document. Report an error if there is a problem.
 */
function roundTripZip(zipfilepath) {
    var zip = new core.Zip(zipfilepath, function (err, zip) {
        if (err) {
            runtime.log(err);
            runtime.exit(1);
        }
        // the TOC of the zip is loaded at this point
        // now we want to load all parts in memory so we can save them again
        zip.write(function (err) {
            if (err) {
                runtime.log(err);
                runtime.exit(1);
            }
            // at this point a zip file should have been written with the same
            // contents as the one that was read
            runtime.exit(0);
        });
    });
}

// loop over arguments to load ODF
var i;
for (i = 1; i < arguments.length; i += 1) {
    roundTripZip(arguments[i]);
}
