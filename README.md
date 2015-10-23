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
directory's name and also passed to file loader's `[name]`. the
empty file is not included in the zip. empty directories are not included.

```js
require('./file.js') // must be completely empty
```

### finer control directory zipping with config file
require a json file with a field `zip-it-config: true`
to distinguish from a json file intended for zipping.

```js
require('./file-name.json')

/* file-name.json */
{
	"zip-it-config": true,
	"name": "directory-name",
	"exclude": [
		"that-one-file.js",
		"^directory-at-config-level/",
		"directory-at-any-level/another-file(.txt|.js)"
	],

	// or use include
	// if both fields are present, only exclude is used

	"include": [
		"^zip-this-only-at-config-level.js"
	]
}
```

available options:
+ name -- sets the name of base directory within the zip.
the zip file's name is based on the imported file's name
if using `file-loader?name=[name].zip`
+ exclude -- an array of strings, converted to regular
expressions in the loader, to exclude. directories are
written relative to config file's directory, e.g. a
directory `images` at the same level as the config file
would be matched by `images/` but not `/images/`. any
directories that resolve to empty due to exclusion are
omitted from the zip
+ include -- same format as exclude. only listed files
or regex-matching files are included in zip.