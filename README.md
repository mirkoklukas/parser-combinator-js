# Monadic parsing in JavaScript

A Javascript implementation of (some of) the *monadic parser combinators* defined by G. Hutton and E. Meijer (cf. [1], see below).

You can see the combinators in action here (the combinators are used to define the parsing function): <a href="http://mirkoklukas.github.io/parser-combinator-js/demo/">Lisp interpreter</a>

[1] G. Hutton and E. Meijer, *Monadic parsing in Haskell*, Journal of Functional Programming **8**, Cambridge University Press (1998), 437–444.


## What is it

A **(monadic) parser combinator** is a higher-order functions that produces, and serves as building block for a more specific *parser*. In our context a **parser** can be understood as a funcion that takes a string, `x` say, and returns a list of tuples `[(a_1, y_1), ...,(a_n, y_n)]`, where the `a_i` are of some previously fixed data type and the `y_i` are strings as well. The first component of the tupel can be understood as the result of the parser (e.g. another string, a single character, or a abstract synthax tree), whereas the second component is the remaining string (i.e. the part of the string that hasn't yet been "consumend" by the parser). The empty list `[]` indicates a failed approach of parsing the given string. The term *monadic* refers to the fact that we can endow the the set of parsers with an additional structure -- we'll dive into that later.

**Examples**. Here is a simple parsing function that simply consumes the letter "z":
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

For simplicity let's agree on the following haskell like notation for a function that takes an argument `x` and returns a value `f(x)`:
```
f: x |---> f(x)
```
Let's forget for a moment that a parsing function actually returns a list of results `[(a_1, y_1), ...,(a_n, y_n)]` and assume that it just returns single tupel `(a, y)`. Now suppose we have two parsing functions `f` and `g`. One could easily define a new parser by the concatenation of the two, i.e.
```
f*g: x |---> f(x)=[a, y] |---> g(y)=[b, z].
```



### Monadic behaviour



...

