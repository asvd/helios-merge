
/**
 * @fileoverview Config for the command.js for the merge tool
 */

include('ns.js');
        
init = function() {
    LIB.helios.tools.merge.ns('LIB.helios.tools.merge.cfg');


    // help message head
    var info = [
        "Helios Kernel modules merge tool",
        "",
        "Usage: " + process.argv[0] + " " + process.argv[1] + " [options]"
    ].join('\n');


    // available options
    var options = {
        input     : 'Path of the main module (defaults to ./main.js)',
        output    : 'Path to write the bundled output into',
        quiet     : 'Do not display informational messages',
        plain     : 'Create a plain js script suitable to be used without Helios, implies --scope=global',
        scope  : ['Defines a scope of scripts to bundle, possible values:', {
            subdir : 'only in the given directory and its subdirectories',
            local  : 'all sources available by a local path',
            global : 'all local and remote files'
        }],
        help   : 'Will show this message'
    };


    // checks if the given set of arguments is valid
    var validate = function(args) {
        var error = false;

        if (!args.options.input) {
            error = '--input should be provided';
        }

        if (!args.options.output) {
            error = '--output should be provided';
        }
        
        if (args.options.plain &&
            args.options.scope &&
            args.options.scope != 'global') {
            error = '--plain option implies --scope=global';
        }

        return error;
    };
    
    LIB.helios.tools.merge.cfg.config = {
        info : info,
        options : options,
        validate : validate
    };



    /**
     * Postprocesses parsed arguments config (sets default values)
     * 
     * @param {Object} cfg
     * 
     * @returns {Object} processed cfg
     */
    LIB.helios.tools.merge.cfg.processCfg = function(cfg) {
        var def = {
            input  : './main.js',
            quiet  : false,
            plain  : false,
            scope  : 'subdir'
        };

        for (var key in def) {
            if (def.hasOwnProperty(key)) {
                cfg.options[key] = cfg.options[key]||def[key];
            }
        }

        if (cfg.options.plain) {
            cfg.options.scope = 'global';
        }

        return cfg;
    }

    
}

