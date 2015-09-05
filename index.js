var fs = require('fs')
var path = require('path')
var Bluebird = require('bluebird')
var JSZip = require('jszip')

Bluebird.promisifyAll(fs)

module.exports = function(source) {
	this.cacheable()
	var cb = this.async()
	var loader = this

	var zip = JSZip()
	var completed = source.toString() !== ''
		? zipFile(zip, this.resourcePath)
		: zipDirectory(zip, this).then(Bluebird.all)

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



