# Monadic parsing in JavaScript

A Javascript implementation of (some of) the *monadic parser combinators* defined by G. Hutton and E. Meijer (cf. [1], see below).

You can see the combinators in action here (the combinators are used to define the parsing function): <a href="http://mirkoklukas.github.io/parser-combinator-js/demo/">Lisp interpreter</a>

[1] G. Hutton and E. Meijer, *Monadic parsing in Haskell*, Journal of Functional Programming **8**, Cambridge University Press (1998), 437–444.


## What is it

A **monadic parser combinator** is a higher-order functions that produces, and serves as building block for a more specific *parser*. In our context a **parser** can be understood as a funcion that takes a `string` and returns a list of tuples `[(a,string), ...,(a,string)]` of some data type `a` and another `string`. The first component of the tupel can be understood as the result of the parser (e.g. another string, a single character, or a abstract synthax tree), whereas the second component is the remaining string (i.e. the part of the string that hasn't yet been "consumend" by the parser). The empty list `[]` indicates a failed approach of parsing the given string.

**Examples**:
```JavaScript

var myFirstParsingFunction = function (string) {
  var first = string.charAt(0),
      rest  = string.slice(1);
  if (first === "x") return [["x", rest]];
  else return [];
}

myFirstParsingFunction("xyz"); // [["x", "yz"]] 
myFirstParsingFunction("zyx"); // [] 

```

