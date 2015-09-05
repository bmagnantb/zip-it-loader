zip-it-loader
=============

zip-it-loader takes a file as input and outputs either
a zipped version of that file or a zipped version of the
file's directory.

## installation
coming soon...

## usage
[Webpack Loaders](http://webpack.github.io/docs/using-loaders.html)

likely used with file loader:
`file?name=[name].zip!zip-it`

### zip file only
require a file with content
```
require('./file.txt') // not an empty file
```

### zip directory and sub-directories
require an empty file in the directory you wish to zip.
the file's name sans extension will be used as the unzipped
directory's name and passed to file loader's `[name]`. the
empty file is not included in the zip.

```
require('./file.js') // must be completely empty
```