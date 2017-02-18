---
layout: post
title: Search a City
author: curtis
---

# Let's Play a (Morbid) Game

Here's a fun idea for a game. Let's say my friend and I go to a town with 100
houses. I go in the day before my friend does and pick a house in the town and
*remove* the current residents and inhabit it. My friend comes in the next day
and has to figure out which house I am in. *How many houses does he have to
check before he finds me?*

If they just walks into the city and checks each house one by one, it would take
an average of 50 houses (if we repeated this game over and over) before they
found me. The same is also true if they just go to the houses in a random order.
If we place the houses in some arbitrary order and each house has the same
likelihood of me being inside, then there is a 50% chance I'll be in the first
50 houses and a 50% chance I'll be in the last 50. On average, I'll be in the
first 50% of the houses 50% of the time.

In more general terms, for a town with $$n$$ houses, $$\frac{n}{2}$$ houses will
need to be searched on average. But this assumes that my friend has no
information to help him. 

Let's say that the local newspaper reports the removed family the next day by
saying where they were found. They family was probably found close to their
house rather than far away, because I am lazy (and my friend knows this). This
increases the likelihood that I am in the same area of the town the family was
found in, so it would make more sense to check the houses there first, and my
friend would probably find me by searching many fewer houses on average.

Finally, let's say my friend is clever and prepares a list detailing the names
of all the families and where each of them lives. The newspaper reports the
names of the families as they are found and my friend uses this to find out
exactly which house I am in, meaning he only needs to search one house.

# Some Maths

Let's assume there exists a function as follows:

$$
\begin{align}
\mathbf{H} &= \text{all the houses in the town}\newline
\mathbf{F} &= \text{all the families in the town}\newline
H &= \text{the house I chose}\newline
f(H) &= \text{the family that was removed}
\end{align}
$$

$$
f: \mathbf{H} \mapsto \mathbf{F} \\
\forall H \in \mathbf{H}, \exists F \in \mathbf{F}: f(H) = F \\
\forall F \in \mathbf{F}, \exists H \in \mathbf{H}: f(H) = F
$$

That is to say, there is a one-to-one mapping of each house to a family in the
town.

In the first instance, where my friend knew nothing about where I was hiding, he
had to perform a *brute force search* of the town to find me. This assumes that
$$f(H)$$ is a random mapping and there is no way of determining the input from
just the output. This is long and arduous and grows relative to the size of the
town. If the town doubles in size, he has to search twice as many houses. But
there is an easy tick he can use. If he hires some extra help, he can perform
the search much faster.

$$
\begin{align}
n &= \text{number of houses}\newline
t &= \text{time taken to search each house}\newline
p &= \text{number of people searching}\newline

\frac{n \times t}{2 \times p} &= \text{average time taken to find me}
\end{align}
$$

In the second instance, there was a *[heuristic][heuristic]* that allowed them
to find me faster by knowing some more information about how me selection of
choosing houses works. This heuristic says that for any given $$F$$, we know
some $$H \in \mathbf{H}$$ are more likely to be the house I chose, meaning that
fewer houses need to be searched on average.

In the third and final instance, my friend had a special function $$f^{-}:
\mathbf{F} \mapsto \mathbf{H}$$ (such that $$f^{-}(f(H)) = H$$), that allowed
them to know in one step what house any family came from making the time taken
to find me *constant*, in that it required the search of only one house, no
matter which house I was in.

# Search Spaces and Optimisation

This is an example of a *[search space][searchspace]* and some of the issues
related to actually searching. In the first case the size of the search space
was the houses that needed to be searched ($$\mathbf{H}$$), and there was no
information that would help reduce the size of that search space. In order to
find which house related to a given family, each house had to be searched one by
one until I was found.

In the second example, the search space could be reduced, because we knew that
there were some houses that were more likely to be the one that the family came
from. Those were searched first to find me quicker.

In the final example, the search space was a single house, because we already
knew exactly which house an individual family came from without needing to check
any beforehand.

In the first two cases, the search space could easily be increased by adding
more houses. The time taken to search could also be reduced, by having more
people help with searching houses. If you doubled the number of houses in the
town, it took twice as long to search. If you doubled the number of people
searching, it took half as long to search.

# Binary Numbers

In computing, numbers are generally stored in a *[binary][binary]* format. This
is due to the number being stored by turning a [group of transistors][flipflop]
on or off, like using a switch. Say we have one of these groups which can either
be on or off. We can assign each state a number, on is 1 and 0 is off. If we
have 2 of these, we can have four states as follows:

| State | Switch 1 | Switch 2 |
|:-----:|:--------:|:--------:|
| 0     | Off      | Off      |
| 1     | On       | Off      |
| 2     | Off      | On       |
| 3     | On       | On       |

We can use these two groups to represent 4 numbers. If we add a third switch, we
can represent 8 numbers, twice as many as with 2.

| State | Switch 1 | Switch 2 | Switch 3 |
|:-----:|:--------:|:--------:|:--------:|
| 0     | Off      | Off      | Off      |
| 1     | On       | Off      | Off      |
| 2     | Off      | On       | Off      |
| 3     | On       | On       | Off      |
| 4     | Off      | Off      | On       |
| 5     | On       | Off      | On       |
| 6     | Off      | On       | On       |
| 7     | On       | On       | On       |

