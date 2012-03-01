var ZipPlugin = {
loadAsString: function(zippath, entrypath, success, fail) {
    return PhoneGap.exec(success, fail, "ZipClass", "loadAsString", [zippath, entrypath]);
}
};
core.Zip = function (url, entriesReadCallback) {
    // remove 'odf:' prefix
    url = url.substr(4);
    this.load = function () { alert("load"); };
    /**
     * @param {!string} filename
     * @param {!function(?string, ?string)} callback receiving err and data
     * @return {undefined}
     */
    this.loadAsString = function (filename, callback) {
        alert(url);
        ZipPlugin.loadAsString(url, "content.xml",
                                 function (content) { alert(content); },
                                 function (err) { alert("boo " + err); }
                                 );
        //alert("loadAsString " + filename);
    };
    this.getEntries = function () {
        alert("getEntries");
    };
    this.loadContentXmlAsFragments = function () {
        alert("O");
    };
    this.save = function () {
        alert("save");
    };
    this.write = function () {
        alert("write");
    };
    entriesReadCallback(null, this);
};


