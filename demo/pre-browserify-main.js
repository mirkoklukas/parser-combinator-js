
// --------------------
// Load the interpreter
// --------------------
var Lispy = require('../lib/lispy')

// --------------------
// Create the GUI
// --------------------
var input = document.getElementById("input-container"),
	output = document.getElementById("output"),
	runBtn = document.getElementById("btn-run"),
	inputMirror = CodeMirror(input, {
    	lineNumbers: true
	});

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

// --------------------
// What is a run button wihtout a "click"-listener
// --------------------
runBtn.addEventListener("click", function (e) {
	var src = inputMirror.getDoc().getValue(),
		parsed = Lispy.parse(src),
		result = output.innerHTML = Lispy.run(src);

	console.group("RUN the whole thing....");
	console.log("Source string:")
	console.log(src);
	console.log("Parsed result:");
	console.log(parsed);
	console.log("Evaluated result:");
	console.log(result);
	console.groupEnd();
});
