/*global require console process*/
/* A Node.JS http server*/
var sys = require("sys"),
    http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");

http.createServer(function (request, response) {
    var uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd(), uri);
    console.log(request.method + " " + url + " " + uri + " " + filename);
    function put() {
        var alldata = "";
        request.on("data", function (data) {
            alldata += data;
        });
        request.on("end", function () {
            fs.writeFile(filename, alldata, "binary", function (err) {
                // todo: add error handling
                response.writeHead(200);
                response.end();
            });
        });
    }
    if (request.method === "PUT") {
        put(request, response);
        return;
    }
    fs.stat(filename, function (err, stats) {
        if (!err && stats.isFile()) {
            fs.readFile(filename, "binary", function (err, file) {
                if (err) {
                    response.writeHead(500, {"Content-Type": "text/plain"});
                    response.write(err + "\n");
                    response.end();
                    return;
                }
                response.writeHead(200);
                response.write(file, "binary");
                response.end();
            });
        } else if (!err && stats.isDirectory()) {
            if (uri.length === 0 || uri[uri.length - 1] !== "/") {
                response.writeHead(301, {"Content-Type": "text/plain",
                        "Location": uri + "/"});
                response.write("Moved permanently\n");
                response.end();
                return;
            }
            fs.readdir(filename, function (err, files) {
                if (err) {
                    response.writeHead(500, {"Content-Type": "text/plain"});
                    response.write(err + "\n");
                    response.end();
                    return;
                }
                response.writeHead(200);
                response.write("<html><head><title></title></head><body>");
                var i, l = files.length, file;
                for (i = 0; i < l; i += 1) {
                    file = files[i].replace("&", "&amp;")
                            .replace("<", "&gt;");
                    response.write("<a href=\"");
                    response.write(file);
                    response.write("\">");
                    response.write(file.replace("\"", "\\\""));
                    response.write("</a>\n");
                }
                response.write("</body></html>\n");
                response.end();
            });
        } else {
            console.log("Not found: " + uri);
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.write("404 Not Found\n");
            response.end();
        }
    });
}).listen(8123);

console.log('Server running at http://127.0.0.1:8123/');
