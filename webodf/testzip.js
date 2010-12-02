/*global runtime core*/
runtime.loadClass("core.Zip");
runtime.loadClass("core.Async");

var async = new core.Async();

/**
 * @param {!core.Zip.ZipEntry} entry
 * @param {!core.Zip} zip
 * @param {function(?string):undefined} callback
 * @return {undefined}
 */
function copyEntry(entry, zip, callback) {
    entry.load(function (err, data) {
        if (err) {
            callback(err);
        } else {
            zip.save(entry.filename, data, false, entry.date);
            callback(null);
        }
    });
}

/**
 * @param {!core.Zip} zipa
 * @param {!core.Zip} zipb
 * @param {function(?string):undefined} callback
 * @return {undefined}
 */
function compareZips(zipa, zipb, callback) {
    var entriesa = zipa.getEntries(),
        l = entriesa.length,
        entriesb = zipb.getEntries(),
        i, j, entrya, entryb;
    // compare the number of entries
    if (entriesb.length !== l) {
        callback("Number of entries is not equal.");
        return;
    }
    // compare the meta data of the entries
    for (i = 0; i < l; i += 1) {
        entrya = entriesa[i];
        for (j = 0; j < l; j += 1) {
            entryb = entriesb[j];
            if (entrya.filename === entryb.filename) {
                break;
            }
        }
        if (j === l) {
            callback("Entry " + entrya.filename + " is not present in the " +
                    "second zip file.");
            return;
        }
        if (entrya.date.valueOf() !== entryb.date.valueOf()) {
            callback("Dates for entry " + entrya.filename + " is not equal: " +
                entrya.date + " vs " + entryb.date);
            return;
        }
    }
    // compare the data in the entries
    async.forEach(entriesa, function (entry, callback) {
        entry.load(function (err, dataa) {
            if (err) {
                callback(err);
                return;
            }
            zipb.load(entry.filename, function (err, datab) {
                if (err) {
                    callback(err);
                    return;
                }
                var i = 0, l = dataa.length;
                if (dataa !== datab) {
                    for (i = 0; i < l && dataa[i] === datab[i]; i += 1) {}
                    callback("Data is not equal for " + entry.filename +
                            " at position " + i + ": " + dataa.charCodeAt(i) +
                            " vs " + datab.charCodeAt(i) + ".");
                } else {
                    callback(null);
                }
            });
        });
    }, function (err) {
        callback(err);
    });
}

function testZip(filepatha, callback) {
    var zipa = new core.Zip(filepatha, function (err, zipa) {
        if (err) {
            runtime.log(err);
            runtime.exit(1);
            return;
        }
        // open a new zip file and copy all entries from zipa to zipb
        var filepathb = "tmp323.zip",
            zipb = new core.Zip(filepathb, null),
            entries = zipa.getEntries(),
            i, entriesDone = 0;
        async.forEach(entries, function (entry, callback) {
            copyEntry(entry, zipb, callback);
        }, function (err) {
            if (err) {
                callback(err);
                return;
            }
            zipb.write(function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                zipb = new core.Zip(filepathb, function (err, zipb) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    compareZips(zipa, zipb, callback);
                });
            });
        });
    });
}

var args = arguments;
// open the arguments one by one, save them to a file, then open again and see
// if the contents matches
function doit(i) {
    if (i >= args.length) {
        return;
    }
    testZip(args[i], function (err) {
        runtime.log(args[i]);
        if (err) {
            runtime.log(err);
            return;
        }
        i += 1;
        if (i < args.length) {
            doit(i);
        }
    });
}
doit(1);
