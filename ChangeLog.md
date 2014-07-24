# Changes between 0.5.1 and 0.5.2

## WebODF

### Fixes

* For ODP files sometimes template elements from the master pages were rendered inside the actual slides.
* Navigation via home/end keys, or up/down cursor keys is more reliable on all browsers. ([#555](https://github.com/kogmbh/WebODF/issues/555), [#405](https://github.com/kogmbh/WebODF/issues/405), [#224](https://github.com/kogmbh/WebODF/issues/224), [#185](https://github.com/kogmbh/WebODF/issues/185), [#124](https://github.com/kogmbh/WebODF/issues/124), [#98](https://github.com/kogmbh/WebODF/issues/98))


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
