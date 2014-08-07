Operational Transforms in WebODF
================================


Overview
--------
This is not really meant as an in-depth introduction into operational transform (OT)theory. Instead, this is a primer
to how OT theory is applied in WebODF to enable collaborative editing. It aims to cover the key subsystems involved,
and provide collected tips & tricks helpful in making OT-safe operations.


### Simplified flow diagram
Below is a very simplified diagram roughly showing how ops flow through the main WebODF subsystems (though I'm unsure
whether a picture *made* of words is worth a thousand words).

                     Local changes
                     +---------+
                     |Operation|
                     +----+----+
                          |
      Remote changes      |
      +---------+     +---v-------+
      |Operation+----->           |
      +---------+     | Operation |
                      | Router    |
                      |           |
                      +--+--+-----+
                         |  |
                   Local |  | Remote
                         |  |
                     +---v--v--------+
                     |               |
                     |  Operation    |
                     |  Transformer  |
                     |               |
                     +---------------+
     Local changes         \ /
     cross transformed      X
     vs. Remote changes    / \
                      +-----------+  Transformed Local changes
                      | Operation |  Sent to server
                      | Transform +------->
                      | Matrix    |
                      +----+------+
                           |
                           | Transformed Remote changes
                           v Applied to local document

An example implementation of an operation router might behave as follows:

1. Local changes are made to the document via creation of local operations (e.g., InsertText). These changes
   are added to a queue that will eventually be sent to the server.
2. After the local changes are applied to the document, the operation router fetches remote changes and adds them to
   an incoming queue.
3. The local changes in the outgoing queue are cross-transformed against the remote changes in the incoming queue.
4. The transformed remote changes are then applied to the local document, whilst the transformed local changes are
   sent to the server.


Implementing a transform pair
-----------------------------

### Quickstart checklist
In order to create a new operation and prepare it for collaborative use, the following steps are necessary:

1. Implement new operation
2. Create and register a new transform function against each existing operation type in the 
   transform matrix (``ops.OperationTransformMatrix``)
3. Add operation tests for each new function 

### The transform matrix
The ops.OperationTransformMatrix class houses all transform functions. Each transform function is registered in the
sparse matrix at the bottom of the class like:

    transformations = {
        'OpSpecA': {
            'OpSpecB': transform<OpSpecA><OpSpecB>,
            ...
        },
        ...
    };

The transform function has the following interface:

    function transform<OpSpecA><OpSpecB>(opSpecA, opSpecB, hasAPriority) {
        ...
        return {
            opSpecsA: [...], // Spec A transformed against spec B
            opSpecsB: [...]  // Spec B transformed against spec A
        };
    }

The first two parameters are operation specifications. A specification is a JS object that contains all the data used
to execute the operation. The first parameter is always a specification of type OpSpecA, and the second parameter is
always a specification of type OpSpecB.

The 3rd parameter (`hasAPriority`) indicates which operation is the local change, and which is the remote change. As
both specifications are transformed and returned, the 3rd argument means that only one function is required per operation
pair. This is because:

    transform(opSpecA, opSpecB, true);
    // opspec A takes priority over opspec B due to the 3rd parameter being true

is identical to:

    transform(opSpecB, opSpecA, false);
    // opspec A *still* takes priority over opspec B as the 3rd parameter is now false

The `hasAPriority` parameter is only used when `opSpecA` & `opSpecB` conflict in such a way where
where the results of one overrides the results of the other. For example, if two users change the same paragraph style
to two different styles, clearly one of the style ops will override the other. In this case, `hasAPriority` is set to
true if `opSpecA` should win the tie. For more detail, see transform scenario 1 below.

The return value from a transform function has two arrays of specifications. An array is used because multiple operations
might result from a cross transform.

| **Parameter** | Description
|---------------|------------------------------------------------------------------------------------------------------
| **opSpecsA**  | `opSpecA` cross-transformed vs. spec B. These specs will be applied to source that provided `opSpecB`.
| **opSpecsB**  | `opSpecB` cross-transformed vs. spec A. These specs will be applied to source that provided `opSpecA`.

If the transform function returns null or undefined, an exception will be thrown by the operation transformer. This is
usually used to indicate an unsupported operation or unresolvable conflict. This is not expected during normal
processing.

One or both of the returned arrays can be empty to indicate that no further resulting ops are necessary. This might
happen if two users make an identical change (e.g., two users set the same paragraph style to "Heading". See transform
scenario 2 below).


