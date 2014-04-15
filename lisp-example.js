
var Lispy = (function (parserCombinator) {

	// --------------------
	// The scope object: where expressions save their variables
	// (e.g. the `evaluate` method is called with an expression together with 
	// a resp. scope)
	// --------------------
	var createScope = function (outerScope) {
		return Object.create( outerScope || {});
	};

	// --------------------
	//  The parser pieces
	// --------------------

	// To keep notation tight we start with populating the local
	// scope with the parts of the parser combinator we need.
	// 
	var $ = parserCombinator,
		many_plus = $.combinators.many_plus,
		many_star = $.combinators.many_star,
		sepBy_star = $.combinators.sepBy_star,
		sat = $.combinators.sat,
		comprehension = $.combinators.comprehension

	var result = $.primitives.result,
		char = $.primitives.char,
		digit = $.primitives.digit,
		letter = $.primitives.letter,
		shift = $.primitives.shift,
		reShift = $.primitives.reShift,
		space = $.primitives.space,
		spaces = $.primitives.spaces,
		symbol = sat(function (x) {
			return "!#$%&|*+-/:<=>?@^_~".indexOf(x) > -1;
		}),
		sign = shift.bind(function (x) {
			return (x === "+" || x === "-") ?  result(x) : reShift(x);
		});

	var POSITIVE_NUMBER = many_plus(digit).first().fold().bind(function (a) {
		return char(".").bind(function (dot) {
			return many_plus(digit).first().fold().bind(function (b) {
				return result(Number(a + "." + b));
			});
		}).or(result(Number(a)));
	});

	// var NUMBER = sign.bind(function (sign) {
	// 	return POSITIVE_NUMBER.bind(function (n) {
	// 		return result(Number(sign + n));
	// 	});
	// });

	var NUMBER = comprehension(sign, POSITIVE_NUMBER, function (sign, n) {
		return Number(sign + n);
	});

	var IDENTIFIER = letter.or(symbol).bind(function (first) {
		return many_star(letter.or(digit).or(symbol)).first().fold().bind(function (rest) {
				return  result(first + rest);
		});
	});

	// Non-list expressions
	var ATOM = IDENTIFIER.or(NUMBER);
	 	
	var LIST = char("(").bind(function (_) {
		return (ATOM.or(LIST)).sepBy_star(spaces).first().bind(function (exprs) {
			return many_star(space).bind(function (_) {
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
		var result = (many_star(space).first()).bind(function (_) {
			return LIST;
		}).parse(src);
		return result.length > 0 ? result[0][0] : null;
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
	return {
		parse: parse,
		run: function (src) {
			return evaluate(parse(src), globalScope);
		}
	};

}(parserCombinator));


