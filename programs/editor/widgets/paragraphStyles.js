/**
 * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>

 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * As additional permission under GNU AGPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * As a special exception to the AGPL, any HTML file which merely makes function
 * calls to this code, and for that purpose includes it by reference shall be
 * deemed a separate work for copyright law purposes. In addition, the copyright
 * holders of this code give you permission to combine this code with free
 * software libraries that are released under the GNU LGPL. You may copy and
 * distribute such a system following the terms of the GNU AGPL for this code
 * and the LGPL for the libraries. If you modify this code, you may extend this
 * exception to your version of the code, but you are not obligated to do so.
 * If you do not wish to do so, delete this exception statement from your
 * version.
 *
 * This license applies to this entire compilation.
 * @licend
 * @source: http://www.webodf.org/
 * @source: http://gitorious.org/webodf/webodf/
 */
widgets.ParagraphStyles = (function () {

    var textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";
    var htmlns = "http://www.w3.org/1999/xhtml";

    function makeWidget(documentObject, callback) {
        require(["dijit/form/Select"], function (Select) {
            var i,
                widget,
                selectionList = [],
                availableStyles = documentObject.odfCanvas.getFormatting().getAvailableParagraphStyles(),
                currentParagraph = null,
                currentStyle = null;

            for (i = 0; i < availableStyles.length; i += 1) {
                selectionList.push({
                    label: availableStyles[i].displayName,
                    value: availableStyles[i].name
                });
            }

            widget = new Select({
                name: 'ParagraphStyles',
                options: selectionList,
                maxHeight: 200,
                style: { 
                    width: '100px'
                }
            });

            function trackCursor(avatar) {
                var node = avatar.getCaret().getSelection().focusNode;
                while (node && !((node.localName === "p" || node.localName === "h") && node.namespaceURI === textns)) {
                    node = node.parentNode;
                }
                if(!node)
                    return;
                currentParagraph = node;
                currentStyle = currentParagraph.getAttributeNS(textns, 'style-name');
                widget.set("value", currentStyle);
            }

            documentObject.addEventListener("avatarMoved", function (event) {
                trackCursor(event.detail.avatar);
            });
            documentObject.addEventListener("avatarActivated", function (event) {
                console.log('here')
                trackCursor(event.detail.avatar);
            });


            widget.onChange = function(value) {
                currentStyle = value;
                if(currentParagraph) {
                    var avatar = document.session.getActiveAvatar();
                    if(currentStyle != currentParagraph.getAttributeNS(textns, 'style-name')) {
                        currentParagraph.setAttributeNS(textns, 'style-name', value);
                        document.dispatchEvent(document.documentChangedEvent);

                        currentParagraph.removeAttribute('user');
                        currentParagraph.removeAttribute('class');
                        currentParagraph.removeAttribute('usercolor');

                        runtime.setTimeout(function() {
                            currentParagraph.setAttribute('user', avatar.getMemberId());
                            currentParagraph.setAttribute('class', 'edited');
                            currentParagraph.setAttribute('usercolor', avatar.getColor());
                        }, 1);
                    }
                }
            }

            return callback(widget);
        });
    }

    widgets.ParagraphStyles = function ParagraphStyles(documentObject, callback) {
        makeWidget(documentObject, function (widget) {
            return callback(widget);
        });
    };

    return widgets.ParagraphStyles;
}());
