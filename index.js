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
	return createDirectoryStructure(loader.context, filter, loader)
		.then(Bluebird.all)
		.then(function(structure) {
			return addFilesToZip(zip.folder(directoryName), loader, structure)
		}).then(Bluebird.all)
}

function zipDirectoryWithConfig(zip, loader, options) {
	var filter = getFilter(options)
	return createDirectoryStructure(loader.context, filter, loader)
		.then(Bluebird.all)
		.then(function(structure) {
			return addFilesToZip(zip.folder(options.name), loader, structure)
		}).then(Bluebird.all)
}

function createDirectoryStructure(dirPath, filter, loader) {
	return fs.readdirAsync(dirPath).then(function(result) {
		var resultArray = result.toString().split(',').filter(function(val) {
			var dirPathFromTopDir = dirPath.substr(dirPath.indexOf(loader.context) + loader.context.length + 1)
			var pathFromTopDir = dirPathFromTopDir ? dirPathFromTopDir + '/' + val : val
			return val !== path.basename(loader.resourcePath) && filter(pathFromTopDir)
		})

		return resultArray.map(function(val) {
			var valPath = dirPath + '/' + val
			if (val.indexOf('.') !== -1) {
				return {
					type: 'file',
					path: valPath,
					name: val
				}
			} else {
				return createDirectoryStructure(valPath, filter, loader)
					.then(Bluebird.all).then(function(structure) {
						return {
							type: 'directory',
							path: valPath,
							name: val,
							files: structure
						}
					})
			}
		})
	})
}

function addFilesToZip(zip, loader, structure) {
	return Promise.resolve(structure.filter(function(file) {
		return file.type === 'file' || file.files.length
	}).map(function(file) {
		loader.addDependency(file.path)
		if (file.files) {
			return addFilesToZip(zip.folder(file.name), loader, file.files).then(Bluebird.all)
		} else {
			return fs.readFileAsync(file.path).then(function(buf) { return zip.file(file.name, buf) })
		}
	}))
}

function getFilter(options) {
	if (options.exclude) {
		return function(val) {
			return options.exclude.filter(matches.bind(null, val)).length === 0
		}
	}

	if (options.include) {
		return function(val) {
			return options.include.filter(matches.bind(null, val)).length || val.indexOf('.') === -1
		}
	}

	return function() { return true }
}

function matches(val,test) {
	return new RegExp(test).test(val)
}
