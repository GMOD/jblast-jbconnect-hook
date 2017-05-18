/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var jblastProc = require('../services/jblastProc');
module.exports = {
    hello: function (req, res, next) {
        return res.send('WorkflowMgr hello');
    },
    //getWorkflows: function (req, res, next) {
    //    return res.send('test2 getWorkflows');
    //}
    getWorkflows: jblastProc.getWorkflows
};

