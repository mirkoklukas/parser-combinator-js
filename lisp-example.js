
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
		sat = $.combinators.sat;

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

	var NUMBER = sign.bind(function (sign) {
		return POSITIVE_NUMBER.bind(function (n) {
			return result(Number(sign + n));
		});
	});

	// var number = comprehension(many_plus(digit).first().fold(), char("."), many_plus(digit).first().fold(), function (a, dot, b) {
	// 	return Number(a + "." + b);
	// });

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
	// Evaluates subtrees (expressions) of the AST
	// --------------------
	var evaluate = function (expr, scope) {
		if(!(expr instanceof Array)) {

			if( typeof expr === "string" ) {

				return scope[expr];
			}
			else {
				return expr;
			}
		} else if (expr.length === 0) { 

		} else if (expr[0] === 'begin') {
			var vals = expr.slice(1).map(function (x) {
				return evaluate(x, scope);
			});
			return vals.pop();
		} else if (expr[0] === 'define') {

			var key = expr[1],
				val = evaluate(expr[2], scope);
			scope[key] = val;
		} else if (expr[0] === 'if') {
			var condition = expr[1],
				conseq = expr[2],
				alt = expr[3];
			return evaluate(condition, scope) ? evaluate(conseq, scope) : evaluate(alt, scope);
		} else if (expr[0] === 'set!') {

			var key = expr[1],
				val = evaluate(expr[2], scope);
			scope[key] = val;
		} else if (expr[0] === 'lambda') {
			var keys = expr[1],
				body = expr[2];

			return function () {
				var args = [].slice.call(arguments);
				var functionScope =  createScope(scope);
				for(var i = 0, max = keys.length; i < max; i++) { 
					functionScope[keys[i]] = args[i];
				}
				return evaluate(body, functionScope);
			};
		} else {
			var f = scope[expr[0]];
			var args = expr.slice(1).map(function (x) {
				return evaluate(x, scope);
			});
			return f.apply(null, args);
		}
	};

	// --------------------
	// Some primitive mathematical functions 
	// (used to populate the global scope below)
	// --------------------
	var primitiveFunctions = {
		"+": function () { return [].slice.call(arguments).reduce(function(a,b){ return a+b; }); },
		"-": function () { return [].slice.call(arguments).reduce(function(a,b){ return a-b; }); },
		"*": function () { return [].slice.call(arguments).reduce(function(a,b){ return a*b; }); },
		"/": function () { return [].slice.call(arguments).reduce(function(a,b){ return a/b; }); },
		"=": function (a,b) { return a===b; }
	};

	// --------------------
	// Populate the global scope (with some
	// primitive mathematical functions defined above)
	// --------------------
	var globalScope = createScope(primitiveFunctions);

	return {
		parse: parse,
		run: function (src) {
			return evaluate(parse(src), globalScope);
		}
	};

}(parserCombinator));


