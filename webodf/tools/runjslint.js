/*global runtime core*/
runtime.loadClass("core.JSLint");

function checkWithJSLINT(file) {
    var i, jslint = new core.JSLint().JSLINT,
        jslintconfig = {
            bitwise: true,
            newcap: true,
            nomen: true,
            onevar: true,
            passfail: false,
            plusplus: true,
            regexp: true,
            undef: true,
        //    white: true,
            indent: 4,
            maxerr: 50
         //   maxlen: 80
        },
        data, result, err;

    // these files are an exception for now
    if (file === "lib/core/RawDeflate.js" ||
            file === "lib/core/RawInflate.js") {
        return;
    }
        
    data = runtime.readFileSync(file, "utf-8");
    result = jslint(data, jslintconfig);
    if (!result) {
        for (i = 0; i < jslint.errors.length && jslint.errors[i]; i += 1) {
            err = jslint.errors[i];
            runtime.log(file + ":" + err.line + ":" + err.character +
                ": error: " + err.reason);
        }
        runtime.exit(1);
    }
}

var i;
for (i = 0; i < arguments.length; i += 1) {
    checkWithJSLINT(arguments[i]);
}
