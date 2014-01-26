
include("lighttest.js");

init = function() {
    var fs = require( "fs" );
    var cp = require('child_process');

    var dir = __dirname+'/tests_tmp';
    var start = process.argv[0] + ' ../nodestart.js ';


    var init = function() {
        try {
            var fs = require('fs');
            fs.mkdirSync(dir);
        } catch(e) {}
    }

    var cleanup = function() {
        try {
            fs.rmdirSync(dir);
        } catch(e) {}
    }

    var unlink = function( path ) {
        try {
            fs.unlinkSync(path);
        } catch (e) {
            // throwing without breaking the stack
            setTimeout( function() { throw e; }, 10 );
        }
    }

    cleanup();
    init();

    var tests = {
        'Merging helios-merge with itself and then merging itself again':
        function() {
            var readFile = function(path) {
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

            var stage1 = function (error, stdout, stderr) {
                lighttest.check(error === null);

                // merging helios-merge with merged version of itself
                var command = process.argv[0] + ' ' + dir + '/COMPRESSED1.js ' +
                    '--input=../main.js --output='+dir+'/COMPRESSED2.js --plain';
                cp.exec(command, stage2);
            }

            var stage2 = function(error, stdout, stderr) {
                lighttest.check(error === null);

                // comparing the merged versions
                var source1 = readFile(dir+'/COMPRESSED1.js');
                var source2 = readFile(dir+'/COMPRESSED2.js');
                lighttest.check(source1 == source2);

                unlink(dir+'/COMPRESSED1.js');
                unlink(dir+'/COMPRESSED2.js');

                lighttest.done();
            }

            var command = start +
                '--input=../main.js --output='+dir+'/COMPRESSED1.js --plain';
            cp.exec(command, stage1);
        },


        'Module with dependency and initializer':
        function() {
            var ticket;
            stage3_mod1_initialized = false;
            stage3_mod1_uninitialized = false;
            stage3_mod2_initialized = false;
            stage3_mod2_uninitialized = false;

            var stage1 = function (error, stdout, stderr) {
                lighttest.check(error === null);
                ticket = kernel.require( dir+'/stage3.js', stage1Success, stage1Fail );
            }

            var stage1Success = function() {
                lighttest.check(true);
                stage2();
            }

            var stage1Fail = function() {
                lighttest.check(false);
                stage2();
            }

            var stage2 = function() {
                lighttest.check(stage3_mod1_initialized);
                lighttest.check(stage3_mod2_initialized);
                kernel.release(ticket);
                setTimeout( stage3, 1000 );
            }

            var stage3 = function() {
                lighttest.check(stage3_mod1_uninitialized);
                lighttest.check(stage3_mod2_uninitialized);
                
                var fs = require('fs');
                unlink(dir+'/stage3.js');

                lighttest.done();
            }

            var command = start +
                '--input=stages/stage3/mod1.js --output='+dir+'/stage3.js';
            cp.exec(command, stage1);
        },


        'Modules with a dependency included twice':
        function() {
            var ticket;
            stage7_mod1_initialized = false;
            stage7_mod2_initialized = false;
            stage7_mod3_counter = 0;

            var stage1 = function (error, stdout, stderr) {
                lighttest.check(error === null);
                ticket = kernel.require(
                    dir+'/stage7.js', stage1Success, stage1Failure
                );
            }

             var stage1Success = function() {
                 lighttest.check(true);
                 stage2();
             }

             var stage1Failure = function() {
                 lighttest.check(false);
                 stage2();
             }

             var stage2 = function() {
                 lighttest.check(stage7_mod1_initialized);
                 lighttest.check(stage7_mod2_initialized);
                 lighttest.check(stage7_mod3_counter === 1);
                  
                 kernel.release(ticket);
                 setTimeout( stage3, 1000 );
             }

            var stage3 = function() {
                unlink(dir+'/stage7.js');
                lighttest.done();
            }

            var command = start +
                '--input=stages/stage7/mod1.js --output='+dir+'/stage7.js';
            cp.exec(command, stage1);
        },
        

        'Modules with mixed dependencies order':
        function() {
            var ticket;
            stage11_mod1_check = false;
            stage11_mod2_initialized = false;
            stage11_mod3_check = false;
            stage11_mod4_check = false;
            stage11_mod1_uninitialized = false;
            stage11_mod2_uninit_check = false;
            stage11_mod3_uninit_check = false;
            stage11_mod4_uninit_check = false;

            var stage1 = function (error, stdout, stderr) {
                lighttest.check(error === null);
                ticket = kernel.require(
                    dir+'/stage11.js', stage1Success, stage1Failure
                );
            }

            var stage1Success = function() {
                lighttest.check(true);
                stage2();
            }

            var stage1Failure = function() {
                lighttest.check(false);
                stage2();
            }

            var stage2 = function() {
                lighttest.check(stage11_mod1_check);
                lighttest.check(stage11_mod3_check);
                lighttest.check(stage11_mod4_check);

                kernel.release(ticket);
                setTimeout( stage3, 1000 );
            }

            var stage3 = function() {
                lighttest.check(stage11_mod2_uninit_check);
                lighttest.check(stage11_mod3_uninit_check);
                lighttest.check(stage11_mod4_uninit_check);

                unlink(dir+'/stage11.js');
                lighttest.done();
            }

            var command = start +
                '--input=stages/stage11/mod1.js --output='+dir+'/stage11.js';
            cp.exec(command, stage1);
        },
        

        'Unexisting module':
        function() {
            var cb = function (error, stdout, stderr) {
                lighttest.check(error);
                lighttest.done();
            }

            var command = start +
                '--input=no_such_module.js --output='+dir+'/stage15.js';
            cp.exec(command, cb);
        },


        'Modules with a circular dependency':
        function() {
            var cb = function (error, stdout, stderr) {
                lighttest.check(error);
                lighttest.done();
            }

            var command = start +
                '--input=stages/stage16/mod1.js --output='+dir+'/stage16.js --plain';
            cp.exec(command, cb);
        },

        
        'Modules with nonexisting dependency':
        function() {
            var cb = function (error, stdout, stderr) {
                lighttest.check(error);
                lighttest.done();
            }

            var command = start +
                '--input=stages/stage17/mod1.js --output='+dir+'/stage17.js --plain';
            cp.exec(command, cb);
        },


        'Modules with broken dependency':
        function() {
            var cb = function (error, stdout, stderr) {
                lighttest.check(error);
                lighttest.done();
            }

            var command = start +
                '--input=stages/stage18/mod1.js --output='+dir+'/stage18.js --plain';
            cp.exec(command, cb);
        },


        
        'Up-dir sequence path resolution':
        function() {
            var ticket;
            stage19_mod1_check = false;
            stage19_mod2_initialized = false;
        
            var stage1 = function (error, stdout, stderr) {
                lighttest.check(error===null);
                ticket = kernel.require( dir+'/stage19.js', stage1Success, stage1Failure );
            }

            var stage1Success = function() {
                lighttest.check(true);
                stage2();
            }

            var stage1Failure = function() {
                lighttest.check(false);
                stage2();
            }

            var stage2 = function() {
                lighttest.check(stage19_mod1_check);
                lighttest.check(stage19_mod2_initialized);
                kernel.release(ticket);
                unlink(dir+'/stage19.js');

                lighttest.done();
            }

            var command = start +
                '--input=stages/stage19/dir1/mod1.js --output='+dir+'/stage19.js --scope=local';
            cp.exec(command, stage1);
        },


        'Output and --quiet option':
        function() {
            var stage1 = function (error, stdout, stderr) {
                lighttest.check(stdout.length > 20);
                unlink(dir+'/stage22.js');
                var command = start +
                    '--input=stages/stage22/mod1.js --output='+dir+'/stage22.js --quiet';
                cp.exec(command, stage2);
            }

            var stage2 = function (error, stdout, stderr) {
                lighttest.check(stdout.length == 0);
                unlink(dir+'/stage22.js');
                lighttest.done();
            }

            var command = start +
                '--input=stages/stage22/mod1.js --output='+dir+'/stage22.js';
            cp.exec(command, stage1);
        },


        'Merging with --plain option':
        function() {
            var cb = function (error, stdout, stderr) {
                lighttest.check(error === null);

                // loading as an ordinary script (not a Helios module)
                stage25_mod1_initialized = false;
                require(dir+'/stage25.js');
                lighttest.check(stage25_mod1_initialized);

                unlink(dir+'/stage25.js');
                lighttest.done();
            }

            var command = start +
                '--input=stages/stage25/mod1.js --output='+dir+'/stage25.js --plain';
            cp.exec(command, cb);
        },


        'Merging with --scope=subdir':
        function() {
            var ticket;
            var stage1 = function (error, stdout, stderr) {
                lighttest.check(error === null);
                
                // should not load due to unexisting dependency
                ticket = kernel.require( dir+'/stage27.js', stage1Success, stage1Failure );
            }

            var stage1Success = function() {
                lighttest.check(false);
                stage2();
            }

            var stage1Failure = function() {
                lighttest.check(true);
                stage2();
            }

            var stage2 = function() {
                kernel.release(ticket);
                unlink(dir+'/stage27.js');
                lighttest.done();
            }

            var command = start +
                '--input=stages/stage27/mod1.js --output='+dir+'/stage27.js --scope=subdir';
            cp.exec(command, stage1);
        },
        
        
        'Merging with --scope=local':
        function() {
            var ticket;
            var stage1 = function (error, stdout, stderr) {
                lighttest.check(error === null);
                ticket = kernel.require( dir+'/stage30.js', stage1Success, stage1Failure );
            }

            var stage1Success = function() {
                lighttest.check(false);
                stage2();
            }

            var stage1Failure = function() {
                lighttest.check(true);
                stage2();
            }

            var stage2 = function() {
                kernel.release(ticket);
                unlink(dir+'/stage30.js');
                lighttest.done();
            }

            var command = start +
                '--input=stages/stage30/dir1/mod1.js --output='+dir+'/stage30.js --scope=local';
            cp.exec(command, stage1);
        },


        'Merging with --scope=global':
        function() {
            var ticket;
            stage33_mod1_check = false;
            stage33_mod2_check = false;
            helios_remote_dependency_initialized = false;
            helios_remote_module_initialized = false;

            var stage1 = function (error, stdout, stderr) {
                lighttest.check(error === null);

                ticket = kernel.require( dir+'/stage33.js', stage1Success, stage1Failure );
            }

            var stage1Success = function() {
                lighttest.check(true);
                stage2();
            }

            var stage1Failure = function() {
                lighttest.check(false);
                stage2();
            }

            var stage2 = function() {
                lighttest.check(stage33_mod1_check);
                lighttest.check(stage33_mod2_check);
                lighttest.check(helios_remote_dependency_initialized);
                lighttest.check(helios_remote_module_initialized);
                
                kernel.release(ticket);
                unlink(dir+'/stage33.js');

                // give some time to really uninitialize the remote module
                setTimeout( lighttest.done, 1000 );
            }

            var command = start +
                '--input=stages/stage33/dir1/mod1.js --output='+dir+'/stage33.js --scope=global';
            cp.exec(command, stage1);
        },


        '--plain should imply --scope=global':
        function() {
            stage36_mod1_check = false;
            stage36_mod2_check = false;
            helios_remote_dependency_initialized = false;
            helios_remote_module_initialized = false;

            var stage1 = function (error, stdout, stderr) {
                lighttest.check(error === null);

                // loading as an ordinary script (not helios module)
                var requireError = false;
                try {
                    require(dir+'/stage36.js');
                } catch(e) {
                    requireError = true;
                }

                lighttest.check(!requireError);
                stage2();
            }

            var stage2 = function() {
                lighttest.check(stage36_mod1_check);
                lighttest.check(stage36_mod2_check);
                lighttest.check(helios_remote_dependency_initialized);
                lighttest.check(helios_remote_module_initialized);
                
                unlink(dir+'/stage36.js');
                lighttest.done();
            }

            var command = start +
                '--input=stages/stage36/dir1/mod1.js --output='+dir+'/stage36.js --plain';
            cp.exec(command, stage1);
        }
    };

    lighttest.run( tests, cleanup );

}


