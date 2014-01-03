helios-merge — bundles Helios Kernel modules
============================================

`helios-merge` is a command-line tool which bundles JavaScript modules
based upon the [Helios Kernel](http://asvd.github.io/helios-kernel/)
module format. This tool can be used to prepare a library internally
managed as several Helios Kernel modules to the release as a plain
JavaScript file suitable for using without Helios Kernel, or to simply
prepare a bundled module to be further minimized before the
release. You can even bundle the whole application into a single-file
JavaScript file.

`helios-merge` is based upon the
[Esprima](https://github.com/ariya/esprima) and
[Escodegen](https://github.com/Constellation/escodegen) projects


### Installation

Install `helios-merge` using [npm](https://npmjs.org/):

```sh
$ npm install helios-merge
```

Optionally you may download the distribution using [this
link](https://github.com/asvd/helios-merge/releases/download/v0.1/helios-merge-0.1.tar.gz).
In latter case you will have to launch it as `nodejs helios-merge.js`
instead of simply `helios-merge` in the examples above.



### Brief

#### Usage:

```sh
$ helios-merge --input=[path] --output=[path] [additional options]
```


#### Options:

`--input` : Path of the main module to start bundle from (defaults to `./main.js`)

`--output` : Path to write the bundled result into

`--quiet` : Do not display informational messages

`--plain` : Create a plain js script suitable to be used without Helios Kernel, implies `--scope=global`

`--scope` : Defines a scope of scripts to bundle:
     `subdir` : only in the given directory and its subdirectories
     `local` : all sources available by a local path
     `global` : all local and remote files

`--help` or whatever unrecognized : Will show help message



### Usage

To bundle a set of modules, the following command could be used:

```sh
$ helios-merge --input=path/to/someLibrary/main_module.js --output=./bundled_library.js
```

This command will read all modules included by the `main_module.js` of
some library, and merge the code of the modules tree into a single
`bundled_library.js` module regarding the dependency order. As result,
loading the bundled library module will equal to using the original
`main_module.js`.

By default `helios-merge` will only merge the modules located in the
sub-directories relatively to the main module provided to the
`--input` option. All modules in the higher-level directories will be
treated as external dependencies to the library, and will be included
at the bundled module head using the `include()` function of the
Helios Kernel. This behaviour could be modified using the `--scope`
option.

The following additional options are available:

`--scope` defines the area of modules to bundle. The modules located
  outside the area will be included as external
  dependencies. `--scope` option may have the following values:

`--scope=subdir` (default) - will only bundle the modules located in
  the subdirectory

`--scope=local` - will additionally bundle all modules in external
directories

`--scope=global` - will also download and bundle the remote modules
  (included by paths starting from 'http://')

`--plain` will create a plain JavaScript code instead of a Helios
  Module. Such script could be used as an ordinary JavaScript file
  without Helios Kernel. This option implies `--scope=global`, since
  all the needed code should be bundled in this case

`--quiet` will suppress information messages output




### Example

In this example we have a library splitted between the several modules
relying on each other, and we need to merge it into a single module.
The source of the artificial example library could be like this:


`./myLibrary.js` - main library module, provides a method to say 'Hello
World!':

```js
include('./base.js');
include('./print.js');

init = function() {
    myLibrary.helloWorld = function() {
        myLibrary.print('Hello World!');
    }
}
```


`./print.js` - prints a given message

```js
include('./base.js');

init = function() {
    myLibrary.print = function(text) {
        console.log(text);
    }
}
```


`./base.js` - declares library object

```js
init = function() {
    myLibrary = {};
}
```


To merge this library in a bundle, we will use `helios-merge` tool like
this:


```sh
$ helios-merge --input=./myLibrary.js --output=./myLibraryBundled.js
```

The generated `myLibraryBundled.js` will contain the code of all
modules in order of dependence and will behave like this:

```js
init = function() {
    myLibrary = {};

    myLibrary.print = function(text) {
        console.log(text);
    }

    myLibrary.helloWorld = function() {
        myLibrary.print('Hello World!');
    }
}
```

This code demonstrates the behaviour of the generated bundle, but in
fact the code of each original module will additionally be wrapped in
an anynamous function to make use of local variables declared in each
original module's initializer.


