
/**
 * @fileoverview Contains the merge tool logic methods
 */

include('ns.js');
include('util.js');

init = function() {
    LIB.helios.tools.merge.ns('LIB.helios.tools.merge.logic');
    var util = LIB.helios.tools.merge.util;
    


    /**
     * STAGE 1 - setting up the dependency tree
     * 
     * @param {String} path to start from
     * @param {Boolean} outdir also include outer fiels
     * @param {Boolean} remote also include remote files
     * @param {Boolean} quiet do not display info-messages
     * @param {Function} cb to provide data into
     */
    LIB.helios.tools.merge.logic.getModulesTree = function(path, outdir, remote, quiet, cb) {
        if (!quiet) {
            console.log('\nLoading modules tree...');
        }

        var location = util.getLocation(path);
        var external = [];  // external dependencies, not to bundle
        var list = [path];  // unparsed dependencies
        var modules = {};   // modules by absolute path

        // runs through the list of modules
        var loop = function() {
            var modPath = list.pop();
            if (modPath) {
                // reading the next module
                if (!quiet) {
                    console.log(modPath);
                }

                util.readModule(modPath, process);
            } else {
                // all modules processed
                var result = {
                    modules : modules,
                    external : external
                };

                cb(result);
            }
        }

        // processes another loaded module
        var process = function(mod) {
            var newDependencies = [];
            modules[mod.path] = mod;

            // dispatching dependencies between bundle / include
            var i, j, dep, isSubdir, isRemote, bundle;
            for (i = 0; i < mod.dependencies.length; i++) {
                dep = mod.dependencies[i];
                isSubdir = util.isSubdir(dep, location);
                isRemote = util.isRemote(dep);
                
                bundle = isSubdir ||
                    (!isRemote && outdir) ||
                    (isRemote && remote);

                if (bundle) {
                    // will be bundled
                    newDependencies.push(dep);

                    // checking if a dependency is not listed or parsed
                    var found = modules[dep];
                    if (!found) {
                        for (j = 0; j < list.length; j++) {
                            if (list[j] == dep) {
                                found = true;
                                break;
                            }
                        }
                    }

                    if (!found) {
                        list.push(dep);
                    }
                } else {
                    // will be included
                    external.push(dep);
                }

            }

            mod.dependencies = newDependencies;  // without externals
            loop();
        }

        loop();
    }



    /**
     * STAGE 2 - sorting the modules queue in order of dependency
     * 
     * @param {Object} modules key-based modules tree
     * @param {Boolean} quiet do not display info messages
     * 
     * @returns {Array} sorted list of paths
     */
    LIB.helios.tools.merge.logic.getSortedQueue = function(modules, quiet) {
        if (!quiet) {
            console.log('\nGenerating dependency order...');
        }

        var queue = [];

        // setting-up unsorted queue
        for (var path in modules) {
            if (modules.hasOwnProperty(path)) {
                queue.push(path);
            }
        }

        var ordered = 0;  // already sorted modules number
        var len = queue.length;
        var found;

        while (ordered < queue.length) {
            found = false;
            for (var i = ordered; i < queue.length; i++) {
                if (this._checkDeps(modules, queue, ordered, queue[i])) {
                    // all module deps are on the head
                    path = queue.splice(i,1)[0];
                    queue.splice(ordered,0,path);
                    ordered++;
                    found = true;
                    break;
                }
            }

            if (!found && ordered < queue.length) {
                // unresolved modules persist
                // means circular dependency (otherwise would be resolved)
                var text = "Circular dependency starting from: " + queue[ordered];
                throw new Error(text);
            }
        }

        return queue;
    }
    


    /**
     * Checks if all module deps are in the sorted queue head (and
     * thus that module is ready to be moved itself to the queue head)
     * 
     * @param {Object} modules path-based modules tree
     * @param {Array} queue
     * @param {Number} ordered number of ordered modules
     * @param {String} path of the module to check
     * 
     * @returns {Boolean} true if all dependencies are on the head
     */
    LIB.helios.tools.merge.logic._checkDeps = function(modules, queue, ordered, path) {
        var module = modules[path];

        // cloning deps
        // checkng if each dependency is on a sorted head
        var depPath, i, j, found;

        for (i = 0; i < module.dependencies.length; i++) {
            found = false;
            depPath = module.dependencies[i];

            for (j = 0; j < ordered; j++) {
                if (queue[j] == depPath) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                return false;
            }
        }

        return true;
    }



    /**
     * STAGE 3 - building-up the big initializer
     * 
     * @param {Object} modules path-based modules tree
     * @param {Array} queue of path (ordered)
     * @param {String} location location of the main bundled module
     * @param {Boolean} quiet do not display info messages
     * 
     * @returns {String} huge init method
     */
    LIB.helios.tools.merge.logic.getInit = function(modules, queue, location, quiet) {
        if (!quiet) {
            console.log('\nBundling modules...');
        }
        
        var result = '';
        var i, module, path;
        for (i = 0; i < queue.length; i++) {
            module = modules[queue[i]];
            if (!quiet) {
                console.log(module.path);
            }

            path = util.relatePath(location, module.path);

            result += '\n// ' + path + '\n\n';
            result += module.comment;

            if (module.init) {
                result += '(function()';
                result += module.init;
                result += ')();\n\n\n';
            }
        }

        return result;
    }



    /**
     * STAGE 4 - building-up the big uninitializer
     * 
     * @param {Object} modules path-based modules tree
     * @param {Array} queue of path (ordered)
     * @param {String} location location of the main bundled module
     * @param {Boolean} quiet do not display info messages
     * 
     * @returns {String} huge init method
     */
    LIB.helios.tools.merge.logic.getUninit = function(modules, queue, location, quiet) {
        if (!quiet) {
            console.log('\nBundling common uninitializer...');
        }

        var result = '';

        var i, module, path;
        for (i = queue.length-1; i >= 0; i--) {
            module = modules[queue[i]];
            if (module.uninit) {
                path = util.relatePath(location, module.path);

                result += '\n// ' + path + '\n\n';

                if (module.uninit) {
                    result += '(function()';
                    result += module.uninit;
                    result += ')();\n\n\n';
                }
            };
        }

        return result;
    }



    /**
     * STAGE 5 - building the whole module
     * 
     * @param {Array} external array of external dependencies
     * @param {String} init initializer code
     * @param {String} uninit unitializer code
     * @param {Boolean} plain creates a plain script (not a Helios module)
     * @param {Boolean} quiet do not display info messages
     * 
     * @returns {String} the whole new code
     */
    LIB.helios.tools.merge.logic.getCode = function(external, init, uninit, plain, quiet) {
        if (!quiet) {
            console.log('\nGenerating the code...');
        }

        var result = [
        '/**',
        ' * This is a set of Helios Kernel modules merged with helios-merge',
        ' *',
        ' * http://asvd.github.io/helios-kernel',
        ' * http://github.com/asvd/helios-merge',
        ' *',
        ' * The comment related to this code normally preceeds the main module',
        ' * (following the last here, according to the dependency order)',
        ' */',
        '',
        ''
        ].join('\n');

        if (plain) {
            result += [
                '',
                'LIB = {};',
                ''
            ].join('\n');

            result += init;
        } else {
            if (external.length) {
                for (var i = 0; i < external.length; i++) {
                    result += '\ninclude(\''+external[i]+'\');'
                }

                result += '\n\n';
            }

            result += 'init = function() {\n';
            result += init;
            result += '\n\n};';

            result += '\n\n\n\n\n';

            if (uninit) {
                result += 'uninit = function() {\n';
                result += uninit;
                result += '\n\n};';
            }
        }

        return result;
    }



    /**
     * STAGE 6 - writes the code into the file
     * 
     * @param {String} path
     * @param {String} code to write
     * @param {Boolean} quiet do not display info messages
     */
    LIB.helios.tools.merge.logic.write = function(path, code, quiet) {
        if (!quiet) {
            console.log('\nWriting into '+path+'...');
        }

        util.writeFile(path, code);

        if (!quiet) {
            console.log('Modules are bundled into '+path);
        }
    }
    
    
}


