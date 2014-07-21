
/**
 * @fileoverview Parses and validates command-line arguments, displays
 * help message
 */

include('ns.js');
        
init = function() {
    LIB.helios.tools.merge.ns('LIB.helios.tools.merge.command');
    
    /**
     * Processes commandline arguments using the provided config
     * object, prints help message and exists upon arguments parse
     * failure
     * 
     * @param {Object} argv array of arguments
     * @param {Object} cfg object configuring available arguments
     * 
     * @returns {Object} parsed argumenst (upon success)
     */
    LIB.helios.tools.merge.command.processArgs = function(argv, cfg) {
        var parsed = this._parseArgs(argv);
        return this._readCfg(parsed, cfg);
    }


    /**
     * Parses command-line argumntes
     * 
     * @param {Array} argv
     * 
     * @returns {Object} key-value paired set of provided command-line
     * argument options
     */
    LIB.helios.tools.merge.command._parseArgs = function(argv) {
        var result = {
            options : {},
            arguments : []
        };

        var arg, key, val;
        for (var i = 2; i < argv.length; i++) {
            arg = argv[i].split('=');
            if (arg[0].substr(0,2) == '--') {
                key = arg[0].substr(2);
                val = arg[1] || true;
                result.options[key] = val;
            } else {
                result.arguments.push(argv[i]);
            }
        }

        return result;
    }



    /**
     * Converts the set of arguments to a config object, displays help
     * in case of wrong arguments
     * 
     * @param {Object} args as returned by _parseArgs()
     * @param {Object} cfg arguments config
     * 
     * @returns {Object} cfg object
     */
    LIB.helios.tools.merge.command._readCfg = function(args, cfg) {
        var argsOk = true;
        var errorMsg = '';
        var help = false;

        if (argsOk && cfg.validate) {
            errorMsg = cfg.validate(args);
            if (errorMsg) {
                argsOk = false;
            }
        }

        if (argsOk) {
            var knownArgs = cfg.options;
            var key, val, knownKey, knownVals, knownVal, found, vals,
                badKey = null, badVal = null;
            for (key in args.options) {
                if (args.options.hasOwnProperty(key)) {
                    found = false;
                    for (knownKey in knownArgs) {
                        if (knownKey == key) {
                            found = true;
                            break;
                        }
                    }

                    if (!found) {
                        badKey = key;
                        break;
                    } else if (typeof knownArgs[key] == 'object') {
                        found = false;
                        val = args.options[key];
                        knownVals = knownArgs[key][1];
                        for (knownVal in knownVals) {
                            if (knownVals.hasOwnProperty(knownVal)) {
                                if (knownVal == val) {
                                    found = true;
                                    break;
                                }
                            }
                        }

                        if (!found) {
                            badKey = key;
                            badVal = val;
                            break;
                        }
                    }

                    if (key == 'help') {
                        help = true;
                    }
                }
            }

            if (badKey) {
                argsOk = false;

                if (badVal) {
                    errorMsg =  "Unrecognized value for the option --" + badKey +": " + badVal;
                } else {
                    errorMsg =  "Unrecognized option: --" + badKey;
                }
            }
        }

        if (!argsOk) {
            LIB.helios.tools.merge.command._printHelp(cfg);
            console.log('\nError: ' + errorMsg + '\n');
            process.exit();
        } else if (help) {
            LIB.helios.tools.merge.command._printHelp(cfg);
            process.exit();
        }

        return args;
    }

    

    /**
     * Prints the help message
     * 
     * @param {Object} cfg application config object
     */
    LIB.helios.tools.merge.command._printHelp = function(cfg) {
        var head = [
            '',
            cfg.info,
            '',
            'Available options:'
        ];

        var args = [];
        var knownArgs = cfg.options;
        var knownVals, key, val;
        for (key in knownArgs) {
            if (knownArgs.hasOwnProperty(key)) {
                if (typeof knownArgs[key] == 'object') {
                    args.push('--'+key + ' : ' + knownArgs[key][0]);
                    knownVals = knownArgs[key][1];
                    for (val in knownVals) {
                        if (knownVals.hasOwnProperty(val)) {
                            args.push('     '+val + ' : ' + knownVals[val]);
                        }
                    }
                } else {
                    args.push('--'+key + ' : ' + knownArgs[key]);
                }
            }
        }

        console.log(head.concat(args).join("\n"));
    }
    

}

