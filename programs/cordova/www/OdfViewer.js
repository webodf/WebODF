/**
 * Copyright (C) 2014-2015 KO GmbH <copyright@kogmbh.com>
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
/*global FileScanner, window, DirectoryEntry, FileScannerEntry, FileScannerFileEntry, Blob, XMLHttpRequest, odf, console, WebKitBlobBuilder, navigator, runtime, FileReader, Uint8Array, endsWith*/

/**
 * Remove all child nodes from an element.
 * @param {!Element} element
 * @return {undefined}
 */
function makeElementEmpty(element) {
    "use strict";
    while (element.lastChild) {
        element.removeChild(element.lastChild);
    }
}

/**
 * Prevent an element from propagating.
 * This function detects and calls the various methods by which event
 * propagation can be stopped in various browsers.
 *
 * @param {!Event|null} evt
 * @return {!boolean}
 */
function claimEvent(evt) {
    "use strict";
    if (evt) {
        if (evt.preventDefault) {
            evt.preventDefault();
        }
        if (evt.stopImmediatePropagation) {
            evt.stopImmediatePropagation();
        }
        if (evt.stopPropagation) {
            evt.stopPropagation();
        }
    }
    return false;
}

(function () {
    "use strict";
    if (window.cordova.platformId !== "firefoxos") {
        return;
    }
    var sdcard = navigator.getDeviceStorage("sdcard"),
        read = runtime.read,
        getFileSize = runtime.getFileSize;
    runtime.read = function (path, offset, length, callback) {
        if (path.indexOf("/sdcard/") !== 0) {
            return read(path, offset, length, callback);
        }
        var request = sdcard.get(path);
        request.onsuccess = function () {
            var file = /**@type{!File}*/(request.result),
                reader = new FileReader();
            reader.onload = function () {
                var d = new Uint8Array(/**@type{!ArrayBuffer}*/(reader.result), offset, length);
                callback(null, d);
            };
            reader.onerror = function () {
                callback("error", null);
            };
            try {
                reader.readAsArrayBuffer(file);
            } catch (/**@type{*}*/e) {
                callback("error " + e, null);
            }
        };
        request.onerror = function () {
            callback(request.error.name, null);
        };
    };
    runtime.getFileSize = function (path, callback) {
        if (path.indexOf("/sdcard/") !== 0) {
            return getFileSize(path, callback);
        }
        var request = sdcard.get(path);
        request.onsuccess = function () {
            var file = /**@type{!File}*/(request.result);
            callback(file.size);
        };
        request.onerror = function () {
            callback(-1);
        };
    };
}());

/**
 * Create a <div/> element.
 * @param {!Document} document
 * @return {!HTMLDivElement}
 */
function createDiv(document) {
    "use strict";
    return /**@type{!HTMLDivElement}*/(document.createElement("div"));
}

/**
 * Create a <button/> element.
 * @param {!Document} document
 * @return {!HTMLButtonElement}
 */
function createButton(document) {
    "use strict";
    return /**@type{!HTMLButtonElement}*/(document.createElement("button"));
}

/**@type{!string}*/
var buttonClickType = "";

/**
 * @param {!string} type
 * @return {!boolean}
 */
function checkClickType(type) {
    "use strict";
    if (buttonClickType === "") {
        buttonClickType = type;
    }
    return buttonClickType === type;
}

/**
 * Add fast click listener.
 * @param {!Element} element
 * @param {!function():undefined} onclick
 * @param {!string=} activeCssClass
 * @return {undefined}
 */
