/*global gui, runtime, XMLSerializer */

/**
 * Clipboard wrapper to attempt some semblance of cross-browser clipboard support
 * @constructor
 */
gui.Clipboard = function Clipboard() {
    "use strict";

    /**
     * Copy the contents of the supplied range onto the clipboard (if available).
     * @param {!Event} e
     * @param {!Range} range Selection range to copy into the clipboard
     * @return {boolean} Returns true if the data was successfully copied to the clipboard
     */
    this.setDataFromRange = function(e, range) {
        var result = true,
            setDataResult,
            clipboard = e.clipboardData,
            window = runtime.getWindow(),
            serializer, dom, newNode, fragmentContainer;

        if (!clipboard && window) {
            clipboard = window.clipboardData;
        }

        if (clipboard) {
            serializer = new XMLSerializer();
            dom = runtime.getDOMImplementation().createDocument('', '', null);
            newNode = dom.importNode(range.cloneContents(), true);
            fragmentContainer = dom.createElement('span');

            // the document fragment needs to be wrapped in a span as
            // text nodes cannot be inserted at the top level of the DOM
            fragmentContainer.appendChild(newNode);
            dom.appendChild(fragmentContainer);

            // By calling preventDefault on the copy event, no data is actually placed into the clipboard.
            // However, if we don't call it, the data we add is stripped out and thrown away :-/
            setDataResult = clipboard.setData('text/plain', range.toString());
            result = result && setDataResult;
            // Lazy-man's way of generating pretend html
            setDataResult = clipboard.setData('text/html', serializer.serializeToString(dom));
            result = result && setDataResult;
            e.preventDefault();
        } else {
            result = false;
        }

        return result;
    };

};

(function () {
    "use strict";
    return gui.Clipboard;
}());