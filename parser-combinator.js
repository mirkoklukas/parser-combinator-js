

;(function (exports) { 

	// --------------------
	// 	Parser constructor. 
	// 	(Note that we define some prirmitive parsers first and then 
	// 	add functions to Parser.prototype using these primitives)
	// --------------------
	var Parser  = function (f) {
		//f a:: String --> [(a,String)]
		this.parse = f;
	};

	// --------------------
	//	Primitives
	// --------------------
	var primitives = {};

	var result = primitives.result = function (a) {
		return new Parser(function (string)  { 
			return [[a,string]]; 
		});
	};

	var zero = primitives.zero = new Parser(function (string) {
		return [];
	});

	var item = primitives.item = new Parser(function (string) {
		return string.length === 0 ? [] : [ [string.charAt(0), string.slice(1)] ];
	});

	// Same as item
	var shift = primitives.shift = new Parser(function (string) {
		return string.length === 0 ? [] : [ [string.charAt(0), string.slice(1)] ];
	});

	var reShift = primitives.reShift = function (xs) {
		return new Parser(function(string) {
			return [["", xs + string]];
		});
	};

	// --------------------
	//	Combinators
	// --------------------
	var combinators = {};

	Parser.prototype.bind = function (f) {
		var p = this;
		return new Parser(function (x) {
			var ys = p.parse(x)
			var zs = ys.map(function (y) {
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

	var sat = combinators.sat =  function (f) {
		return item.bind(function (x) {
				return f(x) === true ? result(x) : zero;
		});
	};

	//many_*:: Parser a --> Parser [a]
	//The list [a] contains the matches of p, pˆ2, pˆ3,... and []
	// `many_*` succeeds even if the given parser `p` doesn't 
	var many_star = combinators.many_star = function (p) {
		return p.bind(function (x) {
			return many_star(p).bind(function (xs) {
				return result([x].concat(xs));
			})
		}).plus(result([]));
	};

	// many_+:: Parser a --> Parser [a]
	// The list [a] contains the matches of p, pˆ2, pˆ3,...
	// `many_+` only succeeds if the given parser `p` succeeds at least once 
	var many_plus = combinators.many_plus = function (p) {
		return p.bind(function (x) {
			return many_star(p).bind(function (xs) {
				return result([x].concat(xs));
			})
		});
	};

	//fold:: Parser [a] --> Parser a
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

	// // Independent alternative for Parser.prototype.first 
	// var first = function(p) {
	// 	return new Parser(function (x) {
	// 		var r = p.parse(x).shift();
	// 		return r == undefined ? [] : [r];
	// 	});
	// };

	//sepby_+: Parser a --> Parser b --> Parser [a]
	Parser.prototype.sepBy_plus = function (sep) {
		var p = this;
		return p.bind(function (x) {
			return many_star( sep.bind(function (_) { return p; }) ).bind(function (xs) {
					return result([x].concat(xs));
				})
		});
	};

	Parser.prototype.sepBy_star = function (sep) {
		var p = this;
		return p.sepBy_plus(sep).plus( result([]) );
	};

	Parser.prototype.sepBy_one = function (sep) {
		var p = this;
		return p.bind(function (x) {
			return sep.bind(function (_) {
				return result(x);
			});
		});
	};


	// --------------------
	// `comprehension` is syntactic sugar for a common
	// pattern that arises while working parser combinators, namely:
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

	// Takes an arbitray number of parsers and function of their results (see example above)
	var comprehension = combinators.comprehension = function () {
		var args = [].slice.call(arguments),
			ps = args.slice(0,-1),
			f = args[args.length - 1];
		if(args.length === 1) return result( f() );
		return ps.shift().bind( function (x) {
				return comprehension.apply(null, ps.concat([partial(f,x)]) );
		});
	};


	// --------------------
	// More Primitives 
	// (built with the above combinators)
	// --------------------
	var char = primitives.char = function (c) {
		return sat(function (d) { 
			return c == d; 
		});
	};

	var digit = primitives.digit = sat(function (x) { 
		return '0' <= x && x <= '9'; 
	});

	var lower = primitives.lower = sat(function (x) { 
		return 'a' <= x && x <= 'z'; 
	});

	var upper = primitives.upper = sat(function (x) { 
		return 'A' <= x && x <= 'Z'; 
	});

	var letter = primitives.letter = lower.plus(upper);

	var space = primitives.space = sat(function (x) {
		return (x == " ") || (x == "\n") || (x == "\t");
	});

	var spaces = primitives.spaces = many_plus(space).first().bind(function (_) {
		return result([]);
	});

	var alphanum = primitives.alphanum = letter.plus(digit);

	//string:: String --> Parser String
	var keyword = primitives.keyword = function(str) {
		if(str === "") return result("");

		var x = str.charAt(0);
		var xs = str.slice(1);

		return char(x).bind(  function(_) {
			return keyword(xs).bind( function(_) {
				return result(x + xs);
			})
		});
	};

	exports.parserCombinator = {
		parser: Parser,
		primitives: primitives,
		combinators: combinators
	}

}(typeof exports === 'undefined' ? this : exports));