function addFastOnClickEventListener(element, onclick, activeCssClass) {
    "use strict";
    var active = false;
    /**
     * @return {!boolean}
     */
    function activate() {
        active = true;
        if (activeCssClass) {
            element.classList.add(activeCssClass);
        }
        return true; // pass on event since it may be used for e.g. scrolling
    }
    /**
     * @return {!boolean}
     */
    function deactivate() {
        active = false;
        if (activeCssClass) {
            element.classList.remove(activeCssClass);
        }
        return true;
    }
    /**
     * @param {!Event|null} evt
     * @return {!boolean}
     */
    function up(evt) {
        var handle = active === true && checkClickType(evt.type);
        deactivate();
        if (handle) {
            onclick();
        }
        return true;
        //return claimEvent(evt);
    }
    element.ontouchstart = activate;
    element.ontouchend = up;//function (evt) { return up(evt, "touch"); };
    element.ontouchcancel = deactivate;
    element.ontouchmove = deactivate;
    element.onmousedown = activate;
    element.onmouseup = up;//function (evt) { return up(evt, "mouse"); };
    element.onmouseleave = deactivate;
}

/**
 * @param {!string} uri
 * @return {!boolean}
 */
function fileExists(uri) {
    "use strict";
    var xhr = new XMLHttpRequest(),
        exists;
    xhr.open("HEAD", uri, false);
    try {
        xhr.send(null);
        exists = xhr.status === 200;
    } catch (e) {
        exists = false;
    }
    return exists;
}

/**
 * @constructor
 * @param {!Document} document
 * @param {!Element} parent
 * @param {!string} msg
 * @param {!boolean} autoHide hide after a time interval
 * @param {!boolean} throb
 */
function NotificationLine(document, parent, msg, autoHide, throb) {
    "use strict";
    var /**@type{!HTMLDivElement|undefined}*/
        div = createDiv(document),
        /**@type{!Text}*/
        text = document.createTextNode(msg),
        /**@type{!string}*/
        throbText = "",
        timeout = 3000; // ms
    function close() {
        if (div && div.parentNode === parent) {
            div.parentNode.removeChild(div);
        }
        div = undefined;
    }
    this.close = close;
    function doThrob() {
        var t;
        if (div) {
            if (throbText.length === 3) {
                throbText = "";
            } else {
                throbText += ".";
            }
            t = document.createTextNode(msg + throbText);
            div.replaceChild(t, text);
            text = t;
            window.setTimeout(doThrob, 300);
        }
    }
    function init() {
        div.classList.add("notificationLine");
        div.appendChild(text);
        parent.appendChild(div);
        if (autoHide) {
            window.setTimeout(close, timeout);
        }
        if (throb) {
            window.setTimeout(doThrob, 1000);
        }
    }
    init();
}

/**
 * @constructor
 * @param {!Document} document
 * @param {!Element} parent
 * @param {!string} msg
 * @param {!function():undefined} okHandler
 */
function OkDialog(document, parent, msg, okHandler) {
    "use strict";
    var /**@type{!HTMLDivElement|undefined}*/
        div = createDiv(document),
        /**@type{!Text}*/
        text = document.createTextNode(msg),
        done = false;
    function close() {
        if (div && div.parentNode === parent) {
            div.parentNode.removeChild(div);
        }
        div = undefined;
    }
    function clicked() {
        if (!done) {
            done = true;
            close();
            okHandler();
        }
    }
    this.close = close;
    function init() {
        div.classList.add("okDialog");
        div.appendChild(text);
        parent.appendChild(div);
        addFastOnClickEventListener(div, clicked);
    }
    init();
}

/**
 * @constructor
 * @param {!Element} main
 */
function DialogFactory(main) {
    "use strict";
    var document = /**@type{!Document}*/(main.ownerDocument);
    /**
     * @param {!string} msg
     * @param {!boolean=} autoHide hide after a time interval
     * @param {!boolean=} throb
     * @param {!Element=} parent alternative parent element
     * @return {!NotificationLine}
     */
    this.createNotificationLine = function (msg, autoHide, throb, parent) {
        var hide = autoHide || false,
            t = throb || false,
            p = parent || main,
            dialog = new NotificationLine(document, p, msg, hide, t);
        return dialog;
    };
    /**
     * @param {!string} msg
     * @param {!function():undefined} closeHandler
     * @return {!OkDialog}
     */
    this.createOkDialog = function (msg, closeHandler) {
        var dialog = new OkDialog(document, main, msg, closeHandler);
        return dialog;
    };
}

