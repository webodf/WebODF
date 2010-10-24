/*global XMLHttpRequest*/
var require = (function () {
    var cache = {};

    function safeEval(code) {
        // hide global identifiers
        var window, document, XMLHttpRequest,
        // hide local identifiers
            cache,
            exports = {};
        eval(code);
        return exports;
    }

    function require(modulepath) {
        var xmlHttp = new XMLHttpRequest(),
            module;
        if (modulepath in cache) {
            return cache[modulepath];
        }
        xmlHttp.open("GET", modulepath, false);
        xmlHttp.overrideMimeType("text/javascript");
        xmlHttp.send(null);
        module = safeEval(xmlHttp.responseText);
        cache[modulepath] = module;
        return module;
    }

    return require;
}());
