
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



