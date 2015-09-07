zip-it-loader
=============

zip-it-loader takes a file as input and outputs either
a zipped version of that file or a zipped version of the
file's directory.

## installation
`npm install zip-it-loader`

## usage
[Webpack Loaders](http://webpack.github.io/docs/using-loaders.html)

likely used with [file loader](https://github.com/webpack/file-loader):
`file?name=[name].zip!zip-it`

### zip file only
require a file with content
```js
require('./file.txt') // not an empty file
```

### zip entire directory and sub-directories
require an empty file in the directory you wish to zip.
the file's name sans extension will be used as the unzipped
directory's name and passed to file loader's `[name]`. the
empty file is not included in the zip.

```js
require('./file.js') // must be completely empty
```

### config for directory zipping
require a json file with a field `zip-it-config: true`
to distinguish from a json file intended for zipping alone.

```js
require('./file-name.json')

/* file-name.json */
{
	"zip-it-config": true,
	"name": "file-name",
	"exclude": [
		"that-one-file.js",
		"subdirectory/another-file.txt"
	],

	// or use include
	// if both fields are present, only exclude is used

	"include": [
		"zip-only-this-as-a-directory.js"
	]
}
```

available options:
+ name -- sets the name of the unzipped directory. the zip
file's name is based on the imported file's name if using
`file-loader?name=[name].zip`
+ exclude -- an array of strings to exclude. strings are written
from config file's directory, e.g. a subdirectory `images` would
be written `images/`
+ include -- an array of strings to include