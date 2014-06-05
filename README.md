# Monadic parsing in JavaScript

A Javascript implementation of (some of) the *monadic parser combinators* defined by G. Hutton and E. Meijer (cf. [1], see below).

You can see the combinators in action here (the combinators are used to define the parsing function): <a href="http://mirkoklukas.github.io/parser-combinator-js/demo/">Lisp interpreter</a>

[1] G. Hutton and E. Meijer, *Monadic parsing in Haskell*, Journal of Functional Programming **8**, Cambridge University Press (1998), 437–444.


## What is it

*Monadic parser combinators* are higher-order functions that produce, and serve as building blocks for more specific *parsers*. In our context a *parser* can be understood as a funcion
```
f::String --> A &times; String
```


