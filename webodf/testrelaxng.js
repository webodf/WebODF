/*global runtime dom*/
runtime.loadClass("dom.RelaxNG");

function validate(relaxng, url) {
    runtime.loadXML(url, function (err, dom) {
        var walker;
        if (err) {
            runtime.log("Could not read " + url + ": " + err);
        } else {
            walker = dom.createTreeWalker(dom.firstChild, 0xFFFFFFFF);
            relaxng.validate(walker, function (err) {
                if (err) {
                    var i;
                    runtime.log("Found " + err.length + " error validating " + url + ":");
                    for (i = 0; i < err.length; i += 1) {
                        runtime.log(err[i].message());
                    }
                }
            });
        }
    });
}

var relaxngurl = arguments[1],
    relaxng = new dom.RelaxNG(relaxngurl);

// loop over arguments to load ODF
var i;
for (i = 2; i < arguments.length; i += 1) {
    validate(relaxng, arguments[i]);
}
