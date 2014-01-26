
include('merge/util.js');
include('merge/logic.js');

init = function() {
    var util = helios.tools.merge.util;
    var logic = helios.tools.merge.logic;
    var cfg = util.getCfg();

    var finalize = function( tree ) {
        var queue = logic.getSortedQueue(tree.modules, cfg.quiet);
        var init = logic.getInit(tree.modules, queue, cfg.location, cfg.quiet);
        var uninit = logic.getUninit(tree.modules, queue, cfg.location, cfg.quiet);
        var code = logic.getCode(tree.external, init, uninit, cfg.plain, cfg.quiet);
        logic.write( cfg.output, code, cfg.quiet );
    }

    logic.getModulesTree(
        cfg.input, cfg.outdir, cfg.remote, cfg.quiet,
        finalize
    );
}

