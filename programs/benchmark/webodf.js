var xhr = new XMLHttpRequest(),
    path = "../../webodf/lib",
    runtimeFilePath = path + "/runtime.js",
    code;

xhr.open("GET", runtimeFilePath, false);
xhr.send(null);
code = xhr.responseText;
code += "\n//# sourceURL=" + runtimeFilePath;
code += "\n//@ sourceURL=" + runtimeFilePath; // Chrome
eval(code);

// adapt for out-of-sources run
runtime.currentDirectory = function () {
    return path;
};
runtime.libraryPaths = function () {
    return [path];
};
