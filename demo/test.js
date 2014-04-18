var input = document.getElementById("input-container");
var output = document.getElementById("output");
var run = document.getElementById("btn-run");


var inputMirror = CodeMirror(input, {
    lineNumbers: true
});

// inputMirror.setOption("theme", "pastel-on-dark");



// --------------------
// Our sample programm source code
// --------------------
var src = '(begin ' + '\n\t' +
				'(define x 2) ' + '\n\t' +
				'(define ' + '\n\t\t' +
					'pow ' + '\n\t\t' +
					'(lambda ' +  '\n\t\t\t' +
						'(a b) ' + '\n\t\t\t' +
						'(if ' + '\n\t\t\t\t' +
							'(= b 0) ' + '\n\t\t\t\t' +
							'1 ' + '\n\t\t\t\t' +
							'(* a (pow a (- b 1)))))) ' +  '\n\t' +
				'(pow x 4)) ';

inputMirror.getDoc().setValue(src);


run.addEventListener("click", function (e) {
	var src = inputMirror.getDoc().getValue();
	
	console.group("Create the AST");
		console.log("Source string:")
		console.log(src);
		console.log("Parsed result:");
		console.log(Lispy.parse(src));
		console.log("Evaluated result:");
		console.log(Lispy.run(src));
	console.groupEnd();
	
	output.innerHTML = Lispy.run(src);
});

// --------------------
// Parse and execute the example-code
// --------------------
// console.group("Create the AST");
// console.log("Source string:")
// console.log(src);
// console.log("Parsed result:");
// console.log(Lispy.parse(src));
// console.log("Evaluated result:");
// console.log(Lispy.run(src));
// console.groupEnd();
