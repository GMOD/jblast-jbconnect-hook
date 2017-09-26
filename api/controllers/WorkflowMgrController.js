/**
 * @module
 * @description
 * todo: document 
 */

var jblastProc = require('../services/jblastProc');

module.exports = {
    hello: function (req, res, next) {
        return res.send('WorkflowMgr hello');
    },
    getWorkflows: jblastProc.getWorkflows
};