Transform Scenarios
-------------------
### 1. Set paragraph style vs set paragraph style (conflict)

                              Client A  |  Client B
                                        |
    +--------------------------------+  |  +----------------------------------+
    |Set paragraph #1 style to 'bold'|  |  |Set paragraph #1 style to 'italic'|
    +--------------------------------+  |  +----------------------------------+
                                    \   |
               Changes sent to peer  +> |  Remote op conflicts with local
                                        |  change.
                                        |
                                        |  Resolve conflict by discarding local
                                        |  change. Apply remote operation.
                                        |
                                        |  Executed locally:
                                        |  +--------------------------------+
                                        |  |Set paragraph #1 style to 'bold'|
                                        |  +--------------------------------+
                                        |
                                        |  Sent to peer:
                                        |  x  No changes to send to peer
                                        |

In this scenario both client A & client B attempt to restyle the same paragraph. In WebODF, the transforms are designed
to occur client-side after receiving the remote operations. Assuming that Client A sends the operations to Client B first,
this means that Client B will be responsible for transforming it's local changes before sending them to Client A.

A transform function that could be run on Client B to transform the remote & local operations might look something like:

    // In this example: opSpecA = SetParagraphStyle(1, 'bold')
    //                  opSpecB = SetParagraphStyle(1, 'italic').
    //                  hasAPriority = true (want Client A's spec to win)
    
    // opSpecA transformed against opSpecB.
    // In this example, these will be executed locally on Client B.
    todoLocal = [opSpecA]; 
    
    // opSpecB transformed against opSpecA.
    // In this example, these will be sent to Client A.
    toSend = [opSpecB];

    ... [snip logic to handle other cases] ...

    if (opSpecA.paragraph === opSpecB.paragraph) {
        // Conflicting operation. Both affect the same paragraph
        // Choose which paragraph should "win" the conflict
        
        if (hasAPriority) {
            toSend = []; // Don't need to send specB to Client A
            // specA should still be applied locally. 
        } else {
            todoLocal = []; // specB won and has already been applied locally
            // specB should still be sent to Client A
        }
    }

    return {
        specsA: todoLocal,
        specsB: toSend
    }

### 2. Set paragraph style vs set paragraph style (same style)

                              Client A  |  Client B
                                        |
    +--------------------------------+  |  +--------------------------------+
    |Set paragraph #1 style to 'bold'|  |  |Set paragraph #1 style to 'bold'|
    +--------------------------------+  |  +--------------------------------+
                                    \   |
               Changes sent to peer  +> |  Transforming remote op against local
                                        |  change.
                                        |
                                        |  Executed locally:
                                        |  x Local state already up-to-date with
                                        |    remote state. Remote op is discarded
                                        |    without being executed.
                                        |
                                        |  Sent to peer:
                                        |  x  No changes to send to peer
                                        |

In this scenario, two clients set the same paragraph to the same style. When Client B fetches updates from Client A, no
further changes are necessary.

A transform function that could be run on Client B to transform the remote & local operations might look something like:

    // In this example: opSpecA = SetParagraphStyle(1, 'bold')
    //                  opSpecB = SetParagraphStyle(1, 'bold').
    //                  hasAPriority = true (want Client A's spec to win)
    
    // opSpecA transformed against opSpecB.
    // In this example, these will be executed locally on Client B.
    todoLocal = [opSpecA]; 
    
    // opSpecB transformed against opSpecA.
    // In this example, these will be sent to Client A.
    toSend = [opSpecB];

    ... [snip logic to handle other cases] ...
    
    if (opSpecA.paragraph === opSpecB.paragraph && opSpecA.style === opSpecB.style) {
        toSend = []; // Don't need to send any resulting updates
        todoLocal = []; // Don't need to make any local changes
    }

    return {
        specsA: todoLocal,
        specsB: toSend
    }

### 3. Set paragraph style vs split paragraph

                              Client A  +  Client B
                                        |
    +--------------------------------+  |  +------------------+
    |Set paragraph #1 style to 'bold'|  |  |Split paragraph #1|
    +--------------------------------+  |  +------------------+
                                    \   |
         Changes exchanged with peer +> |  Transform remote op to
                                        |  account for new paragraph
                                        |  introduced locally
                                        |
                                        |  Executed locally:
                                        |  +--------------------------------+
                                        |  |Set paragraph #1 style to 'bold'|
                                        |  +--------------------------------+
                                        |  +--------------------------------+
                                        |  |Set paragraph #2 style to 'bold'|
                                        |  +--------------------------------+
                                        |
                                        |  Sent to peer:
                                        |  +------------------+
                                        |  |Split paragraph #1|
                                        |  +------------------+
                                        |   /
                                        | <+

