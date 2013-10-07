Cursors may not be everywhere in a text document. In ODF documents, the text editing cursor may only appear in <text:p/> and <text:h/> elements.

A cursor in a text document heading or paragraph appears in front, after and between characters and inline objects. The characters can by grouped. In ODF this happens with text:span, text:meta etc. If such groups occur, more positions are available for placing a cursor. In example 1, you see a paragraph without groups. The possible cursor positions are indicated with |.
  <p>|H|e|l|l|o| |w|o|r|l|d|.|</p>
There are 13 possible cursor positions.

If the word 'hello' is put in a group, this is the result:
  <p>|H|e|l|l|o| |<span>|w|o|r|l|d|.|</span>|</p>
Now there are 15 possible, but not necessarily allowed, cursor positions.

Moving the cursor through a text should not be different when some characters are grouped. So we should disallow two of the positions. To decide what positions are allowed, we introduce a simple rule. This rule requires the definition of categories of elements. We define three categories:
  a) character elements: elements that act as characters, the cursor does not enter them
  b) grouping elements: elements that group characters, character elements and other grouping elements, the cursor enters them, but they do not add new allowed cursor positions
  c) ghost elements: elements that the cursor does not enter and that do not add new allowed cursor positions. The contents of ghost elements are never considered when evaluating the rule for allowed cursor positions.
At the end of this text, we have a list that tells which elements belong to which of the above groups.

Only addition of characters or character elements increases the number of allowed cursor positions.

  The cursor may only be placed
   1) directly to the right of a non-whitespace character or character element
   2) directly to the right of a whitespace character if the whitespace character is not preceded by another whitespace character and has a non-whitespace character or character element to the left and to the right in the enclosing <text:p/> or <text:h/> or
   3) at the first position in the <text:p/> or <text:h/>. The first position is determined as follows:
      - in a <text:p/> or <text:h/> with non-whitespace characters or character elements in it (directly or in a group element), it is directly to the left of the first non-whitespace characters or character element.
      - else the first position is directly to the right of the opening tag of the <text:p/> or <text:h/>.

In ODF, whitespace characters are space (U+0020), horizontal tab (U+0009), carriage return (U+000D) and line feed (U+000A). See §6.1.2 Whie Space Characters in the ODF 1.2 specification. The elements <text:/s>, <text:tab/> and <text:line-break/> do not count as whitespace characters but as character elements.

The above example now changes:
  <p>|H|e|l|l|o| |<span>w|o|r|l|d|.|</span></p>

Here is more examples that show allowed cursor positions:
  <p>|A|B|C|</p>
  <p><span>|A|B|</span>C|</p>
  <p>|A|<span>B|</span>C|</p>
  <p>|A|<span>B|C|</span></p>
  <p><span>|A|<span>B|</span></span>C|</p>
  <p>|A|<span><span>B|</span>C|</span></p>

In ODF, two consective spaces count as one space. Also, spaces can be represented by the <text:s/> element. Let's replace the space in the first example:

  <p>|H|e|l|l|o|<s/>|<span>w|o|r|l|d|.|</span></p>

The cursor position before the <s/> element is allowed because of rule 3); <s/> counts as an element and not as a whitespace character. A space element may represent multiple space characters: <text:s text:c="5"/>. The cursor is allowed to be placed between each of these, but this is only possible if the element is split into 5 separate <text:s/> elements. This should happen when the document is loaded.

Examples

Here is a list of more examples. It is a good excersize to apply the above rule for allowed cursor positions to these examples. The number of allowed positions increases when going down the list:

1 allowed position:
<p>|</p>
<p><span>|</span></p>
<p><span>|</span><span></span></p>
<p><span>|<span></span></span></p>
<p>|  </p>
<p>  <span>|  </span>  </p>
<p>  <span>|  </span>  <span>  <span>  </span>  </span>  </p>

2 allowed positions:
<p>|a|</p>
<p>    |a|   </p>
<p>  <span>  |a|  </span>  </p>
<p>  <span>  |a<span>|</span>  </span>  </p>
<p><span></span>  |a|</p>

3 allowed positions:
<p>|a|b|</p>

