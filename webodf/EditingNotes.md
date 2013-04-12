Styles
======
Styles could be simply created using the ODF definitions. Ideally, some magic code would exist
to transform the javascript object literal into the appropriate style. This means that consumers of the API
only need to know what the ODF styles would look like, rather than both knowing ODF style details AND WebODF
style translation mechanics.

E.g.: Table style
 {
    "style:name": "Table1",
    "style:family": "table",
    "style:table-properties": {
        "style:width": "17cm",
        "table:align": "margins"
    }
 }

Validation
==========
Operations carry checks to ensure they are valid to be performed. E.g., when a table is added with a particular
name, the operation should ensure the chosen table name is still unique.

1. Client A creates "Table1"
2. Client B creates "Table1"
3. Client A and B trade updates

Perhaps this is intended to be handled simply by versioning the updates? (e.g., Client A or Client B will reject/conflict
the other's changes).

Operation Grouping
==================
A few approaches are available to operation grouping

1. Multiple specs queued individually
-------------------------------------
In this approach, the SessionController/EditorSession is responsible for carrying the logic about grouped operations.
When an upper level action requires multiple steps, the SessionController or EditorSession
will create multiple individual operations.

E.g., on table insert
1. session.queue(Split paragraph)
2. session.queue(Insert new table)
3. session.queue(Move cursor)

# Pro's
* No specific operation grouping type required
* No changes necessary to op.execute interface
* Reduces direct coupling between operations of logic
* Undo/redo behaviour is relatively straightforward

# Con's
* SessionController/EditorSession has potentially complex detail about implementation of an operation
* Conditional operation logic isn't nicely broken up (by default) into operations. E.g., split paragraph should only occur if
  current cursor is in the middle of a paragraph
* No traceability to realise that a sequence of operations should be executed as an uninterrupted block. Potential for
  race conditions caused by multiple clients modifying a document whilst an operation block is being performed?

2. Grouping on construction (OpGroup type)
---------------------------
In this approach, the SessionController/EditorSession is responsible for carrying the logic about grouped operations.
A new OpGroup type would be created, with the ability to execute multiple operations as part of a single
transactional group.

E.g., on table insert
1. session.queue([Split paragraph, Insert new table, Move cursor])

# Pro's
* Reduces direct coupling between operations
* Operations likely to contain smaller, simpler blocks of logic
* OpGroup contains logic on how to pass or fail multi-operation blocks
* Easy to determine operations are part of a specific block and prevent accidental re-ordering or modifications during
  block

# Con's
* SessionController/EditorSession still has detail about implementation of a set of operations in order to construct
  the necessary group

3. Operations can execute other operations (semi) directly
-----------------------------------------
In this approach, the operation will also be passed a reference to the OperationFactory instance in the execute method.
The operation will then selectively create and execute other operation directly as necessary.

E.g., on table insert
1. session.queue(Insert new table)
    a. Operation creates and executes Split paragraph
    b. Operation creates and executes Move cursor

# Pro's
* More flexible execution of child operations. Can include conditional logic such as "Am I in a paragraph?"
* Reduces direct coupling between SessionController/EditorSession and deep operation-specific logic

# Con's
* Very tight coupling between operations
* Potential for infinite recursion problems etc.
* Operations become much more intelligent. This means that there is a greater chance of consistency-type bugs caused by
  an operation being evaluated on two slightly different documents (if somehow the shared state gets out of sync)
* Difficult to predict the result of executing an operation