In this scenario Client B splits a paragraph that has been styled by Client A. After Client B fetches the changes from
Client A, the resulting transform results in two set paragraph style operations needing to be applied locally. The
resulting split paragraph operation that will be sent to Client A is unaffected.

A transform function that could be run on Client B to transform the remote & local operations might look something like:

    // In this example: opSpecA = SetParagraphStyle(1, 'bold')
    //                  opSpecB = SplitParagraph(1).
    //                  hasAPriority is irrelevant in this case as neither change overrides the other
    
    // opSpecA transformed against opSpecB.
    // In this example, these will be executed locally on Client B.
    todoLocal = []; 
    
    // opSpecB transformed against opSpecA.
    // In this example, these will be sent to Client A.
    toSend = [];

    ... [snip logic to handle other cases] ...
    
    if (opSpecA.paragraph === opSpecB.paragraph) {
        // Both the original paragraph & the new paragraph need to be styled on Client B
        todoLocal.push(opSpecA);
        todoLocal.push(SetParagraphStyle(2, opSpecA.style));
        
        // Client A can simply split the resulting paragraph
        toSend.push(opSpecB);
    }

    return {
        specsA: todoLocal,
        specsB: toSend
    }


Tips for writing transforms
---------------------------
### Think in terms of *states* not *operations*
Each operation changes the document to a new state. When writing transforms, it can helpful to consider each client's
document state independently.

From the perspective of the client that created ``opSpecA``:

* ``opSpecA`` has already been applied to the local document
* ``opSpecB`` needs to be transformed to account for the document changes introduced locally by ``opSpecA``
* the returned specs in ``specsB`` will be applied locally

From the perspective of the client that created ``opSpecB``:

* ``opSpecB`` has already been applied to the local document
* ``opSpecA`` needs to be transformed to account for the document changes introduced locally by ``opSpecB``
* the returned specs in ``specsA`` will be applied locally


### Write transform tests
Writing tests before writing the required transform code (otherwise known as TDD) is a good way to ensure high coverage
of the transform code.

Common scenarios that should be covered by tests:
* Directly conflicting operations (see transform scenario 2 for an example)
* Intersecting/overlapping operations that impact a shared document region
* One operation clearly preceding/following the other operation

### View transform logging
Verbose output is logged to the console when transforming operations. This shows both the input operations, and the output
operation for each client.

Tips for writing operations
---------------------------
### Keep operations simple. Make decisions at the controller level.
An operation should make as few decisions/branches as possible. Each decision introduces a chance that the operation will
execute a different branch on another client. Complex decisions belong at the controller layer that create the operations.

Simple operations also have simpler transforms, reducing the risk that the operation will be incorrectly transformed.

One good example of an operation that was split out into two operations is OpRemoveText. Originally, this was responsible
for both removing text content & merging paragraphs. However, the operation spec was unable to provide enough information
to the transform function about which paragraphs were impacted by the removed region. This made it impossible to converge
if the local client had modified the style of a paragraph that had content being removed.

### Ensure operation specification contains all relevant data. Avoid requesting local document state during execution
Operation specifications should contain all inputs required for the operation to execute and should not rely on implicit
details about the local document state. This ensures the transform function has complete control over the operation, as
well as ensuring the operation has less internal decisions to make.

Keeping all relevant information about the operation in the specification is also necessary to ensure the transform code
is able to be used in environments where there is no access to the document model, such as in an operation relay server.

One example of a bad approach is an implementation of direct formatting (e.g., make selected text bold) that looks up data
from the local document's current text styling. If Client A has non-bold text, the operation would create local text:span's
with the bold style applied. If client B had already bolded the text by the time this operation arrived (e.g., locally 
changed the paragraph style to one that was bold), the operation would do nothing, resulting in Client A & Client B having
completely different local documents.

In addition, split paragraph would implicitly get the paragraph style name of the new paragraph from source paragraph it 
was split from. This would lead to situations where splitting & merging in the right combination would cause the calculated
style name to be different on each client. The problem was fixed by introducing an explicit "styleName" property onto the
specification.

