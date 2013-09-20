About loading & saving of styles
================================

General information about styles
--------------------------------

There can be automatic styles and common styles:
common ones are offered to the user, automatic ones are internal styles
for implementation of direct formatting.

Common styles are stored in styles.xml, while automatic styles are stored in
content.xml if used within the document content, of in styles.xml if used as part of
the document's master style definitions. Automatic styles are only applicable for
the limited document scope (either 'document-styles', or 'document-content') they
are defined within. That is, an automatic style defined in 'document-styles' cannot
be referenced from 'document-content' and vice-versa.

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
"styleInfo.UsedStyleList". That code is also able to determine all
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

To cope with automatic styles having identical names in both content.xml and styles.xml,
imported automatic styles are scoped to either 'document-styles' or 'document-content' on load.

Additional automatic styles created by the user are considered "scopeless", and can be used in
both styles and content scopes. Upon saving of the document, the automatic style will be cloned
into any scopes that require it. Reloading the newly saved document will follow the normal process
of loading this new automatic style into only the appropriate scope.

Future implementation
---------------------

The current implementation always stores all referenced fonts in styles.xml. This could be improved
to only store fonts used within the styles.xml scope, with additional fonts used within the content being
stored in content.xml