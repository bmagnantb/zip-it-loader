var fs = require('fs')
var path = require('path')
var Bluebird = require('bluebird')
var JSZip = require('jszip')

Bluebird.promisifyAll(fs)

module.exports = function(source) {
	this.cacheable()
	var cb = this.async()
	var loader = this

	var completed
	var zip = JSZip()
	if (this.resourcePath.indexOf('.json') !== -1) {
		var sourceString = source.toString()
		var options = JSON.parse(sourceString.substr(sourceString.indexOf('{')))
		if (options['zip-it-config']) completed = zipDirectoryWithConfig(zip, loader, options)
		else completed = zipFile(zip, this.resourcePath)
	} else if (source.toString() === '')
		completed = zipDirectory(zip, this)
	else
		completed = zipFile(zip, this.resourcePath)

	completed.then(function() {
		cb(null, zip.generate({type: 'nodebuffer'}))
	})
}

function zipFile(zip, filePath) {
	return fs.readFileAsync(filePath).then(function(buf) {
		zip.file(path.basename(filePath), buf)
		return zip
	})
}

function zipDirectory(zip, loader) {
	var fileName = path.basename(loader.resourcePath)
	var directoryName = fileName.substr(0, fileName.indexOf('.'))
	var filter = getFilter({})
	return addFilesToZipDirectory(loader.context, zip.folder(directoryName), loader, filter)
		.then(Bluebird.all)
}

function zipDirectoryWithConfig(zip, loader, options) {
	var directoryName = options.name
	var filter = getFilter(options)
	return addFilesToZipDirectory(loader.context, zip.folder(directoryName), loader, filter)
		.then(Bluebird.all)
}

function addFilesToZipDirectory(directory, zip, loader, filter) {
	return fs.readdirAsync(directory).then(function(result) {
		var resultArray = result.toString().split(',').filter(function(val) {
			var pathFromTopDir = directory.substr(directory.indexOf(loader.context) + loader.context.length + 1)
			var valFromTopDir = pathFromTopDir ? pathFromTopDir + '/' + val : val
			return val !== path.basename(loader.resourcePath) && filter(valFromTopDir)
		})

		return resultArray.map(function(val) {
			if (val.indexOf('.') !== -1) {
				var filePath = directory + '/' + val
				loader.addDependency(filePath)
				return fs.readFileAsync(filePath).then(function(buf) {
					return zip.file(val, buf)
				})
			} else return addFilesToZipDirectory(directory + '/' + val, zip.folder(val), loader, filter).then(Bluebird.all)
		})
	})
}

function getFilter(options) {
	if (options.exclude) return function(val) { return options.exclude.indexOf(val) === -1 }
	if (options.include) return function(val) {
		return options.include.indexOf(val) !== -1 || val.indexOf('.') === -1
	}
	return function() { return true }
}



