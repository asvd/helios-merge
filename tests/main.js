
include('supply.js');

init = function() {
    var supply = helios.tests.supply;

    var dir = __dirname+'/tests_tmp';

    var readFile = function(path) {
        var fs = require( "fs" );
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
        
        

    var init = function() {
        try {
            var fs = require('fs');
            fs.mkdirSync(dir);
        } catch(e) {}
    }
    
    

    var stage0 = function() {
        supply.test('Merging helios-merge with itself...');

        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=../main.js --output='+dir+'/COMPRESSED1.js --plain';
        var cb = function (error, stdout, stderr) {
            supply.check(error === null);
            stage1();
        }

        var child = cp.exec(command, cb);
    }
    
    
    
    var stage1 = function() {
        supply.test('Merging helios-merge with merged version of itself');

        var cp = require('child_process');
        var command = process.argv[0] + ' ' + dir + '/COMPRESSED1.js --input=../main.js --output='+dir+'/COMPRESSED2.js --plain';
        var cb = function (error, stdout, stderr) {
            supply.check(error === null);
            stage2();
        }

        var child = cp.exec(command, cb);
    }



    var stage2 = function() {
        supply.test('Comparing the merged versions');

        var source1 = readFile(dir+'/COMPRESSED1.js');
        var source2 = readFile(dir+'/COMPRESSED2.js');
        supply.check(source1 == source2);

        var fs = require('fs');
        fs.unlinkSync(dir+'/COMPRESSED1.js');
        fs.unlinkSync(dir+'/COMPRESSED2.js');

        stage3();
    }



    var stage3 = function() {
        supply.test('Module with dependency and initializer');

        stage3_mod1_initialized = false;
        stage3_mod1_uninitialized = false;
        stage3_mod2_initialized = false;
        stage3_mod2_uninitialized = false;

        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=stages/stage3/mod1.js --output='+dir+'/stage3.js';
        var cb = function (error, stdout, stderr) {
            supply.check(error === null);
            stage4();
        }

        var child = cp.exec(command, cb);
    }

    var stage4 = function() {
        var sCb = function() {
            supply.check(true);
            stage5();
        }

        var fCb = function() {
            supply.check(false);
            stage5();
        }

        stage4_ticket = kernel.require( dir+'/stage3.js', sCb, fCb );
    }

    var stage5 = function() {
        supply.check(stage3_mod1_initialized);
        supply.check(stage3_mod2_initialized);

        kernel.release(stage4_ticket);
        setTimeout( stage6, 1000 );
    }

    var stage6 = function() {
        supply.check(stage3_mod1_uninitialized);
        supply.check(stage3_mod2_uninitialized);
        
        var fs = require('fs');
        fs.unlinkSync(dir+'/stage3.js');

        stage7();
    }



    var stage7 = function() {
        supply.test('Modules with a dependency included twice');

        stage7_mod1_initialized = false;
        stage7_mod2_initialized = false;
        stage7_mod3_counter = 0;

        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=stages/stage7/mod1.js --output='+dir+'/stage7.js';
        var cb = function (error, stdout, stderr) {
            supply.check(error === null);
            stage8();
        }

        var child = cp.exec(command, cb);
    }

    var stage8 = function() {
        var sCb = function() {
            supply.check(true);
            stage9();
        }

        var fCb = function() {
            supply.check(false);
            stage9();
        }

        stage8_ticket = kernel.require( dir+'/stage7.js', sCb, fCb );
    }

    var stage9 = function() {
        supply.check(stage7_mod1_initialized);
        supply.check(stage7_mod2_initialized);
        supply.check(stage7_mod3_counter === 1);

        kernel.release(stage8_ticket);
        setTimeout( stage10, 1000 );
    }

    var stage10 = function() {
        var fs = require('fs');
        fs.unlinkSync(dir+'/stage7.js');

        stage11();
    }
    


    var stage11 = function() {
        supply.test('Modules with mixed dependencies order');
        stage11_mod1_check = false;
        stage11_mod2_initialized = false;
        stage11_mod3_check = false;
        stage11_mod4_check = false;
        stage11_mod1_uninitialized = false;
        stage11_mod2_uninit_check = false;
        stage11_mod3_uninit_check = false;
        stage11_mod4_uninit_check = false;

        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=stages/stage11/mod1.js --output='+dir+'/stage11.js';
        var cb = function (error, stdout, stderr) {
            supply.check(error === null);
            stage12();
        }

        var child = cp.exec(command, cb);
    }

    var stage12 = function() {
        var sCb = function() {
            supply.check(true);
            stage13();
        }

        var fCb = function() {
            supply.check(false);
            stage13();
        }

        stage12_ticket = kernel.require( dir+'/stage11.js', sCb, fCb );
    }

    var stage13 = function() {
        supply.check(stage11_mod1_check);
        supply.check(stage11_mod3_check);
        supply.check(stage11_mod4_check);

        kernel.release(stage12_ticket);
        setTimeout( stage14, 1000 );
    }

    var stage14 = function() {
        supply.check(stage11_mod2_uninit_check);
        supply.check(stage11_mod3_uninit_check);
        supply.check(stage11_mod4_uninit_check);


        var fs = require('fs');
        fs.unlinkSync(dir+'/stage11.js');
        
        stage15();
    }



    var stage15 = function() {
        supply.test('Unexisting module');

        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=no_such_module.js --output='+dir+'/stage15.js';
        var cb = function (error, stdout, stderr) {
            supply.check(error);
            stage16();
        }

        var child = cp.exec(command, cb);
    }

    

    var stage16 = function() {
        supply.test('Modules with a circular dependency');

        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=stages/stage16/mod1.js --output='+dir+'/stage16.js --plain';
        var cb = function (error, stdout, stderr) {
            supply.check(error);
            stage17();
        }

        var child = cp.exec(command, cb);
    }



    var stage17 = function() {
        supply.test('Modules with nonexisting dependency');

        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=stages/stage17/mod1.js --output='+dir+'/stage17.js --plain';
        var cb = function (error, stdout, stderr) {
            supply.check(error);
            stage18();
        }

        var child = cp.exec(command, cb);
    }
    


    var stage18 = function() {
        supply.test('Modules with broken dependency');

        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=stages/stage18/mod1.js --output='+dir+'/stage18.js --plain';
        var cb = function (error, stdout, stderr) {
            supply.check(error);
            stage19();
        }

        var child = cp.exec(command, cb);
    }



    var stage19 = function() {
        supply.test('Up-dir sequence path resolution');
        
        
        stage19_mod1_check = false;
        stage19_mod2_initialized = false;
        
        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=stages/stage19/dir1/mod1.js --output='+dir+'/stage19.js --scope=local';
        var cb = function (error, stdout, stderr) {
            supply.check(error===null);
            stage20();
        }

        var child = cp.exec(command, cb);
    }

    var stage20 = function() {
        var sCb = function() {
            supply.check(true);
            stage21();
        }

        var fCb = function() {
            supply.check(false);
            stage21();
        }

        stage20_ticket = kernel.require( dir+'/stage19.js', sCb, fCb );
    }
    

    var stage21 = function() {
        supply.check(stage19_mod1_check);
        supply.check(stage19_mod2_initialized);
        kernel.release(stage20_ticket);

        var fs = require('fs');
        fs.unlinkSync(dir+'/stage19.js');

        stage22();
    }



    var stage22 = function() {
        supply.test('Output and --quiet option');

        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=stages/stage22/mod1.js --output='+dir+'/stage22.js';
        var cb = function (error, stdout, stderr) {
            supply.check(stdout.length > 20);
            stage23();
        }

        var child = cp.exec(command, cb);
    }

    var stage23 = function() {
        var fs = require('fs');
        fs.unlinkSync(dir+'/stage22.js');
        
        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=stages/stage22/mod1.js --output='+dir+'/stage22.js --quiet';
        var cb = function (error, stdout, stderr) {
            supply.check(stdout.length == 0);
            stage24();
        }

        var child = cp.exec(command, cb);
    }

    var stage24 = function() {
        var fs = require('fs');
        fs.unlinkSync(dir+'/stage22.js');

        stage25();
    }



    var stage25 = function() {
        supply.test('Merging with --plain option');

        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=stages/stage25/mod1.js --output='+dir+'/stage25.js --plain';
        var cb = function (error, stdout, stderr) {
            supply.check(error === null);
            stage26();
        }

        var child = cp.exec(command, cb);
    }

    var stage26 = function() {
        // loading as an ordinary script (not helios module)
        stage25_mod1_initialized = false;
        require(dir+'/stage25.js');
        supply.check(stage25_mod1_initialized);
        
        var fs = require('fs');
        fs.unlinkSync(dir+'/stage25.js');

        stage27();
    }



    var stage27 = function() {
        supply.test('Merging with --scope=subdir');
        

        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=stages/stage27/mod1.js --output='+dir+'/stage27.js --scope=subdir';
        var cb = function (error, stdout, stderr) {
            supply.check(error === null);
            stage28();
        }

        var child = cp.exec(command, cb);
    }

    var stage28 = function() {
        // should not load due to unexisting dependency
        var sCb = function() {
            supply.check(false);
            stage29();
        }

        var fCb = function() {
            supply.check(true);
            stage29();
        }

        stage28_ticket = kernel.require( dir+'/stage27.js', sCb, fCb );
    }

    var stage29 = function() {
        kernel.release(stage28_ticket);

        var fs = require('fs');
        fs.unlinkSync(dir+'/stage27.js');
        stage30();
    }



    var stage30 = function() {
        supply.test('Merging with --scope=local');
        
        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=stages/stage30/dir1/mod1.js --output='+dir+'/stage30.js --scope=local';
        var cb = function (error, stdout, stderr) {
            supply.check(error === null);
            stage31();
        }

        var child = cp.exec(command, cb);
    }

    var stage31 = function() {
        // should not load due to unexisting dependency
        var sCb = function() {
            supply.check(false);
            stage32();
        }

        var fCb = function() {
            supply.check(true);
            stage32();
        }

        stage31_ticket = kernel.require( dir+'/stage30.js', sCb, fCb );
    }

    var stage32 = function() {
        kernel.release(stage31_ticket);

        var fs = require('fs');
        fs.unlinkSync(dir+'/stage30.js');
        stage33();
    }




    var stage33 = function() {
        supply.test('Merging with --scope=global');

        stage33_mod1_check = false;
        stage33_mod2_check = false;
        helios_remote_dependency_initialized = false;
        helios_remote_module_initialized = false;

        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=stages/stage33/dir1/mod1.js --output='+dir+'/stage33.js --scope=global';
        var cb = function (error, stdout, stderr) {
            supply.check(error === null);
            stage34();
        }

        var child = cp.exec(command, cb);
    }

    var stage34 = function() {
        var sCb = function() {
            supply.check(true);
            stage35();
        }

        var fCb = function() {
            supply.check(false);
            stage35();
        }

        stage34_ticket = kernel.require( dir+'/stage33.js', sCb, fCb );
    }

    var stage35 = function() {
        supply.check(stage33_mod1_check);
        supply.check(stage33_mod2_check);
        supply.check(helios_remote_dependency_initialized);
        supply.check(helios_remote_module_initialized);
        
        kernel.release(stage34_ticket);

        var fs = require('fs');
        fs.unlinkSync(dir+'/stage33.js');

        // give some time to really uninitialize the remote module
        setTimeout( stage36, 1000 );
    }



    var stage36 = function() {
        supply.test('--plain should imply --scope=global');

        stage36_mod1_check = false;
        stage36_mod2_check = false;
        helios_remote_dependency_initialized = false;
        helios_remote_module_initialized = false;

        var cp = require('child_process');
        var command = process.argv[0] + ' ../nodestart.js --input=stages/stage36/dir1/mod1.js --output='+dir+'/stage36.js --plain';
        var cb = function (error, stdout, stderr) {
            supply.check(error === null);
            stage37();
        }

        var child = cp.exec(command, cb);
    }

    var stage37 = function() {
        // loading as an ordinary script (not helios module)
        require(dir+'/stage36.js');
        supply.check(stage36_mod1_check);
        supply.check(stage36_mod2_check);
        supply.check(helios_remote_dependency_initialized);
        supply.check(helios_remote_module_initialized);
        
        var fs = require('fs');
        fs.unlinkSync(dir+'/stage36.js');

        stage38();
    }

    var stage38 = function() {
        


        
        
        
        console.log();
        cleanup();
    }


    var cleanup = function() {
        try {
            var fs = require('fs');
            fs.rmdirSync(dir);
        } catch(e) {}
    }


    cleanup();
    init();
    stage0();

}