/**
 * @param {!string} uri
 * @param {!function(!Blob):undefined} callback
 * @return {undefined}
 */
function loadBlob(uri, callback) {
    "use strict";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", uri, true);
    xhr.responseType = 'blob';
    xhr.onload = function () {
        var b;
        if (xhr.status === 200) {
            if (xhr.response instanceof Blob) {
                callback(xhr.response);
            } else {
                try {
                    b = new WebKitBlobBuilder();
                    b.append(/**@type{!string}*/(xhr.response));
                    callback(b.getBlob());
                } catch (/**@type{*}*/e) {
                    console.log(e);
                }
            }
        }
    };
    xhr.send(null);
}

/**
 * @param {!function(!FileScannerEntry):undefined} callback
 * @return {undefined}
 */
function createDummyFS(callback) {
    "use strict";
    var names = ["welcome.odt", "invalid.odt", "talk.odp"], i,
        root = new FileScannerEntry(null);
    for (i = 0; i < names.length; i += 1) {
        if (fileExists(names[i])) {
            root.file[names[i]] = new FileScannerFileEntry(names[i]);
        }
    }
    callback(root);
}

/**
 * @constructor
 * @param {!Document} document
 * @param {!DialogFactory} dialogFactory
 * @param {!function(!string):undefined} handleClick
 */
