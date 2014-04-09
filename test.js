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

var src = "(begin (define r 3) (* 3.141592653 (* r r)))";




var IDENTIFIER = many_plus(letter).fold(); 

var NUMBER = many_plus(digit).fold(); 

var ATOM = IDENTIFIER
			.or(NUMBER);

var LIST = char("(").bind(function (_) {
	return ATOM.or(LIST).sepby_star(char(" ")).bind(function (exprs) {
		return char(")").bind(function (_) { 
			return result(exprs);
		});
	});
});




// If proc is anything other than one of the symbols 
// if, set!, define, lambda, begin, or quote



