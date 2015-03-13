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

/*global require,process */

/*
 * usage: node .../webodf/tools/dojoNlsCompile.js $start l1 l2 l3 [...]
 *
 * $start must be the last argument containing a '/' character
 *   and shall point to the start of directory traversal.
 *
 * lx (l1, l2, l3) are locale-abbreviations for the languages of interest.
 */
(function() {
	"use strict";
	var path = require("path"),
		fs = require("fs"),
		log=function(x) {
		process.stderr.write(x);
		process.stderr.write("\n");
	},
	output_file,
	pathSeparatorTest = path.sep !== "/" ? /\// : /[\/\\]/,
	file_list = [],
	stat,
	start=process.argv[1],
	langs = process.argv;
	langs.shift(); // node interpreter
	// skip all arguments containing a path separator or a /
	// Need to cope with both as Windows can handle either one
	while (langs[0] && langs[0].match(pathSeparatorTest)) {
		start = langs.shift();
	}

	if (langs.length === 0) {
		log("usage: give languages as arguments!");
		return 0;
	}

	stat = fs.statSync(start);
	if (!(stat && stat.isDirectory())) {
		log("start of traversal is no directory: "+start);
		return 1;
	}
	log("start of traversal: "+start);
	log("filtering langs: "+langs.join(","));

	function lang_filter(nlsdir) {
		var langmatch = langs.join("|");
		if (nlsdir.match(/(uncompressed|consoleStripped)\.js$/)) {
			return false;
		}
		if (nlsdir.match(new RegExp("/nls/("+langmatch+")(/|$)"))) {
			return true;
		}
		if (nlsdir.match(new RegExp("/nls/[^/]*\\.js$"))) {
			// accept all files directly below a /nls/
			// (includes dojo_XX.js)
			return true;
		}
		if (nlsdir.match(new RegExp("/nls/.*/"))) {
			return false;
		}
		return true;
	}

	function traverse(dir, cb, nlsflag) {
		fs.readdir(dir, function (err, list) {
			if (err) {
				log("error causing early return from ["+dir+"].");
				cb.done(err);
				return;
			}
			var todo = list.length;
			if (todo === 0) {
				cb.done(null); // no error
				return;
			}
			list.forEach(function (entry) {
				var path = dir+"/"+entry;
				fs.stat(path, function(err, stat) {
					if (err) {
						log("stat error ["+path+"].");
						cb.done(err);
					} else if (stat && stat.isDirectory()) {
						if (lang_filter(path)) {
							traverse(path, {
								entry: cb.entry,
								done: function(res) {
									todo-=1;
									if (res !== null) {
										cb.done(res); // error downwards
									} else if (todo === 0) {
										cb.done(null); // no error
									}
								}
							}, nlsflag||(entry==='nls'));
						}
					} else {
						if (nlsflag && lang_filter(path)) {
							if (path.match(/\.js$/)) {
								cb.entry(path);
							}
						}
						todo-=1;
						if (todo === 0) {
							cb.done(null); // no error
						}
					}
				});
			});
		});
	}

	traverse(start, {
		entry: function(x) {
			file_list.push(x);
			log("adding to nls bundle: "+file_list.length+": "+x);
		},
		done: function() {
			log("finished nls traversal.");
			file_list.sort();
			file_list.forEach(
				function(x) {
					var data = fs.readFileSync(x);
					if (!data) {
						log("failed to read ["+x+"].");
						process.stdout.write("/* FAILED TO READ NLS BUNDLE ENTRY ["+x+"] */\n");
					} else {
						log("writing: "+x);
						// process.stdout.write("/* START OF NLS BUNDLE ENTRY ["+x+"] */\n");
						process.stdout.write(data);
						// process.stdout.write("\n/* END OF NLS BUNDLE ENTRY ["+x+"] */\n");
					}
				}
			);
		}
	});

}());