4 allowed positions:
<p>|a| |b|</p>
<p>  |a| | b|  </p>
<p>  <span>|a| | </span>  <span>  b|</span></p>

6 allowed positions:
<p>|a| |<s/>|<s/>|b|</p>
<p> <span>|a| |</span> <s/>| <span><s/>|b|</span> </p>

In the above rule for allowed cursor positions, the elements are placed in categories. A list that puts the ODF elements in the character, grouping and ghost categories is given here. Together, the three categories should contain all elements that are allowed in <text:h/> and <text:p/>.
If an element is not a character element or a ghost element, it is considered to be on a grouping element.

These elements are character elements:
<presentation:date-time/>
<presentation:footer/>
<presentation:header/>
<text:alphabetical-index-mark/>
<text:author-initials/>
<text:author-name/>
<text:bibliography-mark/>
<text:bookmark-ref/>
<text:s/>
<text:tab/>
<text:date/>
<text:line-break/>
<text:page-count/>
<text:page-number/>
<text:reference-ref/>
<text:subject/>
<text:time/>
<text:title/>

These elements are character elements if the attribute @text:anchor-type has the value 'as-char'. Otherwise these elements are ghost elements.
<dr3d:scene/>
<draw:caption/>
<draw:circle/>
<draw:connector/>
<draw:control/>
<draw:custom-shape/>
<draw:ellipse/>
<draw:frame/>
<draw:g/>
<draw:line/>
<draw:measure/>
<draw:page-thumbnail/>
<draw:path/>
<draw:polygon/>
<draw:polyline/>
<draw:rect/>
<draw:regular-polygon/>

These elements are grouping elements:
<draw:a/>
<text:a/>
<office:annotation-end/>
<office:annotation/>
<text:alphabetical-index-mark-end/>
<text:alphabetical-index-mark-start/>
<text:bookmark-end/>
<text:bookmark-start/>
<text:bookmark/>
<text:change-end/>
<text:change-start/>
<text:span/>
<text:meta/>

Unsorted: elements for which it has not been determined yet on which list they belong
<text:change/>
<text:chapter/>
<text:character-count/>
<text:conditional-text/>
<text:creation-date/>
<text:creation-time/>
<text:creator/>
<text:database-display/>
<text:database-name/>
<text:database-next/>
<text:database-row-number/>
<text:database-row-select/>
<text:dde-connection/>
<text:description/>
<text:editing-cycles/>
<text:editing-duration/>
<text:execute-macro/>
<text:expression/>
<text:file-name/>
<text:hidden-paragraph/>
<text:hidden-text/>
<text:image-count/>
<text:initial-creator/>
<text:keywords/>
<text:measure/>
<text:meta-field/>
<text:modification-date/>
<text:modification-time/>
<text:note-ref/>
<text:note/>
<text:number/>
<text:object-count/>
<text:page-continuation/>
<text:page-variable-get/>
<text:page-variable-set/>
<text:paragraph-count/>
<text:placeholder/>
<text:print-date/>
<text:print-time/>
<text:printed-by/>
<text:reference-mark-end/>
<text:reference-mark-start/>
<text:reference-mark/>
<text:ruby/>
<text:script/>
<text:sender-city/>
<text:sender-company/>
<text:sender-country/>
<text:sender-email/>
<text:sender-fax/>
<text:sender-firstname/>
<text:sender-initials/>
<text:sender-lastname/>
<text:sender-phone-private/>
<text:sender-phone-work/>
<text:sender-position/>
<text:sender-postal-code/>
<text:sender-state-or-province/>
<text:sender-street/>
<text:sender-title/>
<text:sequence-ref/>
<text:sequence/>
<text:sheet-name/>
<text:soft-page-break/>
<text:table-count/>
<text:table-formula/>
<text:template-name/>
<text:text-input/>
<text:toc-mark-end/>
<text:toc-mark-start/>
<text:toc-mark/>
<text:user-defined/>
<text:user-field-get/>
<text:user-field-input/>
<text:user-index-mark-end/>
<text:user-index-mark-start/>
<text:user-index-mark/>
<text:variable-get/>
<text:variable-input/>
<text:variable-set/>
<text:word-count>