In fact, for every group we add, we get twice as many numbers we can represent.
A simpler way of showing this is to represent each switch as a digit, a 0 or 1.
We then line these digits up from right to left. Each is given a value based on
the position it is in, starting from the right, of $$2^{p}$$. To get the number,
we add the values for all the digits that are a 1. For example, the number 169:

| Position | 7   | 6  | 5  | 4  | 3  | 2  | 1  | 0  |
| Value    | 128 | 64 | 32 | 16 | 8  | 4  | 2  | 1  |
| Digit    | 1   | 0  | 1  | 0  | 1  | 0  | 0  | 1  |

So in binary, the number 169 is represented as `10101001`.

The important part to note here is that for $$n$$ bits, we can represent
$$2^{n}$$ different numbers, the amount doubling for every bit we add. This
means that the number of numbers we can represent grows very quickly.

| Number of Bits | Number of Numbers          |
|:--------------:|:--------------------------:|
| `1`            | $$2$$                      |
| `2`            | $$4$$                      |
| `3`            | $$8$$                      |
| `4`            | $$16$$                     |
| `6`            | $$64$$                     |
| `8`            | $$256$$                    |
| `10`           | $$1024$$                   |
| `16`           | $$65536$$                  |
| `16`           | $$4.3 \times 1000^{3}$$    |
| `32`           | $$18.4 \times 1000^{6}$$   |
| `64`           | $$340.2 \times 1000^{12}$$ |

If it only takes a 16 bit number to have one value for half of the world's
population. If we had 16 times that many (256) bits, but only assigned the same
amount of values as we did if we only had 16, then if we pick one at random,
there is a 1 in 4.3 billion chance that we pick one assigned to an actual
person.

# In Computing

In computing our search space is often constrained by the values we can
represent. If we use 32 bit numbers, we have enough values for each person in
the world many times over. Most computers now use 64 bit numbers, meaning we
could have a database with a unique number for every combination of 2 people on
the planet and still have numbers to spare. So why would we **want** to have
larger numbers than this?

If you have a function that has an output with a small search space, then
finding a valid input for that function to give the output is relatively easy.
Let's say that I have a function that randomly maps any input number to some
output number.

$$
|\mathbf{I}| = |\mathbf{O}| \\
f: \mathbf{I} \mapsto \mathbf{O} \\
\forall i \in \mathbf{I}, \exists o \in \mathbf{O}: f(i) = o \\
\forall o \in \mathbf{O}, \exists i \in \mathbf{I}: f(i) = o \\
$$

Let's then say that is takes 1 microsecond ($$10^{-6}$$ seconds) for a computer
to compute the result of the function for any given value of $$i \in
\mathbf{I}$$. This is roughly equivalent to $$2^{-20}$$ seconds. If we have a
value $$o \in \mathbf{O}$$, then in order to find the corresponding $$i \in
\mathbf{I}$$, we need to try all the possible values of $$i \in \mathbf{I}$$
until we find the one that matches. This means that on average, we need to
search through half of the numbers to find a match. If each set uses 32 bits to
represent all the values, then the amount of time taken to search for a match on
average is as follows:

$$
\frac{2^{32} \times 2^{-20}}{2}
= \frac{2^{32}}{2^{21}} 
= 2^{11} \text{ seconds}
\approx 34 \text{ minutes}
$$

If each set uses 64 bits to represent all of the values, we instead find the
amount of time taken to search for a match on average is instead:

$$
\frac{2^{64} \times 2^{-20}}{2}
= \frac{2^{64}}{2^{21}}
= 2^{43} \text{ seconds}
\approx 279 \text{ millennia}
$$

By doubling the number of bits, we get a substantial increase in search time. In
contrast, doubling the number of computers doing the searching, or having a
computer that is twice as fast, is equivalent to having one less bit's worth of
values.

We can use this concept to describe the amount of work required to search a set
of values as *bits of work*. If there are roughly $$2^n$$ values to search
through, there are $$n$$ bits of work to be done and, on average, $$2^{n -1}$$
values to be searched.

This is only true if there is a random mapping that can't be predicted between
the input and output of the function. If we have some indication or can predict
what the input might have been for a given number, then the search is much
easier.

If we just make a record of all inputs and resultant outputs, then the search
for an input is almost instantaneous.

This concept of searching and search spaces has many uses for both determining
why some computational processes are difficult and time consuming, also giving
some indication of how to optimise them, but also for intentionally designing
computational processes that are fast and simple to perform in one direction but
complex and time consuming to perform in reverse.


[heuristic]:    https://en.wikipedia.org/wiki/Heuristic_(computer_science) "Wikipedia - Heuristic (computer science)"
[searchspace]:  https://en.wikipedia.org/wiki/Feasible_region "Wikipedia -Feasible region"
[binary]:       https://en.wikipedia.org/wiki/Binary_number "Wikipedia - Binary number"
[flipflop]:     https://en.wikipedia.org/wiki/Flip-flop_(electronics) "Wikipedia - Flip-flop (electronics)"
[hash]:         https://en.wikipedia.org/wiki/Hash_function "Wikipedia - Hash function"
