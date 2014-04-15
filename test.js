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
							'(* a (pow a (- b 1))))) ) ' + 
				'(pow x 4)) ';

// --------------------
// Parse and execute the example-code
// --------------------
console.group("Create the AST");
console.log("Source string:")
console.log(src);
console.log("Parsed result:");
console.log(Lispy.parse(src));
console.log("Evaluated result:");
console.log(Lispy.run(src));
console.groupEnd();