function Browser(document, dialogFactory, handleClick) {
    "use strict";
    var node = createDiv(document),
        /**@type{!FileScanner|undefined}*/
        fileScanner,
        scanBusy = false,
        fsroot,
        lastEntryCount = 0,
        /**@type{!Array.<!string>}*/
        startList = [],
        /**@type{!NotificationLine|undefined}*/
        scanNotification;
    /**
     * @param {!FileScannerEntry} root
     * @return {!Array.<!FileScannerFileEntry>}
     */
    function getFileList(root) {
        var list = [], e;
        for (e in root.list) {
            if (root.list.hasOwnProperty(e) && root.list[e]) {
                list = list.concat(getFileList(root.list[e]));
            }
        }
        for (e in root.file) {
            if (root.file.hasOwnProperty(e)) {
                list.push(root.file[e]);
            }
        }
        return list;
    }
    /**
     * @param {!FileScannerEntry} root
     * @return {!Array.<!FileScannerFileEntry>}
     */
    function getMergedFileList(root) {
        var l = getFileList(root), i, j, url, found;
        for (i = 0; i < startList.length; i += 1) {
            url = startList[i];
            found = false;
            for (j = 0; !found && j < l.length; j += 1) {
                found = l[j].url === url;
            }
            if (!found) {
                l.push(new FileScannerFileEntry(url));
            }
        }
        return l;
    }
    /**
     * @param {!Node} n
     * @return {undefined}
     */
    function swapNode(n) {
        if (node.firstChild) {
            node.replaceChild(n, node.firstChild);
        } else {
            node.appendChild(n);
        }
    }
    /**
     * @param {!FileScannerFileEntry} entry
     * @param {!string} commonPath
     * @return {!Element}
     */
    function createEntryElement(entry, commonPath) {
        var div = createDiv(document);
        div.classList.add("button");
        div.appendChild(document.createTextNode(entry.url.substr(commonPath.length)));
        addFastOnClickEventListener(div, function () {
            handleClick(entry.url);
        }, "buttondown");
        return div;
    }
    /**
     * @param {!FileScannerEntry|undefined} root
     */
    function saveFileList(root) {
        var urls = [], i,
            fileList;
        if (root) {
            fileList = getFileList(root);
            for (i = 0; i < fileList.length; i += 1) {
                urls.push(fileList[i].url);
            }
        }
        startList = urls;
        window.localStorage.odfUrls = JSON.stringify(urls);
    }
    /**
     * @return {!Array.<!string>}
     */
    function loadFileList() {
        var list = [], i, url, s, o,
            urls = [];
        try {
            s = window.localStorage.getItem("odfUrls");
            if (s) {
                o = JSON.parse(s);
                if (o instanceof Array) {
                    urls = o;
                }
            }
            for (i = 0; i < urls.length; i += 1) {
                url = /**@type{*}*/(urls[i]);
                if (typeof url === "string" && list.indexOf(url) === -1) {
                    list.push(url);
                }
            }
        } catch (/**@type{*}*/e) {
            console.log(e);
        }
        return list;
    }
    /**
     * @param {!string} a
     * @param {!string} b
     * @return {!string}
     */
    function getCommonPath(a, b) {
        var as = a.split("/"), i = 0, commonPath = "",
            bs = b.split("/");
        while (i < as.length && i < bs.length && as[i] === bs[i]) {
            i += 1;
        }
        if (i > 0) {
            commonPath = as.slice(0, i).join("/") + "/";
        }
        return commonPath;
    }
    /**
     * @param {!FileScannerFileEntry} a
     * @param {!FileScannerFileEntry} b
     * @return {!number}
     */
    function compareUrls(a, b) {
        var r = 0;
        if (a.url < b.url) {
            r = -1;
        } else if (a.url > b.url) {
            r = 1;
        }
        return r;
    }
    /**
     * @param {!FileScannerEntry|undefined} root
     */
    function renderFileList(root) {
        var fileList, i,
            div = createDiv(document),
            commonPath = "";
        if (root) {
            fileList = getMergedFileList(root);
            fileList.sort(compareUrls);
            if (fileList.length > 0) {
                commonPath = fileList[0].url;
            }
            for (i = 1; i < fileList.length; i += 1) {
                commonPath = getCommonPath(commonPath, fileList[i].url);
            }
            for (i = 0; i < fileList.length; i += 1) {
                div.appendChild(createEntryElement(fileList[i], commonPath));
            }
        }
        if (!root || fileList.length === 0) {
            div.appendChild(div.ownerDocument.createTextNode("No OpenDocument files were found."));
        }
        swapNode(div);
    }
    /**
     * @param {!FileScannerEntry|undefined} root
     * @return {!number}
     */
    function countEntries(root) {
        var count = 0;
        if (root) {
            count = getMergedFileList(root).length;
        }
        return count;
    }
    function updateFileList() {
        var newCount = 0;
        fsroot = fileScanner.root();
        if (fsroot) {
            newCount = countEntries(fsroot);
        }
        if (newCount !== lastEntryCount) {
            renderFileList(fsroot);
            lastEntryCount = newCount;
            saveFileList(fsroot);
        }
        if (scanBusy) {
            window.setTimeout(updateFileList, 100);
        }
    }
    function handleScanDone() {
        scanBusy = false;
        updateFileList();
        if (scanNotification) {
            scanNotification.close();
            scanNotification = undefined;
        }
    }
    /**
     * @return {undefined}
     */
    this.scanFileSystem = function () {
        if (fileScanner === undefined && window.requestFileSystem) {
            if (!scanNotification) {
                scanNotification = dialogFactory.createNotificationLine(
                    "Scanning for OpenDocument files",
                    false,
                    true,
                    node
                );
            }
            scanBusy = true;
            fileScanner = new FileScanner([".odt", ".ods", ".odp", ".fodt", ".fods", ".fodp"],
                handleScanDone);
            startList = loadFileList();
            updateFileList();
        }
    };
    /**
     * @return {!HTMLDivElement}
     */
    this.getNode = function () {
        return node;
    };
    this.pause = function () {
        if (fileScanner) {
            fileScanner.pause();
        }
    };
    this.resume = function () {
        if (fileScanner) {
            fileScanner.resume();
        }
    };
    function init() {
        // start with a dummy list of files for testing
        createDummyFS(function (root) {
            fsroot = root;
            renderFileList(fsroot);
        });
        node.classList.add("screen");
    }
    init();
}

