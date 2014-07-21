
/**
 * @fileoverview Contains namespace object
 */

init = function() {

    /**
     * @returns {Object} and creates (if not created yet) an object with
     * the given name
     */
    var ns = function(name) {
        var names = name.split('.');
        var obj=global;
        for (var i = 0; i < names.length; i++) {
            if (typeof obj[names[i]] == 'undefined') {
                obj[names[i]] = {};
            }

            obj = obj[names[i]];
        }

        return obj;
    }

    ns('LIB.helios.tools.merge.ns');

    LIB.helios.tools.merge.ns = ns;

}
