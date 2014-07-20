
/**
 * @fileoverview Contains utilities for the merge tool
 */

include('../include/esprima.js');
include('../include/escodegen/escodegen.js');

include('ns.js');
include('cfg.js');
include('command.js');


init = function() {
    LIB.helios.tools.merge.ns('LIB.helios.tools.merge.util');

    /**
     * Relates the given absolute path to the given location
     * 
     * @param {String} location to relate the path ('/home/abc/project/code')
     * @param {String} absolute path ('/home/abc/project/lib.js')
     * 
     * @returns {String} related path ('../lib.js');
     */
    LIB.helios.tools.merge.util.relatePath = function( location, absolute ) {
        location += '/';
        var matching = true, locWord, absWord, locSize, absSize;
        while(matching){
            absSize = absolute.indexOf('/');
            locSize = location.indexOf('/');
            absWord = absolute.substr( 0, absSize );
            locWord = location.substr( 0, locSize );

            if ( absWord == locWord ) {
                absolute = absolute.substr( absSize+1 );
                location = location.substr( locSize+1 );

                if ( location.length == 0 ) {
                    matching = false;
                }
            } else {
                matching = false;
            }
        }

        var result = '';

        for ( var i = 0; i < location.length; i++ ) {
            if ( location.charAt(i) == '/' ) {
                result += '../';
            }
        }

        result += absolute;

        return result;
    }



    /**
     * Converts the given relative path + absolute directory location
     * to the absolute location
     * 
     * @param {String} location to which the path is related ('/home/abc/project/code')
     * @param {String} relative path ('../lib.js')
     * 
     * @returns {String} absolute path ('/home/abc/project/lib.js')
     */
    LIB.helios.tools.merge.util.unrelatePath = function( location, relative ) {
        if ( relative[0] == '/' ) {
            // already absolute
            return relative;
        } else {
            var path = location + '/' + relative;
            
            // clearing up-dir sequences such as 'foo/../'
            var newPath = path;
            do {
                path = newPath;
                newPath = path.replace( /[\w-\.~]*\/\.\.\//, '' );
            } while ( newPath!=path );

            // clearing cur-dir sequences such as './'
            do {
                path = newPath;
                newPath = path.replace(/\.\//,'');
            } while ( newPath!=path );

            return path;
        }
    }



    /**
     * Configs for esprima and escodegen
     */
    LIB.helios.tools.merge.util._esprimaCfg = {
        comment : true,
        loc : true,
        range : true,
        tokens : true
    };
    
    LIB.helios.tools.merge.util._escodegenCfg = {
        comment : true,
        format : {
            indent : {
                adjustMultilineComment:true
            }
        }
    };



    /**
     * Reads a module with the given (absolute) path, provides its
     * data and code to the callback
     * 
     * @param {String} path of the module to read
     * @param {Function} cb to provide data into
     */
    LIB.helios.tools.merge.util.readModule = function( path, cb ) {
        var me = this;

        // called after the file contents is loaded
        var sCb = function( code ) {
            var data = null;

            try {
                data = me._parse(code);
            } catch (e) {
                var text = "" + path + ":\n";
                text += e.toString();
                throw new Error(text);
            }

            data.path = path;

            // converting dependencies path to absolute
            for ( var i = 0; i < data.dependencies.length; i++ ) {
                data.dependencies[i] = me._getAbsolute(
                    data.dependencies[i], path
                );
            }

            cb(data);
        }

        if ( this.isRemote(path) ) {
            this.readRemote( path, sCb );
        } else {
            sCb( this.readLocal(path) );
        }
        
    }
    
    
    
    /**
     * Converts the relative path to the absolute related to the
     * dependent module
     * 
     * @param {String} path relative path
     * @param {String} childPath path of the dependent module
     */
    LIB.helios.tools.merge.util._getAbsolute = function( path, childPath ) {
        // concatinating path with the child's path (without the filename)
        // path starting from 'http://' or '/' treated as absolute
        if ( path.substr(0,7).toLowerCase() != 'http://' &&
             path.substr(0,8).toLowerCase() != 'https://'&&
             path.substr(0,1) != '/' ) {
            path = this.getLocation(childPath) + '/' + path;
        }

        // resolving (clearing) up-dir sequences such as 'foo/../'
        var newPath = path;
        do {
            path = newPath;
            newPath = path.replace( /[\w\-\.~]*\/\.\.\//, '' );
        } while ( newPath!=path );

        return path;
    }
    
    
    
    /**
     * Returns path location (path without a filename)
     * 
     * @param {String} path (i.e. '/path/to/c.js')
     * 
     * @returns {String} location (i.e. '/path/to')
     */
    LIB.helios.tools.merge.util.getLocation = function( path ) {
        return path.substr( 0, path.lastIndexOf('/') );
    }
    
    
    
    /**
     * Checks if the given path is remote
     * 
     * @param {String} path to check
     * @returns {Boolean} true if path is remote
     */
    LIB.helios.tools.merge.util.isRemote = function( path ) {
        return ( path.substr(0,7).toLowerCase() == 'http://' ||
                 path.substr(0,8).toLowerCase() == 'https://' );
    }


    
    /**
     * Checks if the given path is in subdirectory related to the
     * given location
     * 
     * @param {String} path     ('/abc/def/ghi')
     * @param {String} location ('/abc/def')
     * 
     * @returns {Boolean} true if path is in subdirectory
     */
    LIB.helios.tools.merge.util.isSubdir = function( path, location ) {
        var result = (
            path.indexOf(location) == 0 &&
            (
                path.length == location.length ||
                path.charAt(location.length) == '/'
            )
        );

        return result;
    }


    
    /**
     * Reads the contents of the local file
     * 
     * @param {String} path absolute path of the file to read
     * 
     * @returns {String} file contents
     */
    LIB.helios.tools.merge.util.readLocal = function( path ) {
        var fs = require( "fs" );
        var error = '';

        try {
            var buf = fs.readFileSync(path);
        } catch ( e ) {
            if ( e.code == 'ENOENT' ) {
                throw e;
            } else {
                throw e;
            }
        }

        return buf.toString();
    }

    
    
    /**
     * Reads the contents of the remote file, provides its content to
     * the callback
     * 
     * @param {String} path remote path of the file to read
     * @param {Function} cb to provide content into
     */
    LIB.helios.tools.merge.util.readRemote = function( path, cb ) {
        var http = require('http');

        var sCb = function(res) {
            if ( res.statusCode != 200 ) {
                fCb('HTTP responce status code: ' + res.statusCode);
            } else {
                var content = '';

                res.on( 'end', function(){ cb(content); } );
                res.on(
                    'readable',
                    function() {
                        var chunk=res.read();
                        content += chunk.toString();
                    }
                );
            }
        }

        var fCb = function(e) {
            throw new Error(e.message);
        }

        http.get( path, sCb ).on( 'error', fCb );
    }

    
    
    /**
     * Writes the contents to the local file
     * 
     * @param {String} path absolute path of the file to write
     * @param {String} content to put into the file
     */
    LIB.helios.tools.merge.util.writeFile = function( path, code ) {
        var fs = require('fs');
        
        var cb = function(err) {
            if (err) {
                console.log(err);
            }
        }
        
        fs.writeFile(path,code,cb);
    }

    
    
    /**
     * Parses the module content resulting in an object containing the
     * dependencies, initializer and uninitializer code
     * 
     * @param {String} code of the module to read
     * 
     * @returns {Object}
     */
    LIB.helios.tools.merge.util._parse = function( code ) {
        var result = {
            dependencies : [], // list of included modules
            init : '',         // initializer code
            uninit : '',       // uninitializer code
            comment : ''       // module leading comment
        };

        var ast = LIB.esprima.parse( code, this._esprimaCfg );
        ast = LIB.escodegen.attachComments( ast, ast.comments, ast.tokens );

        result.comment = this._genLeadingComment( ast.leadingComments || [] );

        // running through top-level entries
        var expr, reason, node;
        for ( var i = 0; i < ast.body.length; i++ ) {
            node = ast.body[i];
            if ( node.type != 'ExpressionStatement' ) {
                this._complain( node.type, node.loc.start.line );
            } else {
                expr = node.expression;
                if ( expr.type == 'CallExpression' ) {
                    if ( expr.callee.name == 'include' ) {
                        // include() expr
                        if ( typeof expr.arguments != 'undefined' &&
                             typeof expr.arguments[0] != 'undefined' &&
                             typeof expr.arguments[0].value != 'undefined') {
                            result.dependencies.push(
                                expr.arguments[0].value
                            );
                        } else {
                            this._complain(
                                'argument', expr.loc.start.line
                            );
                        }
                        continue;
                    } else {
                        this._complain(
                            expr.callee.name, expr.loc.start.line
                        );
                    }

                } else if ( expr.type == 'AssignmentExpression' ) {
                    if ( expr.left.name == 'init' ) {
                        // module initializer, compiling the source
                        result.init = LIB.escodegen.generate(
                            expr.right.body, this._escodegenCfg
                        );
                        continue;
                    } else if ( expr.left.name == 'uninit' ) {
                        // module uninitializer, compiling the source
                        result.uninit = LIB.escodegen.generate(
                            expr.right.body, this._escodegenCfg
                        );
                        continue;
                    } else {
                        this._complain(
                            expr.left.name, expr.loc.start.line
                        );
                    }
                } else {
                    this._complain(
                        expr.type, expr.loc.start.line
                    );
                }
            }
        }

        return result;
    }
    
    

    /**
     * Generates a set of head comments for a module
     * 
     * @param {Array} leadingComments as parsed by esprima
     * 
     * @returns {String} generated comment to append
     */
    LIB.helios.tools.merge.util._genLeadingComment = function( leadingComments ){
        var result = '', com;
        for ( var i = 0; i < leadingComments.length; i++ ) {
            com = leadingComments[i];
            if ( com.type == 'Block' ) {
                result += '/*' + com.value + '*/\n';
            } else if ( com.type == 'Line' ) {
                result += '//' + com.value + '\n';
            }
        }

        return result;
    }



    /**
     * @throws {Strng} an exception reporting the file path and
     * problem location
     * 
     * @param {String} problem
     * @param {Number} line
     */
    LIB.helios.tools.merge.util._complain = function( problem, line ) {
        var text = 'Line ' + line + ': \n';
        text += 'Unexpected ' + problem + '\n';
        text += 'Helios Module should only contain '+
                'init(), uninit() declarations, '+
                'and a set of include() calls at the head\n';
        throw new Error(text);
    }



    /**
     * Reads the arguments and generates the application config
     */
    LIB.helios.tools.merge.util.getCfg = function() {
        var dirname = process.cwd();
        var cfg = LIB.helios.tools.merge.cfg.processCfg(
            LIB.helios.tools.merge.command.processArgs(
                process.argv,
                LIB.helios.tools.merge.cfg.config
            )
        );

        var input = this.unrelatePath( dirname, cfg.options.input );
        var output = this.unrelatePath( dirname, cfg.options.output );

        return {
            input  : input,
            output : output,
            location : this.getLocation(input),
            plain  : cfg.options.plain,
            outdir : cfg.options.scope != 'subdir',
            remote : cfg.options.scope == 'global',
            quiet  : cfg.options.quiet
        };
    }

    
}

