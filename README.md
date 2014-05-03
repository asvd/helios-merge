helios-merge — merges Helios modules
=====================================

`helios-merge` is a command-line tool which bundles JavaScript modules
based upon the [Helios Kernel](http://asvd.github.io/helios-kernel/)
module format. This tool can be used to prepare a library internally
managed as several Helios Kernel modules to release as a plain
JavaScript file (suitable for using without Helios Kernel), or to
simply get a bundled module suitable for further
minimizaiton. `helios-merge` is based upon the
[Esprima](https://github.com/ariya/esprima) and
[Escodegen](https://github.com/Constellation/escodegen) projects.


### Installation

- *Globally* using [npm](https://npmjs.org/):

```sh
$ sudo npm install helios-merge -g
```

In this case you can simply launch the tool as `helios-merge` from
anywhere (as shown in the examples below). Nevertheless the global
installation is not necessary.

- *Locally* using [npm](https://npmjs.org/):

```sh
$ npm install helios-merge
```

If you install it like this, the tool can be launched using

```sh
$ node ./node_modules/helios-merge/helios-merge.js ...
```

- *Download* the distribution using [this
link](https://github.com/asvd/helios-merge/releases/download/v0.1.0/helios-merge-0.1.0.tar.gz).
In latter case you will have to launch the tool with a command like this:

```sh
$ node path/to/helios-merge.js ...
```




### Usage

```sh
$ helios-merge --input=path --output=path [additional options]
```


#### Options:

`--input` path of the main module to start merging from (defaults to
`./main.js`)

`--output` path to write the bundled script into. After the bundle is
prepared, it could be reused instead of the original file (provided to
the `--input` option) with the same effect

`--quiet` suppress informational messages display

`--plain` create a plain .js file suitable to be used without Helios
Kernel (implies `--scope=global`)

`--scope=subdir` (default) — bundle only the scripts in the directory
and subdirectories. All modules outside of the bundling scope will be
treated as external dependencies and will be included into the bundled
module head using the `include()` function of Helios Kernel

`--scope=local` bundle all sources available by a local path, but
treat remote dependencies as external

`--scope=global` bundle all local and remote files (paths starting
form `http://...`)


`--help` or whatever unrecognized — show help message



### Example

In this example we have a library splitted between several modules
relying on each other, and we are going to merge it into a single
module.  The source of the artificial example library could be like
this:


##### `./myLibrary.js` — main library module, provides a method to say 'Hello World!':

```js
include('./base.js');
include('./print.js');

init = function() {
    myLibrary.helloWorld = function() {
        myLibrary.print('Hello World!');
    }
}
```


##### `./print.js` — prints a given message:

```js
include('./base.js');

init = function() {
    myLibrary.print = function(text) {
        console.log(text);
    }
}
```


##### `./base.js` — declares library object:

```js
init = function() {
    myLibrary = {};
}
```


Bundling the library using `helios-merge` like this:


```sh
$ helios-merge --input=./myLibrary.js --output=./myLibraryBundled.js
```

The generated `myLibraryBundled.js` will contain the code of all
modules sorted in order of dependence and will behave like this:

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

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/asvd/helios-merge/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
