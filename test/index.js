var Chai = require('chai')
var fs = require('fs')
var path = require('path')
var JSZip = require('jszip')
var _ = require('lodash')

var loader = require('..')

var expect = Chai.expect
var defaultMock = {
	addDependency: function() {},
	async: function() {
		return this.callback
	},
	cacheable: function() {},
	callback: function(err) { if (err) throw err },
	context: 'test',
	resourcePath: 'test/picture-of-dorian-gray.txt'
}

describe('zip-it-loader', function() {

	it('should be a function', function() {
		expect(loader).to.be.instanceof(Function)
	})

	context('when called on a file with content', function() {
		var zipResult
		before(function(done) {
			var mock = _.assign({}, defaultMock, {
				callback: function(err, result) {
					if (err) throw err
					zipResult = result
					done()
				}
			})
			loader.call(mock, fs.readFileSync(mock.resourcePath))
		})

		it('should return a zip with one file', function() {
			var files = JSZip(zipResult).files
			expect(files).to.have.all.keys('picture-of-dorian-gray.txt')
		})
	})

	context('when called on a file with no content', function() {
		var zipResult
		before(function(done) {
			var mock = _.assign({}, defaultMock, {
				callback: function(err, result) {
					if (err) throw err
					zipResult = result
					done()
				},
				context: 'test/books',
				resourcePath: 'test/books/books.js'
			})
			loader.call(mock, fs.readFileSync(mock.resourcePath))
		})

		it('should return a zip of directory containing source file', function() {
			var files = JSZip(zipResult).files
			expect(files).to.contain.all.keys([
				'books/heart-of-darkness.txt',
				'books/phantastes.txt',
				'books/melville/moby-dick.txt',
				'books/melville/bartleby-the-scrivener.txt'
			])
			expect(files).to.have.property('books/').that.has.property('dir', true)
			expect(files).to.have.property('books/melville/').that.has.property('dir', true)
		})
	})
})