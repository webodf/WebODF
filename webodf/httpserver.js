/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global require, console, process, Buffer, unescape*/

/* A Node.JS http server*/
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    lookForIndexHtml = true,
    ipaddress = "127.0.0.1",
    port = 8124;

function statFile(dir, filelist, position, callback) {
    "use strict";
    if (position >= filelist.length) {
        return callback(null, filelist);
    }
    fs.stat(dir + "/" + filelist[position], function (err, stats) {
        if (stats && stats.isDirectory()) {
            filelist[position] = filelist[position] + "/";
        }
        statFile(dir, filelist, position + 1, callback);
    });
}

function listFiles(dir, callback) {
    "use strict";
    fs.readdir(dir, function (err, files) {
        if (err) {
            return callback(err);
        }
        statFile(dir, files, 0, callback);
    });
}

http.createServer(function (request, response) {
    "use strict";
    var uri = unescape(url.parse(request.url).pathname),
        filename = path.join(process.cwd(), uri);
    if (uri !== '/favicon.ico') {
        console.log(request.method + " " + uri);
    }
    function put() {
        var contentlength = parseInt(request.headers["content-length"], 10),
            alldata = new Buffer(contentlength),
            sum = 0;
        request.on("data", function (data) {
            data.copy(alldata, sum, 0);
            sum += data.length;
        });
        request.on("end", function () {
            fs.writeFile(filename, alldata, "binary", function (err) {
                if (err) {
                    response.writeHead(500);
                    response.write(err);
                } else {
                    response.writeHead(200);
                }
                response.end();
            });
        });
    }
    if (request.method === "PUT") {
        put(request, response);
        return;
    }
    if (request.method === "DELETE") {
        fs.unlink(filename, function (err) {
            if (err) {
                response.writeHead(500);
            } else {
                response.writeHead(200);
            }
            response.end();
        });
        return;
    }

    function setContentTypeInHead(head, filename) {
        var contentTypeLookupTable = [
                {ext: [".js"],          type: "text/javascript"},
                {ext: [".css"],         type: "text/css"},
                {ext: [".odt"],         type: "application/vnd.oasis.opendocument.text"},
                {ext: [".fodt"],        type: "application/vnd.oasis.opendocument.text-flat-xml"},
                {ext: [".ott"],         type: "application/vnd.oasis.opendocument.text-template"},
                {ext: [".odp"],         type: "application/vnd.oasis.opendocument.presentation"},
                {ext: [".fodp"],        type: "application/vnd.oasis.opendocument.presentation-flat-xml"},
                {ext: [".otp"],         type: "application/vnd.oasis.opendocument.presentation-template"},
                {ext: [".ods"],         type: "application/vnd.oasis.opendocument.spreadsheet"},
                {ext: [".fods"],        type: "application/vnd.oasis.opendocument.spreadsheet-flat-xml"},
                {ext: [".ots"],         type: "application/vnd.oasis.opendocument.spreadsheet-template"},
                {ext: [".json"],        type: "application/json"},
                {ext: [".txt"],         type: "text/plain; charset=utf-8"},
                {ext: [".html"],        type: "text/html; charset=utf-8"},
                {ext: [".xhtml"],       type: "application/xhtml+xml; charset=utf-8"},
                {ext: [".xml"],         type: "text/xml; charset=utf-8"},
                {ext: [".ttf"],         type: "application/x-font-ttf"},
                {ext: [".jpg",".jpeg"], type: "image/jpeg"},
                {ext: [".gif"],         type: "image/gif"},
                {ext: [".png"],         type: "image/png"}
            ];

        contentTypeLookupTable.some(function (contentTypeEntry) {
            return contentTypeEntry.ext.some(function (ext) {
                if (filename.substr(-ext.length) === ext) {
                    head["Content-Type"] = contentTypeEntry.type;
                    return true;
                }
                return false;
            });
        });
    }
    function handleStat(err, stats, lookForIndexHtml) {
        if (!err && stats.isFile()) {
            fs.readFile(filename, "binary", function (err, file) {
                if (err) {
                    response.writeHead(500, {"Content-Type": "text/plain"});
                    if (request.method !== "HEAD") {
                        response.write(err + "\n");
                    }
                    response.end();
                    return;
                }
                var head = {"Content-Length": stats.size};
                setContentTypeInHead(head, filename);
                response.writeHead(200, head);
                if (request.method !== "HEAD") {
                    response.write(file, "binary");
                }
                response.end();
            });
        } else if (!err && stats.isDirectory()) {
            if (lookForIndexHtml) {
                fs.stat(filename + "/index.html", function (err, stats) {
                    if (err) {
                        fs.stat(filename, handleStat);
                    } else {
                        filename = filename + "/index.html";
                        handleStat(err, stats);
                    }
                });
                return;
            }
            if (uri.length === 0 || uri[uri.length - 1] !== "/") {
                response.writeHead(301, {"Content-Type": "text/plain",
                        "Location": uri + "/"});
                if (request.method !== "HEAD") {
                    response.write("Moved permanently\n");
                }
                response.end();
                return;
            }
            listFiles(filename, function (err, files) {
                if (err) {
                    response.writeHead(500, {"Content-Type": "text/plain"});
                    if (request.method !== "HEAD") {
                        response.write(err + "\n");
                    }
                    response.end();
                    return;
                }
                response.writeHead(200);
                if (request.method !== "HEAD") {
                    files.sort();
                    response.write("<html><head><title></title></head><body>");
                    response.write("<table>");
                    var i, l = files.length, file;
                    for (i = 0; i < l; i += 1) {
                        file = files[i];
                        if (file.length > 0 && file[file.length - 1] === '/') {
                            file = encodeURIComponent(file.slice(0, file.length - 1)) + "/";
                        } else {
                            file = encodeURIComponent(file);
                        }
                        response.write("<tr><td><a href=\"");
                        response.write(file);
                        response.write("\">");
                        file = files[i].replace("&", "&amp;")
                                .replace("<", "&gt;");
                        response.write(file.replace("\"", "\\\""));
                        response.write("</a></td></tr>\n");
                    }
                    response.write("</table></body></html>\n");
                }
                response.end();
            });
        } else {
            if (uri !== '/favicon.ico') {
                console.log("Not found: " + uri);
            }
            response.writeHead(404, {"Content-Type": "text/plain"});
            if (request.method !== "HEAD") {
                response.write("404 Not Found\n");
            }
            response.end();
        }
    }
    fs.stat(filename, function (err, stats) {
        handleStat(err, stats, lookForIndexHtml);
    });
}).listen(port, ipaddress);

console.log('Server running at http://' + ipaddress + ':' + port + '/');
