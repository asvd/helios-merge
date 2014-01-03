
init = function() {
    /**
     * @returns {Object} and creates (if not created yet) an object with
     * the given name
     */
    var ns = function( name ) {
        var names = name.split('.');
        var obj=global;
        for ( var i = 0; i < names.length; i++ ) {
            if ( typeof obj[names[i]] == 'undefined' ) {
                obj[names[i]] = {};
            }

            obj = obj[names[i]];
        }

        return obj;
    }

    ns('helios.tests.supply');

    var supply = helios.tests.supply;

    var red   = '\033[31m';
    var green = '\033[32m';
    var reset = '\033[0m';

    var print = function(val) {
        process.stdout.write(val);
    }
    
    var printRed = function(text) {
        print( red+text+reset );
    }

    var printGreen = function(text) {
        print( green+text+reset );
    }

    var printLine = function() {
        console.log();
    }
    
    supply.updatePerStats = function() {}
    
    // prevents from crashing on exceptions
    process.on(
        'uncaughtException',
        function (err) {
            console.log();
            console.error(err);
        }
    );
    
    var testNr = 0;
    
    /**
     * Starts a new test with the given name
     * 
     * @param {String} name for the test
     */
    supply.test = function( name ) {
        if ( testNr > 0 ) {
            printLine();
        }
        print("Test " + (++testNr) + ": " + name + "... " );
    }
    
    
    /**
     * Displays green PASSED label if condition is true, red FAILED
     * label otherwise
     * 
     * @param {Boolean} cond to check against being truly
     */
    supply.check = function( cond ) {
        if ( cond ) {
            printGreen( "PASSED " );
        } else {
            printRed( "FAILED " );
        }
    }

    

}