---
title: "Teaching programming with systems design"
tagline: "Getting pupils to understand the art of programming."
...

Having taught programming
for a few years
one thing that continually bothers me
is how we teach our students
more technologies and techniques
than the fundamental practice of programming.

I hope for the following
to inform some future direction
in ensuring that the programmers
that I teach in the future
understand what it is
that they should be trying to learn.

# What is a system?

Fundamentally,
the job of every programmer
is to design and implement _systems_.
Every system has two fundamental features;
they has some _state_
during the period of time in which it exists,
and they has some _interfaces_
with which it can interact with other systems.

A system without any interfaces cannot be observed
and so cannot be show nor required to exist.
A system without state cannot change
any information that it is provided
and so cannot be shown to have any effect.
Thus, only when a system has both state and interfaces
does it actually exist.

The observer of a system
does not actually care _what_ the state of a system is
so long as the system _has_ state.
They do care what the interface of the system is
as the interface describes
all the ways in which they may interact with it.
Every interface to a system
is some way of an external agent
providing information to the system
in a manner which may change the state of the system.
Some of the interfaces
will also provide information
back to the external agent.

A system can only exist once it has been provided information
and can only be observed if information is provided to external agents.

# What is system design?

System design is the art
of prescribing meaning
to the information
that flows into and out of a system
and of describing and constraining
the interfaces of that system.

In the design of a system
it is helpful to think of it as an agent
and of all the interfaces
as transactions that may occur with other agents.
Each transaction
will involve some information
being added to the system
from the external agent
and some information 
leaving the system
to the external agent.

The information that is introduced into a system
and that leaves the system
may not only be related to each other
but also to any information
exchanged in any transaction
with the system
at any point in the lifetime of that system.

# What is system implementation?

System implementation is the art
of describing the internal state
of a system
in such a way
that it allows for the interfaces
to operate as described
in the design.

The state of the system
is wholly dependant on
what information is exchanged
with any interface
and how information is related
between transactions.

# How do you design a system?

Systems are designed to solve problems.
A system can't be designed
without at leas _some_ idea
of the problem it needs to solve.
The problem statement should state
what information exists before the system
and what information the system should produce.

The information requirements can then be used
to describe the individual interfaces
of the system.
Once the interfaces of the system have been described
the state of the system can be constructed
such that the interfaces operate as specified.
Once the state has been designed,
the actual system can then be constructed
from smaller component systems.

Whilst the above may seem simultaneously abstract and straightforward,
it is also fraught.
Each step could continue indefinitely,
but this should clearly be avoided.
Many development practices
advocate strongly
for one of two methodologies.

The first suggests
that you fully describe the system at each stage
before proceeding to the next.
This has the advantage
that you can verify
that all of the interfaces
operate well with each other,
but it comes at the cost
of being unable to predict
how long the implementation will take
and suffers greatly when errors in earlier stages
are found during later ones.

The second suggests
that you complete the smallest
well isolated set of interfaces
at each stage
and develop those to completion
before iterating again
and adding more of the interface.
This has the advantage
that a complete system
exists much sooner
and that there are many opportunities
for errors in design
to be resolved during later iterations,
but comes at the cost
of not being able to account
for unexpected interactions
between interfaces.

In truth,
a middle-ground between the two approaches
tends to be the most effective.
An approach wherein
you plan for a set of moderate set of interfaces
but only take a small subset
of what is developed at each phase
forward to the next.
This allows you to better predict
how interfaces currently in development
will interact with those that will be developed later.

# What makes a good system?

A good system
is one that is impossible to misuse,
that will never fail,
and will never cause the systems with which it interacts to fail.
Clearly,
meeting all of these requirements perfectly
is impossible
but it is certainly worth striving for.

A good system
starts with well-defined interfaces.
Well-designed interfaces
are those that are unambiguous
as to what information they accept,
what information the return,
and how that information
relates to information exchanged
through any other interface.

If all of the above requirements are met,
then they can be both checked and tested.

Checking that the requirements are met
involves observing the interactions
between the system and another.
This may be done statically or dynamically.

Static checking involves
verifying the interfaces between the two systems
at every point of interaction
and ensuring that the information
flowing between the two
matches all of the requirements
specified in the interfaces of both systems.
This is considered static
as it can be done
without ever having to observe
the systems in action
as it solely relies on their definition.
This relies on interfaces
being well defined.
The more well defined the interface is
the more of it can be checked statically.

Dynamic checking involves
verifying the interactions between two systems
as they are in operation.
It is done by observing
the information exchanged between the two systems
as they are in operation
and by raising failure exceptions
when the requirements of either system
are not met.
Poorly defined systems
rely on dynamic checking
and in many cases
fail catastrophically
due to poor requirement specification.
Many well defined systems
will utilise some amount of dynamic checking
by allowing conditions that can be checked statically
to rely on the assumption conditions checked dynamically
are always resolved
to some valid case.

Testing a system
involves designing an agent
to interact with a system
based on the description of its interfaces.
Testing systems
show that the _implementation_ of a system
does not satisfy the requirements of the interfaces
by providing examples
where the expected information
exchanged with the system
differs from that
in the specific implementation.

# How do you teach system design?

Clearly, the above methodology
is far to broad and general
for a programmer to learn all at once.
Of particular issue
is that each stage
of design and implementation
requires an immense amount of foresight
of stages yet to come
thus requiring extensive experience
of how those stages operate.

In order to ensure
that a programmer has sufficient experience
to have foresight into later stages
when developing in earlier ones
they must practice with them first.

Teaching system design must start
by providing the programmer
with systems already designed
simply for lack of implementation.
This will allow the programmer
to practice implementing a system
with the knowledge
of the interface definitions
and of the system state model
and allow them to develop
and understanding
of how they impact the development
of the implementation.

The programmer must then move back
to have their practice include
the design of the system state
from the interface definition.
This will allow them to understand
how the interface definition
informs the model of the state
and to understand
how to resolve errors in the state model
that are brought to light
by the implementation.

The programmer must then move back
to defining the system interfaces
from the requirements and problem statement
before developing the system in full.
This will allow them to understand
the full depth of system development
and how each stage
interacts with the others
and how they may reveal
errors in the other stages.

Finally,
the programmer must be able to demonstrate
their ability to identify a problem
describe the requirements of the solution
define the system interfaces,
design the system state model,
and implement the system proper
entirely unassisted.
Upon having achieved this
they will have shown
that no matter what technologies
are thrust upon them
and what problems they are tasked with solving
they will always be able to work towards
developing, in a system, a solution.
