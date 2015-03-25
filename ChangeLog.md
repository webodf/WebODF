# Changes between 0.5.6 and 0.5.7

## WebODF

### Fixes

* Fix breaking all empty annotations on merging the paragraph they are contained in with the one before ([#877](https://github.com/kogmbh/WebODF/pull/877)))


# Changes between 0.5.5 and 0.5.6

## WebODF

### Fixes

* No longer fail due to possible Byte Order Marks in ODF-internal XML files with Chromium ([#872](https://github.com/kogmbh/WebODF/issues/872)))


## Wodo.TextEditor
See also section about WebODF

### Improvements

* Add options for "Save as" and "Download" buttons in Wodo.TextEditor ([#865](https://github.com/kogmbh/WebODF/pull/865)))


# Changes between 0.5.4 and 0.5.5

## WebODF

### Improvements

* Add a "documentModified" state with change signal to UndoManager classes ([#857](https://github.com/kogmbh/WebODF/pull/857)))

### Fixes

* No longer fail on "draw:master-page-name" attributes values with non-alphabetic chars ([#742](https://github.com/kogmbh/WebODF/pull/742)))


## Wodo.TextEditor
See also section about WebODF

### Improvements

* Add a "documentModified" state with change signal ([#857](https://github.com/kogmbh/WebODF/pull/857)))

### Fixes

* Fix wrongly enabled hyperlink tools with no document loaded ([#833](https://github.com/kogmbh/WebODF/pull/833))
* Prevent Cross-Site Scripting from style names and font names ([#849](https://github.com/kogmbh/WebODF/pull/849)))
* Avoid badly rendered toolbar element with subsets of tools ([#855](https://github.com/kogmbh/WebODF/pull/855)))
* Prevent Cross-Site Scripting from links ([#850](https://github.com/kogmbh/WebODF/pull/850)))
* Prevent browser translation service breaking the editor logic ([#862](https://github.com/kogmbh/WebODF/pull/862)))

# Changes between 0.5.3 and 0.5.4

## WebODF

### Fixes

* Only highlight ODF fields in edit mode ([#816](https://github.com/kogmbh/WebODF/issues/816))
* Prevent Cross-Site Scripting from file names ([#851](https://github.com/kogmbh/WebODF/pull/851)))

## Wodo.TextEditor
See also section about WebODF

### Fixes

* Fix broken loading of other files via "Open file..." button in localfileeditor example


# Changes between 0.5.2 and 0.5.3

## WebODF

### Improvements

* Add support for double line-through in Firefox (Chrome/Safari + IE don't support this feature) ([#758](https://github.com/kogmbh/WebODF/pull/758))
* Add support for subscript & superscript ([#755](https://github.com/kogmbh/WebODF/pull/755))
* In odf.OdfContainer allow creation of document template types as well as querying and setting the template state of the document

### Fixes

* Fixed occasional crash when splitting a paragraph ([#723](https://github.com/kogmbh/WebODF/issues/723))
* Keep IME composition menu & avatar in the correct position when entering characters
* Allow screen-readers to read the document content correctly in OSX 10.8+ versions of Safari
* Scroll newly created annotations completely into view ([#486](https://github.com/kogmbh/WebODF/issues/486))
* Improve line ending detection when word-wrapping occurs ([#774](https://github.com/kogmbh/WebODF/pull/774))


## Wodo.TextEditor
See also section about WebODF


## Firefox Add-on ODF Viewer

### Improvements

* Add support for the flat-xml and template variants of ODT, ODP, ODS (i.e. FODT, FODP, FODS and OTT, OTP, OTS)


# Changes between 0.5.1 and 0.5.2

## WebODF

### Fixes

* For ODP files sometimes template elements from the master pages were rendered inside the actual slides.
* Navigation via home/end keys, or up/down cursor keys is more reliable on all browsers. ([#555](https://github.com/kogmbh/WebODF/issues/555), [#405](https://github.com/kogmbh/WebODF/issues/405), [#224](https://github.com/kogmbh/WebODF/issues/224), [#185](https://github.com/kogmbh/WebODF/issues/185), [#124](https://github.com/kogmbh/WebODF/issues/124), [#98](https://github.com/kogmbh/WebODF/issues/98))
* More elements from master pages are now correctly positioned when displayed inside slides.
* In slides hide elements of class "header", "footer", "page-number" and "date-time" from master pages when configured so.


# Changes between 0.5.0 and 0.5.1

## WebODF

### Improvements

* numbering of multi-level lists is now well supported in rendering, including display of only a subset of the list numbers and continued numbering from previous lists (both `text:continue-numbering` and `text:continue-list`)
([#565](https://github.com/kogmbh/WebODF/pull/565))

### Fixes

* Loading of documents without optional `<style:list-level-properties>` or `<style:list-level-label-alignment>` no longer fails and stalls
* Loading of ODT files with annotations in Internet Explorer 10 (and possibly other versions) no longer fails and stalls


## Wodo.TextEditor
See also section about WebODF

### Fixes

* Start-up of editor no longer hangs in some browsers
Two different bugs were fixed which so far broke the start-up with Safari and other browsers using older WebKit versions as well as the default browser on Android 4.0.3
([#693](https://github.com/kogmbh/WebODF/issues/693))
* All toolbar elements are now disabled when no document is loaded.
([#709](https://github.com/kogmbh/WebODF/issues/709))