/**
 * @constructor
 * @param {!Document} document
 * @param {!string} imgUrl
 * @param {!function():undefined} clickHandler
 * @param {!string=} altText
 */
function IconButton(document, imgUrl, clickHandler, altText) {
    "use strict";
    var node = createDiv(document),
        img = document.createElement("img");
    /**
     * @return {!HTMLDivElement}
     */
    this.getNode = function () {
        return node;
    };
    /**
     * @param {!boolean} visible
     */
    this.setVisible = function (visible) {
        node.style.display = visible ? "" : "none";
    };
    function init() {
        node.classList.add("iconbutton");
        addFastOnClickEventListener(node, clickHandler, "buttondown");
        img.classList.add("buttonicon");
        img.src = imgUrl;
        img.altText = altText;
        node.appendChild(img);
    }
    init();
}

/**
 * @constructor
 * @param {!Document} document
 */
function ButtonBar(document) {
    "use strict";
    var node = createDiv(document);
    /**
     * @return {!HTMLDivElement}
     */
    this.getNode = function () {
        return node;
    };
    /**
     * @param {!string} imgUrl
     * @param {!function():undefined} clickHandler
     * @param {!string=} altText
     * @return {!IconButton}
     */
    function addButton(imgUrl, clickHandler, altText) {
        var button = new IconButton(document, imgUrl, clickHandler, altText);
        node.appendChild(button.getNode());
        return button;
    }
    this.addButton = addButton;
    function init() {
        node.classList.add("buttonbar");
    }
    init();
}

/**
 * @param {!string} url
 * @return {!boolean}
 */
function hasPages(url) {
    "use strict";
    if (endsWith(url, ".odp") || endsWith(url, ".fodp")) {
        return true;
    }
    return false;
}

/**
 * @constructor
 * @param {!Document} document
 * @param {!DialogFactory} dialogFactory
 * @param {!function():undefined} leaveViewer
 */
