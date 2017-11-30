/* 
 * libroutes is a jbserver framework.
 * libroutes maps dependancy routes for client-side access.
 * The framework also looks for libroutes.js in jbh- (hook modules), in their respective config directories
 * 
 *  For example: for the module jquery,
 *    The module is installed with 'npm install jquery'
 *    The mapping the mapping 'jquery': '/jblib/jquery'
 *    makes the jquery directory accessible as /jblib/jquery from the client side.
 */

module.exports = {
    lib: {
            'jQuery-ui-Slider-Pips':    '/jblib/slider-pips',
            'jquery-ui-dist':           '/jblib/jquery-ui'
    }
};
