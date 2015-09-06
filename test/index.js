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

var makeSpyAddDependency = function(addedDependencies) {
	return function(dependency) {
		addedDependencies.push(dependency)
	}
}

var booksFilePaths = [
	'books/heart-of-darkness.txt',
	'books/phantastes.txt',
	'books/melville/moby-dick.txt',
	'books/melville/bartleby-the-scrivener.txt',
	'books/',
	'books/melville/'
]

var options = require('./books/zip-it.config.json')
// var options2 = require('./books2/zip-it.config.json')

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
					zipResult = JSZip(result)
					done()
				}
			})
			fs.readFile(mock.resourcePath, function(err, result) {
				loader.call(mock, result)
			})
		})

		it('should return a zip with one file', function() {
			var files = zipResult.files
			expect(files).to.have.all.keys('picture-of-dorian-gray.txt')
		})
	})

	context('when called on a file with no content', function() {
		var zipResult
		var addedDependencies = []
		before(function(done) {
			var mock = _.assign({}, defaultMock, {
				addDependency: makeSpyAddDependency(addedDependencies),
				callback: function(err, result) {
					if (err) throw err
					zipResult = JSZip(result)
					done()
				},
				context: 'test/books',
				resourcePath: 'test/books/books.js'
			})
			fs.readFile(mock.resourcePath, function(err, result) {
				loader.call(mock, result)
			})
		})

		it('should return a zip of directory containing source file', function() {
			var files = zipResult.files
			expect(files).to.have.all.keys(booksFilePaths.concat('books/zip-it.config.json'))
			expect(files).to.have.property('books/').that.has.property('dir', true)
			expect(files).to.have.property('books/melville/').that.has.property('dir', true)
		})

		it('should add all files as dependencies', function() {
			expect(addedDependencies).to.have.length(5)
		})
	})

	context('when called on a zip-it.config.json file', function() {
		context('', function() {
			var zipResult
			var addedDependencies = []
			before(function(done) {
				var mock = _.assign({}, defaultMock, {
					addDependency: makeSpyAddDependency(addedDependencies),
					callback: function(err, result) {
						if (err) throw err
						zipResult = JSZip(result)
						done()
					},
					context: 'test/books',
					resourcePath: 'test/books/zip-it.config.json'
				})
				fs.readFile(mock.resourcePath, function(err, result) {
					loader.call(mock, result)
				})
			})

			it('should have base dir named by name field', function() {
				var files = zipResult.files
				expect(files).to.have.property(options.name + '/').that.has.property('dir', true)
			})

			it('should not have excluded files', function() {
				var files = zipResult.files
				var newFilePaths = booksFilePaths.filter(function(val) {
					var unprefixedFile = val.substr(val.indexOf('/') + 1)
					return options.exclude.indexOf(unprefixedFile) === -1
				}).map(function(val) {
					return options.name + val.substr(val.indexOf('/'))
				})
				expect(files).to.have.all.keys(newFilePaths.concat(options.name + '/books.js'))
			})
		})
	})
})