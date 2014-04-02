

var p = many_star(digit).bind(function (x1) { 
	return char(" ").bind(function (x2) {
		return many_star(letter);
	});
});




var xy = char("x").bind(function (c) {
	if(c === "x") return char("y");
	else return zero;
});



console.log( many_plus(letter).parse("xx e") )