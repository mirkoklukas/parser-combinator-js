

;(function (exports) { 

	// --------------------
	// 	Parser constructor. 
	// 	(Note that we define some prirmitive parsers first and then 
	// 	add functions to Parser.prototype using these primitives)
	// --------------------
	var Parser  = function (f, id) {
		//f a:: String --> ([(a,String)], [])
		this.parse = function (string) {
			var result = f(string);

			//console.log("PPAAAAAARRRRSSSSEEE")
			//console.log(result)
			//console.log(result.history)
			var addHistory = (function (id) {
				return function (obj) {
					//console.log("HHHIIIISSSSSSSTTTOORY");
					//console.log(obj.history);
					//console.log(id);
					if(id !== "Nobody") obj.history = [[id , obj.history || [] ]];
					else obj.history = obj.history || [];
					return obj;
				};
			})(this.getId());

			// addHistory(result)
			result = result.length === 0 ? addHistory(result) : result.map(function (r) {
				return addHistory(r);
			});

			return result;

		};

		this.id = id || "Nobody";

		this.setId = function (id) {
			this.id = id;
			return this;
		};
		this.getId = function () {
			return this.id;
		}
	};

	// --------------------
	//	Primitives
	// --------------------
	var primitives = {};

	var result = primitives.result = function (a, history) {
		var history = history || [];

		return new Parser(function (string)  { 
			var res = [a,string];
			res.history = history;
			console.log(res.history)
			return [res]; 
		}, "Result");
	};

	var zero = primitives.zero = new Parser(function (string) {
		return [];
	}, "Zero");

	var item = primitives.item = new Parser(function (string) {
		return string.length === 0 ? [] : [ [string.charAt(0), string.slice(1)] ];
	}, "Item");

	// Same as item
	var shift = primitives.shift = new Parser(function (string) {
		return string.length === 0 ? [] : [ [string.charAt(0), string.slice(1)] ];
	}, "Shift") ;

	var reShift = primitives.reShift = function (xs) {
		return new Parser(function(string) {
			return [["", xs + string]];
		}, "Re-Shift") ;
	};

	// --------------------
	//	Combinators
	// --------------------
	var combinators = {};

	Parser.prototype.bind = function (f) {


		var p = this;

		return new Parser(function (x) {
			//console.log("BINDSTART " + x)
			var ys = p.parse(x);
			//console.log("ys == ")
			//console.log(ys)
			//console.log(">>=")
			if(ys.length===0) {
				//console.log("ys == []")
				//console.log("ENDBIND " + x)
				return ys;
			} else {
				var zs = ys.map(function (y) {
					//console.log("ys == [.....]")
					//console.log("y == ")
					//console.log(y)
					var ws = f(y[0]).parse(y[1]);
					//console.log("ws == ")
					//console.log(ws)
					if( ws.length === 0) {
						//console.log("ws == []")
	
						ws.history = ws.history.concat(y.history);
						return ws;

					} else {
						//console.log("ws == [.....]")
						var www = ws.map(function (w) {
							//console.log(w);
							w.history = w.history.concat(y.history);
							return w;
						})	
						//console.log("ws == ")
						//console.log( www)
						return 	www;	
					}
				});

				var xxx = zs.reduce(function (a,b) {
					var result = a.concat(b);
					if(a.length === 0 && b.length === 0) {
						result.history = a.history;
					} 
					return result;
				});
				//console.log("zs == ")
				//console.log(xxx)
				//console.log("ENDBIND " + x)
				return xxx;
			}

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
			var qWithHistory= result("", ys.history).setId("Nobody").bind(function () {
				return q;
			});
			return ys.length > 0 ? ys : qWithHistory.parse(x);
		}).setId("OR");
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
	var manyStar = combinators.manyStar = function (p) {
		return p.bind(function (x) {
			return manyStar(p).bind(function (xs) {
				return result([x].concat(xs));
			})
		}).plus(result([]));
	};

	// many_+:: Parser a --> Parser [a]
	// The list [a] contains the matches of p, pˆ2, pˆ3,...
	// `many_+` only succeeds if the given parser `p` succeeds at least once 
	var manyPlus = combinators.manyPlus = function (p) {
		return p.bind(function (x) {
			return manyStar(p).bind(function (xs) {
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
	Parser.prototype.sepByPlus = function (sep) {
		var p = this;
		return p.bind(function (x) {
			return manyStar( sep.bind(function (_) { return p; }) ).bind(function (xs) {
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
	// pattern, (*) say, that arises while working parser combinators, namely:
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
		// The first (n-1) of the n arguments are expected to be parsers, 
		// whereas the last argument is a function that takes the results of
		// these parsers, when applied in the pattern (*) described above
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
	var char = primitives.char = function (c) {
		return sat(function (d) { 
			return c == d; 
		}).setId(c);
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

	var spaces = primitives.spaces = manyPlus(space).first().bind(function (_) {
		return result([]);
	});

	var alphanum = primitives.alphanum = letter.plus(digit);

	//string:: String --> Parser String
	var keyword = primitives.keyword = function(str) {
		if(str === "") return result("");

		var x = str.charAt(0);
		var xs = str.slice(1);

		return char(x).bind(function (_) {
			return keyword(xs).bind(function (_) {
				return result(x + xs);
			})
		});
	};

	exports.parserCombinator = {
		parser: Parser,
		primitives: primitives,
		combinators: combinators
	}



console.log( 
	char("x").bind(function (_) {
		return char("z").or(char("s")).bind(function (_) {
			return result("");
		});
}).parse("xa") );



}(typeof exports === 'undefined' ? this : exports));



