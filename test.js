// >> program = "(begin (define r 3) (* 3.141592653 (* r r)))"

// >>> parse(program)
// ['begin', ['define', 'r', 3], ['*', 3.141592653, ['*', 'r', 'r']]]

// >>> eval(parse(program))
// 28.274333877


// var opening = shift.bind(function (x) {
// 	if(x == "(") return first(many_plus(letter)).fold().bind(function (tag) {
// 			return result(tag);
// 	});
// 	else return opening;
// }); 

// var closing = function(tag) {
// 	return shift.bind(function (x) {
// 		if(x == ")") return result(tag);
// 		else return closing;
// 	});
// };

 // parseAtom :: Parser LispVal
 // parseAtom = do 
 //                first <- letter <|> symbol
 //                rest <- many (letter <|> digit <|> symbol)

var src = "(begin (define r 3) (* 3.141592653 (* r r)))";


var symbolTable = {

};




var PRIMITIVES = {
	"+": function (xs) { return xs.reduce(function(a,b){ return a+b; }); },
	"-": function (xs) { return xs.reduce(function(a,b){ return a-b; }); }
}

var STRING = many_plus(letter).first().fold(); 

var NUMBER = many_plus(digit).first().fold().bind(function (a) {
	return char(".").bind(function (dot) {
		return many_plus(digit).first().fold().bind(function (b) {
			return result(a + "." + b);
		});
	}).or(result(a))
});

var ATOM = letter.or(symbol).bind(function (first) {
	return many_star(letter.or(digit).or(symbol)).first().fold().bind(function (rest) {
			var atom = first + rest;
			switch(atom) {
				case "#t":
					return result(true);
				case "#f":
					return result(false);
				default:
					return result(atom);
			}
		});
});

var NON_LIST_EXPR = ATOM.or(STRING).or(NUMBER);


var LIST = char("(").bind(function (_) {
	return (NON_LIST_EXPR.or(LIST)).sepby_star(spaces).first().bind(function (exprs) {
		return char(")").bind(function (_) { 
			return result(exprs);
		});
	});
});

var LIST2 = char("(").bind(function (_) {
	return (NON_LIST_EXPR.or(LIST)).sepby_star(spaces).first().bind(function (exprs) {
		return char(")").bind(function (_) { 
			return result(exprs);
		});
	});
});

var parse = function(src) {
	var result = LIST.parse(src);
	return result.length > 0 ? result[0][0] : null;
}



// If proc is anything other than one of the symbols 
// if, set!, define, lambda, begin, or quote



