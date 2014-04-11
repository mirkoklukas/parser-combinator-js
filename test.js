
// --------------------
//  The scope object where expressions save their variables
// --------------------
var Scope = function (outerScope) {
	this.dict = Object.create( outerScope ? outerScope.dict : {});
};

Scope.prototype.update = function (dict) {
	for (key in dict) {
		this.dict[key] = dict[key];
	}
	return this;
};

Scope.prototype.get = function (key) {
	return this.dict[key];
};

Scope.prototype.set = function (key, val) {
	this.dict[key] = val;
};

Scope.prototype.contains = function (key) {
	return this.dict[key] !== undefined; 
}

// --------------------
//  The parser pieces
// --------------------
// TODO: you should be able to parse negative numbers
// (e.g. "-3.14")
var NUMBER = many_plus(digit).bind(function (a) {
	return char(".").bind(function (dot) {
		return many_plus(digit).first().fold().bind(function (b) {
			return result(Number(a + "." + b));
		});
	}).or(result(Number(a)));
});

var ATOM = letter.or(symbol).bind(function (first) {
	return many_star(letter.or(digit).or(symbol)).first().fold().bind(function (rest) {
			return  result(first + rest);
	});
});

var NON_LIST_EXPR = ATOM.or(NUMBER);

var LIST = char("(").bind(function (_) {
	return (NON_LIST_EXPR.or(LIST)).sepby_star(spaces).first().bind(function (exprs) {
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

			return scope.get(expr);
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
		scope.set(key, val);
	} else if (expr[0] === 'if') {
		var condition = expr[1],
			conseq = expr[2],
			alt = expr[3];
		return evaluate(condition, scope) ? evaluate(conseq, scope) : evaluate(alt, scope);
	} else if (expr[0] === 'set!') {

		var key = expr[1],
			val = evaluate(expr[2], scope);
		scope.set(key, val);
	} else if (expr[0] === 'lambda') {
		var keys = expr[1],
			body = expr[2];

		return function () {
			var args = [].slice.call(arguments);
			var functionScope =  new Scope(scope);
			for(var i = 0; i < keys.length; i++) { 
				functionScope.set(keys[i],args[i])
			}
			return evaluate(body, functionScope);
		};
	} else {
		var f = scope.get(expr[0]);
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
var globalScope = (new Scope()).update(primitiveFunctions);

// --------------------
// Our sample programm source code
// --------------------
// var src = '(begin (define r 3) (* 3.141592653 (* r r)))';
// var src = '(begin (define square (lambda (x) (* x x))) (square 2))';
// var src = '(begin (define add (lambda (x y) (* y x))) (add 2 3))';
var src = '(begin ' +
				'(define x 2) ' +
				'(define ' +
					'pow ' +
					'(lambda ' + 
						'(a b) ' +
						'(if ' +
							'(= b 0) ' +
							'1 ' +
							'(* a (pow a (- b 1)))))) ' + 
				'(pow x 4)) ';

// --------------------
// Parse and execute the example-code
// --------------------
console.group("Create the AST");
console.log("Source string:")
console.log(src);
console.log("Parsed result:");
console.log(parse(src));
console.log("Evaluated result:");
console.log(evaluate(parse(src), globalScope));
console.groupEnd();



