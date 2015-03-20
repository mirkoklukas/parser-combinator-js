var expect = require('chai').expect;
var pc = require('./../lib/parser-combinator');

describe('Parser Combinator', function () { 

	// --------------------
	// The Parser Class
	// --------------------
	describe('Parser class', function () {

		describe('Parser.bind', function () {
			it('is pending')
		});

		describe('Parser.plus', function () {
			it('is pending')
		});

		// @todo test all remaining functions
	});

	// --------------------
	// Building blocks
	// --------------------
	describe('Atomic parsers', function () { 
		describe('result', function () {
			var result = pc.result;
			it('should return a constant parser', function () {
				expect(result("x").parse("asfasf")).to.deep.equal([["x", "asfasf"]]);
			});
		});

		describe('zero', function () {
			it('is pending')
		});

		describe('item', function () {
			it('is pending')
		});

		describe('shift', function () {
			it('is pending')
		});

		describe('reShift', function () {
			it('is pending')
		});

		// @todo test all remaining atoms

	});
});