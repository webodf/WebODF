Clipboard behaviour and support
==================================

Overview
--------
Clipboard implementations and availability are extremely different between browsers and versions of various browsers.
This makes it challenging to access data, or add extra data on a cut/copy or paste event.

The high level goal is for webodf to support internal copying and pasting, as well as allow the ability to paste from
external sources such as other browser tabs or documents. Ideally support will match the copy/paste experience that
googledocs is able to provide.

Technical challenges
--------------------
1. Read/write clipboard access
Only webkit-based or blink JS engines (Chrome, Safari, Opera, etc.) and very recent version of Firefox (22, July 2013 [4])
provide full read-write access to the browser's clipboard. Internet Explorer provides some simplistic access[3]. Older
versions of Firefox provide practically no direct access to the clipboard content (read or write).

Firefox has recently improved clipboard support enormously though, so this situation is slowly improving.

2. Browser events
For security reasons, access to the browser's clipboard is only allowed during a cut, copy or paste event [1].
Though the w3 specs require that implementations always allow these events to be fired on any element in a page (even
if it will have no impact on the document)[2], the only browser that properly does this is Chrome.

Safari & firefox will only allow a cut or paste event if the current focus node is an editable area such as a text field
or a contentEditable div.

3. Styling support
Browsers have different levels of support for including style-related information for the copied text selection.
Firefox includes some font size information, HTML attributes (id., class) the fragment DOM structure, but no other style
information. This means that coloured text copied in Firefox will always paste in the current font colour of the paste
location (e.g., black if that is the colour of the destination text).

Chrome includes ALL style information as if it were inline css on each individual element, as well
as HTML attributes and the fragment DOM structure in a text/html data blob on the clipboard. When pasted, all direct
formatting is preserved and displayed.

Safari only adds the plain text to the clipboard, meaning that the only way to access the complex HTML is to allow
the paste to occur in a contentEditable div, and then extract the resulting HTML (e.g., using setTimeout [5]).

4. Image support
Generally, images are not copied directly to the clipboard alongside the relevant DOM fragments. This means that on paste,
the receiving application must go and download the image from the remote URL.

The behaviour is also inconsistent when copying a standalone image. For example, viewing an image (e.g.,
http://www.w3.org/Icons/w3c_home) and right-click + copying this in Chrome results in the png itself being placed on the
clipboard as an item. In firefox, this still pastes as a normal HTML fragment with a link to the original URL.

Safari will place the image on the clipboard, and will additionally add a plain-text entry with the original URL
(which means that the default paste action in most other applications is to paste the plain text rather than the image!).

5. All or nothing clipboard write access
The default action for a cut or copy event *must* be prevented in order for anything added to the clipboard using setData
to remain available [6]. This is because the handler is called before the browser has populated the clipboard, and the
browser then subsequently overwrites the clipboard with the current selection.

What this means is that if a web-app wants to add additional meta-data to the clipboard (e.g., a webodf/fragment data
type), it also becomes responsible for populating text/plain & text/html with the correct data as well. This task is quite
difficult to do correctly as there is no way provided to access the browser's default implementation (e.g., Chrome's
which does things such as inlining css information).

6. Inter-browser clipboard types
Custom data types are generally not preserved when pasting between browsers.

For example, copying a block of text in googledocs in Chrome and pasting in the clipboard test harness shows a type
'application/x-vnd.google-docs-document-slice+wrapped' entry as present. If this is then pasted in Safari, an entry for
'org.chromium.web-custom-data' is shown instead. If pasted into firefox, only text/plain &
text/html entries exist.

Googledocs Clipboard implementation
-----------------------------------
Googledocs has good cross-browser (and version) clipboard support. This is achieved using the following techniques

1. Virtual cursors - workaround for technical challenge #2
As mentioned previously, most browsers only allow limited access to the cut, copy & paste commands.
The displayed caret on screen, and associated selection rectangles are NOT the browser caret or selection. These are
actually cleverly placed divs and highlights. Viewing the page source, it can be observed that there is a hidden
contentEditable div or iframe (class=docs-texteventtarget-iframe) that is the window's current selection and active element
(window.getSelection() && document.activeElement) at all times. This means the cut, copy & paste events can be selectively
enabled by adding or removing content from the hidden div.

2. Web Pasteboard
One of the most common uses for cut/copy/paste is actually copying or moving data within an open document, or multiple
open documents. To improve the user experience in this area, google implemented a whole new clipboard system called a
web paste board (see links below). This greatly simplifies the problem of copy & paste within a document, as data can
now be added alongside the clipboard selection data without needing to clear & regenerate all the clipboard data.

This would allow googledocs to function without access to the browser clipboard at all when copying and pasting
between internal documents.

3. Custom HTML serializer - workaround for technical challenges #3, #4 & #6
Examining the content of the text/html data type when copying from a googledoc shows significant differences to Firefox's
normal generated HTML. This indicates that google has written a custom JS HTML serializer that creates rendered HTML
based on the current selection in the document. No copy of this exist in the viewed page, so it is clearly generated
on-the-fly when a cut/copy event is invoked.

Due to technical challenge #5, this also indicates that a custom serializer is also implemented to generate the
text/plain clipboard data.

To provide good cut & copy support on earlier versions of FF, when a cut or copy operation is received the current
selection is shadowed into the hidden contentEditable div using the custom serializer. At the completion of the event, the
div is immediately cleared again. This allows the clipboard to receive the sanitized HTML equivalent of the current
selection, in spite of there being no direct clipboard interface.

* http://googledocs.blogspot.com.au/2010/02/web-clipboard-for-google-docs.html
* http://googleappsupdates.blogspot.com.au/2010/02/new-web-clipboard-for-google-docs-that.html
* https://support.google.com/drive/answer/161768?hl=en
* http://googlesystem.blogspot.com.au/2012/03/google-docs-and-clipboard-access.html


Footnotes
---------
[1] http://www.w3.org/TR/clipboard-apis
[2] http://www.w3.org/TR/clipboard-apis, 4.1.2, paragraph 2
[3] http://msdn.microsoft.com/en-us/library/ms535220%28v=vs.85%29.aspx
[4] https://bugzilla.mozilla.org/show_bug.cgi?id=407983
[5] http://stackoverflow.com/questions/2176861/javascript-get-clipboard-data-on-paste-event-cross-browser
[6] http://www.w3.org/TR/clipboard-apis, 4.1.2, paragraph 4