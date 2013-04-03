About loading & saving of styles
================================

General information about styles
--------------------------------

There can be automatic styles and named/common styles:
named/common ones are offered to the user, automatic ones are internal styles
for implementation of direct formatting.

Common styles are stored in styles.xml, while automatic styles are stored in
content.xml or, if used by things in styles.xml, in styles.xml.

Both common styles and automatic styles can get new ids (style:name) during
roundtrips. Style ids are only required to be unique with a given style:family
attribute and within <office:styles>, <office:automatic-styles> and
<office:master-styles>. For <office:automatic-styles> the same id could be even
used once within content.xml and once within styles.xml

Any automatic style can only have a common style as parent style, so not another
automatic style.


Current implementation
----------------------

The ODT document is represented in the DOM in roughly the same structure as in
the flat ODT file format. On loading & saving of normal ODT file most of the
subtrees can be simply mapped between the flat ODT file format and the
different trees of the normal ODT file, with the exception of the automatic
styles and font declarations, which are both merged into a single tree each.

Due to the possible style id conflicts on this merging, all ids of automatic
styles from styles.xml are prefixed (at definition and usage) on loading.
To avoid a long chain of prefixes after multiple roundtrips, the prefix is
also removed on saving again.

If loaded from a flat ODT file, all style defining elements are created by the
simple conversion of the XML of the flat ODT file into a node tree in the DOM,
by the internal function handleFlatXml() of the class odf.OdfContainer. If
loaded from a normal ODT file, all style definining elements are created by
being loaded as separate node trees which then are being inserted and merged
at the proper location by the internal functions handleStylesXml() and
handleContentXml().

Merging on loading means unmerging on saving to the normal ODT file. To split
up the automatic styles between styles.xml and content.xml there is code to
determine all styles that are used in a tree of ODF elements,
"styleInfo.UsedStyleList". That code just is not yet able to determine all
automatic styles which are used indirectly from other automatic styles, like in
this example, where the automatic style "List" for a paragraph references the
list style "ListStyleUsedByParagraph", which again references the char style
"TextStyleUsedByListLevelStyleBullet":

<style:style style:name="List" style:family="paragraph" style:list-style-name="ListStyleUsedByParagraph"/>
<text:list-style style:name="ListStyleUsedByParagraph">
    <text:list-level-style-bullet text:level="1" text:style-name="TextStyleUsedByListLevelStyleBullet" text:bullet-char="➢">
        <style:list-level-properties text:min-label-width="0.762cm"/>
    </text:list-level-style-bullet>
</text:list-style>
<style:style style:name="TextStyleUsedByListLevelStyleBullet" style:display-name="Bullet Symbols" style:family="text">
    <style:text-properties style:font-name="OpenSymbol" style:font-name-asian="OpenSymbol" style:font-name-complex="OpenSymbol"/>
</style:style>

As automatic styles are not modified in the current code, as intermediate
solution all automatic styles are tagged with their origin on loading and
accordingly written back on saving, by setting an attribute "origin" in a
webodf namespace.


Future implementation
---------------------

Instead of the workaround mentioned above, i.e. tagging the origin of the
automatic styles to write them back to the same place, the code needs to
determine the target place of automatic styles based one from which places they
are referenced. The old code used styleInfo.UsedStyleList for that, but ignored
any styles used from other styles, as noted above.

So styleInfo.UsedStyleList needs to be extended to be able to explore the tree
of indirectly used styles and collect their ids as well, starting from the set
of directly used styles.

Other than that there seems no work needed, given that the structure of the
style data in the DOM directly reflects the structure of the style data in the
ODF format, and any changes to this data is currently done without breaking
this structure (and also should in the future).