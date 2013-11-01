Copy & paste behaviour and support
==================================

Overview
--------
Paste support is extremely important to get right for an editor. Users have an expectation that data can be replicated
with a high degree of accuracy when copied and pasted. This includes things such as pasting images, styled text (e.g.,
bold, underline), paragraph breaks, lists etc.

This README does not cover details about how data is written or retrieved from the clipboard. For that information, please
see README_clipboard.txt.

Desired paste support
---------------------
* Plain text with paragraphs, tabs, spaces
* HTML text with direct formatting
* HTML tables
* HTML table rows & columns
* Images (standalone)
* Images within mixed HTML fragments (e.g., HTML fragment with paragraphs & images etc.)
* Lists (bulleted & numbered)

Requirements
------------
1. Paste should be able to be undone/redone safely
2. Extra "formatting" steps should be able to be undone without removing the pasted content. E.g., automatically converting
   to a list or table (optional advanced feature)
3. Want to avoid duplicating logic in other operations (e.g., paragraph splitting & merging behaviours, image insertion,
   style addition, adding new list items etc.)
4. Any new operations must be able to be OT'ed easily

Design
------
There are effectively two opposing approaches that can be taken to handle pasting of new data:
1. Create a complex operation (e.g., OpPasteData) that is responsible for determining how to insert a fragment into the
   document
2. Create a paste handler that attempts to break the paste fragment into a series of smaller operations

Option 1
- Pro: Easily integrates with existing undo/redo manager
- Con: OpPasteData likely to contain a lot of duplication of existing ops however
- Pro: Less operations generated (less on-the-wire traffic)

Option 2
- Pro: Better re-use of existing operations
- Pro: Less complex operations required
- Con: Need significant re-work of undo operation grouping to allow paste to be undone/redone

OT adaption of a paste command is relatively straightforward for both options, as both largely generate insert-only
operations. This means that usually the start position just needs to be shifted around to cope with added or removed
characters.

Based on the pro's and con's, Option 2 is the best approach for paste handling. The key argument for this is that it makes
better use of existing operations (requirement#3). The existing undo manager grouping logic is not very extensible, and
should be reworked anyways.

Example paste steps
-------------------
1. Extract data from clipboard. Order of preference is
    - Custom webodf fragment ("application/vnd.webodf")
    - LO/MSWord fragment (??)
    - RTF fragment (??)
    - HTML ("text/html")
    - Plain text ("text/plain")
2. Convert data into webodf fragment (and associated styles) using appropriate import filter
3. Split the fragment up into separate paragraphs
4. Start a new transaction/undo group (this is a new feature...)
5. Add any new named styles (Op???)
6. Add any new auto styles (Op???)
7. For each paragraph
    - start a new paragraph at the current position (OpSplitParagraph)
    - insert the new paragraph (OpInsertFragment)
8. After all paragraphs have been inserted, remove the FIRST created split to merge the first inserted paragraph with
    it's previous sibling (allows the paragraphs to merge with the correct paragraph merge logic)
9. Finish transaction/undo group (Actually, this probably happens on the next edit op start)
10. Auto-convert things to lists, links, etc. (optional). This should be in a new transaction/undo group

Questions
---------
* Should pasting multiple paragraphs into a list should result in a new list item per paragraph?
* Should links be automatically converted?

Links of interest
-----------------
* https://trac.webkit.org/browser/trunk/Source/WebCore/editing/SimplifyMarkupCommand.cpp