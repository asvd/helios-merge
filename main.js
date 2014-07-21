/**
 * @fileoverview helios-merge merges Helios Kernel modules
 * 
 * @version 0.1.1
 * 
 * Copyright (c) 2014 asvd <heliosframework@gmail.com> 
 * 
 * helios-merge tool library is licensed under the MIT license,
 * see http://github.com/asvd/helios-merge
 */

include('merge/util.js');
include('merge/logic.js');

init = function() {
    var util = LIB.helios.tools.merge.util;
    var logic = LIB.helios.tools.merge.logic;
    var cfg = util.getCfg();

    var finalize = function(tree) {
        var queue = logic.getSortedQueue(tree.modules, cfg.quiet);
        var init = logic.getInit(tree.modules, queue, cfg.location, cfg.quiet);
        var uninit = logic.getUninit(tree.modules, queue, cfg.location, cfg.quiet);
        var code = logic.getCode(tree.external, init, uninit, cfg.plain, cfg.quiet);
        logic.write( cfg.output, code, cfg.quiet );
    }

    logic.getModulesTree(cfg.input, cfg.outdir, cfg.remote, cfg.quiet, finalize);
}

