/*global window, console, require*/
var exec = require('cordova/exec');
Object.defineProperty(window, "startUrl", {enumerable: false,
    configurable: false,
    get: function () {
        "use strict";
        var url = null;
        exec(
            function (u) {
                url = u;
            },
            function (error) {
                console.log(error);
            },
            "StartURL",
            "startUrl",
            []
        );
        return url;
    }});
