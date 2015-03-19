(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

// --------------------
// Load the interpreter
// --------------------
var Lispy = require('../lib/lispy')

// --------------------
// Create the GUI
// --------------------
var input = document.getElementById("input-container"),
	output = document.getElementById("output"),
	runBtn = document.getElementById("btn-run"),
	inputMirror = CodeMirror(input, {
    	lineNumbers: true
	});

// --------------------
// Our sample programm source code
// --------------------
var src = '(begin ' + '\n\t' +
				'(define x 2) ' + '\n\t' +
				'(define ' + '\n\t\t' +
					'pow ' + '\n\t\t' +
					'(lambda ' +  '\n\t\t\t' +
						'(a b) ' + '\n\t\t\t' +
						'(if ' + '\n\t\t\t\t' +
							'(= b 0) ' + '\n\t\t\t\t' +
							'1 ' + '\n\t\t\t\t' +
							'(* a (pow a (- b 1)))))) ' +  '\n\t' +
				'(pow x 4)) ';

inputMirror.getDoc().setValue(src);

// --------------------
// What is a run button wihtout a "click"-listener
// --------------------
runBtn.addEventListener("click", function (e) {
	var src = inputMirror.getDoc().getValue(),
		parsed = Lispy.parse(src),
		result = output.innerHTML = Lispy.run(src);

	console.group("RUN the whole thing....");
	console.log("Source string:")
	console.log(src);
	console.log("Parsed result:");
	console.log(parsed);
	console.log("Evaluated result:");
	console.log(result);
	console.groupEnd();
});

},{"../lib/lispy":2}],2:[function(require,module,exports){

// 	=============================================================================
// 	Lisp interpreter.
// 	=============================================================================

// --------------------
//  The parser pieces
// --------------------
var parserCombinator = require("./parser-combinator")

// To keep notation tight we start with populating the local
// scope with the parts of the parser combinator we need.
var manyPlus = parserCombinator.manyPlus,
	manyStar = parserCombinator.manyStar,
	sat 	 = parserCombinator.sat,
	comprehension = parserCombinator.comprehension,
	result 	 = parserCombinator.result,
	char 	 = parserCombinator.char,
	digit 	 = parserCombinator.digit,
	letter 	 = parserCombinator.letter,
	shift 	 = parserCombinator.shift,
	reShift  = parserCombinator.reShift,
	space 	 = parserCombinator.space,
	spaces 	 = parserCombinator.spaces;


var	symbol 	 = sat(function (x) {
	return "!#$%&|*+-/:<=>?@^_~".indexOf(x) > -1;
});

var sign 	= shift.bind(function (x) {
	return (x === "+" || x === "-") ?  result(x) : reShift(x);
});

var positiveNumber = manyPlus(digit, true).bind(function (a) {
	return char(".").bind(function (dot) {
		return manyPlus(digit, true).bind(function (b) {
			return result(Number(a + "." + b));
		});
	}).or(result(Number(a)));
});

var number = sign.bind(function (sign) {
	return positiveNumber.bind(function (n) {
		return result(Number(sign + n));
	});
});

// var number = comprehension(sign, positiveNumber, function (sign, n) {
// 	return Number(sign + n);
// });

var identifier = letter.or(symbol).bind(function (first) {
	return manyStar(letter.or(digit).or(symbol), true).bind(function (rest) {
			return  result(first + rest);
	});
});

// Non-list expressions
var atom = identifier.or(number);

var list = char("(").bind(function (_) {
	return (atom.or(list)).sepByPlus(spaces).bind(function (exprs) {
		return manyStar(space, true).bind(function (_) {
			return char(")").bind(function (_) { 
				return result(exprs);
			});
		});	
	});
});

// --------------------
// Create the AST in terms of nested lists
// --------------------
var parse = function(src) {
	var parsedSrc = manyStar(space, true).bind(function (_) {
		return list.bind(function (l) {
			return manyStar(space, true).bind(function (_) {
				return result(l);
			});
		});
	}).parse(src);  
	
	if(parsedSrc.length === 0) throw "The synthax of your source code is not accurate... :(";

	return parsedSrc.length > 0 ? parsedSrc[0][0] : null;
};

// --------------------
// The scope object: where expressions save their variables
// (e.g. the `evaluate` method is called with an expression together with 
// a resp. scope)
// --------------------
var createScope = function (outerScope) {
	return Object.create( outerScope || {});
};

// --------------------
// 	Evaluates subtrees (expressions) of the AST
// --------------------
var evaluate = function (expr, scope) {
	// --------------------
	// 	Evaluate Atoms, i.e. non-list expr
	// --------------------
	if(!(expr instanceof Array)) {
		switch(typeof expr) {
		// --------------------
		case "string":
			return scope[expr];
			break;
		// --------------------
		case "number":
		case "boolean":
			return expr;
			break;
		}
	// --------------------
	// 	Empty list `()`
	// --------------------
	} else if (expr.length === 0) { 
		console.log("Empty list...")
		return null;
	// --------------------
	// 	Evaluate list expressions
	// --------------------
	} else {
		switch(expr[0]) {
		// --------------------
		case "begin":
			var vals = expr.slice(1).map(function (x) {
				return evaluate(x, scope);
			});
			return vals.pop();
			break;
		// --------------------
		case "define":
			var key = expr[1]
			  ,	val = evaluate(expr[2], scope);
			scope[key] = val;
			break;
		// --------------------
		case "if":
			var condition = expr[1]
			  ,	conseq = expr[2]
			  ,	alt = expr[3];
			return evaluate(condition, scope) ? evaluate(conseq, scope) : evaluate(alt, scope);
			break;
		// --------------------
		case "set!":
			var key = expr[1]
			  ,	val = evaluate(expr[2], scope);
			scope[key] = val;
			break;
		// --------------------
		case "lambda":
			var keys = expr[1]
			  ,	body = expr[2];
			return function () {
				var args = [].slice.call(arguments)
				  , functionScope =  createScope(scope);
				for(var i = 0, max = keys.length; i < max; i++) { 
					functionScope[keys[i]] = args[i];
				}
				return evaluate(body, functionScope);
			};
			break;
		// --------------------
		default:
			var f = scope[expr[0]]
			  , args = expr.slice(1).map(function (x) {
				return evaluate(x, scope);
			});
			return f.apply(null, args);
		}
	}
};

// --------------------
// 	Populate the global scope (with some
// 	primitive mathematical functions)
// --------------------
var globalScope = createScope({
	"+": function () { return [].slice.call(arguments).reduce(function(a,b){ return a+b; }); },
	"-": function () { return [].slice.call(arguments).reduce(function(a,b){ return a-b; }); },
	"*": function () { return [].slice.call(arguments).reduce(function(a,b){ return a*b; }); },
	"/": function () { return [].slice.call(arguments).reduce(function(a,b){ return a/b; }); },
	"=": function (a,b) { return a===b; },
	"<": function (a,b) { return a<b; },
	">": function (a,b) { return a>b; },
	"AND": function (a,b) { return a && b; },
	"OR": function (a,b) { return a || b; }
});

// --------------------
// 	Return the interpreter object
// --------------------
module.exports = {
	parse: parse,
	run: function (src) {
		return evaluate(this.parse(src), globalScope);
	}
};




},{"./parser-combinator":3}],3:[function(require,module,exports){
// 	=============================================================================
// 	Mondadic Parser Combinator
// 	=============================================================================

// --------------------
// The object that will be populated and exported
// --------------------
var parserCombinator = {}
module.exports = parserCombinator

// --------------------
// 	Parser constructor. 
// 	(NOTE that we define some prirmitive parsers first and then 
// 	add functions to Parser.prototype using these primitives)
// 	The signature of the parse function f needs to be f:String --> [[a,String]]
// --------------------
var Parser = parserCombinator.Parser =  function (f) {
	this.parse = f;
};

// --------------------
//	Primitives
// --------------------
var result = parserCombinator.result = function (a) {
	return new Parser(function (string)  { 
		return [[a,string]]; 
	});
};

var zero = parserCombinator.zero = new Parser(function (string) {
	return [];
});

var item = parserCombinator.item = new Parser(function (string) {
	return string.length === 0 ? [] : [ [string.charAt(0), string.slice(1)] ];
});

// same as item
var shift = parserCombinator.shift = new Parser(function (string) {
	return string.length === 0 ? [] : [ [string.charAt(0), string.slice(1)] ];
});

var reShift = parserCombinator.reShift = function (xs) {
	return new Parser(function(string) {
		return [["", xs + string]];
	});
};

// --------------------
//	Combinators
// --------------------
Parser.prototype.bind = function (f) {
	var p = this;
	return new Parser(function (x) {
		var ys = p.parse(x);
		var	zs = ys.map(function (y) {
				return f(y[0]).parse(y[1]);
		});
		return [].concat.apply([], zs);
	});
};

Parser.prototype.plus = function (q) {
	var p = this;
	return new Parser(function (x) {
		return p.parse(x).concat(q.parse(x));
	});
};

Parser.prototype.or = function (q) {
	var p = this;
	return new Parser(function (x) {
		var ys = p.parse(x);
		return ys.length > 0 ? ys : q.parse(x);
	});
};

Parser.prototype.seq = function (q) {
	var p = this;
	return p.bind( function (x) { 
		return q.bind(function (y) {
			return result(x+y);
		});
	});
};

Parser.prototype.mult = function (f) {
	var p = this;
	return function (x) {
		return f(x)===true ? p : zero;
	};
};

var sat = parserCombinator.sat =  function (f) {
	return item.bind(function (x) {
			return f(x) === true ? result(x) : zero;
	});
};

Parser.prototype.fold = function() {
	var p = this;
	return p.bind(function (xs) {
		return result(xs.join("")); 
	})
};

Parser.prototype.first = function() {
	var p = this;
	return new Parser(function (x) {
		var ys = p.parse(x);
		return ys.length > 0 ? [ys[0]] : [];
	});
};

//	The Combinator manyStar takes a parser p and returns a parser
// 	whose list of results contains the matches of p, pˆ2, pˆ3,... and []
//  Note that manyStar succeeds even if the given parser `p` doesn't 
var manyStar = parserCombinator.manyStar = function (p, folded) {
	return p.bind(function (x) {
		return manyStar(p, folded).bind(function (xs) {
			return folded ? result([x].concat(xs)).fold() : result([x].concat(xs));
		})
	}).plus(result([]));
};

// The Combinator manyPlus behaves almost like manyStar with the
// following difference: it only succeeds if the given parser 
// p succeeds at least once 
var manyPlus = parserCombinator.manyPlus = function (p, folded) {
	return p.bind(function (x) {
		return manyStar(p, folded).bind(function (xs) {
			return folded ? result([x].concat(xs)).fold() : result([x].concat(xs));
		})
	});
};



// // Independent alternative for Parser.prototype.first 
// var first = function(p) {
// 	return new Parser(function (x) {
// 		var r = p.parse(x).shift();
// 		return r == undefined ? [] : [r];
// 	});
// };

// This function called upon a parser p takes a parser sep and 
// returns a parser that consequtively applies p followed by sep.
Parser.prototype.sepByPlus = function (sep) {
	var p = this;
	return p.bind(function (x) {
		return manyStar(sep.bind(function (_) { return p; })).bind(function (xs) {
			return result([x].concat(xs));
		})
	});
};

Parser.prototype.sepByStar = function (sep) {
	var p = this;
	return p.sepByPlus(sep).plus( result([]) );
};

Parser.prototype.sepByOne = function (sep) {
	var p = this;
	return p.bind(function (x) {
		return sep.bind(function (_) {
			return result(x);
		});
	});
};


// --------------------
// `comprehension` is syntactic sugar for a common
// pattern, that arises while working with parser combinators, namely:
// 		
// 		comprehension(p1, p2, p3, function f(x1, x2, x3) { ... }) 
//
//		:=
// 		
// 		p1.bind(function (x1) { 
// 			return p2.bind(function (x2) {
// 				return p3.bind(function (x3) {
// 						return result(f(x1,x2,x3));
// 					})
// 			});
// 		});
// 
// --------------------
var partial = function (f, x) {
	return function () {
			var bs = Array.prototype.slice.call(arguments);
			return f.apply(this, [x].concat(bs));
	};
};

// Takes an arbitray number of parsers and a function of their results 
// (see example above)
var comprehension = parserCombinator.comprehension = function () {
	var args = [].slice.call(arguments)
	  , ps = args.slice(0,-1)
	  , f = args[args.length - 1];

	return args.length === 1 ? result(f()) : ps.shift().bind( function (x) {
			return comprehension.apply(null, ps.concat([partial(f,x)]) );
	});
};


// --------------------
// More Primitives 
// (built with the above combinators)
// --------------------
var char = parserCombinator.char = function (c) {
	return sat(function (d) { 
		return c == d; 
	});
};

var digit = parserCombinator.digit = sat(function (x) { 
	return '0' <= x && x <= '9'; 
});

var lower = parserCombinator.lower = sat(function (x) { 
	return 'a' <= x && x <= 'z'; 
});

var upper = parserCombinator.upper = sat(function (x) { 
	return 'A' <= x && x <= 'Z'; 
});

var letter = parserCombinator.letter = lower.plus(upper);

var space = parserCombinator.space = sat(function (x) {
	return (x == " ") || (x == "\n") || (x == "\t");
});

var spaces = parserCombinator.spaces = manyPlus(space).first().bind(function (_) {
	return result([]);
});

var alphanum = parserCombinator.alphanum = letter.plus(digit);

var keyword = parserCombinator.keyword = function(str) {
	if(str === "") return result("");

	var x = str.charAt(0);
	var xs = str.slice(1);

	return char(x).bind(function (_) {
		return keyword(xs).bind(function (_) {
			return result(x + xs);
		})
	});
};





},{}]},{},[1]);
