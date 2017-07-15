---
title: Atoms Language
---

# Types

## Concrete Types

* `String`
* `Int`
* `Float`
* `Nil`
* `Cons`
* `List`
* `Type`

## Structured Types

>  Constructors are *consumer* chains that eventually produce a value of some
>  *type*.

> Fuzzy typing on `enum` and `struct`?

### Structs

```
(struct
  ((member_a type_a)
    (member_b type_b)
    ...
    (member_n type_n)))

(let 
  ((Box (T) 
      ((struct (value T))))
    (UnitBox (Box ())))
  (UnitBox::new ()))
```

> Member Syntax

### Enums

```
(enum
  ((variant struct)
    (variant struct)
    ...
    (variant struct)))

(let
  ((Option (T)
      ((enum
          ((Some ((value T)))
            None ()))))
    (UnitOption (Option ())))
  (UnitOption::Some ()))
```

> `match` form

```
(match name
  ((variant_a expr_a)
    (variant_b expr_b)
    ...
    (variant_n expr_n))
  otherwise-expr); Optional catch-all?

(defun Option (T)
  (enum
    ((Some ((value T)))
      (None ()))))
(def IntOption (Option Int))

; Implicit unrwap on Struct (..., Some (..., value: Int, ...), ...)?
(def unwrap (value)
  (match value
    ((Some (self.value)))
    (0)))

(let
  ((value (IntOption::Some 12)))
  (unwrap value))

(unwrap (IntOption::None ()))
```

> Note: `self` is bound in scope of all impl expressions to the value being
> called on.

## Traits

```
(trait name
  ((type_a constructor_a)
    (type_b constructor_b)
    ...
    (type_n constructor_n)))
```

```
(impl name type
  ((type_a expr_a)
    (type_b expr_b)
    ...
    (type_n expr_n)))
```

> Note: `self` is bound in scope of all impl expressions to the value being
> called on.

# Scope

Scope consists of a collection of bindings. Bindings are either to a *value* or
to a *type*.

## Binding Values into Parent Scope (`def`)

The `def` *form* evaluates an *expression* and binds it to the given *name* in
its parent's scope. That name will **always** have the *type* of the first value
it was bound to.

```
(def name expr)
```

## Binding into a Consumer (`bind`)

The `bind` *form*, when evaluated, produces a *consumer* with a new *scope*
inhereting everything from the parent. When the *consumer* is evaluated, it
takes the first *value* from the list that follows it and binds it to a *name*
in its own *scope*. The *consumer* has a type that consumes the *type* used by
the first consumer in the experssion to use the binding (and forcing that *name*
to remain that type for the duration of the *scope*), and produces the type of
the inner *expression*.

> Note on temprality. It is not clear whether the inhereted scope should refer
> to the parent's scope when the consumer is created or when it is evaluated.

```
(bind name expr)
```

### Optional Consumers (`bind-final`)

In order to evaluate *consumers* in a list of indeterminate size, the
`bind-final` form needs to be used (albeit inderectly). This *form* creates a
*consumer* with two *expressions*. When the *consumer* is evaluated, If there is
a further value in the list to consume, it takes it and binds it to *name* in
its scope and evaluates the first *expression*, otherwise it evaluates the
second *expression*, without the named value in scope.

The *consumer* produced by this *form* has a type such that it consumes a value
of some *type*. For convenience, the first of the two expressions **may either**
evaluate to the *type* initially consumed or to a *consumer* of the same type as
itself, producing what is known as an *iterative consumer*. THe second of the
two expressions **must** evaluate to the same *type* as was initially consumed.

```
(bind-final name expr_with expr_without)
```

## Binding Multiple Values

### Chain Consumer (`lambda`)

The `lambda` *form* produces a chain of *consumers* that evaluate iteratively
with a list and eventually produce an expression.

```
(lambda (arg_a arg_b ... arg_n) 
  expr)
```

Is equivalent to

```
(bind arg_a 
  (bind arg_b
    (... 
      (bind arg_n 
        expr))))
```

### Bind a Chain Consumer into Parent Scope (`defun`)

The  `defun` *form* creates a `lambda` and binds it to a *name* in the parent
*scope*.

```
(defun name
  (arg_a arg_b ... arg_n)
  expr)
```

Is equivalent to

```
(def name
  (lambda (arg_a arg_b ... arg_n)
    expr))  
```

### Multiple Optional Consumer (`lambda-final`)

The `lambda-final` form conusmes two values and an *expression* and produces a
*consumer* that consumes one *value*, binding it to a name in its internal
*scope* and produces another *consumer*. If that second consumer can consume a
*value*, it evaluates it internal *expression*, otherwise it evaluates to the
*value* that was initially consumed.

Due to the restraints on `bind-final`, `lambda-final` must consume one or two
*values* of the same *type* and the internal *expression* must evaluate to
either the same *type* as the consumed *values* or to an *iterative consumer*
that consumes and produces values of the same *type* as initially consumed.

```
(lambda-final (arg_a arg_b) expr_with)
```

Is equivalent to

```
(bind arg_a
  (bind-final arg_b
    expr_with
    (arg_a)))
```
    
### Bind an Iterative Consumer into Parent Scope (`defold`)

The `defold` form produces a *consumer* that, when evaluated, will reproduce
itself, consuming one or more *values* of the same *type* from a list until no
values remain in the list. 

The *type* the type produced is *iterative consumer* that consumes and produces
values of a given *type*. The *type* of *values* consumed must be the same and
the internal *expression* must evaluate to the same type as the arguments.

```
(defold name (arg_a arg_b) (expr))
```

Is equivalent to

```
(def name
  (lambda-final (arg_a arg_b) 
    (name (expr))))
```

### Sub-scope (`let`)

The `let` *form* creates a new *scope* and binds a series of *names* to
expressions, before evaluating the innermost expression.

```
(let
  ((arg_a (expr_a))
    (arg_b (expr_b))
    (...)
    (arg_n (expr_n)))
  expr)
```

Is equivalent to

```
((bind arg_a
    (bind arg_b
      (...
        (bind arg_n
          expr))))
  expr_a
  expr_b
  ...
  expr_n)
```

