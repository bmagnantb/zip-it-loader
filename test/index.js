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

var testFilePaths = [
	'books/bartleby-the-scrivener.txt',
	'books/heart-of-darkness.png',
	'books/heart-of-darkness.txt',
	'books/heart-of-darkness.txt2',
	'books/phantastes.txt',
	'books/melville/moby-dick.txt',
	'books/melville/bartleby-the-scrivener.txt',
	'books/',
	'books/melville/',
	'books/test.json'
]

var options = require('./books/old-books.json')
var options2 = require('./books2/read-these.json')

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
			expect(files).to.have.all.keys(testFilePaths.concat('books/old-books.json'))
			expect(files).to.have.property('books/').that.has.property('dir', true)
			expect(files).to.have.property('books/melville/').that.has.property('dir', true)
		})

		it('should add all files as dependencies', function() {
			expect(addedDependencies).to.have.length(testFilePaths.length)
		})
	})

	context('when called on a .json file', function() {

		context('that does not have a zip-it-config field set to true', function() {
			var zipResult
			before(function(done) {
				var mock = _.assign({}, defaultMock, {
					callback: function(err, result) {
						if (err) throw err
						zipResult = JSZip(result)
						done()
					},
					context: 'test/books',
					resourcePath: 'test/books/test.json'
				})
				fs.readFile(mock.resourcePath, function(err, result) {
					loader.call(mock, result)
				})
			})

			it('should zip the json file only', function() {
				var files = zipResult.files
				expect(files).to.have.all.keys('test.json')
			})
		})

		context('that has zip-it-config field set to true', function() {
			var zipResult
			before(function(done) {
				var mock = _.assign({}, defaultMock, {
					callback: function(err, result) {
						if (err) throw err
						zipResult = JSZip(result)
						done()
					},
					context: 'test/books',
					resourcePath: 'test/books/old-books.json'
				})
				fs.readFile(mock.resourcePath, function(err, result) {
					loader.call(mock, result)
				})
			})

			it('should have base dir named by name field', function() {
				var files = zipResult.files
				expect(files).to.have.property(options.name + '/').that.has.property('dir', true)
			})

			context('with exclude field', function() {
				it('should not have excluded files', function() {
					var files = zipResult.files
					var newFilePaths = [
						'old-books/phantastes.txt',
						'old-books/melville/moby-dick.txt',
						'old-books/',
						'old-books/melville/',
						'old-books/test.json'
					]
					expect(files).to.have.all.keys(newFilePaths.concat(options.name + '/books.js'))
				})
			})

			context('with include field', function() {
				var zipResult2
				before(function(done) {
					var mock = _.assign({}, defaultMock, {
						callback: function(err, result) {
							if (err) throw err
							zipResult2 = JSZip(result)
							done()
						},
						context: 'test/books2',
						resourcePath: 'test/books2/read-these.json'
					})
					fs.readFile(mock.resourcePath, function(err, result) {
						loader.call(mock, result)
					})
				})

				it('should only have included files', function() {
					var files = zipResult2.files
					var newFilePaths = [
						'read-these/heart-of-darkness.txt',
						'read-these/',
						'read-these/melville/',
						'read-these/melville/bartleby-the-scrivener.txt',
						'read-these/melville/moby-dick.txt',
					]
					expect(files).to.have.all.keys(newFilePaths)
				})
			})
		})
	})
})
