// 	=============================================================================
// 	Mondadic Parser Combinator
// 	=============================================================================

/**
 * Parser combinator.
 * @module parser-combinator
 */
var parserCombinator = {}
module.exports = parserCombinator

/** 
 * Parser constructor. 
 * @constructor
 * @class
 * @param  {function} f - A parsing function with signature String --> [[a,String]].
 */
// NOTE that we define some prirmitive parsers first and then 
// add functions to Parser.prototype using these primitives
var Parser = parserCombinator.Parser =  function (f) {
	this.parse = f;
};

// --------------------
//	Primitives
// --------------------

/** 
 * The natural element with respect to bind.
 * @param  {object} a - A parser result.
 * @return {Parser} - The parser that always succeeds with [[a, string]].
 */
var result = parserCombinator.result = function (a) {
	return new Parser(function (string)  { 
		return [[a,string]]; 
	});
};

/** 
 * The parser that always fails.
 * @type {Parser}
 */
var zero = parserCombinator.zero = new Parser(function (string) {
	return [];
});

/** 
 * A Parser that consumes the first letter.
 * @type {Parser}
 */
var item = parserCombinator.item = new Parser(function (string) {
	return string.length === 0 ? [] : [ [string.charAt(0), string.slice(1)] ];
});

/** 
 * A Parser that consumes the first letter (same as {@link item}).
 * @type {Parser}
 */
var shift = parserCombinator.shift = new Parser(function (string) {
	return string.length === 0 ? [] : [ [string.charAt(0), string.slice(1)] ];
});

/** 
 * Produces a parser that behaves like the inverse of shift.
 * @function
 * @param  {string} xs -  
 * @return {Parser} - A parser that behaves like the inverse of shift.
 */
var reShift = parserCombinator.reShift = function (xs) {
	return new Parser(function(string) {
		return [["", xs + string]];
	});
};

// --------------------
//	Combinators
// --------------------

/** 
 * @function
 * @param  {function} f - A function with signature a --> Parser  
 * @return {Parser} - A parser that applies the original parser first, and 
 * 	then based on the result applies f(a).
 */
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

/** 
 * @function
 * @param  {Parser} q - A Parser 
 * @return {Parser} - A parser that collects the result of the original parser and q.
 */
Parser.prototype.plus = function (q) {
	var p = this;
	return new Parser(function (x) {
		return p.parse(x).concat(q.parse(x));
	});
};

/** 
 * @function
 * @param  {Parser} q - A Parser 
 * @return {Parser} - A parser that collects the result of the original parser, 
 *  or, if that result is empty returns the result of q.
 */
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




