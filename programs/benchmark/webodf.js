var xhr = new XMLHttpRequest(),
    code;
xhr.open("GET", "../../webodf/lib/runtime.js", false);
xhr.send(null);
code = xhr.responseText;
code += "\n//# sourceURL=../../webodf/lib/runtime.js";
code += "\n//@ sourceURL=../../webodf/lib/runtime.js"; // Chrome
eval(code);
