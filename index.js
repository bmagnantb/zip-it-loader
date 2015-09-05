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
	if (this.resourcePath.indexOf('zip-it.config.json') !== -1) {
		var sourceString = source.toString()
		var options = JSON.parse(sourceString.substr(sourceString.indexOf('{')))
		completed = zipDirectoryWithConfig(zip, loader, options)
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
	return addFilesToZipDirectory(loader.context, zip.folder(directoryName), loader).then(Bluebird.all)
}

function zipDirectoryWithConfig(zip, loader, options) {
	var directoryName = options.name
	console.log(directoryName)
	return addFilesToZipDirectory(loader.context, zip.folder(directoryName), loader).then(Bluebird.all)
}

function addFilesToZipDirectory(directory, zip, loader) {
	return fs.readdirAsync(directory).then(function(result) {
		var resultArray = result.toString().split(',')
		var nameFileIndex = resultArray.indexOf(path.basename(loader.resourcePath))
		if (nameFileIndex !== -1 && directory === loader.context) resultArray.splice(nameFileIndex, 1)
		return resultArray.map(function(val) {
			if (val.indexOf('.') !== -1) {
				var filePath = directory + '/' + val
				loader.addDependency(filePath)
				return fs.readFileAsync(filePath).then(function(buf) {
					return zip.file(val, buf)
				})
			} else return addFilesToZipDirectory(directory + '/' + val, zip.folder(val), loader).then(Bluebird.all)
		})
	})
}



