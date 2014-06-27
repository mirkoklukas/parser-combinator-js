# Monadic parsing in JavaScript
A Javascript implementation of (some of) the *monadic parser combinators* defined by G. Hutton and E. Meijer (cf. [1], see below).

You can see the combinators in action here (the combinators are used to define the parsing function): <a href="http://mirkoklukas.github.io/parser-combinator-js/demo/">Lisp interpreter</a>

[1] G. Hutton and E. Meijer, *Monadic parsing in Haskell*, Journal of Functional Programming **8**, Cambridge University Press (1998), 437–444.


## What is it
A **(monadic) parser combinator** is a higher-order functions that produces, and serves as building block for a more specific *parser*. In our context a **parser** can be understood as a funcion that takes a string, `x` say, and returns a list of tuples `[(a_1, y_1), ...,(a_n, y_n)]`, where the `a_i` are of some previously fixed data type `A` and the `y_i` are strings as well. The first component of the tupel can be understood as the result of the parser (e.g. another string, a single character, or a abstract synthax tree), whereas the second component is the remaining string (i.e. the part of the string that hasn't yet been "consumend" by the parser). The empty list `[]` indicates a failed approach of parsing the given string. The term *monadic* refers to the fact that we can endow the the set of parsers with an additional structure -- we'll dive into that later.

**Example**. Here is a simple parsing function that simply consumes the letter "z":
```JavaScript
var z = function (string) {
  var first = string.charAt(0),
      rest  = string.slice(1);
  if (first === "z") return [["z", rest]];
  else return [];
}

z("zoo"); // [["z", "oo"]] 
z("shoe"); // [] 
```

**Example**. Here is another simple parsing function that simply consumes the first letter of a string, or fails if the string is empty:
```JavaScript
var item = function (string) {
	return string.length === 0 ? [] : [ [string.charAt(0), string.slice(1)] ];
}

item("zoo"); // [["z", "oo"]] 
item("shoe"); // [["s", "hoe"]] 
item(""); // [] 
```

**Example**. Lets conclude the section with a trivial example. The function that always fails:
```JavaScript
var zero = function (string) {
	return [];
}

zero("whatever"); // [] 
```

#### Monadic behaviour
**Bind**. For simplicity let's agree on the following mathy notation for a function that takes an argument `x` of some type `A` and returns a value `f(x)` of some type `B`:
```
f: A  ---> B
   x |---> f(x).
```
In particular a parsing function is map 
```
String ---> [A×String],
```
where `[A×String] := {[]} ⋃ { [(a_1, y_1), ...,(a_n, y_n)]; n ∈ ℕ, (a_i, y_i) ∈ (A×String)}`.

Let's forget for a moment that a parsing function actually returns a list of results `[(a_1, y_1), ...,(a_n, y_n)]` and assume that it just returns single tupel `(a, y)`. Furthermore suppose we are given two parsing functions `P` and `Q`. One could easily define a new parsing function `P*Q` by
```
P*Q: x |---> P(x)=(a, y) |---> Q(y)=(b, z).
```
There is nothing wrong with this approach, however the final result `(b,z)` does not depend on the intermediate result `a` of the first function `P` at all. The natural evolution of the above approach would be the following
```
P `bind` f: x |---> P(x)=(a, y) |---> (f(a))(y)=(b, z).
```
Note that we replaced `Q` by a function `f: A ---> Parser`, i.e. given some `a` the received function value `f(a)` is a parsing function itself. 


...

