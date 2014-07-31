# Changes between 0.5.2 and 0.5.3

## WebODF

### Fixes

* Fixed occasional crash when splitting a paragraph ([#723](https://github.com/kogmbh/WebODF/issues/723))
* Keep IME composition menu & avatar in the correct position when entering characters
* Allow screen-readers to read the document content correctly in OSX 10.8+ versions of Safari


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
