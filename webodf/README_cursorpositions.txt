Cursors may not be everywhere in a text document. In ODF documents, the text editing cursor may only appear in <text:p/> and <text:h/> elements.

A cursor in a text document heading or paragraph appears between characters. The characters can by grouped. In ODF this happens with text:span, text:meta etc. If such groups occur, more positions are available for placing a cursor. In example 1, you see a paragraph without groups. The possible cursor positions are indicated with |.
  <p>|H|e|l|l|o| |w|o|r|l|d|.|</p>
There are 13 possible cursor positions.

If the word 'hello' is put in a group, this the result:
  <p>|H|e|l|l|o| |<span>|w|o|r|l|d|.|</span>|</p>
Now there are 15 possible cursor positions.

Moving the cursor through a text should not be different when some characters are grouped. So we should disallow two of the positions. To decide what positions are allowed, we introduce a simple rule:

  The cursor may only be placed
   1) to the left of a non-whitespace character or
   2) to the left of a group of whitespace characters or
   3) to right of the last character in the <p/> or <h/> or
   4) to the left of an element with no text nodes in it.

The above example now changes:
  <p>|H|e|l|l|o| <span>|w|o|r|l|d|.|</span></p>

In ODF, two consective spaces count as one space. Also, spaces can be represented by the <text:s/> element. Let's replace the space in the previous example:

  <p>|H|e|l|l|o|<s/><span>|w|o|r|l|d|.|</span></p>

The cursor position before the <s/> element is allowed because of rule 4). A space element may represent multiple space characters: <text:s text:c="5"/>. The cursor is allowed to be placed between each of these, but this is only possible if the element is split into 5 separate <text:s/> elements. This should happen when the document is loaded.

