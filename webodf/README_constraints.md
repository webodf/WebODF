UI Constraints in WebODF
========================

Overview
--------
A constraint is a restriction on the UI, which may dictate whether or not
to show certain elements or may serve to block the processing of an action
that would otherwise result in the generation of operations to be enqueued.

For example, a "review mode" constraint would block editing of text inside
anything but one's own annotations.

Constraints do not do anything by themselves, they are merely 'config flags'
that can be accessed from relevant parts of the code and turned on/off in
a running session.

Design
------
A constraint is designated by a string name. Constraints that ship with WebODf
are available inside a const `gui.CommonConstraints` object, for ease of use.
And example is gui.CommonConstraints.EDIT.ANNOTATIONS.ONLY_DELETE_OWN.

Constraints are registered as being used in an instance of the `SessionConstraints`
class, following which they can be toggled as `true` or `false`, and such states
can be subscribed to.

Usage
-----
It is recommended that controllers declare their support for a constraint by
registering to it. Registering a constraint multiple times, for example when
several controllers respect the same constraint, is completely fine with no
adverse effects. This is a good practice because if other controllers are
removed from the environment, each can keep working independently.

If one desires to subscribe to the state of a constraint, it is not necessary
to register to it, because subscription automatically registers it.