function Viewer(document, dialogFactory, leaveViewer) {
    "use strict";
    var node = createDiv(document),
        odfelement = createDiv(document),
        /**@type{!ButtonBar}*/
        buttonBar,
        /**@type{!odf.OdfContainer}*/
        odfcontainer,
        /**@type{!odf.OdfCanvas}*/
        odfcanvas,
        /**@type{!NotificationLine|undefined}*/
        openNotification,
        /**@type{!string}*/
        url,
        /**@type{!IconButton}*/
        nextButton,
        /**@type{!IconButton}*/
        previousButton;
    function closeNotification() {
        if (openNotification) {
            openNotification.close();
            openNotification = undefined;
        }
    }
    function fail() {
        var msg = "Could not load " + url + ".",
            dialog = dialogFactory.createOkDialog(msg, function () {
                leaveViewer();
                dialog.close();
            });
        closeNotification();
    }
    /**
     * @param {!odf.OdfContainer} odf
     */
    function loadHandler(odf) {
        if (odf && odf.state === 2) { // odf.OdfContainer.DONE
            odfcontainer = odf;
            odfcanvas.setOdfContainer(odfcontainer);
        } else {
            fail();
        }
    }
    /**
     * @param {!string} u
     * @return {undefined}
     */
    this.openUrl = function (u) {
        closeNotification();
        openNotification = dialogFactory.createNotificationLine("Opening " + u, false, true, node);
        url = u;
        // unload the previous file
        odfcontainer = new odf.OdfContainer(odf.OdfContainer.DocumentType.TEXT);
        odfcanvas.setOdfContainer(odfcontainer);
        nextButton.setVisible(hasPages(u));
        previousButton.setVisible(hasPages(u));
        // load the current file
        try {
            odfcontainer = new odf.OdfContainer(url, loadHandler);
        } catch (/**@type{*}*/e) {
            fail();
            console.log(e);
        }
    };
    /**
     * @return {!HTMLDivElement}
     */
    this.getNode = function () {
        return node;
    };
    /**
     * @return {!number}
     */
    function width() {
        return node.offsetWidth;
    }
    /**
     * @return {!number}
     */
    function height() {
        return node.offsetHeight - buttonBar.getNode().offsetHeight;
    }
    function handleFitBest() {
        odfcanvas.fitToContainingElement(width(), height());
    }
    function handleFitHeight() {
        odfcanvas.fitToHeight(height());
    }
    function handleFitWidth() {
        odfcanvas.fitToWidth(width());
    }
    function handleZoomIn() {
        odfcanvas.setZoomLevel(odfcanvas.getZoomLevel() * 1.25);
    }
    function handleZoomOut() {
        odfcanvas.setZoomLevel(odfcanvas.getZoomLevel() * 0.8);
    }
    function handleNextPage() {
        odfcanvas.showNextPage();
    }
    function handlePreviousPage() {
        odfcanvas.showPreviousPage();
    }
    function init() {
        buttonBar = new ButtonBar(document);
        buttonBar.addButton("folder.png", leaveViewer);
        buttonBar.addButton("ZoomIn.png", handleZoomIn);
        buttonBar.addButton("ZoomOut.png", handleZoomOut);
        buttonBar.addButton("zoom-fit-best.png", handleFitBest);
        buttonBar.addButton("zoom-fit-height.png", handleFitHeight);
        buttonBar.addButton("zoom-fit-width.png", handleFitWidth);
        previousButton = buttonBar.addButton("go-previous.png", handlePreviousPage);
        nextButton = buttonBar.addButton("go-next.png", handleNextPage);
        odfcanvas = new odf.OdfCanvas(odfelement);
        odfcanvas.addListener("statereadychange", function () {
            if (odfcontainer.state === 2) { // odf.OdfContainer.DONE
                if (hasPages(url)) {
                    odfcanvas.showPage(1);
                }
                odfcanvas.fitToWidth(width());
                closeNotification();
            }
        });
        node.appendChild(odfelement);
        node.appendChild(buttonBar.getNode());
        node.classList.add("screen");
    }
    init();
}

/**
 * @constructor
 * @param {!Document} document
 */
function OdfViewer(document) {
    "use strict";
    var main = /**@type{!HTMLBodyElement}*/(document.body),
        dialogFactory = new DialogFactory(main),
        /**@type{!Browser}*/
        fileBrowser,
        /**@type{!Viewer}*/
        viewer;
    /**
     * @param {!Element} node
     * @return {undefined}
     */
    function setWidget(node) {
        if (main.firstChild) {
            main.replaceChild(node, main.firstChild);
        } else {
            main.appendChild(node);
        }
    }
    /**
     * @param {!string} url
     * @return {undefined}
     */
    function openUrl(url) {
        fileBrowser.pause();
        viewer.openUrl(url);
        setWidget(viewer.getNode());
    }
    this.openUrl = openUrl;
    /**
     * @return {undefined}
     */
    function scanFileSystem() {
        try {
            fileBrowser.scanFileSystem();
        } catch (/**@type{*}*/e) {
            dialogFactory.createNotificationLine(String(e));
        }
    }
    this.scanFileSystem = scanFileSystem;
    /**
     * @return {undefined}
     */
    function showBrowser() {
        setWidget(fileBrowser.getNode());
        scanFileSystem();
        fileBrowser.resume();
    }
    /**
     * @return {undefined}
     */
    function init() {
        makeElementEmpty(main);
        fileBrowser = new Browser(document, dialogFactory, openUrl);
        viewer = new Viewer(document, dialogFactory, showBrowser);
        showBrowser();
    }
    init();
}
