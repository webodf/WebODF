var xhr = new XMLHttpRequest();
xhr.open("GET", "../../webodf/lib/runtime.js", false);
xhr.send(null);
eval(xhr.responseText);
