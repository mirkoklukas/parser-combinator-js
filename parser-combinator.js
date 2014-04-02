

	var Parser = function (f) {
		//f a:: String --> [(a,String)]
		this.parse = f;
	};

	//
	//	Primitives
	//

	var result = function (a) {
		return new Parser(function (string)  { 
			return [[a,string]]; 
		});
	};

	var zero =  new Parser(function (string) {
		return [];
	});

	var item = new Parser(function (string) {
		return string.length === 0 ? [] : [ [string.charAt(0), string.slice(1)] ];
	});

	var shift = new Parser(function (string) {
		return string.length === 0 ? [] : [ [string.charAt(0), string.slice(1)] ];
	});

	var reshift = function (xs) {
		return new Parser(function(string) {
			return [["", xs + string]];
		});
	};

	//
	//	Combinators
	//

	Parser.prototype.bind = function (Q) {
		var p = this;
		return new Parser(function (x) {
			var ys = p.parse(x)
			var zs = ys.map(function (y) {
				return Q(y[0]).parse(y[1]);
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
			if (b(x)===true) return p;
			else return zero;
		};
	};

	var sat = function (f) {
		return item.bind(function (x) {
				return f(x) === true ? result(x) : zero;
		});
	};

	//many_*:: Parser a --> Parser [a]
	//The list [a] contains the matches of id, p, pˆ2, pˆ3,...
	var many_star = function (p) {
		return p.bind(function (x) {
			return many_star(p).bind(function (xs) {
				return result([x].concat(xs));
			})
		}).plus(result([]));
	};

	//many_+:: Parser a --> Parser [a]
	//The list [a] contains the matches of p, pˆ2, pˆ3,... 
	var many_plus = function (p) {
		return p.bind(function (x) {
			return many_star(p).bind(function (xs) {
				return result([x].concat(xs));
			})
		});
	};

	//fold:: Parser [a] --> Parser a
	//Could also just make a fold fct as in the bind statement...
	Parser.prototype.fold = function() {
		var p = this;
		return p.bind(function (xs) {
			return result(xs.join("")); 
		})
	}; 

	//sepby_+: Parser a --> Parser b --> Parser [a]
	Parser.prototype.sepby_plus = function (sep) {
		var p = this;
		return p.bind(function (x) {
			return many_star( sep.bind(function (_) { return p; }) ).bind(function (xs) {
					return result([x].concat(xs));
				})
		});
	};

	Parser.prototype.sepby_star = function (sep) {
		var p = this;
		return p.sepby1(sep).plus( result([]) );
	};

	//
	//	Level 1 Primitives
	//

	var char = function (c) {
		return sat(function (d) { 
			return c == d; 
		});
	};

	var digit = sat(function (x) { 
		return '0' <= x && x <= '9'; 
	});

	var lower = sat(function (x) { 
		return 'a' <= x && x <= 'z'; 
	});

	var upper = sat(function (x) { 
		return 'A' <= x && x <= 'Z'; 
	});

	var letter = lower.plus(upper);

	var alphanum = letter.plus(digit);

	//string:: String --> Parser String
	var string = function(str) {
		if(str === "") return result("");

		var x = str.charAt(0);
		var xs = str.slice(1);

		return char(x).bind(  function(_) {
			return string(xs).bind( function(_) {
				return result(x + xs);
			})
		});
	};





