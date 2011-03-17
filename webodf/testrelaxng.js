/*global runtime dom*/
runtime.loadClass("dom.RelaxNG");

function validate(relaxng, url) {
    runtime.log("validate " + url);
    runtime.loadXML(url, function (err, dom) {
        var walker;
        runtime.log("loaded " + err + " " + dom);
        if (err) {
            runtime.log("Could not read " + url + ": " + err);
        } else {
            walker = dom.createTreeWalker(dom.documentElement, 0xFFFFFFFF);
            relaxng.validate(walker, function (err) {
                if (err) {
                    runtime.log(err);
                }
                runtime.log("validated " + err + " " + dom);
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
