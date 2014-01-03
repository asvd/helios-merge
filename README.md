helios-merge — bundles Helios modules
============================================

`helios-merge` is a command-line tool which bundles JavaScript modules
based upon the [Helios Kernel](http://asvd.github.io/helios-kernel/)
module format. This tool can be used to prepare a library internally
managed as several Helios Kernel modules to the release as a plain
JavaScript file suitable for using without Helios Kernel, or to simply
prepare a bundled module to be further minimized before the release.

`helios-merge` is based upon the
[Esprima](https://github.com/ariya/esprima) and
[Escodegen](https://github.com/Constellation/escodegen) projects.


### Installation

Install `helios-merge` using [npm](https://npmjs.org/):

```sh
$ npm install helios-merge
```

Optionally you may download the distribution using [this
link](https://github.com/asvd/helios-merge/releases/download/v0.1/helios-merge-0.1.tar.gz).
In latter case you will have to launch it as `nodejs helios-merge.js`
instead of simply `helios-merge` in the examples below.



### Usage

```sh
$ helios-merge --input=path --output=path [additional options]
```


#### Options:

`--input` : path of the main module to start bundle from (defaults to `./main.js`)

`--output` : path to write the bundled result into. Using the resulted
bundled module will equal to using the original library main script
provided to the `--input` option)

`--quiet` : suppress informational messages display

`--plain` : create a plain js script suitable to be used without
Helios Kernel, implies `--scope=global`

`--scope=subdir` (default): bundle only the scripts in the directory
and subdirectories. All modules outside of the bundling scope will be
treated as external dependencies and will be included into the bundled
module head using `include()` function of Helios Kernel.

`--scope=local` : bundle all sources available by a local path, but
treat remote dependencies as external

`--scope=global` : bundle all local and remote files (paths starting
form `http://...`)


`--help` or whatever unrecognized : shows help message



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
fact the code of each original module will additionally be wrapped
into an anonymous function to make use of local variables declared in
each original module's initializer.


